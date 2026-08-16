import React, { useState, useEffect } from 'react'; // <-- FIXED: Added useEffect here
import { useLocalStorageSync } from './useLocalStorageSync'; // Ensure this path matches

const CGPACalculator = ({ cloudCGPA = [], updateCloudData }) => {
  // CRITICAL FIX 1: Force incoming data to ALWAYS be an Array. 
  // If Firebase accidentally sends an object from an old save, this converts it to []
  const safeCloudCGPA = Array.isArray(cloudCGPA) ? cloudCGPA : [];

  const [courses, setCourses] = useLocalStorageSync('cgpaCalculatorData', safeCloudCGPA);

  // UPDATED BRIDGE: Only update if Firebase actually sends an Array
  useEffect(() => {
    if (Array.isArray(cloudCGPA)) {
      setCourses(cloudCGPA); 
    }
  }, [cloudCGPA]);

  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newCredits, setNewCredits] = useState('');
  const [newGrade, setNewGrade] = useState('A');
  const [newSemester, setNewSemester] = useState('Semester 1'); // NEW: Semester tracking

  // Exact BITS Pilani Scale
  const gradeScale = { 'A': 10, 'A-': 9, 'B': 8, 'B-': 7, 'C': 6, 'C-': 5, 'D': 4, 'E': 2 };
  
  // 10 Semesters for a 5-year programme
  const semesterOptions = Array.from({ length: 10 }, (_, i) => `Semester ${i + 1}`);

  // CRITICAL FIX 2: Guarantee an array to prevent `.map` or `.reduce` crashes
  const safeCourses = Array.isArray(courses) ? courses : [];

  const handleSave = (e) => {
    e.preventDefault();
    if (!newName || !newCredits) return;
    
    const courseData = { 
      id: editingId || Date.now(), 
      name: newName, 
      credits: Number(newCredits), 
      grade: newGrade,
      semester: newSemester
    };
    
    let updatedCourses;
    if (editingId) {
      updatedCourses = safeCourses.map(c => c.id === editingId ? courseData : c);
      setEditingId(null);
    } else {
      updatedCourses = [...safeCourses, courseData];
    }
    
    setCourses(updatedCourses);
    if (updateCloudData) updateCloudData('cgpa', updatedCourses);

    setNewName(''); setNewCredits(''); setNewGrade('A');
  };

  const handleEdit = (id) => {
    const c = safeCourses.find(x => x.id === id);
    if (!c) return;
    setEditingId(c.id); 
    setNewName(c.name); 
    setNewCredits(c.credits); 
    setNewGrade(c.grade);
    setNewSemester(c.semester || 'Semester 1');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteCourse = (id) => {
    const updatedCourses = safeCourses.filter(c => c.id !== id);
    setCourses(updatedCourses);
    if (updateCloudData) updateCloudData('cgpa', updatedCourses);
  };
  
  const cancelEdit = () => { 
    setEditingId(null); setNewName(''); setNewCredits(''); setNewGrade('A'); setNewSemester('Semester 1'); 
  };

  // CRITICAL FIX 3: Bulletproof math engine prevents NaN and division-by-zero crashes
  const calculateGPA = (courseList) => {
    if (!courseList || courseList.length === 0) return { credits: 0, points: 0, gpa: "0.00" };
    
    const credits = courseList.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
    const points = courseList.reduce((sum, c) => sum + ((Number(c.credits) || 0) * (gradeScale[c.grade] || 0)), 0);
    const gpa = credits === 0 ? "0.00" : (points / credits).toFixed(2);
    
    return { credits, points, gpa };
  };

  // Calculate Overall CGPA
  const overall = calculateGPA(safeCourses);

  // Group courses by semester for SGPA
  const coursesBySemester = safeCourses.reduce((acc, course) => {
    const sem = course.semester || 'Semester 1';
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(course);
    return acc;
  }, {});

  // Sort semesters logically (Sem 1, Sem 2, ... Sem 10)
  const sortedSemesters = Object.keys(coursesBySemester).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">CGPA Calculator</h1>
          <p className="text-gray-400 text-sm mt-1">Total Credits: {overall.credits}</p>
        </div>
        <div className="bg-emerald-900/20 border border-emerald-900/50 px-6 py-3 rounded-xl text-center shadow-inner">
          <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider mb-1">Cumulative CGPA</p>
          <p className="text-3xl font-black text-white">{overall.gpa}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        
        {/* ADD/EDIT FORM */}
        <div className="lg:col-span-1 bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg h-fit">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-800 pb-3">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            {editingId ? 'Edit Subject' : 'Add Subject'}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Subject Name *</label>
              <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500 outline-none transition-colors" placeholder="e.g., Data Structures" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Semester *</label>
                <select value={newSemester} onChange={(e) => setNewSemester(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500 outline-none transition-colors">
                  {semesterOptions.map(sem => <option key={sem} value={sem}>{sem}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Credits *</label>
                <input type="number" required min="1" max="15" value={newCredits} onChange={(e) => setNewCredits(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500 outline-none transition-colors" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Expected Grade *</label>
              <select value={newGrade} onChange={(e) => setNewGrade(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500 outline-none transition-colors">
                {Object.keys(gradeScale).map(grade => <option key={grade} value={grade}>{grade} ({gradeScale[grade]} pts)</option>)}
              </select>
            </div>
            
            <div className="pt-2 flex gap-2">
              <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-md">
                {editingId ? 'Update Subject' : 'Add to Calculation'}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ROSTER & SGPA VIEW */}
        <div className="lg:col-span-2 bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg flex flex-col h-[75vh] overflow-hidden">
          <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3 shrink-0">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              Academic Roster
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8">
            {sortedSemesters.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <p>No subjects added yet. Start adding courses to calculate your SGPA and CGPA.</p>
              </div>
            ) : (
              sortedSemesters.map(semester => {
                const semesterCourses = coursesBySemester[semester];
                const semesterStats = calculateGPA(semesterCourses);
                
                return (
                  <div key={semester} className="space-y-3">
                    {/* Semester Header with SGPA */}
                    <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                      <h3 className="text-lg font-bold text-emerald-400">{semester}</h3>
                      <div className="text-right">
                        <span className="text-xs text-gray-400 mr-3">Credits: {semesterStats.credits}</span>
                        <span className="text-sm font-black text-white bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700 shadow-sm">
                          SGPA: {semesterStats.gpa}
                        </span>
                      </div>
                    </div>
                    
                    {/* Courses in this Semester */}
                    <div className="space-y-2">
                      {semesterCourses.map(course => (
                        <div key={course.id} className="bg-black border border-gray-800 p-4 rounded-xl flex items-center justify-between group hover:border-gray-700 transition-colors">
                          <div>
                            <h4 className="text-white font-bold">{course.name}</h4>
                            <p className="text-xs text-gray-400 mt-1">{course.credits} Credits • {gradeScale[course.grade]} Grade Points</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="bg-gray-900 text-emerald-400 font-black text-lg px-4 py-1.5 rounded-lg border border-gray-800 shadow-inner">
                              {course.grade}
                            </div>
                            <div className="flex shrink-0 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEdit(course.id)} className="text-gray-500 hover:text-white bg-gray-800 p-1.5 rounded transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button onClick={() => deleteCourse(course.id)} className="text-gray-500 hover:text-red-400 bg-gray-800 p-1.5 rounded transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CGPACalculator;