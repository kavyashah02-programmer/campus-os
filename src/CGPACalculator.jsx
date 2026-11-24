import React, { useState, useEffect } from 'react';
import { useLocalStorageSync } from './useLocalStorageSync'; 

const GRADE_POINTS = { 'A': 10, 'A-': 9, 'B': 8, 'B-': 7, 'C': 6, 'C-': 5, 'D': 4, 'E': 2, 'NC': 0 };

const CGPACalculator = ({ cloudCGPA = [], cloudSubjects = [], activeSemester = 'Semester 1', updateCloudData }) => {
  const [records, setRecords] = useLocalStorageSync('cgpaData', cloudCGPA);

  useEffect(() => {
    if (cloudCGPA && cloudCGPA.length > 0) setRecords(cloudCGPA);
  }, [cloudCGPA, setRecords]);

  const safeRecords = Array.isArray(records) ? records : [];
  const safeSubjects = Array.isArray(cloudSubjects) ? cloudSubjects : [];

  const [subject, setSubject] = useState('');
  const [credits, setCredits] = useState(3);
  const [grade, setGrade] = useState('A');

  const handleAddRecord = (e) => {
    e.preventDefault();
    if (!subject) return;

    const newRecord = {
      id: Date.now().toString(),
      subject,
      credits: Number(credits),
      grade,
      semester: activeSemester
    };

    const updated = [...safeRecords, newRecord];
    setRecords(updated);
    if (updateCloudData) updateCloudData('cgpa', updated);
    
    setSubject('');
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this grade record?")) {
      const updated = safeRecords.filter(r => r.id !== id);
      setRecords(updated);
      if (updateCloudData) updateCloudData('cgpa', updated);
    }
  };

  const calculateGPA = (courses) => {
    if (courses.length === 0) return 0;
    let totalPoints = 0;
    let totalCredits = 0;
    courses.forEach(c => {
      totalPoints += c.credits * GRADE_POINTS[c.grade];
      totalCredits += c.credits;
    });
    return totalCredits === 0 ? 0 : (totalPoints / totalCredits).toFixed(2);
  };

  const cgpa = calculateGPA(safeRecords);
  
  // FIX: Force legacy records into Semester 1 for SGPA
  const currentSemesterRecords = safeRecords.filter(r => (r.semester ? r.semester : 'Semester 1') === activeSemester);
  const sgpa = calculateGPA(currentSemesterRecords);

  // FIX: Force legacy records into Semester 1 for Transcript Grouping
  const groupedRecords = safeRecords.reduce((acc, curr) => {
    const sem = curr.semester ? curr.semester : 'Semester 1';
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(curr);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-10">
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">CGPA Calculator</h1>
          <p className="text-gray-400 text-sm mt-0.5">Accurate BITS Pilani 10-point scale tracking.</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] bg-gray-900 border border-gray-800 text-gray-400 px-2 py-1 rounded uppercase tracking-wider font-bold">Active: {activeSemester}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
        <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg flex flex-col items-center justify-center text-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Overall CGPA</p>
          <div className={`text-6xl font-black font-mono drop-shadow-md ${cgpa >= 8.5 ? 'text-emerald-400' : cgpa >= 7.0 ? 'text-blue-400' : 'text-yellow-400'}`}>
            {cgpa}
          </div>
          <p className="text-[10px] text-gray-500 mt-3">Calculated across ALL semesters</p>
        </div>

        <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Current SGPA ({activeSemester})</p>
          <div className="text-5xl font-black text-white font-mono drop-shadow-md">
            {sgpa}
          </div>
          <p className="text-[10px] text-gray-500 mt-3">Target: 8.5+</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        <div className="lg:col-span-1 bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg h-fit">
          <h2 className="text-lg font-bold text-white mb-6 border-b border-gray-800 pb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg> 
            Log a Grade
          </h2>
          <form onSubmit={handleAddRecord} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Subject ({activeSemester})</label>
              <select required value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-yellow-500 outline-none transition-colors">
                <option value="" disabled>Select Subject...</option>
                {safeSubjects.length === 0 && <option value="" disabled>⚠️ Add subjects in Subjects module first</option>}
                {safeSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Credits</label>
                <input type="number" min="1" max="10" required value={credits} onChange={e => setCredits(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-yellow-500 outline-none text-center" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Grade Earned</label>
                <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full bg-black border border-gray-700 text-yellow-400 font-bold rounded-xl px-4 py-3 text-sm focus:border-yellow-500 outline-none text-center">
                  {Object.keys(GRADE_POINTS).map(g => <option key={g} value={g}>{g} ({GRADE_POINTS[g]})</option>)}
                </select>
              </div>
            </div>

            <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black py-3 rounded-xl shadow-[0_0_15px_rgba(202,138,4,0.3)] transition-colors mt-4">
              Add to Transcript
            </button>
          </form>
        </div>

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
                    <span className="text-xs font-bold text-gray-500">SGPA: <span className="text-yellow-400">{calculateGPA(courses)}</span></span>
                  </div>
                  
                  <div className="space-y-2">
                    {courses.map(course => (
                      <div key={course.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-900 group">
                        <div className="flex flex-col">
                          <span className="text-gray-200 text-sm font-bold">{course.subject}</span>
                          <span className="text-[10px] text-gray-500">{course.credits} Credits</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-yellow-400 font-black text-lg bg-yellow-900/20 px-3 py-1 rounded border border-yellow-900/50 shadow-sm">{course.grade}</span>
                          <button onClick={() => handleDelete(course.id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
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