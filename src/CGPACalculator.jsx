import React, { useState, useEffect } from 'react';
import { useLocalStorageSync } from './useLocalStorageSync';
import { DEFAULT_GRADING_SYSTEM } from './Subjects';

const CGPACalculator = ({
  cloudCGPA = [],
  cloudSubjects = [],
  activeSemester = 'Semester 1',
  cloudGradingSystem = null,
  updateCloudData
}) => {
  const [records, setRecords] = useLocalStorageSync('cgpaData', cloudCGPA);

  useEffect(() => {
    if (cloudCGPA && cloudCGPA.length > 0) setRecords(cloudCGPA);
  }, [cloudCGPA, setRecords]);

  const safeRecords = Array.isArray(records) ? records : [];
  const safeSubjects = Array.isArray(cloudSubjects) ? cloudSubjects : [];

  // Pull dynamic grading system sorted descending by points
  const gradingScale = (
    Array.isArray(cloudGradingSystem) && cloudGradingSystem.length > 0
      ? [...cloudGradingSystem]
      : [...DEFAULT_GRADING_SYSTEM]
  ).sort((a, b) => b.points - a.points);

  // Build O(1) grade-to-points lookup map
  const gradePointMap = gradingScale.reduce((acc, item) => {
    acc[item.grade] = Number(item.points);
    return acc;
  }, {});

  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState(gradingScale[0] ? gradingScale[0].grade : 'A');
  const [targetCGPA, setTargetCGPA] = useState('');

  // Ensure selected grade stays valid if grading scale changes
  useEffect(() => {
    if (gradingScale.length > 0 && gradePointMap[grade] === undefined) {
      setGrade(gradingScale[0].grade);
    }
  }, [gradingScale, grade, gradePointMap]);

  // Automatically fetch credits from Master Subjects
  const selectedSubjectObj = safeSubjects.find(s => s.name === subject);
  const autoCredits = selectedSubjectObj
    ? (selectedSubjectObj.credits !== undefined ? Number(selectedSubjectObj.credits) : 3)
    : null;

  const handleAddRecord = (e) => {
    e.preventDefault();
    if (!subject || autoCredits === null) return;

    const newRecord = {
      id: Date.now().toString(),
      subject,
      credits: autoCredits,
      grade,
      semester: activeSemester
    };

    const updated = [...safeRecords, newRecord];
    setRecords(updated);
    if (updateCloudData) updateCloudData('cgpa', updated);

    setSubject('');
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this grade record?')) {
      const updated = safeRecords.filter(r => r.id !== id);
      setRecords(updated);
      if (updateCloudData) updateCloudData('cgpa', updated);
    }
  };

  const getPointsForGrade = (g) => {
    return gradePointMap[g] !== undefined ? gradePointMap[g] : 0;
  };

  const calculateGPA = (courses) => {
    if (courses.length === 0) return '0.00';
    let totalPoints = 0;
    let totalCredits = 0;
    courses.forEach(c => {
      const cr = Number(c.credits) > 0 ? Number(c.credits) : 0;
      totalPoints += cr * getPointsForGrade(c.grade);
      totalCredits += cr;
    });
    return totalCredits === 0 ? '0.00' : (totalPoints / totalCredits).toFixed(2);
  };

  const cgpa = calculateGPA(safeRecords);
  const currentSemesterRecords = safeRecords.filter(
    r => (r.semester ? r.semester : 'Semester 1') === activeSemester
  );
  const sgpa = calculateGPA(currentSemesterRecords);

  const groupedRecords = safeRecords.reduce((acc, curr) => {
    const sem = curr.semester ? curr.semester : 'Semester 1';
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(curr);
    return acc;
  }, {});

  // --- TARGET CGPA SOLVER (Floor-and-Step Greedy Algorithm) ---
  const computeTargetPlan = () => {
    const T = Number(targetCGPA);
    if (targetCGPA === '' || isNaN(T) || T <= 0) return null;

    // 1. Identify unlogged subjects remaining in the active semester
    const loggedInActiveSem = new Set(currentSemesterRecords.map(r => r.subject));
    const remainingSubjects = safeSubjects
      .filter(s => !loggedInActiveSem.has(s.name))
      .map(s => ({
        id: s.id,
        name: s.name,
        credits: s.credits !== undefined ? Number(s.credits) : 3
      }));

    if (remainingSubjects.length === 0) {
      return { status: 'no_remaining' };
    }

    // 2. Calculate earned totals (all semesters) and remaining credits
    let earnedPoints = 0;
    let earnedCredits = 0;
    safeRecords.forEach(r => {
      const cr = Number(r.credits) > 0 ? Number(r.credits) : 0;
      earnedCredits += cr;
      earnedPoints += cr * getPointsForGrade(r.grade);
    });

    const remCredits = remainingSubjects.reduce((sum, s) => sum + s.credits, 0);
    const totalFutureCredits = earnedCredits + remCredits;
    const neededPoints = T * totalFutureCredits - earnedPoints;
    const requiredGPA = neededPoints / remCredits;

    // Ascending order of grades (lowest -> highest) for step-up traversal
    const ascendingGrades = [...gradingScale].sort((a, b) => a.points - b.points);
    const minGrade = ascendingGrades[0];
    const maxGrade = ascendingGrades[ascendingGrades.length - 1];

    const maxAchievableCGPA = (earnedPoints + remCredits * maxGrade.points) / totalFutureCredits;

    if (neededPoints > remCredits * maxGrade.points + 1e-9) {
      return {
        status: 'unreachable',
        requiredGPA,
        maxAchievableCGPA,
        maxGrade
      };
    }

    if (neededPoints <= remCredits * minGrade.points + 1e-9) {
      return {
        status: 'secured',
        requiredGPA: Math.max(0, requiredGPA),
        uniformGrade: minGrade,
        plan: remainingSubjects.map(s => ({ ...s, assigned: minGrade }))
      };
    }

    // Minimum uniform grade: lowest grade with points >= requiredGPA
    const uniformGrade =
      ascendingGrades.find(g => g.points >= requiredGPA - 1e-9) || maxGrade;

    // Floor grade index: highest grade with points <= requiredGPA
    let floorIdx = 0;
    for (let i = 0; i < ascendingGrades.length; i++) {
      if (ascendingGrades[i].points <= requiredGPA + 1e-9) {
        floorIdx = i;
      }
    }

    // Initialize every remaining subject at the floor grade
    const assignment = remainingSubjects.map(s => ({
      ...s,
      gradeIdx: floorIdx
    }));

    const getPlanPoints = () =>
      assignment.reduce((sum, item) => sum + item.credits * ascendingGrades[item.gradeIdx].points, 0);

    // Step up one grade at a time until neededPoints is met, minimizing overshoot & peak grade
    let safetyCounter = 0;
    while (getPlanPoints() < neededPoints - 1e-9 && safetyCounter < 500) {
      safetyCounter++;
      const deficit = neededPoints - getPlanPoints();

      // Restrict candidates to subjects currently at the lowest gradeIdx to keep max grade minimal
      const minCurrentIdx = Math.min(...assignment.map(a => a.gradeIdx));
      const candidates = assignment
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => item.gradeIdx === minCurrentIdx && item.gradeIdx < ascendingGrades.length - 1);

      if (candidates.length === 0) break;

      const deltaPts = ascendingGrades[minCurrentIdx + 1].points - ascendingGrades[minCurrentIdx].points;

      // Check if a single upgrade clears the deficit; if so, pick the one with minimal overshoot
      const clearing = candidates.filter(({ item }) => item.credits * deltaPts >= deficit - 1e-9);
      let chosenIdx;
      if (clearing.length > 0) {
        clearing.sort((a, b) => a.item.credits - b.item.credits);
        chosenIdx = clearing[0].idx;
      } else {
        // Otherwise upgrade the highest-credit subject to close the gap fastest
        candidates.sort((a, b) => b.item.credits - a.item.credits);
        chosenIdx = candidates[0].idx;
      }

      assignment[chosenIdx].gradeIdx += 1;
    }

    const projectedPoints = earnedPoints + getPlanPoints();
    const projectedCGPA = projectedPoints / totalFutureCredits;

    return {
      status: 'achievable',
      requiredGPA,
      uniformGrade,
      projectedCGPA,
      plan: assignment.map(a => ({
        id: a.id,
        name: a.name,
        credits: a.credits,
        assigned: ascendingGrades[a.gradeIdx]
      }))
    };
  };

  const targetPlan = computeTargetPlan();

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-10">
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">CGPA Calculator</h1>
          <p className="text-gray-400 text-sm mt-0.5">Synced with your Master Subjects credits and custom grading scale.</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] bg-gray-900 border border-gray-800 text-gray-400 px-2 py-1 rounded uppercase tracking-wider font-bold">
            Active: {activeSemester}
          </span>
        </div>
      </header>

      {/* TOP STATS + TARGET PLANNER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg flex flex-col items-center justify-center text-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Overall CGPA</p>
          <div className={`text-6xl font-black font-mono drop-shadow-md ${Number(cgpa) >= 8.5 ? 'text-emerald-400' : Number(cgpa) >= 7.0 ? 'text-blue-400' : 'text-yellow-400'}`}>
            {cgpa}
          </div>
          <p className="text-[10px] text-gray-500 mt-3">Calculated across ALL semesters</p>
        </div>

        <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Current SGPA ({activeSemester})</p>
          <div className="text-5xl font-black text-white font-mono drop-shadow-md">{sgpa}</div>
          <p className="text-[10px] text-gray-500 mt-3">{currentSemesterRecords.length} course(s) logged</p>
        </div>

        {/* TARGET CGPA INPUT CARD */}
        <div className="bg-[#121212] rounded-2xl border border-indigo-900/50 p-6 shadow-lg flex flex-col justify-center">
          <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 block">
            🎯 Target CGPA Simulator
          </label>
          <input
            type="number"
            min="0"
            max={gradingScale[0] ? gradingScale[0].points : 10}
            step="0.01"
            value={targetCGPA}
            onChange={(e) => setTargetCGPA(e.target.value)}
            placeholder="Enter target (e.g. 8.50)"
            className="w-full bg-black border border-gray-700 text-white font-mono font-bold text-xl rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none text-center"
          />
          <p className="text-[10px] text-gray-500 mt-2 text-center">
            Calculates least required grades for unlogged {activeSemester} courses.
          </p>
        </div>
      </div>

      {/* TARGET CGPA RESULT BANNER */}
      {targetPlan ? (
        <div className="bg-[#121212] rounded-2xl border border-indigo-500/40 p-6 shadow-lg space-y-4">
          {targetPlan.status === 'no_remaining' ? (
            <p className="text-sm text-gray-400">
              All subjects for <span className="text-white font-bold">{activeSemester}</span> are already logged. Add upcoming subjects in Master Subjects to calculate required grades.
            </p>
          ) : targetPlan.status === 'unreachable' ? (
            <div className="text-red-400 text-sm font-medium">
              Target CGPA of <span className="font-bold text-white">{targetCGPA}</span> is mathematically unreachable this semester (requires <span className="font-bold">{targetPlan.requiredGPA.toFixed(2)}</span> SGPA, exceeding max grade {targetPlan.maxGrade.grade} = {targetPlan.maxGrade.points}). Maximum achievable CGPA this semester is <span className="font-bold text-white">{targetPlan.maxAchievableCGPA.toFixed(2)}</span>.
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-4">
                <div>
                  <h3 className="text-white font-bold text-base">
                    {targetPlan.status === 'secured'
                      ? `Target CGPA (${targetCGPA}) Already Secured!`
                      : `Least Possible Path to ${targetCGPA} CGPA`}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Minimum Required SGPA on remaining courses:{' '}
                    <span className="text-indigo-400 font-bold">{targetPlan.requiredGPA.toFixed(2)}</span>
                    {targetPlan.projectedCGPA ? (
                      <>
                        {' '}• Plan achieves{' '}
                        <span className="text-emerald-400 font-bold">{targetPlan.projectedCGPA.toFixed(2)} CGPA</span>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="bg-indigo-900/20 border border-indigo-500/40 rounded-xl px-4 py-2 text-center shrink-0">
                  <p className="text-[9px] uppercase font-bold text-indigo-300 tracking-wider">Min Uniform Grade</p>
                  <p className="text-xl font-black text-white">
                    {targetPlan.uniformGrade.grade}{' '}
                    <span className="text-xs font-normal text-gray-400">({targetPlan.uniformGrade.points} pts)</span>
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-3">
                  Optimized Least Grade Combination (Remaining {activeSemester} Subjects)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {targetPlan.plan.map(item => (
                    <div
                      key={item.id}
                      className="bg-black border border-gray-800 rounded-xl p-3 flex justify-between items-center"
                    >
                      <div className="truncate pr-2">
                        <p className="text-white font-bold text-xs truncate">{item.name}</p>
                        <p className="text-[10px] text-gray-500">{item.credits} Credits</p>
                      </div>
                      <span className="text-sm font-black text-emerald-400 bg-emerald-900/20 border border-emerald-900/50 px-2.5 py-1 rounded-lg shrink-0">
                        {item.assigned.grade}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* LOG A GRADE FORM */}
        <div className="lg:col-span-1 bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg h-fit">
          <h2 className="text-lg font-bold text-white mb-6 border-b border-gray-800 pb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Log a Grade
          </h2>
          <form onSubmit={handleAddRecord} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                Subject ({activeSemester})
              </label>
              <select
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-yellow-500 outline-none transition-colors"
              >
                <option value="" disabled>Select Subject...</option>
                {safeSubjects.length === 0 ? (
                  <option value="" disabled>Add subjects in Master Subjects first</option>
                ) : null}
                {safeSubjects.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.credits !== undefined ? s.credits : 3} cr)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                  Credits (Auto)
                </label>
                <div className="w-full bg-black/60 border border-gray-800 text-gray-300 font-bold rounded-xl px-4 py-3 text-sm text-center">
                  {autoCredits !== null ? `${autoCredits} Credits` : '—'}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                  Grade Earned
                </label>
                <select
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  className="w-full bg-black border border-gray-700 text-yellow-400 font-bold rounded-xl px-4 py-3 text-sm focus:border-yellow-500 outline-none text-center"
                >
                  {gradingScale.map(g => (
                    <option key={g.grade} value={g.grade}>
                      {g.grade} ({g.points})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black py-3 rounded-xl shadow-[0_0_15px_rgba(202,138,4,0.3)] transition-colors mt-4"
            >
              Add to Transcript
            </button>
          </form>
        </div>

        {/* ACADEMIC TRANSCRIPT */}
        <div className="lg:col-span-2 bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg flex flex-col h-full overflow-hidden">
          <h2 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-3">Academic Transcript</h2>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
            {Object.keys(groupedRecords).length === 0 ? (
              <p className="text-gray-500 italic text-center py-10">No grades logged yet.</p>
            ) : (
              Object.entries(groupedRecords).reverse().map(([sem, courses]) => (
                <div key={sem} className="bg-black border border-gray-800 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
                    <h3 className="font-bold text-white text-sm">{sem}</h3>
                    <span className="text-xs font-bold text-gray-500">
                      SGPA: <span className="text-yellow-400">{calculateGPA(courses)}</span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    {courses.map(course => (
                      <div key={course.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-900 group">
                        <div className="flex flex-col">
                          <span className="text-gray-200 text-sm font-bold">{course.subject}</span>
                          <span className="text-[10px] text-gray-500">{course.credits} Credits</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-yellow-400 font-black text-lg bg-yellow-900/20 px-3 py-1 rounded border border-yellow-900/50 shadow-sm">
                            {course.grade}
                          </span>
                          <button
                            onClick={() => handleDelete(course.id)}
                            className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CGPACalculator;