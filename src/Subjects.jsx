import React, { useState, useEffect } from 'react';
import { useLocalStorageSync } from './useLocalStorageSync'; 

const Subjects = ({ cloudSubjects = [], updateCloudData }) => {
  const [subjects, setSubjects] = useLocalStorageSync('subjectsData', cloudSubjects);

  useEffect(() => {
    if (cloudSubjects) setSubjects(cloudSubjects);
  }, [cloudSubjects, setSubjects]);

  const safeSubjects = Array.isArray(subjects) ? subjects : [];

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    let updatedSubjects;
    if (editingId) {
      updatedSubjects = safeSubjects.map(s => s.id === editingId ? { ...s, name } : s);
      setEditingId(null);
    } else {
      updatedSubjects = [...safeSubjects, { id: Date.now().toString(), name }];
    }

    setSubjects(updatedSubjects);
    if (updateCloudData) updateCloudData('subjects', updatedSubjects);
    setName('');
  };

  const handleEdit = (subject) => {
    setEditingId(subject.id);
    setName(subject.name);
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-10">
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg shrink-0">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Master Subjects</h1>
        <p className="text-gray-400 text-sm mt-0.5">Manage the master list of subjects available across your trackers.</p>
      </header>

      <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg h-fit">
        <h2 className="text-base font-bold text-white mb-4 border-b border-gray-800 pb-3">
          {editingId ? 'Edit Subject' : 'Add New Subject'}
        </h2>
        <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-3">
          <input 
            type="text" required value={name} onChange={(e) => setName(e.target.value)} 
            placeholder="e.g., Data Structures, Engineering Maths..." 
            className="flex-1 bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors" 
          />
          <div className="flex gap-2 shrink-0">
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-colors text-sm">
              {editingId ? 'Update' : 'Add Subject'}
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
        <h2 className="text-base font-bold text-white mb-4 border-b border-gray-800 pb-3">Your Subjects</h2>
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
          {safeSubjects.length === 0 ? (
            <p className="text-gray-500 text-sm italic text-center py-10">No subjects added yet.</p>
          ) : (
            safeSubjects.map(subject => (
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