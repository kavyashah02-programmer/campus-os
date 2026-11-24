import React, { useState, useEffect } from 'react';
import { useLocalStorageSync } from './useLocalStorageSync';

const FALLBACK_GRADING_SYSTEM = [
  { grade: 'A', points: 10 },
  { grade: 'A-', points: 9 },
  { grade: 'B', points: 8 },
  { grade: 'B-', points: 7 },
  { grade: 'C', points: 6 },
  { grade: 'C-', points: 5 },
  { grade: 'D', points: 4 },
  { grade: 'E', points: 2 },
  { grade: 'NC', points: 0 }
];

// Read-time adapter: resolves course names across both new ('subject') and legacy field names
const getCourseName = (record) => {
  if (!record) return '';
  const raw =
    record.subject ??
    record.name ??
    record.subjectName ??
    record.courseName ??
    record.course ??
    record.title ??
    '';
  return String(raw).trim();
};

// Normalize strings for case/whitespace-insensitive matching between Master Subjects and Transcript
const normalizeKey = (str) => String(str ?? '').trim().toLowerCase();

// Normalize legacy semester formats (e.g. undefined, 1, "1", "Semester 1") -> "Semester 1"
const normalizeSemester = (sem) => {
  if (!sem) return 'Semester 1';
  const trimmed = String(sem).trim();
  return /^\d+$/.test(trimmed) ? `Semester ${trimmed}` : trimmed;
};

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
  const normalizedActiveSem = normalizeSemester(activeSemester);

  // Copy before sorting so React props/state are never mutated in place
  const gradingScale = (
    Array.isArray(cloudGradingSystem) && cloudGradingSystem.length > 0
      ? [...cloudGradingSystem]
      : [...FALLBACK_GRADING_SYSTEM]
  ).sort((a, b) => Number(b.points) - Number(a.points));

  // O(1) lookup table mapping grade labels -> numeric points
  const gradePointMap = gradingScale.reduce((acc, item) => {
    acc[item.grade] = Number(item.points);
    return acc;
  }, {});

  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState(gradingScale[0] ? gradingScale[0].grade : 'A');
  const [targetCGPA, setTargetCGPA] = useState('');

  // Keep selected grade valid if the user edits the grading scale in Master Subjects
  useEffect(() => {
    if (gradingScale.length > 0 && gradePointMap[grade] === undefined) {
      setGrade(gradingScale[0].grade);
    }
  }, [gradingScale, grade, gradePointMap]);

  // Filter transcript records belonging to the active semester
  const currentSemesterRecords = safeRecords.filter(
    r => normalizeSemester(r.semester) === normalizedActiveSem
  );

  // Build an O(1) Set of normalized subject names already logged in the active semester
  const loggedSubjectKeys = new Set(
    currentSemesterRecords
      .map(r => normalizeKey(getCourseName(r)))
      .filter(key => key.length > 0)
  );

  // Count legacy records in the active semester that have no course name saved at all
  const unnamedActiveSemCount = currentSemesterRecords.filter(
    r => getCourseName(r).length === 0
  ).length;

  // Strictly remaining (unlogged) courses for the active semester
  const remainingSubjects = safeSubjects
    .filter(s => !loggedSubjectKeys.has(normalizeKey(s.name)))
    .map(s => ({
      id: s.id,
      name: s.name,
      credits: s.credits !== undefined ? Number(s.credits) : 3
    }));

  // Reset dropdown selection if the currently chosen subject gets logged
  useEffect(() => {
    if (subject && loggedSubjectKeys.has(normalizeKey(subject))) {
      setSubject('');
    }
  }, [subject, loggedSubjectKeys]);

  // Automatically fetch credits from Master Subjects for the chosen course
  const selectedSubjectObj = remainingSubjects.find(s => s.name === subject);
  const autoCredits = selectedSubjectObj ? selectedSubjectObj.credits : null;

  const handleAddRecord = (e) => {
    e.preventDefault();
    if (!subject || autoCredits === null) return;

    const newRecord = {
      id: Date.now().toString(),
      subject: subject.trim(),
      credits: autoCredits,
      grade,
      semester: normalizedActiveSem
    };

    const updated = [...safeRecords, newRecord];
    setRecords(updated);
    if (updateCloudData) updateCloudData('cgpa', updated);

    setSubject('');
  };

  // Assign a Master Subject name to an unnamed legacy transcript row without losing its grade
  const handleAssignLegacySubject = (recordId, chosenSubjectName) => {
    if (!chosenSubjectName) return;
    const matchedSubj = safeSubjects.find(s => s.name === chosenSubjectName);
    const updated = safeRecords.map(r => {
      if (r.id !== recordId) return r;
      return {
        ...r,
        subject: chosenSubjectName,
        credits: matchedSubj && matchedSubj.credits !== undefined
          ? Number(matchedSubj.credits)
          : r.credits
      };
    });
    setRecords(updated);
    if (updateCloudData) updateCloudData('cgpa', updated);
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
  const sgpa = calculateGPA(currentSemesterRecords);

  const groupedRecords = safeRecords.reduce((acc, curr) => {
    const sem = normalizeSemester(curr.semester);
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(curr);
    return acc;
  }, {});

  // --- TARGET CGPA SOLVER (Operates strictly on unlogged remainingSubjects) ---
  const computeTargetPlan = () => {
    const T = Number(targetCGPA);
    if (targetCGPA === '' || isNaN(T) || T <= 0) return null;

    if (remainingSubjects.length === 0) {
      return { status: 'no_remaining' };
    }

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

    const ascendingGrades = [...gradingScale].sort((a, b) => Number(a.points) - Number(b.points));
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

    const uniformGrade =
      ascendingGrades.find(g => g.points >= requiredGPA - 1e-9) ?? maxGrade;

    // Start all remaining courses at the highest grade <= requiredGPA
    let floorIdx = 0;
    for (let i = 0; i < ascendingGrades.length; i++) {
      if (ascendingGrades[i].points <= requiredGPA + 1e-9) {
        floorIdx = i;
      }
    }

    const assignment = remainingSubjects.map(s => ({
      ...s,
      gradeIdx: floorIdx
    }));

    const getPlanPoints = () =>
      assignment.reduce((sum, item) => sum + item.credits * ascendingGrades[item.gradeIdx].points, 0);

    // Greedily bump the lowest-grade courses one tier at a time until neededPoints is met
    let safetyCounter = 0;
    while (getPlanPoints() < neededPoints - 1e-9 && safetyCounter < 500) {
      safetyCounter++;
      const deficit = neededPoints - getPlanPoints();
      const minCurrentIdx = Math.min(...assignment.map(a => a.gradeIdx));
      const candidates = assignment
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => item.gradeIdx === minCurrentIdx && item.gradeIdx < ascendingGrades.length - 1);

      if (candidates.length === 0) break;

      const deltaPts = ascendingGrades[minCurrentIdx + 1].points - ascendingGrades[minCurrentIdx].points;
      const clearing = candidates.filter(({ item }) => item.credits * deltaPts >= deficit - 1e-9);

      let chosenIdx;
      if (clearing.length > 0) {
        // Minimize overshoot when a single upgrade closes the gap
        clearing.sort((a, b) => a.item.credits - b.item.credits);
        chosenIdx = clearing[0].idx;
      } else {
        // Close the gap fastest when multiple upgrades are still needed
        candidates.sort((a, b) => b.item.credits - a.item.credits);
        chosenIdx = candidates[0].idx;
      }

      assignment[chosenIdx].gradeIdx += 1;
    }

    const projectedCGPA = (earnedPoints + getPlanPoints()) / totalFutureCredits;

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
    /* FIX: Removed 'h-full' so expanding the Target Simulator never squashes the Transcript below */
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">CGPA Calculator</h1>
          <p className="text-gray-400 text-sm mt-0.5">Synced with your Master Subjects credits and custom grading scale.</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] bg-gray-900 border border-gray-800 text-gray-400 px-2 py-1 rounded uppercase tracking-wider font-bold">
            Active: {normalizedActiveSem}
          </span>
        </div>
      </header>

      {/* TOP STATS + TARGET PLANNER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg flex flex-col items-center justify-center text-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Overall CGPA</p>
          <div className={`text-6xl font-black font-mono drop-shadow-md ${Number(cgpa) >= 8.5 ? 'text-emerald-400' : Number(cgpa) >= 7.0 ? 'text-blue-400' : 'text-yellow-400'}`}>
            {cgpa}
          </div>
          <p className="text-[10px] text-gray-500 mt-3">Calculated across ALL semesters</p>
        </div>

        <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Current SGPA ({normalizedActiveSem})</p>
          <div className="text-5xl font-black text-white font-mono drop-shadow-md">{sgpa}</div>
          <p className="text-[10px] text-gray-500 mt-3">
            {currentSemesterRecords.length} logged • {remainingSubjects.length} remaining
          </p>
        </div>

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
            Shows minimum grades only for the {remainingSubjects.length} unlogged course(s).
          </p>
        </div>
      </div>

      {/* TARGET CGPA RESULT BANNER */}
      {targetPlan ? (
        <div className="bg-[#121212] rounded-2xl border border-indigo-500/40 p-6 shadow-lg space-y-4">
          {unnamedActiveSemCount > 0 ? (
            <div className="bg-amber-900/20 border border-amber-500/40 rounded-xl px-4 py-2.5 text-xs text-amber-300">
              Note: {unnamedActiveSemCount} older record(s) in {normalizedActiveSem} have no subject name saved. Link them in the Academic Transcript below so they are excluded from remaining courses.
            </div>
          ) : null}

          {targetPlan.status === 'no_remaining' ? (
            <p className="text-sm text-gray-400">
              All subjects for <span className="text-white font-bold">{normalizedActiveSem}</span> already have grades logged.
            </p>
          ) : targetPlan.status === 'unreachable' ? (
            <div className="text-red-400 text-sm font-medium">
              Target CGPA of <span className="font-bold text-white">{targetCGPA}</span> is unreachable with your {remainingSubjects.length} remaining course(s) (requires <span className="font-bold">{targetPlan.requiredGPA.toFixed(2)}</span> SGPA, above max grade {targetPlan.maxGrade.grade} = {targetPlan.maxGrade.points}). Maximum achievable CGPA is <span className="font-bold text-white">{targetPlan.maxAchievableCGPA.toFixed(2)}</span>.
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-4">
                <div>
                  <h3 className="text-white font-bold text-base">
                    {targetPlan.status === 'secured'
                      ? `Target CGPA (${targetCGPA}) Already Secured!`
                      : `Least Possible Grades for Remaining ${remainingSubjects.length} Course(s)`}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Required SGPA on remaining courses:{' '}
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
            </>
          )}
        </div>
      ) : null}

      {/* FIX: Removed 'flex-1 overflow-hidden' so Transcript stays fully visible and never collapses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
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
                Remaining Subjects ({normalizedActiveSem})
              </label>
              <select
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-yellow-500 outline-none transition-colors"
              >
                <option value="" disabled>
                  {remainingSubjects.length === 0 ? 'All subjects logged' : 'Select unlogged subject...'}
                </option>
                {remainingSubjects.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.credits} cr)
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
              disabled={remainingSubjects.length === 0}
              className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-800 disabled:text-gray-600 text-black font-black py-3 rounded-xl shadow-[0_0_15px_rgba(202,138,4,0.3)] transition-colors mt-4"
            >
              Add to Transcript
            </button>
          </form>
        </div>

        {/* ACADEMIC TRANSCRIPT */}
        <div className="lg:col-span-2 bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg flex flex-col">
          <h2 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-3">Academic Transcript</h2>

          <div className="max-h-[540px] overflow-y-auto custom-scrollbar pr-2 space-y-6">
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
                    {courses.map(course => {
                      const resolvedName = getCourseName(course);
                      return (
                        <div key={course.id} className="flex justify-between items-center p-2.5 rounded-lg hover:bg-gray-900 group gap-3">
                          <div className="flex flex-col flex-1 min-w-0">
                            {resolvedName ? (
                              <span className="text-white text-sm font-bold truncate">{resolvedName}</span>
                            ) : (
                              /* Fallback linker if an older record had no subject name stored in Firebase */
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-amber-400 text-xs font-bold">Unassigned Course</span>
                                {remainingSubjects.length > 0 && sem === normalizedActiveSem ? (
                                  <select
                                    defaultValue=""
                                    onChange={(e) => handleAssignLegacySubject(course.id, e.target.value)}
                                    className="bg-[#121212] border border-amber-500/40 text-gray-200 text-[11px] rounded-md px-2 py-0.5 outline-none focus:border-amber-400"
                                  >
                                    <option value="" disabled>Link subject...</option>
                                    {remainingSubjects.map(s => (
                                      <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                  </select>
                                ) : null}
                              </div>
                            )}
                            <span className="text-[11px] text-gray-500">{course.credits} Credits</span>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-yellow-400 font-black text-lg bg-yellow-900/20 px-3 py-1 rounded border border-yellow-900/50 shadow-sm">
                              {course.grade}
                            </span>
                            <button
                              onClick={() => handleDelete(course.id)}
                              title="Delete Record"
                              className="text-gray-500 hover:text-red-500 opacity-60 group-hover:opacity-100 transition-opacity p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
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