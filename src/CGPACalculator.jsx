import React, { useState, useEffect } from 'react';

const CGPACalculator = () => {
  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem('react_cgpa');
    return saved ? JSON.parse(saved) : [];
  });

  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newCredits, setNewCredits] = useState('');
  const [newGrade, setNewGrade] = useState('A');

  // Exact BITS Pilani Scale
  const gradeScale = { 'A': 10, 'A-': 9, 'B': 8, 'B-': 7, 'C': 6, 'C-': 5, 'D': 4, 'E': 2 };

  useEffect(() => { localStorage.setItem('react_cgpa', JSON.stringify(courses)); }, [courses]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!newName || !newCredits) return;
    const courseData = { id: editingId || Date.now(), name: newName, credits: Number(newCredits), grade: newGrade };
    
    if (editingId) {
      setCourses(courses.map(c => c.id === editingId ? courseData : c));
      setEditingId(null);
    } else {
      setCourses([...courses, courseData]);
    }
    setNewName(''); setNewCredits(''); setNewGrade('A');
  };

  const handleEdit = (id) => {
    const c = courses.find(x => x.id === id);
    if (!c) return;
    setEditingId(c.id); setNewName(c.name); setNewCredits(c.credits); setNewGrade(c.grade);
  };

  const deleteCourse = (id) => setCourses(courses.filter(c => c.id !== id));
  const cancelEdit = () => { setEditingId(null); setNewName(''); setNewCredits(''); setNewGrade('A'); };

  const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
  const totalPoints = courses.reduce((sum, course) => sum + (course.credits * gradeScale[course.grade]), 0);
  const cgpa = totalCredits === 0 ? 0 : (totalPoints / totalCredits).toFixed(2);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg flex justify-between items-center">
        <div><h1 className="text-2xl font-extrabold text-white tracking-tight">CGPA Calculator</h1></div>
        <div className="bg-emerald-900/20 border border-emerald-900/50 px-6 py-3 rounded-xl text-center shadow-inner">
          <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider mb-1">Current CGPA</p>
          <p className="text-3xl font-black text-white">{cgpa}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        <div className="lg:col-span-1 bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg h-fit">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-800 pb-3">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            {editingId ? 'Edit Subject' : 'Add Subject'}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Subject Name *</label>
              <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Credits Hours *</label>
                <input type="number" required min="1" max="15" value={newCredits} onChange={(e) => setNewCredits(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Expected Grade *</label>
                <select value={newGrade} onChange={(e) => setNewGrade(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500 outline-none">
                  {Object.keys(gradeScale).map(grade => <option key={grade} value={grade}>{grade} ({gradeScale[grade]} pts)</option>)}
                </select>
              </div>
            </div>
            <div className="pt-2 flex gap-2">
              <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors text-sm">{editingId ? 'Update' : 'Add to Calculation'}</button>
              {editingId && <button type="button" onClick={cancelEdit} className="flex-1 bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors text-sm">Cancel</button>}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3">
            <h2 className="text-base font-bold text-white">Subject Roster</h2>
            <span className="text-xs font-bold text-gray-400 bg-gray-800 px-3 py-1 rounded-full">Total Credits: {totalCredits}</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
            {courses.map(course => (
              <div key={course.id} className="bg-black border border-gray-800 p-4 rounded-xl flex items-center justify-between group">
                <div>
                  <h3 className="text-white font-bold">{course.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{course.credits} Credits • {gradeScale[course.grade]} Grade Points</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-gray-800 text-emerald-400 font-black text-xl px-4 py-2 rounded-lg border border-gray-700">{course.grade}</div>
                  <div className="flex shrink-0 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(course.id)} className="text-gray-500 hover:text-white"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    <button onClick={() => deleteCourse(course.id)} className="text-gray-500 hover:text-red-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CGPACalculator;