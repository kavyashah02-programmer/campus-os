import React, { useState, useEffect } from 'react';
import { useLocalStorageSync } from './useLocalStorageSync'; 

const ExamTracker = ({ cloudExams = [], updateCloudData }) => {
  const [exams, setExams] = useLocalStorageSync('examTrackerData', cloudExams);

  useEffect(() => {
    if (cloudExams) {
      setExams(cloudExams); 
    }
  }, [cloudExams, setExams]);

  const [selectedExamId, setSelectedExamId] = useState(null);
  const [editingExamId, setEditingExamId] = useState(null);
  
  const [examTitle, setExamTitle] = useState('');
  const [examSubject, setExamSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examMarks, setExamMarks] = useState(''); 
  const [examStartTime, setExamStartTime] = useState('');
  const [examEndTime, setExamEndTime] = useState('');
  const [examDesc, setExamDesc] = useState('');
  const [examType, setExamType] = useState('');

  const [newTopic, setNewTopic] = useState('');
  const [newTopicUnit, setNewTopicUnit] = useState(''); 

  const safeExams = Array.isArray(exams) ? exams : [];

  // Sort exams: Nearest upcoming exam first
  const sortedExams = [...safeExams].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  useEffect(() => {
    if (!selectedExamId && sortedExams.length > 0) {
      setSelectedExamId(sortedExams[0].id);
    } else if (selectedExamId && !safeExams.find(e => e.id === selectedExamId)) {
      setSelectedExamId(sortedExams.length > 0 ? sortedExams[0].id : null);
    }
  }, [safeExams, selectedExamId, sortedExams]);

  // --- DURATION CALCULATOR ---
  const calculateDuration = (start, end) => {
    if (!start || !end) return '';
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    let diff = (endH * 60 + endM) - (startH * 60 + startM);
    if (diff < 0) diff += 24 * 60; // Just in case it crosses midnight
    
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    
    if (hrs === 0) return `${mins} mins`;
    if (mins === 0) return `${hrs} hrs`;
    return `${hrs} hrs ${mins} mins`;
  };

  // --- SAVE / UPDATE EXAM ---
  const handleExamSubmit = (e) => {
    e.preventDefault();
    if (!examTitle || !examDate) return;
    
    let updatedExams;
    const examPayload = {
      title: examTitle, subject: examSubject, date: examDate, marks: examMarks,
      startTime: examStartTime, endTime: examEndTime, description: examDesc, type: examType
    };

    if (editingExamId) {
      updatedExams = safeExams.map(ex => ex.id === editingExamId ? { ...ex, ...examPayload } : ex);
      setEditingExamId(null);
    } else {
      const newExam = { id: Date.now(), ...examPayload, topics: [] };
      updatedExams = [...safeExams, newExam];
      setSelectedExamId(newExam.id);
    }
    
    setExams(updatedExams);
    if (updateCloudData) updateCloudData('exams', updatedExams);
    
    setExamTitle(''); setExamSubject(''); setExamDate(''); setExamMarks('');
    setExamStartTime(''); setExamEndTime(''); setExamDesc(''); setExamType('');
  };

  const handleEditExam = (exam) => {
    setEditingExamId(exam.id);
    setExamTitle(exam.title || ''); 
    setExamSubject(exam.subject || ''); 
    setExamDate(exam.date || '');
    setExamMarks(exam.marks || '');
    setExamStartTime(exam.startTime || '');
    setExamEndTime(exam.endTime || '');
    setExamDesc(exam.description || '');
    setExamType(exam.type || '');
    // Auto scroll down to form
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingExamId(null); 
    setExamTitle(''); setExamSubject(''); setExamDate(''); setExamMarks('');
    setExamStartTime(''); setExamEndTime(''); setExamDesc(''); setExamType('');
  };

  const deleteExam = (id) => {
    if(window.confirm("Delete this exam and all its topics?")) {
      const remaining = safeExams.filter(e => e.id !== id);
      setExams(remaining);
      if (updateCloudData) updateCloudData('exams', remaining);
      if (selectedExamId === id) setSelectedExamId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // --- TOPIC MANAGEMENT ---
  const addTopic = (e) => {
    e.preventDefault();
    if (!newTopic || !selectedExamId) return;
    
    const updatedExams = safeExams.map(ex => ex.id === selectedExamId ? { 
      ...ex, 
      topics: [...ex.topics, { id: Date.now(), name: newTopic, unit: newTopicUnit, studied: false, revised: false }] 
    } : ex);
    
    setExams(updatedExams);
    if (updateCloudData) updateCloudData('exams', updatedExams);
    setNewTopic(''); setNewTopicUnit('');
  };

  const toggleTopicState = (examId, topicId, field) => {
    const updatedExams = safeExams.map(ex => ex.id === examId ? { ...ex, topics: ex.topics.map(t => t.id === topicId ? { ...t, [field]: !t[field] } : t) } : ex);
    setExams(updatedExams);
    if (updateCloudData) updateCloudData('exams', updatedExams);
  };

  const deleteTopic = (examId, topicId) => {
    const updatedExams = safeExams.map(ex => ex.id === examId ? { ...ex, topics: ex.topics.filter(t => t.id !== topicId) } : ex);
    setExams(updatedExams);
    if (updateCloudData) updateCloudData('exams', updatedExams);
  };

  const calculateDaysLeft = (targetDate) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const target = new Date(targetDate); target.setHours(0,0,0,0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  };

  const currentExam = safeExams.find(e => e.id === selectedExamId);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-10">
      
      {/* HEADER */}
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Exam & Syllabus Tracker</h1>
          <p className="text-gray-400 text-sm mt-0.5">Track study progress and revision cycles before test day.</p>
        </div>
      </header>

      {/* TOP SECTION: ACTIVE EXAM & SYLLABUS PHASES */}
      <div className="bg-[#121212] rounded-2xl border border-gray-800 shadow-lg flex flex-col min-h-[45vh] overflow-hidden shrink-0">
        {!currentExam ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-10 text-center">
            <svg className="w-16 h-16 text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <p className="text-lg font-bold text-white mb-1">No Exam Selected</p>
            <p className="text-sm">Create or select an exam from the roster below to start tracking your syllabus.</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-gray-800 bg-black/30">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold text-white">{currentExam.title}</h2>
                    {currentExam.type && <span className="text-[10px] bg-blue-900/30 border border-blue-800 text-blue-400 px-2 py-1 rounded font-bold uppercase tracking-wider">{currentExam.type}</span>}
                  </div>
                  
                  <p className="text-gray-400 text-sm">
                    {currentExam.subject} {currentExam.marks ? `• ${currentExam.marks} Marks Total` : ''}
                  </p>
                  
                  {(currentExam.startTime || currentExam.endTime) && (
                    <p className="text-gray-300 text-xs mt-2 flex items-center gap-2">
                      <span className="bg-gray-800 px-2 py-1 rounded border border-gray-700">🕒 {currentExam.startTime || '?'} - {currentExam.endTime || '?'}</span>
                      {currentExam.startTime && currentExam.endTime && (
                        <span className="text-purple-400 font-bold bg-purple-900/20 px-2 py-1 rounded border border-purple-900/50 shadow-sm">
                          Duration: {calculateDuration(currentExam.startTime, currentExam.endTime)}
                        </span>
                      )}
                    </p>
                  )}

                  {currentExam.description && (
                    <p className="text-gray-400 text-xs mt-3 italic border-l-2 border-purple-500/50 pl-3 leading-relaxed">
                      "{currentExam.description}"
                    </p>
                  )}
                </div>
                
                <div className="text-right shrink-0 ml-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Time Remaining</p>
                  <p className={`text-3xl font-black ${calculateDaysLeft(currentExam.date) <= 3 ? 'text-red-500' : 'text-purple-500'}`}>
                    {Math.max(0, calculateDaysLeft(currentExam.date))} <span className="text-lg font-medium text-gray-500">Days</span>
                  </p>
                </div>
              </div>

              <form onSubmit={addTopic} className="mt-6 flex gap-3">
                <input type="text" value={newTopicUnit} onChange={e => setNewTopicUnit(e.target.value)} placeholder="Unit (e.g., 2.1)" className="w-32 bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none transition-colors" />
                <input type="text" value={newTopic} onChange={e => setNewTopic(e.target.value)} placeholder="Add a new chapter or topic name..." className="flex-1 bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none transition-colors" required />
                <button type="submit" className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-8 py-3 rounded-xl border border-gray-700 transition-colors shadow-sm">Add Topic</button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1 overflow-hidden min-h-[300px]">
              <div className="flex flex-col h-full border-r border-gray-800">
                <div className="p-4 bg-gray-900/20 border-b border-gray-800 shadow-inner"><h3 className="font-bold text-blue-400 uppercase tracking-wider text-xs">Self-Study Phase</h3></div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                  {currentExam.topics.map(topic => (
                    <div key={topic.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${topic.studied ? 'bg-black/50 border-gray-800 opacity-60' : 'bg-black border-gray-700 shadow-sm'}`}>
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input type="checkbox" checked={topic.studied} onChange={() => toggleTopicState(currentExam.id, topic.id, 'studied')} className="w-5 h-5 accent-blue-500 rounded cursor-pointer" />
                        <span className={`text-sm font-semibold select-none ${topic.studied ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                          {topic.unit && <span className="text-purple-400 mr-2 opacity-80">{topic.unit}</span>}
                          {topic.name}
                        </span>
                      </label>
                      <button onClick={() => deleteTopic(currentExam.id, topic.id)} className="text-gray-600 hover:text-red-400 p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                  ))}
                  {currentExam.topics.length === 0 && <p className="text-gray-500 text-sm italic text-center mt-10">No topics added yet.</p>}
                </div>
              </div>

              <div className="flex flex-col h-full">
                <div className="p-4 bg-purple-900/10 border-b border-gray-800 shadow-inner"><h3 className="font-bold text-purple-400 uppercase tracking-wider text-xs">Revision Phase</h3></div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                  {currentExam.topics.map(topic => (
                    <div key={`rev-${topic.id}`} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${topic.revised ? 'bg-purple-900/20 border-purple-900/50 shadow-sm' : 'bg-black border-gray-700'}`}>
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input type="checkbox" checked={topic.revised} onChange={() => toggleTopicState(currentExam.id, topic.id, 'revised')} disabled={!topic.studied} className="w-5 h-5 accent-purple-500 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" />
                        <div className="flex flex-col">
                           <span className={`text-sm font-semibold select-none ${topic.revised ? 'text-purple-400' : !topic.studied ? 'text-gray-600' : 'text-gray-200'}`}>
                             {topic.unit && <span className="text-purple-400 mr-2 opacity-80">{topic.unit}</span>}
                             {topic.name}
                           </span>
                           {!topic.studied && <span className="text-[9px] text-red-500/70 mt-0.5">Complete self-study first</span>}
                        </div>
                      </label>
                    </div>
                  ))}
                  {currentExam.topics.length === 0 && <p className="text-gray-500 text-sm italic text-center mt-10">No topics added yet.</p>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* BOTTOM SECTION: EXAM ROSTER TABLE & SETUP FORM */}
      <div className="bg-[#121212] rounded-2xl border border-gray-800 shadow-lg p-6">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Exam Roster & Setup
        </h2>

        {/* Tabular Form */}
        <form onSubmit={handleExamSubmit} className="bg-black/40 p-5 rounded-xl border border-gray-800 mb-8 shadow-inner">
          <h3 className="text-sm font-bold text-purple-400 mb-4">{editingExamId ? 'Edit Exam Details' : 'Add New Exam'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="lg:col-span-2">
               <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Exam Title *</label>
               <input type="text" required value={examTitle} onChange={e => setExamTitle(e.target.value)} placeholder="e.g., Mid Semester Exam" className="w-full bg-black border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:border-purple-500 outline-none transition-colors" />
            </div>
            <div>
               <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Type (Hint)</label>
               <input type="text" value={examType} onChange={e => setExamType(e.target.value)} placeholder="e.g., Mid Sem, Comprehensive" className="w-full bg-black border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:border-purple-500 outline-none transition-colors" />
            </div>
            <div>
               <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Subject</label>
               <input type="text" value={examSubject} onChange={e => setExamSubject(e.target.value)} placeholder="e.g., Engineering Maths" className="w-full bg-black border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:border-purple-500 outline-none transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Date *</label>
              <input type="date" required value={examDate} onChange={e => setExamDate(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:border-purple-500 outline-none [color-scheme:dark] transition-colors" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Start Time</label>
              <input type="time" value={examStartTime} onChange={e => setExamStartTime(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:border-purple-500 outline-none [color-scheme:dark] transition-colors" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">End Time</label>
              <input type="time" value={examEndTime} onChange={e => setExamEndTime(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:border-purple-500 outline-none [color-scheme:dark] transition-colors" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Total Marks</label>
              <input type="number" value={examMarks} onChange={e => setExamMarks(e.target.value)} placeholder="e.g., 100" className="w-full bg-black border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:border-purple-500 outline-none transition-colors" />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
               <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Description / Notes</label>
               <textarea rows="1" value={examDesc} onChange={e => setExamDesc(e.target.value)} placeholder="Enter syllabus details or extra notes..." className="w-full bg-black border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:border-purple-500 outline-none resize-none custom-scrollbar transition-colors" />
            </div>
            <div className="flex items-end gap-3 shrink-0">
               {editingExamId && (
                 <button type="button" onClick={cancelEdit} className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors border border-gray-700">
                   Cancel
                 </button>
               )}
               <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-2.5 rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)] whitespace-nowrap">
                 {editingExamId ? 'Update Exam' : 'Save New Exam'}
               </button>
            </div>
          </div>
        </form>

        {/* Full Width Roster Table */}
        <div className="overflow-x-auto custom-scrollbar border border-gray-800 rounded-xl">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-black/50 border-b-2 border-gray-800 text-gray-500 text-[10px] uppercase tracking-wider font-bold">
                <th className="p-4 w-1/3">Exam Details</th>
                <th className="p-4">Subject & Marks</th>
                <th className="p-4">Schedule & Duration</th>
                <th className="p-4">Countdown</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedExams.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-gray-500 italic">No exams scheduled yet. Add your first exam above.</td>
                </tr>
              ) : (
                sortedExams.map(exam => {
                  const daysLeft = calculateDaysLeft(exam.date);
                  const isSelected = selectedExamId === exam.id;

                  return (
                    <tr 
                      key={exam.id} 
                      onClick={() => setSelectedExamId(exam.id)} 
                      className={`border-b border-gray-800 transition-colors cursor-pointer group hover:bg-purple-900/10 ${isSelected ? 'bg-purple-900/20' : 'bg-black'}`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {isSelected ? (
                            <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] shrink-0"></span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-gray-800 shrink-0"></span>
                          )}
                          <div>
                            <h4 className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-gray-300'}`}>{exam.title}</h4>
                            <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mt-0.5">{exam.type || 'Standard Exam'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-300 font-medium">{exam.subject || '-'}</p>
                        {exam.marks && <p className="text-[10px] text-gray-500 mt-0.5">{exam.marks} Marks Total</p>}
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-300 font-medium">{new Date(exam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        {(exam.startTime || exam.endTime) && (
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {exam.startTime || '?'} - {exam.endTime || '?'} {exam.startTime && exam.endTime && <span className="text-purple-400 ml-1 opacity-80">({calculateDuration(exam.startTime, exam.endTime)})</span>}
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${daysLeft < 0 ? 'bg-gray-800 text-gray-500' : daysLeft === 0 ? 'bg-orange-900/30 text-orange-400 border border-orange-900/50' : daysLeft <= 3 ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-purple-900/30 text-purple-400 border border-purple-900/50'}`}>
                          {daysLeft < 0 ? 'Passed' : daysLeft === 0 ? 'Today' : `${daysLeft} Days`}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); handleEditExam(exam); }} title="Edit Exam" className="text-gray-400 hover:text-white bg-gray-900 p-2 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deleteExam(exam.id); }} title="Delete Exam" className="text-gray-400 hover:text-red-400 bg-gray-900 p-2 rounded-lg border border-gray-700 hover:border-red-900/50 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default ExamTracker;