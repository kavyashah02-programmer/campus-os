import React, { useState, useEffect } from 'react';

const ExamTracker = () => {
  const [exams, setExams] = useState(() => {
    const saved = localStorage.getItem('react_exams');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedExamId, setSelectedExamId] = useState(null);
  const [editingExamId, setEditingExamId] = useState(null);
  
  const [examTitle, setExamTitle] = useState('');
  const [examSubject, setExamSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [newTopic, setNewTopic] = useState('');

  useEffect(() => {
    localStorage.setItem('react_exams', JSON.stringify(exams));
    if (!selectedExamId && exams.length > 0) setSelectedExamId(exams[0].id);
  }, [exams, selectedExamId]);

  const handleExamSubmit = (e) => {
    e.preventDefault();
    if (!examTitle || !examDate) return;
    
    if (editingExamId) {
      setExams(exams.map(ex => ex.id === editingExamId ? { ...ex, title: examTitle, subject: examSubject, date: examDate } : ex));
      setEditingExamId(null);
    } else {
      const newExam = { id: Date.now(), title: examTitle, subject: examSubject, date: examDate, topics: [] };
      setExams([...exams, newExam]);
      setSelectedExamId(newExam.id);
    }
    setExamTitle(''); setExamSubject(''); setExamDate('');
  };

  const handleEditExam = (exam) => {
    setEditingExamId(exam.id);
    setExamTitle(exam.title); setExamSubject(exam.subject); setExamDate(exam.date);
  };

  const deleteExam = (id) => {
    if(window.confirm("Delete this exam and all its topics?")) {
      const remaining = exams.filter(e => e.id !== id);
      setExams(remaining);
      if (selectedExamId === id) setSelectedExamId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const addTopic = (e) => {
    e.preventDefault();
    if (!newTopic || !selectedExamId) return;
    setExams(exams.map(ex => ex.id === selectedExamId ? { ...ex, topics: [...ex.topics, { id: Date.now(), name: newTopic, studied: false, revised: false }] } : ex));
    setNewTopic('');
  };

  const toggleTopicState = (examId, topicId, field) => {
    setExams(exams.map(ex => ex.id === examId ? { ...ex, topics: ex.topics.map(t => t.id === topicId ? { ...t, [field]: !t[field] } : t) } : ex));
  };

  const deleteTopic = (examId, topicId) => {
    setExams(exams.map(ex => ex.id === examId ? { ...ex, topics: ex.topics.filter(t => t.id !== topicId) } : ex));
  };

  const calculateDaysLeft = (targetDate) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const target = new Date(targetDate); target.setHours(0,0,0,0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  };

  const currentExam = exams.find(e => e.id === selectedExamId);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Exam & Syllabus Tracker</h1>
          <p className="text-gray-400 text-sm mt-0.5">Track study progress and revision cycles before test day.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">
        <div className="lg:col-span-1 bg-[#121212] rounded-2xl border border-gray-800 shadow-lg h-full flex flex-col overflow-hidden">
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2"><svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> Upcoming Exams</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {exams.map(exam => {
              const daysLeft = calculateDaysLeft(exam.date);
              return (
                <div key={exam.id} onClick={() => setSelectedExamId(exam.id)} className={`p-3 rounded-xl cursor-pointer transition-all border ${selectedExamId === exam.id ? 'bg-purple-900/20 border-purple-500 shadow-sm' : 'bg-black border-gray-800 hover:border-gray-600'}`}>
                  <div className="flex justify-between items-start">
                    <h3 className={`font-bold text-sm ${selectedExamId === exam.id ? 'text-white' : 'text-gray-300'}`}>{exam.title}</h3>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleEditExam(exam); }} className="text-gray-600 hover:text-white"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteExam(exam.id); }} className="text-gray-600 hover:text-red-400"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">{exam.subject}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded">{exam.date}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${daysLeft < 0 ? 'bg-gray-800 text-gray-500' : daysLeft <= 3 ? 'bg-red-900/30 text-red-400' : 'bg-purple-900/30 text-purple-400'}`}>{daysLeft < 0 ? 'Passed' : `${daysLeft} Days Left`}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t border-gray-800 bg-black/50">
            <h3 className="text-xs font-bold text-gray-400 mb-2">{editingExamId ? 'Edit Exam Date' : 'Add New Exam'}</h3>
            <form onSubmit={handleExamSubmit} className="space-y-3">
              <input type="text" required value={examTitle} onChange={e => setExamTitle(e.target.value)} placeholder="Exam Title" className="w-full bg-black border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none" />
              <input type="text" value={examSubject} onChange={e => setExamSubject(e.target.value)} placeholder="Subject" className="w-full bg-black border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none" />
              <input type="date" required value={examDate} onChange={e => setExamDate(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none [color-scheme:dark]" />
              <div className="flex gap-2">
                 <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg text-sm transition-colors">{editingExamId ? 'Update' : 'Add'}</button>
                 {editingExamId && <button type="button" onClick={() => {setEditingExamId(null); setExamTitle(''); setExamSubject(''); setExamDate('');}} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg text-sm transition-colors">Cancel</button>}
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-3 bg-[#121212] rounded-2xl border border-gray-800 shadow-lg flex flex-col h-full overflow-hidden">
          {!currentExam ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">Select or create an exam to track topics.</div>
          ) : (
            <>
              <div className="p-6 border-b border-gray-800 bg-black/30">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{currentExam.title}</h2>
                    <p className="text-gray-400 text-sm">{currentExam.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Time Remaining</p>
                    <p className={`text-3xl font-black ${calculateDaysLeft(currentExam.date) <= 3 ? 'text-red-500' : 'text-purple-500'}`}>
                      {Math.max(0, calculateDaysLeft(currentExam.date))} <span className="text-lg font-medium text-gray-500">Days</span>
                    </p>
                  </div>
                </div>
                <form onSubmit={addTopic} className="mt-6 flex gap-3">
                  <input type="text" value={newTopic} onChange={e => setNewTopic(e.target.value)} placeholder="Add a new chapter or topic..." className="flex-1 bg-black border border-gray-700 text-white rounded-xl px-4 py-2 text-sm focus:border-purple-500 outline-none" />
                  <button type="submit" className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-6 py-2 rounded-xl border border-gray-700">Add Topic</button>
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1 overflow-hidden">
                <div className="flex flex-col h-full border-r border-gray-800">
                  <div className="p-4 bg-gray-900/20 border-b border-gray-800"><h3 className="font-bold text-blue-400">Self-Study Phase</h3></div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    {currentExam.topics.map(topic => (
                      <div key={topic.id} className={`flex items-center justify-between p-3 rounded-xl border ${topic.studied ? 'bg-black/50 border-gray-800 opacity-60' : 'bg-black border-gray-700'}`}>
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input type="checkbox" checked={topic.studied} onChange={() => toggleTopicState(currentExam.id, topic.id, 'studied')} className="w-5 h-5 accent-blue-500 rounded" />
                          <span className={`text-sm font-semibold select-none ${topic.studied ? 'line-through text-gray-500' : 'text-gray-200'}`}>{topic.name}</span>
                        </label>
                        <button onClick={() => deleteTopic(currentExam.id, topic.id)} className="text-gray-600 hover:text-red-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col h-full">
                  <div className="p-4 bg-purple-900/10 border-b border-gray-800"><h3 className="font-bold text-purple-400">Revision Phase</h3></div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    {currentExam.topics.map(topic => (
                      <div key={`rev-${topic.id}`} className={`flex items-center justify-between p-3 rounded-xl border ${topic.revised ? 'bg-purple-900/20 border-purple-900/50' : 'bg-black border-gray-700'}`}>
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input type="checkbox" checked={topic.revised} onChange={() => toggleTopicState(currentExam.id, topic.id, 'revised')} disabled={!topic.studied} className="w-5 h-5 accent-purple-500 rounded disabled:opacity-30" />
                          <div className="flex flex-col">
                             <span className={`text-sm font-semibold select-none ${topic.revised ? 'text-purple-400' : !topic.studied ? 'text-gray-600' : 'text-gray-200'}`}>{topic.name}</span>
                             {!topic.studied && <span className="text-[9px] text-red-500/70">Complete self-study first</span>}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamTracker;