import React, { useState, useEffect } from 'react';
import { useLocalStorageSync } from './useLocalStorageSync'; 

const ExamTracker = ({ cloudExams = [], cloudPlanner = [], cloudSubjects = [], updateCloudData }) => {
  const [exams, setExams] = useLocalStorageSync('examTrackerData', cloudExams);
  const [plannerBlocks, setPlannerBlocks] = useLocalStorageSync('dailyPlannerBlocks', cloudPlanner);
  const [subjects] = useLocalStorageSync('subjectsData', cloudSubjects);

  useEffect(() => { if (cloudExams) setExams(cloudExams); }, [cloudExams, setExams]);
  useEffect(() => { if (cloudPlanner) setPlannerBlocks(cloudPlanner); }, [cloudPlanner, setPlannerBlocks]);

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
  const [examPhases, setExamPhases] = useState(''); 

  const [newTopic, setNewTopic] = useState('');
  const [newTopicUnit, setNewTopicUnit] = useState(''); 

  const safeExams = Array.isArray(exams) ? exams : [];
  const safePlannerBlocks = Array.isArray(plannerBlocks) ? plannerBlocks : [];
  const safeSubjects = Array.isArray(subjects) ? subjects : [];

  const calculateDaysLeft = (targetDate) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const target = new Date(targetDate); target.setHours(0,0,0,0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  };

  // --- AUTO-ARCHIVE & UPCOMING EXAM SORTER ---
  // Filters out exams that have already passed, and sorts the remaining by closest date
  const sortedExams = [...safeExams]
    .filter(exam => calculateDaysLeft(exam.date) >= 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Automatically selects the next upcoming exam if none is selected, or if the selected one just passed!
  useEffect(() => {
    if (!selectedExamId && sortedExams.length > 0) setSelectedExamId(sortedExams[0].id);
    else if (selectedExamId && !sortedExams.find(e => e.id === selectedExamId)) {
      setSelectedExamId(sortedExams.length > 0 ? sortedExams[0].id : null);
    }
  }, [selectedExamId, sortedExams]);

  const calculateDuration = (start, end) => {
    if (!start || !end) return '';
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let diff = (endH * 60 + endM) - (startH * 60 + startM);
    if (diff < 0) diff += 24 * 60; 
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hrs === 0) return `${mins} mins`;
    if (mins === 0) return `${hrs} hrs`;
    return `${hrs} hrs ${mins} mins`;
  };

  const timeToMins = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const isBlockOnDate = (block, targetDateStr) => {
    if (block.excludedDates && block.excludedDates.includes(targetDateStr)) return false;
    if (block.date === targetDateStr) return true;
    if (block.repeat === 'Once' || !block.repeat) return false;
    const bDate = new Date(block.date);
    const tDate = new Date(targetDateStr);
    bDate.setHours(0,0,0,0); tDate.setHours(0,0,0,0);
    if (tDate < bDate) return false;
    if (block.repeat === 'Daily') return true;
    if (block.repeat === 'Weekly' && bDate.getDay() === tDate.getDay()) return true;
    if (block.repeat === 'Monthly' && bDate.getDate() === tDate.getDate()) return true;
    if (block.repeat === 'Biweekly') {
      const diffDays = Math.round((tDate.getTime() - bDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays % 14 === 0) return true;
    }
    return false;
  };

  const handleExamSubmit = (e) => {
    e.preventDefault();
    if (!examTitle || !examDate) return;
    
    const parsedPhases = examPhases.split(',').map(s => s.trim()).filter(Boolean);

    let updatedExams;
    const currentExamId = editingExamId || Date.now();
    const examPayload = {
      id: currentExamId, title: examTitle, subject: examSubject, date: examDate, marks: examMarks,
      startTime: examStartTime, endTime: examEndTime, description: examDesc, type: examType,
      customPhases: parsedPhases 
    };

    if (editingExamId) {
      updatedExams = safeExams.map(ex => ex.id === editingExamId ? { ...ex, ...examPayload } : ex);
      setEditingExamId(null);
    } else {
      updatedExams = [...safeExams, { ...examPayload, topics: [] }];
      setSelectedExamId(currentExamId);
    }
    
    setExams(updatedExams);
    if (updateCloudData) updateCloudData('exams', updatedExams);

    if (examStartTime && examEndTime) {
      const exStartMins = timeToMins(examStartTime);
      const exEndMins = timeToMins(examEndTime);
      const examBlockId = `exam-${currentExamId}`;
      let updatedPlanner = [...safePlannerBlocks];

      updatedPlanner = updatedPlanner.map(block => {
        if (block.id === examBlockId) return block;
        if (isBlockOnDate(block, examDate)) {
          const bStart = timeToMins(block.startTime);
          const bEnd = timeToMins(block.endTime);
          if (bStart < exEndMins && bEnd > exStartMins) {
            if (block.repeat === 'Once' || !block.repeat) return null; 
            else return { ...block, excludedDates: [...(block.excludedDates || []), examDate] };
          }
        }
        return block;
      }).filter(Boolean);

      updatedPlanner = updatedPlanner.filter(b => b.id !== examBlockId);
      updatedPlanner.push({
        id: examBlockId, title: `Exam: ${examTitle}`, date: examDate, startTime: examStartTime, endTime: examEndTime,
        repeat: 'Once', color: '#a855f7', location: '', description: `${examSubject} ${examType ? `(${examType})` : ''} - System Auto-Block`, excludedDates: []
      });

      setPlannerBlocks(updatedPlanner);
      if (updateCloudData) updateCloudData('planner', updatedPlanner);
    }
    
    setExamTitle(''); setExamSubject(''); setExamDate(''); setExamMarks('');
    setExamStartTime(''); setExamEndTime(''); setExamDesc(''); setExamType(''); setExamPhases('');
  };

  const handleEditExam = (exam) => {
    setEditingExamId(exam.id);
    setExamTitle(exam.title || ''); setExamSubject(exam.subject || ''); setExamDate(exam.date || '');
    setExamMarks(exam.marks || ''); setExamStartTime(exam.startTime || ''); setExamEndTime(exam.endTime || '');
    setExamDesc(exam.description || ''); setExamType(exam.type || '');
    setExamPhases(exam.customPhases ? exam.customPhases.join(', ') : '');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingExamId(null); 
    setExamTitle(''); setExamSubject(''); setExamDate(''); setExamMarks('');
    setExamStartTime(''); setExamEndTime(''); setExamDesc(''); setExamType(''); setExamPhases('');
  };

  const deleteExam = (id) => {
    if(window.confirm("Delete this exam and all its topics?")) {
      const remaining = safeExams.filter(e => e.id !== id);
      setExams(remaining);
      if (updateCloudData) updateCloudData('exams', remaining);
      
      const cleanedPlanner = safePlannerBlocks.filter(b => b.id !== `exam-${id}`);
      setPlannerBlocks(cleanedPlanner);
      if (updateCloudData) updateCloudData('planner', cleanedPlanner);

      if (selectedExamId === id) setSelectedExamId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const addTopic = (e) => {
    e.preventDefault();
    if (!newTopic || !selectedExamId) return;
    
    const updatedExams = safeExams.map(ex => ex.id === selectedExamId ? { 
      ...ex, 
      topics: [...ex.topics, { id: Date.now(), name: newTopic, unit: newTopicUnit, studied: false, revised: false, customProgress: {} }] 
    } : ex);
    
    setExams(updatedExams);
    if (updateCloudData) updateCloudData('exams', updatedExams);
    setNewTopic(''); setNewTopicUnit('');
  };

  const toggleTopicState = (examId, topicId, field, isCustom = false) => {
    const updatedExams = safeExams.map(ex => {
      if (ex.id !== examId) return ex;
      return {
        ...ex,
        topics: ex.topics.map(t => {
          if (t.id !== topicId) return t;
          if (isCustom) {
            const currentCustom = t.customProgress || {};
            return { ...t, customProgress: { ...currentCustom, [field]: !currentCustom[field] } };
          }
          return { ...t, [field]: !t[field] };
        })
      };
    });
    setExams(updatedExams);
    if (updateCloudData) updateCloudData('exams', updatedExams);
  };

  const deleteTopic = (examId, topicId) => {
    const updatedExams = safeExams.map(ex => ex.id === examId ? { ...ex, topics: ex.topics.filter(t => t.id !== topicId) } : ex);
    setExams(updatedExams);
    if (updateCloudData) updateCloudData('exams', updatedExams);
  };

  const currentExam = safeExams.find(e => e.id === selectedExamId);

  // --- UNIT SEQUENCING LOGIC ---
  // Sorts topics semantically (e.g. 2.1 -> 2.2 -> 2.10) and pushes unit-less topics to the bottom
  const sortedTopics = currentExam ? [...currentExam.topics].sort((a, b) => {
    const uA = a.unit || '';
    const uB = b.unit || '';
    if (!uA && uB) return 1;
    if (uA && !uB) return -1;
    return uA.localeCompare(uB, undefined, { numeric: true, sensitivity: 'base' });
  }) : [];

  const phaseColors = [
    { text: 'text-sky-400', bg: 'bg-sky-900/10', border: 'border-sky-900/50', accent: 'accent-sky-500' },
    { text: 'text-amber-400', bg: 'bg-amber-900/10', border: 'border-amber-900/50', accent: 'accent-amber-500' },
    { text: 'text-rose-400', bg: 'bg-rose-900/10', border: 'border-rose-900/50', accent: 'accent-rose-500' },
    { text: 'text-emerald-400', bg: 'bg-emerald-900/10', border: 'border-emerald-900/50', accent: 'accent-emerald-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-10">
      
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Exam & Syllabus Tracker</h1>
          <p className="text-gray-400 text-sm mt-0.5">Track study progress and auto-sync exams to the Daily Planner.</p>
        </div>
      </header>

      {/* TOP SECTION: ACTIVE EXAM & SYLLABUS PHASES */}
      <div className="bg-[#121212] rounded-2xl border border-gray-800 shadow-lg flex flex-col min-h-[45vh] overflow-hidden shrink-0">
        {!currentExam ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-10 text-center">
            <svg className="w-16 h-16 text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <p className="text-lg font-bold text-white mb-1">No Upcoming Exams</p>
            <p className="text-sm">Create or select an upcoming exam from the roster below to start tracking your syllabus.</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-gray-800 bg-black/30 shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold text-white">{currentExam.title}</h2>
                    {currentExam.type && <span className="text-[10px] bg-blue-900/30 border border-blue-800 text-blue-400 px-2 py-1 rounded font-bold uppercase tracking-wider">{currentExam.type}</span>}
                  </div>
                  <p className="text-gray-400 text-sm">{currentExam.subject} {currentExam.marks ? `• ${currentExam.marks} Marks Total` : ''}</p>
                  
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
                  {currentExam.description && <p className="text-gray-400 text-xs mt-3 italic border-l-2 border-purple-500/50 pl-3 leading-relaxed">"{currentExam.description}"</p>}
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

            <div className="flex overflow-x-auto custom-scrollbar flex-1 min-h-[300px]">
              
              <div className="flex flex-col h-full border-r border-gray-800 min-w-[320px] flex-1 shrink-0">
                <div className="p-4 bg-gray-900/20 border-b border-gray-800 shadow-inner"><h3 className="font-bold text-blue-400 uppercase tracking-wider text-xs">Self-Study Phase</h3></div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                  {sortedTopics.map(topic => (
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
                  {sortedTopics.length === 0 && <p className="text-gray-500 text-sm italic text-center mt-10">No topics added yet.</p>}
                </div>
              </div>

              <div className="flex flex-col h-full border-r border-gray-800 min-w-[320px] flex-1 shrink-0">
                <div className="p-4 bg-purple-900/10 border-b border-gray-800 shadow-inner"><h3 className="font-bold text-purple-400 uppercase tracking-wider text-xs">Revision Phase</h3></div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                  {sortedTopics.map(topic => (
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
                  {sortedTopics.length === 0 && <p className="text-gray-500 text-sm italic text-center mt-10">No topics added yet.</p>}
                </div>
              </div>

              {currentExam.customPhases && currentExam.customPhases.map((phase, index) => {
                const style = phaseColors[index % phaseColors.length];
                return (
                  <div key={phase} className="flex flex-col h-full border-r border-gray-800 min-w-[320px] flex-1 shrink-0">
                    <div className={`p-4 border-b border-gray-800 shadow-inner ${style.bg}`}>
                      <h3 className={`font-bold uppercase tracking-wider text-xs ${style.text}`}>{phase}</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                      {sortedTopics.map(topic => {
                        const isDone = topic.customProgress?.[phase];
                        return (
                          <div key={`custom-${topic.id}-${phase}`} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isDone ? `${style.bg} ${style.border} opacity-70` : 'bg-black border-gray-700 shadow-sm'}`}>
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                              <input type="checkbox" checked={!!isDone} onChange={() => toggleTopicState(currentExam.id, topic.id, phase, true)} className={`w-5 h-5 rounded cursor-pointer ${style.accent}`} />
                              <span className={`text-sm font-semibold select-none ${isDone ? `line-through ${style.text}` : 'text-gray-200'}`}>
                                {topic.unit && <span className="text-gray-500 mr-2 opacity-80">{topic.unit}</span>}
                                {topic.name}
                              </span>
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

            </div>
          </>
        )}
      </div>

      {/* BOTTOM SECTION: EXAM ROSTER TABLE & SETUP FORM */}
      <div className="bg-[#121212] rounded-2xl border border-gray-800 shadow-lg p-6">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Upcoming Exam Roster & Setup
        </h2>

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
               <select value={examSubject} onChange={(e) => setExamSubject(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:border-purple-500 outline-none transition-colors">
                 <option value="" disabled>Select Subject</option>
                 {safeSubjects.length === 0 && <option value="" disabled>⚠️ Please add subjects in the Subjects module</option>}
                 {safeSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
               </select>
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

          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
               <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Custom Tracking Phases</label>
               <input type="text" value={examPhases} onChange={e => setExamPhases(e.target.value)} placeholder="e.g., Solving, PYQs, Mock Tests (comma separated)" className="w-full bg-black border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:border-purple-500 outline-none transition-colors" />
            </div>
            <div className="flex-1">
               <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Description / Notes</label>
               <input type="text" value={examDesc} onChange={e => setExamDesc(e.target.value)} placeholder="Enter syllabus details or extra notes..." className="w-full bg-black border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:border-purple-500 outline-none transition-colors" />
            </div>
          </div>

          <div className="flex justify-end gap-3 shrink-0 pt-2 border-t border-gray-800">
             {editingExamId && (
               <button type="button" onClick={cancelEdit} className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors border border-gray-700">
                 Cancel
               </button>
             )}
             <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-2.5 rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)] whitespace-nowrap">
               {editingExamId ? 'Update Exam' : 'Save New Exam'}
             </button>
          </div>
        </form>

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
                  <td colSpan="5" className="p-10 text-center text-gray-500 italic">No upcoming exams. Everything is up to date!</td>
                </tr>
              ) : (
                sortedExams.map(exam => {
                  const daysLeft = calculateDaysLeft(exam.date);
                  const isSelected = selectedExamId === exam.id;

                  return (
                    <tr key={exam.id} onClick={() => setSelectedExamId(exam.id)} className={`border-b border-gray-800 transition-colors cursor-pointer group hover:bg-purple-900/10 ${isSelected ? 'bg-purple-900/20' : 'bg-black'}`}>
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
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${daysLeft === 0 ? 'bg-orange-900/30 text-orange-400 border border-orange-900/50' : daysLeft <= 3 ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-purple-900/30 text-purple-400 border border-purple-900/50'}`}>
                          {daysLeft === 0 ? 'Today' : `${daysLeft} Days`}
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