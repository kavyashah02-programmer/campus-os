import React, { useState, useEffect } from 'react';
import { useLocalStorageSync } from './useLocalStorageSync';

const SEMESTERS = Array.from({ length: 10 }, (_, i) => `Semester ${i + 1}`);

export const DEFAULT_GRADING_SYSTEM = [
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

const Subjects = ({
  cloudSubjects = [],
  cloudActiveSemester = 'Semester 1',
  cloudGradingSystem = null,
  updateCloudData
}) => {
  const [subjects, setSubjects] = useLocalStorageSync('subjectsData', cloudSubjects);
  const [activeSemester, setActiveSemester] = useState(cloudActiveSemester ? cloudActiveSemester : 'Semester 1');
  const [gradingSystem, setGradingSystem] = useLocalStorageSync(
    'gradingSystemData',
    Array.isArray(cloudGradingSystem) && cloudGradingSystem.length > 0
      ? cloudGradingSystem
      : DEFAULT_GRADING_SYSTEM
  );

  useEffect(() => {
    if (cloudSubjects && cloudSubjects.length > 0) setSubjects(cloudSubjects);
  }, [cloudSubjects, setSubjects]);

  useEffect(() => {
    if (cloudActiveSemester) setActiveSemester(cloudActiveSemester);
  }, [cloudActiveSemester]);

  useEffect(() => {
    if (Array.isArray(cloudGradingSystem) && cloudGradingSystem.length > 0) {
      setGradingSystem(cloudGradingSystem);
    }
  }, [cloudGradingSystem, setGradingSystem]);

  const safeSubjects = Array.isArray(subjects) ? subjects : [];
  const safeGrading = Array.isArray(gradingSystem) && gradingSystem.length > 0
    ? gradingSystem
    : DEFAULT_GRADING_SYSTEM;

  // Subject Form State
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [credits, setCredits] = useState(3);

  // Grading Scale Form State
  const [newGradeLabel, setNewGradeLabel] = useState('');
  const [newGradePoints, setNewGradePoints] = useState('');

  const handleSemesterChange = (e) => {
    const newSem = e.target.value;
    setActiveSemester(newSem);
    if (updateCloudData) updateCloudData('activeSemester', newSem);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name || !name.trim()) return;

    const numericCredits = Number(credits);
    if (isNaN(numericCredits) || numericCredits <= 0) return;

    let updatedSubjects;
    if (editingId) {
      updatedSubjects = safeSubjects.map(s =>
        s.id === editingId
          ? { ...s, name: name.trim(), credits: numericCredits, semester: activeSemester }
          : s
      );
      setEditingId(null);
    } else {
      updatedSubjects = [
        ...safeSubjects,
        {
          id: Date.now().toString(),
          name: name.trim(),
          credits: numericCredits,
          semester: activeSemester
        }
      ];
    }

    setSubjects(updatedSubjects);
    if (updateCloudData) updateCloudData('subjects', updatedSubjects);
    setName('');
    setCredits(3);
  };

  const handleEdit = (subject) => {
    setEditingId(subject.id);
    setName(subject.name ? subject.name : '');
    setCredits(subject.credits !== undefined ? subject.credits : 3);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this subject?')) {
      const updatedSubjects = safeSubjects.filter(s => s.id !== id);
      setSubjects(updatedSubjects);
      if (updateCloudData) updateCloudData('subjects', updatedSubjects);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setCredits(3);
  };

  // --- GRADING SYSTEM HANDLERS ---
  const saveGradingScale = (updatedScale) => {
    // Always keep grades sorted from highest points to lowest
    const sorted = [...updatedScale].sort((a, b) => b.points - a.points);
    setGradingSystem(sorted);
    if (updateCloudData) updateCloudData('gradingSystem', sorted);
  };

  const handleAddGrade = (e) => {
    e.preventDefault();
    const label = newGradeLabel.trim().toUpperCase();
    const pts = Number(newGradePoints);
    if (!label || newGradePoints === '' || isNaN(pts) || pts < 0) return;

    // Replace existing grade if label matches, otherwise append
    const exists = safeGrading.some(g => g.grade.toUpperCase() === label);
    const updated = exists
      ? safeGrading.map(g => (g.grade.toUpperCase() === label ? { grade: label, points: pts } : g))
      : [...safeGrading, { grade: label, points: pts }];

    saveGradingScale(updated);
    setNewGradeLabel('');
    setNewGradePoints('');
  };

  const handleUpdateGradePoints = (gradeLabel, newPtsStr) => {
    const pts = Number(newPtsStr);
    if (isNaN(pts) || pts < 0) return;
    const updated = safeGrading.map(g => (g.grade === gradeLabel ? { ...g, points: pts } : g));
    saveGradingScale(updated);
  };

  const handleDeleteGrade = (gradeLabel) => {
    if (safeGrading.length <= 1) {
      alert('You must keep at least one grade in the grading system.');
      return;
    }
    const updated = safeGrading.filter(g => g.grade !== gradeLabel);
    saveGradingScale(updated);
  };

  const handleResetGrading = () => {
    if (window.confirm('Reset grading scale back to default (A=10 down to NC=0)?')) {
      saveGradingScale(DEFAULT_GRADING_SYSTEM);
    }
  };

  const displayedSubjects = safeSubjects.filter(
    s => (s.semester ? s.semester : 'Semester 1') === activeSemester
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-10">
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Master Subjects & Grading</h1>
          <p className="text-gray-400 text-sm mt-0.5">Configure semester courses, credits, and your university grading scale.</p>
        </div>
        <div className="flex flex-col items-end">
          <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">Active Semester</label>
          <select
            value={activeSemester}
            onChange={handleSemesterChange}
            className="bg-black border border-gray-700 text-fuchsia-400 font-bold rounded-xl px-4 py-2 text-sm focus:border-fuchsia-500 outline-none transition-colors"
          >
            {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* LEFT 2 COLUMNS: SUBJECTS & CREDITS */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg h-fit">
            <h2 className="text-base font-bold text-white mb-4 border-b border-gray-800 pb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse"></span>
              {editingId ? 'Edit Subject' : `Add Subject to ${activeSemester}`}
            </h2>
            <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., MATH F111, Data Structures..."
                className="flex-1 bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-fuchsia-500 outline-none transition-colors"
              />
              <div className="flex items-center gap-2 bg-black border border-gray-700 rounded-xl px-3">
                <label className="text-[10px] uppercase font-bold text-gray-500">Credits</label>
                <input
                  type="number"
                  min="0.5"
                  max="20"
                  step="0.5"
                  required
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  className="w-16 bg-transparent text-fuchsia-400 font-bold text-sm py-3 text-center outline-none"
                />
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="submit"
                  className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold px-6 py-3 rounded-xl shadow-[0_0_10px_rgba(192,38,211,0.3)] transition-colors text-sm"
                >
                  {editingId ? 'Update' : 'Save'}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-4 py-3 rounded-xl transition-colors text-sm"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg flex-1 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3">
              <h2 className="text-base font-bold text-white">Your Subjects</h2>
              <span className="text-[10px] bg-gray-900 border border-gray-800 text-gray-400 px-2 py-1 rounded uppercase tracking-wider font-bold">
                {activeSemester} • {displayedSubjects.reduce((sum, s) => sum + (Number(s.credits) > 0 ? Number(s.credits) : 3), 0)} Credits
              </span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 max-h-[420px]">
              {displayedSubjects.length === 0 ? (
                <p className="text-gray-500 text-sm italic text-center py-10">No subjects added for {activeSemester} yet.</p>
              ) : (
                displayedSubjects.map(subject => (
                  <div
                    key={subject.id}
                    className="flex justify-between items-center p-4 bg-black border border-gray-800 rounded-xl hover:border-gray-700 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold">{subject.name}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-fuchsia-900/20 text-fuchsia-400 border border-fuchsia-900/50 px-2 py-0.5 rounded">
                        {subject.credits !== undefined ? subject.credits : 3} Credits
                      </span>
                    </div>
                    <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(subject)}
                        className="text-gray-400 hover:text-white bg-gray-900 p-2 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id)}
                        className="text-gray-400 hover:text-red-400 bg-gray-900 p-2 rounded-lg border border-gray-700 hover:border-red-900/50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CUSTOM GRADING SYSTEM */}
        <div className="lg:col-span-1 bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg flex flex-col h-fit">
          <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3">
            <h2 className="text-base font-bold text-white">Grading System</h2>
            <button
              type="button"
              onClick={handleResetGrading}
              className="text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-yellow-400 transition-colors"
            >
              Reset Default
            </button>
          </div>

          <form onSubmit={handleAddGrade} className="flex gap-2 mb-4">
            <input
              type="text"
              required
              maxLength="4"
              value={newGradeLabel}
              onChange={(e) => setNewGradeLabel(e.target.value)}
              placeholder="Grade (A+)"
              className="w-1/2 bg-black border border-gray-700 text-white rounded-xl px-3 py-2 text-xs focus:border-yellow-500 outline-none uppercase"
            />
            <input
              type="number"
              required
              min="0"
              max="100"
              step="0.5"
              value={newGradePoints}
              onChange={(e) => setNewGradePoints(e.target.value)}
              placeholder="Pts (10)"
              className="w-1/3 bg-black border border-gray-700 text-yellow-400 font-bold rounded-xl px-3 py-2 text-xs focus:border-yellow-500 outline-none text-center"
            />
            <button
              type="submit"
              className="bg-yellow-600 hover:bg-yellow-500 text-black font-black px-3 py-2 rounded-xl text-xs transition-colors"
            >
              +
            </button>
          </form>

          <div className="space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
            {safeGrading.map(item => (
              <div
                key={item.grade}
                className="flex items-center justify-between bg-black border border-gray-800 rounded-xl px-3 py-2"
              >
                <span className="font-black text-white text-sm w-12">{item.grade}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={item.points}
                    onChange={(e) => handleUpdateGradePoints(item.grade, e.target.value)}
                    className="w-16 bg-[#121212] border border-gray-700 text-yellow-400 font-bold text-xs rounded-lg px-2 py-1 text-center outline-none focus:border-yellow-500"
                  />
                  <span className="text-[10px] text-gray-500 font-bold uppercase">pts</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteGrade(item.grade)}
                    className="text-gray-600 hover:text-red-400 p-1 transition-colors"
                    title="Remove Grade"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subjects;