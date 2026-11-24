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

// Safely resolve course name across both new ('subject') and legacy field keys
const getCourseName = (record) => {
  if (!record) return '';
  const raw =
    record.subject ??
    record.name ??
    record.subjectName ??
    record.courseName ??
    record.course ??
    record.title ??
    record.courseCode ??
    record.code ??
    record.label ??
    '';
  return String(raw).trim();
};

const normalizeKey = (str) => String(str ?? '').trim().toLowerCase();

// Unifies "1", "Sem 1", "Semester 1", or missing semester into "Semester 1"
const normalizeSemester = (sem) => {
  if (sem === null || sem === undefined || sem === '') return 'Semester 1';
  const str = String(sem).trim();
  const match = str.match(/(\d+)/);
  return match ? `Semester ${match[1]}` : str;
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
    if (Array.isArray(cloudCGPA)) {
      setRecords(prev => (JSON.stringify(prev) !== JSON.stringify(cloudCGPA) ? cloudCGPA : prev));
    }
  }, [cloudCGPA, setRecords]);

  const safeRecords = Array.isArray(records) ? records : [];
  const safeSubjects = Array.isArray(cloudSubjects) ? cloudSubjects : [];
  const normalizedActiveSem = normalizeSemester(activeSemester);

  // Copy before sorting descending so props/state are never mutated in place
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

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [grade, setGrade] = useState(gradingScale[0] ? gradingScale[0].grade : 'A');
  const [targetCGPA, setTargetCGPA] = useState('');

  // Primitive key prevents unnecessary effect re-runs when gradingScale is recreated
  const gradingScaleKey = gradingScale.map(g => g.grade).join(',');
  useEffect(() => {
    if (gradingScale.length > 0 && gradePointMap[grade] === undefined) {
      setGrade(gradingScale[0].grade);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradingScaleKey, grade]);

  // All transcript entries belonging to the currently active semester
  const currentSemesterRecords = safeRecords.filter(
    r => normalizeSemester(r.semester) === normalizedActiveSem
  );

  // O(1) Sets of logged subject IDs and normalized names for the active semester
  const loggedSubjectIds = new Set(
    currentSemesterRecords
      .map(r => (r.subjectId ? String(r.subjectId) : ''))
      .filter(id => id.length > 0)
  );
  const loggedSubjectKeys = new Set(
    currentSemesterRecords
      .map(r => normalizeKey(getCourseName(r)))
      .filter(key => key.length > 0)
  );

  // Count legacy rows in the active semester that have no course name saved
  const unnamedActiveSemCount = currentSemesterRecords.filter(
    r => getCourseName(r).length === 0
  ).length;

  // Strictly remaining (unlogged) subjects in the active semester
  const remainingSubjects = safeSubjects
    .filter(s => {
      const idStr = s.id ? String(s.id) : '';
      const nameKey = normalizeKey(s.name ?? s.subject ?? '');
      const isLoggedById = idStr.length > 0 && loggedSubjectIds.has(idStr);
      const isLoggedByName = nameKey.length > 0 && loggedSubjectKeys.has(nameKey);
      return !isLoggedById && !isLoggedByName;
    })
    .map(s => ({
      id: String(s.id),
      name: String(s.name ?? s.subject ?? '').trim(),
      credits: s.credits !== undefined ? Number(s.credits) : 3
    }));

  // Resolve the currently selected subject object from remainingSubjects
  const selectedSubjectObj = remainingSubjects.find(s => s.id === selectedSubjectId);
  const autoCredits = selectedSubjectObj ? selectedSubjectObj.credits : null;

  const persistRecords = (updated) => {
    setRecords(updated);
    if (updateCloudData) updateCloudData('cgpa', updated);
  };

  const handleAddRecord = (e) => {
    e.preventDefault();
    if (!selectedSubjectObj) return;

    const newRecord = {
      id: Date.now().toString(),
      subjectId: selectedSubjectObj.id,
      subject: selectedSubjectObj.name,
      credits: selectedSubjectObj.credits,
      grade,
      semester: normalizedActiveSem
    };

    persistRecords([...safeRecords, newRecord]);
    setSelectedSubjectId('');
  };

  // Inline grade updater inside the Academic Transcript
  const handleUpdateRecordGrade = (recordId, newGrade) => {
    const updated = safeRecords.map(r => (r.id === recordId ? { ...r, grade: newGrade } : r));
    persistRecords(updated);
  };

  // Link an unnamed legacy transcript row to a Master Subject so Target Simulator excludes it
  const handleAssignLegacySubject = (recordId, chosenSubjectId) => {
    const matched = safeSubjects.find(s => String(s.id) === String(chosenSubjectId));
    if (!matched) return;
    const updated = safeRecords.map(r => {
      if (r.id !== recordId) return r;
      return {
        ...r,
        subjectId: String(matched.id),
        subject: String(matched.name ?? matched.subject ?? '').trim(),
        credits: matched.credits !== undefined ? Number(matched.credits) : r.credits
      };
    });
    persistRecords(updated);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this grade record?')) {
      persistRecords(safeRecords.filter(r => r.id !== id));
    }
  };

  const getPointsForGrade = (g) => (gradePointMap[g] !== undefined ? gradePointMap[g] : 0);

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

  // Group all logged records across semesters for the Academic Transcript
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
    if (remCredits <= 0) return { status: 'no_remaining' };

    const totalFutureCredits = earnedCredits + remCredits;
    const neededPoints = T * totalFutureCredits - earnedPoints;
    const requiredGPA = neededPoints / remCredits;

    const ascendingGrades = [...gradingScale].sort((a, b) => Number(a.points) - Number(b.points));
    const minGrade = ascendingGrades[0];
    const maxGrade = ascendingGrades[ascendingGrades.length - 1];
    const maxAchievableCGPA = (earnedPoints + remCredits * maxGrade.points) / totalFutureCredits;

    if (neededPoints > remCredits * maxGrade.points + 1e-9) {
      return { status: 'unreachable', requiredGPA, maxAchievableCGPA, maxGrade };
    }

    if (neededPoints <= remCredits * minGrade.points + 1e-9) {
      return {
        status: 'secured',
        requiredGPA: Math.max(0, requiredGPA),
        uniformGrade: minGrade,
        plan: remainingSubjects.map(s => ({ ...s, assigned: minGrade }))
      };
    }

    const uniformGrade = ascendingGrades.find(g => g.points >= requiredGPA - 1e-9) ?? maxGrade;

    // Initialize every unlogged course at the highest grade <= requiredGPA
    let floorIdx = 0;
    for (let i = 0; i < ascendingGrades.length; i++) {
      if (ascendingGrades[i].points <= requiredGPA + 1e-9) {
        floorIdx = i;
      }
    }

    const assignment = remainingSubjects.map(s => ({ ...s, gradeIdx: floorIdx }));
    const getPlanPoints = () =>
      assignment.reduce((sum, item) => sum + item.credits * ascendingGrades[item.gradeIdx].points, 0);

    // Step up the lowest-grade courses one tier at a time until neededPoints is reached
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
        clearing.sort((a, b) => a.item.credits - b.item.credits);
        chosenIdx = clearing[0].idx;
      } else {
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
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">CGPA Calculator</h1>
          <p className="text-gray-400 text-sm mt-0.5">Synced with your Master Subjects credits and custom grading scale.</p>
        </div>
        <span className="text-[10px] bg-gray-900 border border-gray-800 text-gray-400 px-3 py-1.5 rounded-lg uppercase tracking-wider font-bold">
          Active: {normalizedActiveSem}
        </span>
      </header>

      {/* COMPACT KPI STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Overall CGPA</p>
            <p className="text-[11px] text-gray-500 mt-1">Across all logged semesters ({safeRecords.length} courses)</p>
          </div>
          <div className={`text-5xl font-black font-mono ${Number(cgpa) >= 8.5 ? 'text-emerald-400' : Number(cgpa) >= 7.0 ? 'text-blue-400' : 'text-yellow-400'}`}>
            {cgpa}
          </div>
        </div>

        <div className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Current SGPA ({normalizedActiveSem})</p>
            <p className="text-[11px] text-gray-500 mt-1">
              {currentSemesterRecords.length} logged • {remainingSubjects.length} remaining
            </p>
          </div>
          <div className="text-5xl font-black text-white font-mono">{sgpa}</div>
        </div>
      </div>

      {/* MAIN SPLIT WORKSPACE: Left = Log + Target Simulator | Right = Always-Visible Transcript */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. LOG A GRADE */}
          <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg">
            <h2 className="text-lg font-bold text-white mb-5 border-b border-gray-800 pb-3 flex items-center gap-2">
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
                  value={selectedSubjectId}
                  onChange={e => setSelectedSubjectId(e.target.value)}
                  className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-yellow-500 outline-none transition-colors"
                >
                  <option value="" disabled>
                    {remainingSubjects.length === 0 ? 'All subjects logged' : 'Select unlogged subject...'}
                  </option>
                  {remainingSubjects.map(s => (
                    <option key={s.id} value={s.id}>
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
                className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-800 disabled:text-gray-600 text-black font-black py-3 rounded-xl shadow-[0_0_15px_rgba(202,138,4,0.3)] transition-colors"
              >
                Add to Transcript
              </button>
            </form>
          </div>

          {/* 2. TARGET CGPA SIMULATOR (Strictly for remaining unlogged courses) */}
          <div className="bg-[#121212] rounded-2xl border border-indigo-900/50 p-6 shadow-lg space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h2 className="text-base font-bold text-indigo-400 uppercase tracking-wider">
                🎯 Target CGPA Simulator
              </h2>
              <span className="text-[10px] text-gray-500 font-bold uppercase">
                {remainingSubjects.length} unlogged
              </span>
            </div>

            <div>
              <input
                type="number"
                min="0"
                max={gradingScale[0] ? gradingScale[0].points : 10}
                step="0.01"
                value={targetCGPA}
                onChange={(e) => setTargetCGPA(e.target.value)}
                placeholder="Enter required CGPA (e.g. 8.50)"
                className="w-full bg-black border border-gray-700 text-white font-mono font-bold text-lg rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none text-center"
              />
            </div>

            {unnamedActiveSemCount > 0 ? (
              <div className="bg-amber-900/20 border border-amber-500/40 rounded-xl px-3 py-2 text-[11px] text-amber-300">
                {unnamedActiveSemCount} older record(s) on the right have no subject name. Link them in the Academic Transcript so they are excluded below.
              </div>
            ) : null}

            {targetPlan ? (
              <div className="pt-2 space-y-3">
                {targetPlan.status === 'no_remaining' ? (
                  <p className="text-xs text-gray-400">
                    No remaining unlogged courses left in {normalizedActiveSem}.
                  </p>
                ) : targetPlan.status === 'unreachable' ? (
                  <div className="bg-red-900/20 border border-red-500/40 rounded-xl p-3 text-xs text-red-300 leading-relaxed">
                    Target <span className="font-bold text-white">{targetCGPA}</span> is unreachable with the {remainingSubjects.length} remaining course(s) (needs <span className="font-bold">{targetPlan.requiredGPA.toFixed(2)}</span> SGPA). Max achievable CGPA: <span className="font-bold text-white">{targetPlan.maxAchievableCGPA.toFixed(2)}</span>.
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between bg-black border border-gray-800 rounded-xl p-3">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-500">Req. Remaining SGPA</p>
                        <p className="text-lg font-black text-indigo-400 font-mono">
                          {targetPlan.requiredGPA.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-gray-500">Min Uniform Grade</p>
                        <p className="text-lg font-black text-white">
                          {targetPlan.uniformGrade.grade}{' '}
                          <span className="text-xs font-normal text-gray-400">({targetPlan.uniformGrade.points})</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                        Least Possible Grades (Remaining Courses Only)
                      </p>
                      {targetPlan.plan.map(item => (
                        <div
                          key={item.id}
                          className="bg-black border border-gray-800 rounded-xl px-3 py-2.5 flex justify-between items-center"
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
            ) : (
              <p className="text-[11px] text-gray-500 text-center">
                Enter a target CGPA to see the minimum grades required on your remaining unlogged courses.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACADEMIC TRANSCRIPT (Always anchored & visible) */}
        <div className="lg:col-span-7 bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3">
            <h2 className="text-lg font-bold text-white">Academic Transcript</h2>
            <span className="text-[11px] text-gray-500">
              {safeRecords.length} logged course(s)
            </span>
          </div>

          <div className="space-y-5 max-h-[680px] overflow-y-auto custom-scrollbar pr-1">
            {Object.keys(groupedRecords).length === 0 ? (
              <p className="text-gray-500 italic text-center py-12">No grades logged yet.</p>
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
                        <div
                          key={course.id}
                          className="flex justify-between items-center p-2.5 rounded-lg hover:bg-gray-900/80 group gap-3 border border-transparent hover:border-gray-800 transition-colors"
                        >
                          <div className="flex flex-col flex-1 min-w-0">
                            {resolvedName ? (
                              <span className="text-white text-sm font-bold truncate">{resolvedName}</span>
                            ) : (
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
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                  </select>
                                ) : null}
                              </div>
                            )}
                            <span className="text-[11px] text-gray-500">{course.credits} Credits</span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <select
                              value={course.grade}
                              onChange={(e) => handleUpdateRecordGrade(course.id, e.target.value)}
                              title="Change grade"
                              className="text-yellow-400 font-black text-sm bg-yellow-900/20 px-2.5 py-1.5 rounded-lg border border-yellow-900/50 outline-none focus:border-yellow-500 cursor-pointer"
                            >
                              {gradingScale.map(g => (
                                <option key={g.grade} value={g.grade} className="bg-black text-white">
                                  {g.grade}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => handleDelete(course.id)}
                              title="Delete Record"
                              className="text-gray-500 hover:text-red-500 opacity-70 group-hover:opacity-100 transition-opacity p-1"
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