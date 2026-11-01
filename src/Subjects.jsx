import React, { useState, useEffect } from 'react';
import { useLocalStorageSync } from './useLocalStorageSync'; 

const SEMESTERS = Array.from({length: 10}, (_, i) => `Semester ${i + 1}`);

const Subjects = ({ cloudSubjects = [], cloudActiveSemester = 'Semester 1', updateCloudData }) => {
  // Sync arrays/objects normally
  const [subjects, setSubjects] = useLocalStorageSync('subjectsData', cloudSubjects);
  
  // FIX: Use standard state for strings to prevent JSON.parse() syntax crashes
  const [activeSemester, setActiveSemester] = useState(cloudActiveSemester || 'Semester 1');

  useEffect(() => {
    if (cloudSubjects && cloudSubjects.length > 0) setSubjects(cloudSubjects);
  }, [cloudSubjects, setSubjects]);
  
  useEffect(() => {
    if (cloudActiveSemester) setActiveSemester(cloudActiveSemester);
  }, [cloudActiveSemester]);

  const safeSubjects = Array.isArray(subjects) ? subjects : [];

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');

  const handleSemesterChange = (e) => {
    const newSem = e.target.value;
    setActiveSemester(newSem);
    if (updateCloudData) updateCloudData('activeSemester', newSem);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name || !name.trim()) return; // Added safety check

    let updatedSubjects;
    if (editingId) {
      updatedSubjects = safeSubjects.map(s => s.id === editingId ? { ...s, name, semester: activeSemester } : s);
      setEditingId(null);
    } else {
      updatedSubjects = [...safeSubjects, { id: Date.now().toString(), name, semester: activeSemester }];
    }

    setSubjects(updatedSubjects);
    if (updateCloudData) updateCloudData('subjects', updatedSubjects);
    setName('');
  };

  const handleEdit = (subject) => {
    setEditingId(subject.id);
    setName(subject.name || '');
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this subject?")) {
      const updatedSubjects = safeSubjects.filter(s => s.id !== id);
      setSubjects(updatedSubjects);
      if (updateCloudData) updateCloudData('subjects', updatedSubjects);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
  };

  // Filter subjects to only show the ones for the currently selected semester
  const displayedSubjects = safeSubjects.filter(s => !s.semester || s.semester === activeSemester);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-10">
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Master Subjects</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage the master list of subjects available across your trackers.</p>
        </div>
        <div className="flex flex-col items-end">
           <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">Active Semester</label>
           <select value={activeSemester} onChange={handleSemesterChange} className="bg-black border border-gray-700 text-fuchsia-400 font-bold rounded-xl px-4 py-2 text-sm focus:border-fuchsia-500 outline-none transition-colors">
              {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
           </select>
        </div>
      </header>

      <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg h-fit">
        <h2 className="text-base font-bold text-white mb-4 border-b border-gray-800 pb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse"></span>
          {editingId ? 'Edit Subject' : `Add Subject to ${activeSemester}`}
        </h2>
        <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-3">
          <input 
            type="text" required value={name} onChange={(e) => setName(e.target.value)} 
            placeholder="e.g., Data Structures, Engineering Maths..." 
            className="flex-1 bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-fuchsia-500 outline-none transition-colors" 
          />
          <div className="flex gap-2 shrink-0">
            <button type="submit" className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold px-6 py-3 rounded-xl shadow-[0_0_10px_rgba(192,38,211,0.3)] transition-colors text-sm">
              {editingId ? 'Update' : 'Save Subject'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg flex-1 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3">
           <h2 className="text-base font-bold text-white">Your Subjects</h2>
           <span className="text-[10px] bg-gray-900 border border-gray-800 text-gray-400 px-2 py-1 rounded uppercase tracking-wider font-bold">Showing: {activeSemester}</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
          {displayedSubjects.length === 0 ? (
            <p className="text-gray-500 text-sm italic text-center py-10">No subjects added for {activeSemester} yet.</p>
          ) : (
            displayedSubjects.map(subject => (
              <div key={subject.id} className="flex justify-between items-center p-4 bg-black border border-gray-800 rounded-xl hover:border-gray-700 transition-colors group">
                <span className="text-white font-bold">{subject.name}</span>
                <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(subject)} className="text-gray-400 hover:text-white bg-gray-900 p-2 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(subject.id)} className="text-gray-400 hover:text-red-400 bg-gray-900 p-2 rounded-lg border border-gray-700 hover:border-red-900/50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Subjects;