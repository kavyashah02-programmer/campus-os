import React, { useState, useEffect } from 'react';

const TaskManager = ({ cloudTasks = [], updateCloudData }) => {
  const [tasks, setTasks] = useState(cloudTasks);
  
  useEffect(() => {
    setTasks(cloudTasks);
  }, [cloudTasks]);
  
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deadlineTime, setDeadlineTime] = useState(''); 
  const [desc, setDesc] = useState('');
  const [place, setPlace] = useState('');
  const [thingsToBring, setThingsToBring] = useState('');
  const [repeat, setRepeat] = useState('none');
  const [category, setCategory] = useState('Academic');
  const [color, setColor] = useState('#3b82f6');
  const [image, setImage] = useState(null);

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const generateId = () => Date.now().toString() + Math.random().toString(36).slice(2, 9);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 700 * 1024) {
        alert("For cloud syncing, please select an image under 700KB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => setImage(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!title || !date) return;

    let updatedTasks = [...tasks];

    if (editingId) {
      const taskIndex = updatedTasks.findIndex(x => x.id === editingId);
      if (taskIndex > -1) {
        const t = updatedTasks[taskIndex];
        const repeatChanged = t.repeat !== repeat;
        
        updatedTasks[taskIndex] = {
          ...t,
          title, date, time, deadline, deadlineTime, desc, place, thingsToBring, repeat, category, color, image,
          excludedDates: repeatChanged ? [] : (t.excludedDates || [])
        };
      }
      setEditingId(null);
    } else {
      const newTask = {
        id: generateId(),
        createdAt: Date.now(),
        title, date, time, deadline, deadlineTime, desc, place, thingsToBring, repeat, category, color, image,
        completedDates: [], 
        excludedDates: []   
      };
      updatedTasks.push(newTask);
    }
    
    setTasks(updatedTasks);
    if (updateCloudData) updateCloudData('tasks', updatedTasks);
    
    setTitle(''); setTime(''); setDeadline(''); setDeadlineTime(''); setDesc(''); setPlace(''); setThingsToBring(''); setImage(null); setRepeat('none');
  };

  const handleEdit = (id) => {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    
    setEditingId(t.id);
    setTitle(t.title || ''); 
    setDate(t.date || new Date().toISOString().split('T')[0]); 
    setTime(t.time || ''); 
    setDeadline(t.deadline || ''); 
    setDeadlineTime(t.deadlineTime || ''); 
    setDesc(t.desc || ''); 
    setPlace(t.place || ''); 
    setThingsToBring(t.thingsToBring || ''); 
    setRepeat(t.repeat || 'none'); 
    setCategory(t.category || 'Academic');
    setColor(t.color || '#3b82f6'); 
    setImage(t.image || null);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTask = (id, targetDate) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === id) {
        const completed = t.completedDates || [];
        const newCompleted = completed.includes(targetDate)
          ? completed.filter(d => d !== targetDate)
          : [...completed, targetDate];
        return { ...t, completedDates: newCompleted };
      }
      return t;
    });

    setTasks(updatedTasks);
    if (updateCloudData) updateCloudData('tasks', updatedTasks);
  };

  const deleteTask = (id, targetDate) => {
    const t = tasks.find(x => x.id === id);
    if (!t) return;

    if (window.confirm(`Delete this task for ${targetDate} only?`)) {
      let updatedTasks;

      if ((t.repeat === 'none' || !t.repeat) && t.date === targetDate) {
        updatedTasks = tasks.filter(x => x.id !== id);
      } else {
        updatedTasks = tasks.map(x => {
          if (x.id === id) {
            return { ...x, excludedDates: [...(x.excludedDates || []), targetDate] };
          }
          return x;
        });
      }

      setTasks(updatedTasks);
      if (updateCloudData) updateCloudData('tasks', updatedTasks);
    }
  };

  const cancelEdit = () => {
    setEditingId(null); setTitle(''); setTime(''); setDeadline(''); setDeadlineTime(''); setDesc(''); setImage(null); setThingsToBring(''); setPlace('');
  };

  const isTaskVisibleOnDate = (task, targetDateStr) => {
    if (task.excludedDates && task.excludedDates.includes(targetDateStr)) return false;

    if (task.date === targetDateStr) return true;
    if (!task.repeat || task.repeat === 'none') return false;
    
    const taskDate = new Date(task.date);
    const targetDate = new Date(targetDateStr);
    
    taskDate.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    if (targetDate < taskDate) return false;

    if (task.repeat === 'daily') return true;
    if (task.repeat === 'weekly' && taskDate.getDay() === targetDate.getDay()) return true;
    if (task.repeat === 'monthly' && taskDate.getDate() === targetDate.getDate()) return true;
    
    if (task.repeat === 'biweekly') {
      const diffTime = targetDate.getTime() - taskDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      if (diffDays % 14 === 0) return true;
    }
    
    return false;
  };

  // --- SORTING LOGIC: Date -> Timeline (Time OR Deadline Time) -> Creation ---
  const selectedDateTasks = tasks
    .filter(t => isTaskVisibleOnDate(t, selectedDate))
    .sort((a, b) => {
      // 1. Sort by Scheduled Date
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);

      // 2. Sort by Timeline (Uses 'Time' first, falls back to 'Deadline Time')
      const timelineA = a.time || a.deadlineTime || '24:00';
      const timelineB = b.time || b.deadlineTime || '24:00';
      if (timelineA !== timelineB) return timelineA.localeCompare(timelineB);

      // 3. Fallback to creation order
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
  
  const handleCarryForward = () => {
    const pendingTasks = selectedDateTasks.filter(t => {
      return t.completedDates ? !t.completedDates.includes(selectedDate) : !t.completed;
    });

    if (pendingTasks.length === 0) {
      alert("All caught up! No pending tasks to carry forward for this date.");
      return;
    }

    const currDateObj = new Date(selectedDate);
    currDateObj.setUTCDate(currDateObj.getUTCDate() + 1);
    const nextDateStr = currDateObj.toISOString().split('T')[0];

    if (window.confirm(`Carry forward ${pendingTasks.length} pending task(s) to ${nextDateStr}?`)) {
      let updatedTasks = [...tasks];

      pendingTasks.forEach((pt, index) => {
        if (pt.repeat === 'none' || !pt.repeat) {
          const idx = updatedTasks.findIndex(x => x.id === pt.id);
          if (idx > -1) {
            updatedTasks[idx] = { ...updatedTasks[idx], date: nextDateStr };
          }
        } else {
          const idx = updatedTasks.findIndex(x => x.id === pt.id);
          if (idx > -1) {
            updatedTasks[idx] = { 
              ...updatedTasks[idx], 
              excludedDates: [...(updatedTasks[idx].excludedDates || []), selectedDate] 
            };
          }
          
          const clone = {
            ...pt,
            id: generateId() + index, 
            createdAt: Date.now(),
            date: nextDateStr,
            repeat: 'none',
            completedDates: [],
            excludedDates: []
          };
          updatedTasks.push(clone);
        }
      });

      setTasks(updatedTasks);
      if (updateCloudData) updateCloudData('tasks', updatedTasks);
      setSelectedDate(nextDateStr);
    }
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDay = (year, month) => new Date(year, month, 1).getDay();
  
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);
  const realTodayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Tasks & Deadlines</h1>
          <p className="text-gray-400 text-sm mt-0.5">Real-time cloud syncing is active. Updates instantly across devices.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Form */}
        <div className="lg:col-span-1 bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg h-fit">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-800 pb-3">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg> 
            {editingId ? 'Edit Task' : 'Create New Task'}
          </h2>
          
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Title *</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors" placeholder="e.g., Physics Lab Report" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Date *</label>
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none [color-scheme:dark] transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Time</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none [color-scheme:dark] transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Location / Place</label>
                <input type="text" value={place} onChange={(e) => setPlace(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors" placeholder="e.g., Lab Room 3" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Things to Bring</label>
                <input type="text" value={thingsToBring} onChange={(e) => setThingsToBring(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors" placeholder="e.g., Lab Coat" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Deadline Date</label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none [color-scheme:dark] transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Deadline Time</label>
                <input type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none [color-scheme:dark] transition-colors" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Repeat</label>
              <select value={repeat} onChange={(e) => setRepeat(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors">
                <option value="none">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="biweekly">Once in two weeks</option><option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Description</label>
              <textarea rows="3" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none resize-none transition-colors" placeholder="Details, links, or notes..."></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors">
                  <option value="Academic">📚 Academic</option><option value="Coding">💻 Coding</option><option value="Clubs">👥 Clubs</option><option value="Personal">🏠 Personal</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Color Code</label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-[46px] bg-black border border-gray-700 rounded-xl px-1 py-1 cursor-pointer transition-colors" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Attach Image</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-gray-800 file:text-white cursor-pointer" />
              {image && (
                <div className="mt-3 relative inline-block">
                  <img src={image} alt="Preview" className="h-24 rounded-lg border border-gray-700 object-cover" />
                  <button type="button" onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-500">×</button>
                </div>
              )}
            </div>

            <div className="pt-4 flex gap-3">
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg transition-colors text-sm">
                {editingId ? 'Update Task' : 'Save Task'}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="flex-1 bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors text-sm hover:bg-gray-600">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Lists & Calendar */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-800 pb-4 gap-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg> 
                Action Items
              </h2>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleCarryForward} 
                  title="Move all unfinished tasks to tomorrow"
                  className="bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-400 border border-indigo-500/30 text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1 shadow-sm"
                >
                  Carry Forward ➡️
                </button>
                <div className="flex items-center gap-2 bg-black border border-gray-800 rounded-xl px-3 py-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</label>
                  <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    className="bg-transparent text-indigo-400 font-bold text-sm focus:border-indigo-500 outline-none [color-scheme:dark] transition-colors" 
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {selectedDateTasks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8 bg-black rounded-xl border border-gray-800 border-dashed">
                  No tasks scheduled for this date.
                </p>
              ) : (
                selectedDateTasks.map(task => {
                  const isDoneForDate = task.completedDates ? task.completedDates.includes(selectedDate) : task.completed;
                  return (
                    <div 
                      key={task.id} 
                      className={`p-5 rounded-xl border transition-all flex flex-col gap-3 ${isDoneForDate ? 'bg-[#1a1a1a] border-gray-800 opacity-50' : 'bg-black border-gray-700 shadow-md'}`} 
                      style={{ borderLeftWidth: '4px', borderLeftColor: isDoneForDate ? '#374151' : task.color }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4 w-full">
                          <input 
                            type="checkbox" 
                            checked={isDoneForDate} 
                            onChange={() => toggleTask(task.id, selectedDate)} 
                            className="mt-1 w-5 h-5 accent-indigo-500 cursor-pointer shrink-0" 
                          />
                          <div className="flex-1">
                            <h4 className={`text-base font-bold ${isDoneForDate ? 'line-through text-gray-500' : 'text-white'}`}>
                              {task.title}
                            </h4>
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                              {/* --- BULLETPROOF DEADLINE RENDERER --- */}
                              {Boolean(task.deadline || task.deadlineTime) && (
                                <span className="text-[10px] text-red-400 bg-red-900/20 border border-red-900/50 px-2 py-1 rounded shadow-sm font-bold flex items-center gap-1">
                                  ⚠️ Due: {[task.deadline, task.deadlineTime].filter(Boolean).join(' at ')}
                                </span>
                              )}
                              
                              {task.time && <span className="text-[10px] text-gray-300 bg-gray-800 px-2 py-1 rounded border border-gray-700">🕒 {task.time}</span>}
                              {task.place && <span className="text-[10px] text-gray-300 bg-gray-800 px-2 py-1 rounded border border-gray-700">📍 {task.place}</span>}
                              {task.thingsToBring && <span className="text-[10px] text-emerald-400 bg-emerald-900/20 border border-emerald-900/50 px-2 py-1 rounded shadow-sm">🎒 {task.thingsToBring}</span>}
                              {task.repeat !== 'none' && <span className="text-[10px] text-blue-400 bg-blue-900/20 border border-blue-900/50 px-2 py-1 rounded">
                                🔁 {task.repeat === 'biweekly' ? 'Bi-weekly' : task.repeat}
                              </span>}
                            </div>
                            
                            {task.desc && (
                              <p className="text-sm text-gray-400 mt-3 bg-gray-900/50 p-3 rounded-lg border border-gray-800 leading-relaxed">
                                {task.desc}
                              </p>
                            )}
                            
                            {task.image && (
                              <div className="mt-3 relative overflow-hidden rounded-lg border border-gray-700 inline-block">
                                <img src={task.image} alt="Attachment" className="max-h-48 object-cover hover:scale-105 transition-transform duration-300" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex shrink-0 gap-3 ml-4">
                          <button onClick={() => handleEdit(task.id)} className="text-gray-500 hover:text-white transition-colors bg-gray-900 p-2 rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => deleteTask(task.id, selectedDate)} title="Delete for this day" className="text-gray-500 hover:text-red-400 transition-colors bg-gray-900 p-2 rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg> 
                Monthly Overview
                <span title="Left-click a task badge to delete for that day. Right-click to edit." className="ml-2 w-5 h-5 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center text-xs font-bold cursor-help hover:text-white transition-colors">
                  i
                </span>
              </h2>
              <div className="flex items-center gap-3 bg-black border border-gray-800 rounded-xl p-1">
                <button onClick={() => setCalendarDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 transition-colors">&lt;</button>
                <span className="text-sm font-bold w-32 text-center text-white">
                  {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => setCalendarDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 transition-colors">&gt;</button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-3 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-xs font-bold text-gray-500 uppercase tracking-widest">{d}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] rounded-xl bg-[#0a0a0a] border border-gray-900/50"></div>
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayTasks = tasks.filter(t => isTaskVisibleOnDate(t, dayStr));
                const isToday = dayStr === realTodayStr;
                
                return (
                  <div key={dayStr} className={`min-h-[80px] p-2 rounded-xl border transition-colors flex flex-col ${isToday ? 'bg-blue-900/10 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 'bg-black border-gray-800 hover:border-gray-600'}`}>
                    <span className={`text-xs font-bold mb-1.5 ${isToday ? 'text-blue-400' : 'text-gray-400'}`}>{dayNum}</span>
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
                      {dayTasks.map(t => {
                         const isDone = t.completedDates ? t.completedDates.includes(dayStr) : t.completed;
                         const deadlineText = (t.deadline || t.deadlineTime) ? `Due: {[t.deadline, t.deadlineTime].filter(Boolean).join(' at ')}\n` : '';
                         const tooltip = `${t.title}\n${deadlineText}Left-click: Delete\nRight-click: Edit`;
                         return (
                          <div 
                            key={t.id} 
                            title={tooltip}
                            onClick={(e) => { e.stopPropagation(); deleteTask(t.id, dayStr); }}
                            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(t.id); }}
                            className={`text-[9px] px-1.5 py-1 rounded truncate border border-l-2 font-medium shadow-sm cursor-pointer transition-opacity hover:opacity-80 ${isDone ? 'opacity-30 line-through text-gray-500' : 'text-white'}`} 
                            style={{ backgroundColor: `${t.color}20`, borderColor: `${t.color}30`, borderLeftColor: t.color }}
                          >
                            {t.title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TaskManager;