import React, { useState, useEffect } from 'react';
import { useLocalStorageSync } from './useLocalStorageSync'; 

const getLocalDate = (d = new Date()) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Attendance = ({ cloudAttendance = {}, cloudSubjects = [], updateCloudData }) => {
  
  const [schedules, setSchedules] = useLocalStorageSync('attendanceSchedules', cloudAttendance.schedules || []);
  const [records, setRecords] = useLocalStorageSync('attendanceRecords', cloudAttendance.records || {});
  const [threshold, setThreshold] = useLocalStorageSync('attendanceThreshold', cloudAttendance.threshold || 75);
  const [customClassTypes, setCustomClassTypes] = useLocalStorageSync('attendanceClassTypes', cloudAttendance.classTypes || ['Lecture', 'Tutorial', 'Lab']);

  useEffect(() => {
    if (cloudAttendance.schedules) setSchedules(cloudAttendance.schedules);
    if (cloudAttendance.records) setRecords(cloudAttendance.records);
    if (cloudAttendance.threshold) setThreshold(cloudAttendance.threshold);
    if (cloudAttendance.classTypes) setCustomClassTypes(cloudAttendance.classTypes);
  }, [cloudAttendance, setSchedules, setRecords, setThreshold, setCustomClassTypes]);

  const safeSubjects = Array.isArray(cloudSubjects) ? cloudSubjects : [];
  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  const safeRecords = records || {};

  const [activeTab, setActiveTab] = useState('mark'); 
  
  const [subject, setSubject] = useState('');
  const [classType, setClassType] = useState(customClassTypes[0] || ''); 
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [isManagingTypes, setIsManagingTypes] = useState(false);
  const [newTypeInput, setNewTypeInput] = useState('');

  const [targetDate, setTargetDate] = useState(getLocalDate());
  const [startDate, setStartDate] = useState(getLocalDate(new Date(new Date().setDate(new Date().getDate() - 30)))); 
  const [endDate, setEndDate] = useState(getLocalDate());

  const saveToCloud = (newSchedules, newRecords, newThreshold = threshold, newClassTypes = customClassTypes) => {
    setSchedules(newSchedules);
    setRecords(newRecords);
    setThreshold(newThreshold);
    setCustomClassTypes(newClassTypes);
    if (updateCloudData) {
      updateCloudData('attendance', { schedules: newSchedules, records: newRecords, threshold: newThreshold, classTypes: newClassTypes });
    }
  };

  const handleAddClass = (e) => {
    e.preventDefault();
    if (!subject || !startTime || !endTime) return;
    
    const newClass = {
      id: Date.now().toString(),
      subject,
      classType, 
      dayOfWeek,
      startTime,
      endTime
    };
    
    saveToCloud([...safeSchedules, newClass], safeRecords);
    setStartTime(''); setEndTime('');
  };

  const handleDeleteClass = (id) => {
    if (window.confirm("Delete this class schedule? (Attendance records will remain for reports)")) {
      saveToCloud(safeSchedules.filter(s => s.id !== id), safeRecords);
    }
  };

  const handleMarkAttendance = (dateStr, scheduleId, status) => {
    const key = `${dateStr}_${scheduleId}`;
    const newRecords = { ...safeRecords };
    
    if (newRecords[key] === status) {
      delete newRecords[key]; 
    } else {
      newRecords[key] = status; 
    }
    
    saveToCloud(safeSchedules, newRecords);
  };

  const handleAddCustomType = () => {
    if(newTypeInput.trim() && !customClassTypes.includes(newTypeInput.trim())) {
      const updatedTypes = [...customClassTypes, newTypeInput.trim()];
      saveToCloud(safeSchedules, safeRecords, threshold, updatedTypes);
      setClassType(newTypeInput.trim());
      setNewTypeInput('');
    }
  };

  const handleRemoveCustomType = (typeToRemove) => {
    if (window.confirm(`Remove "${typeToRemove}" from options? (Existing classes will keep this label)`)) {
      const updatedTypes = customClassTypes.filter(t => t !== typeToRemove);
      saveToCloud(safeSchedules, safeRecords, threshold, updatedTypes);
      if (classType === typeToRemove) setClassType(updatedTypes[0] || '');
    }
  };

  const generateReport = () => {
    const reportDays = [];
    const subjectStats = {};
    let totalP = 0;
    let totalA = 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start) || isNaN(end) || start > end) return { reportDays, subjectStats, overall: 0, totalP: 0, totalA: 0 };

    let curr = new Date(start);
    while (curr <= end) {
      const dateStr = getLocalDate(curr);
      const dayName = DAYS_OF_WEEK[curr.getDay()];
      
      const dayClasses = safeSchedules.filter(s => s.dayOfWeek === dayName).sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      if (dayClasses.length > 0) {
        const enrichedClasses = dayClasses.map(cls => {
          const key = `${dateStr}_${cls.id}`;
          const status = safeRecords[key]; 
          
          const statKey = `${cls.subject} ${cls.classType ? `(${cls.classType})` : ''}`;
          
          if (!subjectStats[statKey]) {
            subjectStats[statKey] = { present: 0, absent: 0, totalMarked: 0 };
          }
          
          if (status === 'P') {
            subjectStats[statKey].present++;
            subjectStats[statKey].totalMarked++;
            totalP++;
          } else if (status === 'A') {
            subjectStats[statKey].absent++;
            subjectStats[statKey].totalMarked++;
            totalA++;
          }
          
          return { ...cls, status, recordKey: key };
        });
        
        reportDays.push({ date: dateStr, dayName, classes: enrichedClasses });
      }
      curr.setDate(curr.getDate() + 1);
    }

    const totalMarked = totalP + totalA;
    const overall = totalMarked === 0 ? 0 : Math.round((totalP / totalMarked) * 100);

    return { reportDays: reportDays.reverse(), subjectStats, overall, totalP, totalA };
  };

  const { reportDays, subjectStats, overall, totalP, totalA } = generateReport();

  const getTypeColor = (type) => {
    if (type === 'Lab') return 'text-purple-400 bg-purple-900/20 border-purple-900/50';
    if (type === 'Tutorial') return 'text-amber-400 bg-amber-900/20 border-amber-900/50';
    if (type === 'Lecture') return 'text-blue-400 bg-blue-900/20 border-blue-900/50';
    
    // Auto-generate consistent colors for custom types
    const colors = [
      'text-pink-400 bg-pink-900/20 border-pink-900/50',
      'text-emerald-400 bg-emerald-900/20 border-emerald-900/50',
      'text-orange-400 bg-orange-900/20 border-orange-900/50',
      'text-cyan-400 bg-cyan-900/20 border-cyan-900/50',
      'text-fuchsia-400 bg-fuchsia-900/20 border-fuchsia-900/50',
      'text-rose-400 bg-rose-900/20 border-rose-900/50'
    ];
    const charTotal = type.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charTotal % colors.length];
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-10">
      
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Attendance Hub</h1>
          <p className="text-gray-400 text-sm mt-0.5">Track your presence, monitor percentages, and dodge detentions.</p>
        </div>
        <div className="flex bg-black p-1 rounded-lg border border-gray-800">
          <button onClick={() => setActiveTab('mark')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'mark' ? 'bg-teal-500/20 text-teal-400' : 'text-gray-500 hover:text-gray-300'}`}>Daily Marker</button>
          <button onClick={() => setActiveTab('setup')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'setup' ? 'bg-teal-500/20 text-teal-400' : 'text-gray-500 hover:text-gray-300'}`}>Class Setup</button>
          <button onClick={() => setActiveTab('report')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'report' ? 'bg-teal-500/20 text-teal-400' : 'text-gray-500 hover:text-gray-300'}`}>Detailed Reports</button>
        </div>
      </header>

      {activeTab === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg h-fit">
              <h2 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Alert Settings
              </h2>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Minimum Attendance Target (%)</label>
                <input type="number" min="0" max="100" value={threshold} onChange={e => saveToCloud(safeSchedules, safeRecords, Number(e.target.value))} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-yellow-500 outline-none transition-colors" />
                <p className="text-[10px] text-gray-500 mt-2">Subjects falling below this value will trigger a warning on your Dashboard.</p>
              </div>
            </div>

            <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg h-fit">
              <h2 className="text-lg font-bold text-white mb-6 border-b border-gray-800 pb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg> Add Weekly Class
              </h2>
              <form onSubmit={handleAddClass} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Subject</label>
                  <select required value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-teal-500 outline-none transition-colors">
                    <option value="" disabled>Select Subject...</option>
                    {safeSubjects.length === 0 && <option value="" disabled>⚠️ Add subjects in Subjects module first</option>}
                    {safeSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Class Type</label>
                      <button type="button" onClick={() => setIsManagingTypes(!isManagingTypes)} className="text-[10px] text-teal-500 hover:text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1">
                         {isManagingTypes ? 'Done' : '⚙️ Manage'}
                      </button>
                    </div>
                    {isManagingTypes ? (
                      <div className="bg-black border border-gray-700 rounded-xl p-2.5 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {customClassTypes.map(t => (
                          <div key={t} className="flex justify-between items-center text-xs text-white bg-gray-900 px-2 py-1.5 rounded-lg border border-gray-800">
                            <span className="truncate pr-2">{t}</span>
                            <button type="button" onClick={() => handleRemoveCustomType(t)} className="text-gray-500 hover:text-red-400 font-bold p-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                          </div>
                        ))}
                        <div className="flex gap-2 pt-1 border-t border-gray-800 mt-2">
                          <input type="text" value={newTypeInput} onChange={e => setNewTypeInput(e.target.value)} placeholder="New type..." className="w-full bg-[#121212] border border-gray-800 text-white rounded-lg px-2 py-1.5 text-xs focus:border-teal-500 outline-none" />
                          <button type="button" onClick={handleAddCustomType} className="bg-gray-800 hover:bg-gray-700 text-white px-2 py-1.5 rounded-lg text-xs font-bold shrink-0 shadow-sm">+</button>
                        </div>
                      </div>
                    ) : (
                      <select value={classType} onChange={e => setClassType(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-teal-500 outline-none transition-colors">
                        {customClassTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        {customClassTypes.length === 0 && <option value="" disabled>No types available</option>}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Day of Week</label>
                    <select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-teal-500 outline-none transition-colors">
                      {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Start Time</label>
                    <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-teal-500 outline-none [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">End Time</label>
                    <input type="time" required value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-teal-500 outline-none [color-scheme:dark]" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-xl shadow-lg transition-colors mt-4">Save Class</button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg">
            <h2 className="text-lg font-bold text-white mb-6 border-b border-gray-800 pb-3">Your Weekly Timetable</h2>
            <div className="space-y-6">
              {DAYS_OF_WEEK.map(day => {
                const dayClasses = safeSchedules.filter(s => s.dayOfWeek === day).sort((a,b) => a.startTime.localeCompare(b.startTime));
                if (dayClasses.length === 0) return null;
                
                return (
                  <div key={day}>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 bg-black/50 p-2 rounded-lg border border-gray-800">{day}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {dayClasses.map(cls => (
                        <div key={cls.id} className="bg-black border border-gray-700 p-4 rounded-xl flex justify-between items-center group hover:border-gray-500 transition-colors">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-white text-sm">{cls.subject}</p>
                              {cls.classType && (
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getTypeColor(cls.classType)}`}>
                                  {cls.classType}
                                </span>
                              )}
                            </div>
                            <p className="text-teal-400 text-xs font-medium bg-teal-900/10 px-2 py-0.5 rounded border border-teal-900/30 inline-block">🕒 {cls.startTime} - {cls.endTime}</p>
                          </div>
                          <button onClick={() => handleDeleteClass(cls.id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {safeSchedules.length === 0 && <p className="text-gray-500 italic text-center py-10">No classes scheduled yet. Add your timetable to the left!</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'mark' && (() => {
        const targetDayName = DAYS_OF_WEEK[new Date(targetDate).getDay()];
        const todayClasses = safeSchedules.filter(s => s.dayOfWeek === targetDayName).sort((a,b) => a.startTime.localeCompare(b.startTime));

        return (
          <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg max-w-3xl mx-auto w-full">
            <div className="flex justify-between items-center border-b border-gray-800 pb-5 mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Mark Attendance
              </h2>
              <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="bg-black border border-gray-700 text-teal-400 font-bold rounded-xl px-4 py-2 text-sm focus:border-teal-500 outline-none [color-scheme:dark]" />
            </div>

            <div className="space-y-3">
              {todayClasses.length === 0 ? (
                <div className="text-center py-16 bg-black rounded-xl border border-gray-800 border-dashed">
                  <p className="text-gray-500 text-lg">No classes scheduled for {targetDayName}.</p>
                  <p className="text-gray-600 text-sm mt-2">Enjoy your free time!</p>
                </div>
              ) : (
                todayClasses.map(cls => {
                  const status = safeRecords[`${targetDate}_${cls.id}`];
                  return (
                    <div key={cls.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${status === 'P' ? 'bg-teal-900/10 border-teal-500/50' : status === 'A' ? 'bg-red-900/10 border-red-500/50' : 'bg-black border-gray-700'}`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white font-bold text-lg">{cls.subject}</h4>
                          {cls.classType && (
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getTypeColor(cls.classType)}`}>
                              {cls.classType}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 bg-gray-900 px-2 py-0.5 rounded border border-gray-700 font-mono inline-block">{cls.startTime} - {cls.endTime}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleMarkAttendance(targetDate, cls.id, 'P')} className={`w-12 h-12 rounded-xl font-black text-lg flex items-center justify-center transition-all ${status === 'P' ? 'bg-teal-500 text-black shadow-[0_0_15px_rgba(20,184,166,0.4)]' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>P</button>
                        <button onClick={() => handleMarkAttendance(targetDate, cls.id, 'A')} className={`w-12 h-12 rounded-xl font-black text-lg flex items-center justify-center transition-all ${status === 'A' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>A</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {activeTab === 'report' && (
        <div className="space-y-6">
          
          <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-black border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm outline-none [color-scheme:dark]" />
              </div>
              <span className="text-gray-600 mt-4">→</span>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-black border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm outline-none [color-scheme:dark]" />
              </div>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
              <div className="bg-black border border-gray-800 rounded-xl px-6 py-3 text-center flex-1">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Total Present</p>
                <p className="text-2xl font-black text-teal-400">{totalP}</p>
              </div>
              <div className="bg-black border border-gray-800 rounded-xl px-6 py-3 text-center flex-1">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Total Absent</p>
                <p className="text-2xl font-black text-red-400">{totalA}</p>
              </div>
              <div className={`border rounded-xl px-6 py-3 text-center flex-1 shadow-lg ${overall >= threshold ? 'bg-teal-900/20 border-teal-500/50' : overall >= threshold - 15 ? 'bg-yellow-900/20 border-yellow-500/50' : 'bg-red-900/20 border-red-500/50'}`}>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Overall %</p>
                <p className={`text-2xl font-black ${overall >= threshold ? 'text-teal-400' : overall >= threshold - 15 ? 'text-yellow-400' : 'text-red-400'}`}>{overall}%</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-1 bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg h-fit">
              <h3 className="text-white font-bold mb-4 border-b border-gray-800 pb-3 flex items-center justify-between">
                Subject Summary
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider bg-gray-900 border border-gray-800 px-2 py-0.5 rounded">Target: {threshold}%</span>
              </h3>
              <div className="space-y-4">
                {Object.entries(subjectStats).map(([statKey, stats]) => {
                  const subPct = stats.totalMarked === 0 ? 100 : Math.round((stats.present / stats.totalMarked) * 100);
                  const colorClass = subPct >= threshold ? 'text-teal-400' : subPct >= threshold - 15 ? 'text-yellow-400' : 'text-red-400';
                  
                  return (
                    <div key={statKey} className="bg-black border border-gray-800 p-4 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-white text-sm">{statKey}</span>
                        <span className={`font-black text-lg ${colorClass}`}>{subPct}%</span>
                      </div>
                      <div className="flex gap-4 text-xs font-medium text-gray-400 bg-[#121212] p-2 rounded-lg border border-gray-800/50">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-teal-500"></div>{stats.present} P</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>{stats.absent} A</span>
                        <span className="flex items-center gap-1 ml-auto">Total: {stats.totalMarked}</span>
                      </div>
                    </div>
                  );
                })}
                {Object.keys(subjectStats).length === 0 && <p className="text-gray-500 text-sm text-center py-4">No attendance marked in this date range.</p>}
              </div>
            </div>

            <div className="lg:col-span-2 bg-[#121212] rounded-2xl border border-gray-800 shadow-lg overflow-hidden flex flex-col h-[600px]">
              <div className="p-6 border-b border-gray-800 bg-black/40">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  Daily Timeline
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-[#0a0a0a]">
                {reportDays.map(day => (
                  <div key={day.date} className="relative pl-4 border-l-2 border-gray-800">
                    <div className="absolute w-3 h-3 bg-gray-600 rounded-full -left-[7px] top-1 border-4 border-[#0a0a0a]"></div>
                    <div className="mb-3">
                      <span className="text-white font-bold text-sm bg-gray-900 px-3 py-1 rounded-md border border-gray-800 shadow-sm inline-block">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} <span className="text-gray-500 font-normal ml-1">({day.dayName})</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {day.classes.map(cls => (
                        <div key={cls.id} onClick={() => handleMarkAttendance(day.date, cls.id, cls.status === 'P' ? 'A' : cls.status === 'A' ? undefined : 'P')} className={`cursor-pointer border p-3 rounded-xl transition-all ${cls.status === 'P' ? 'bg-teal-900/10 border-teal-500/30 hover:border-teal-500' : cls.status === 'A' ? 'bg-red-900/10 border-red-500/30 hover:border-red-500' : 'bg-black border-gray-800 hover:border-gray-600 border-dashed'}`}>
                          <div className="flex justify-between items-start mb-1.5">
                            <div className="truncate pr-2">
                              <span className="font-bold text-white text-xs block truncate">{cls.subject}</span>
                              {cls.classType && <span className={`text-[8px] font-bold uppercase tracking-wider ${getTypeColor(cls.classType).split(' ')[0]}`}>{cls.classType}</span>}
                            </div>
                            <span className={`shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${cls.status === 'P' ? 'bg-teal-500 text-black' : cls.status === 'A' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
                              {cls.status || '?'}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-gray-500">{cls.startTime}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {reportDays.length === 0 && <p className="text-gray-500 text-center py-10 italic">No scheduled classes found in this date range.</p>}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Attendance;