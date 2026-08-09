import React, { useState, useEffect } from 'react';

const DailyPlanner = () => {
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('daily'); 
  
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [repeat, setRepeat] = useState('Once');
  const [color, setColor] = useState('#6366f1'); 
  const [thingsToBring, setThingsToBring] = useState('');
  const [location, setLocation] = useState('');

  const [blocks, setBlocks] = useState(() => {
    const saved = localStorage.getItem('react_daily_planner');
    return saved ? JSON.parse(saved) : [];
  });

  const [nowMins, setNowMins] = useState((new Date().getHours() * 60) + new Date().getMinutes());

  useEffect(() => { localStorage.setItem('react_daily_planner', JSON.stringify(blocks)); }, [blocks]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setNowMins((now.getHours() * 60) + now.getMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => {
    const ampm = i < 12 ? 'AM' : 'PM';
    const hour = i % 12 === 0 ? 12 : i % 12;
    return { label: `${hour} ${ampm}`, value: i };
  });

  const getBlockStyle = (start, end, blockColor) => {
    if (!start || !end) return {};
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startMinutes = (startHour * 60) + startMin;
    let endMinutes = (endHour * 60) + endMin;
    if (endMinutes <= startMinutes) endMinutes = startMinutes + 30; 
    const duration = endMinutes - startMinutes;

    return {
      top: `${startMinutes}px`, 
      height: `${duration}px`,
      backgroundColor: `${blockColor}E6`, 
      borderLeft: `4px solid ${blockColor}`,
    };
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) return;

    if (editingId) {
      setBlocks(blocks.map(b => {
        if (b.id === editingId) {
          const repeatChanged = b.repeat !== repeat;
          return { 
            ...b, title, date, startTime, endTime, repeat, color, thingsToBring, location,
            excludedDates: repeatChanged ? [] : (b.excludedDates || [])
          };
        }
        return b;
      }));
      setEditingId(null);
    } else {
      const blockData = { 
        id: Date.now(), title, date, startTime, endTime, repeat, color, thingsToBring, location,
        excludedDates: [] 
      };
      setBlocks([...blocks, blockData]);
    }
    setTitle(''); setStartTime(''); setEndTime(''); setThingsToBring(''); setLocation(''); setRepeat('Once');
  };

  const handleEdit = (id) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;
    setEditingId(block.id); setTitle(block.title); setDate(block.date); setStartTime(block.startTime); 
    setEndTime(block.endTime); setRepeat(block.repeat || 'Once'); setColor(block.color); 
    setThingsToBring(block.thingsToBring || ''); setLocation(block.location || '');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id, targetDate) => {
    if (window.confirm(`Delete this schedule block for ${targetDate} only?`)) {
      setBlocks(blocks.map(b => {
        if (b.id === id) {
          const excluded = b.excludedDates || [];
          return { ...b, excludedDates: [...excluded, targetDate] };
        }
        return b;
      }).filter(b => {
        if (b.id === id && (b.repeat === 'Once' || !b.repeat) && b.date === targetDate) {
          return false;
        }
        return true;
      }));
    }
  };

  const cancelEdit = () => {
    setEditingId(null); setTitle(''); setStartTime(''); setEndTime(''); setThingsToBring(''); setLocation('');
  };

  const exportPDF = () => window.print();

  const realTodayStr = new Date().toISOString().split('T')[0];

  const isBlockVisibleOnDate = (block, targetDateStr) => {
    if (block.excludedDates && block.excludedDates.includes(targetDateStr)) return false;

    if (block.date === targetDateStr) return true;
    if (block.repeat === 'Once' || !block.repeat) return false;
    
    const blockDate = new Date(block.date);
    const targetDate = new Date(targetDateStr);
    
    blockDate.setHours(0,0,0,0);
    targetDate.setHours(0,0,0,0);

    if (targetDate < blockDate) return false; 

    if (block.repeat === 'Daily') return true;
    if (block.repeat === 'Weekly' && blockDate.getDay() === targetDate.getDay()) return true;
    if (block.repeat === 'Monthly' && blockDate.getDate() === targetDate.getDate()) return true;
    
    // NEW: Bi-weekly logic (Every 14 days)
    if (block.repeat === 'Biweekly') {
      const diffTime = targetDate.getTime() - blockDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      if (diffDays % 14 === 0) return true;
    }

    return false;
  };

  const getWeekDays = (dateStr) => {
    const curr = new Date(dateStr);
    const first = curr.getDate() - curr.getDay();
    return Array.from({length: 7}, (_, i) => {
       const d = new Date(curr.setDate(first + i));
       return d.toISOString().split('T')[0];
    });
  };

  const weekDays = getWeekDays(currentDate);
  const visibleBlocksDaily = blocks.filter(b => isBlockVisibleOnDate(b, currentDate));
  const sortedPrintBlocksDaily = [...visibleBlocksDaily].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="w-full flex flex-col h-full space-y-6 relative">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#121212] p-6 rounded-xl border border-gray-800 shadow-lg print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            Daily Planner
            {viewMode === 'weekly' && (
              <span title="Left-click a block to delete for that day. Right-click to edit." className="w-5 h-5 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center text-xs font-bold cursor-help hover:text-white transition-colors">
                i
              </span>
            )}
          </h2>
          <p className="text-gray-400 text-sm">Time-block your lectures, labs, and focused work.</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-3">
          <div className="flex bg-black p-1 rounded-lg border border-gray-800">
            <button onClick={() => setViewMode('daily')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${viewMode === 'daily' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}>
              Daily
            </button>
            <button onClick={() => setViewMode('weekly')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${viewMode === 'weekly' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}>
              Weekly
            </button>
          </div>

          <div className="bg-black border border-gray-700 rounded-lg flex items-center px-3">
            <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider mr-2">Date</label>
            <input type="date" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} className="bg-transparent text-white py-2 text-sm focus:outline-none [color-scheme:dark]" />
          </div>

          <button onClick={exportPDF} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg> 
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[75vh] print:hidden">
        
        <div className="col-span-1 bg-[#121212] p-6 rounded-xl border border-gray-800 shadow-lg h-full overflow-y-auto custom-scrollbar">
          <div className="flex items-center space-x-2 mb-6">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h3 className="text-white font-bold text-lg">{editingId ? 'Edit Block' : 'Add Schedule Block'}</h3>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Title *</label>
              <input type="text" required placeholder="e.g., Engineering Maths" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-black border border-gray-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Start Date *</label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-black border border-gray-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500 [color-scheme:dark]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Start Time *</label>
                <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-black border border-gray-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500 [color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">End Time *</label>
                <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-black border border-gray-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500 [color-scheme:dark]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Repeat</label>
                <select value={repeat} onChange={(e) => setRepeat(e.target.value)} className="w-full bg-black border border-gray-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500">
                  <option value="Once">Once</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Biweekly">Once in two weeks</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Color</label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-[42px] bg-black border border-gray-700 rounded-lg cursor-pointer p-1" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Location</label>
              <input type="text" placeholder="e.g., Lecture Hall 4" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-black border border-gray-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500 placeholder-gray-600" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Things to Bring</label>
              <input type="text" placeholder="e.g., Lab coat, Calculator" value={thingsToBring} onChange={(e) => setThingsToBring(e.target.value)} className="w-full bg-black border border-gray-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500 placeholder-gray-600" />
            </div>
            <div className="pt-4 flex gap-2">
              <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg">{editingId ? 'Update Block' : 'Save to Schedule'}</button>
              {editingId && <button type="button" onClick={cancelEdit} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">Cancel</button>}
            </div>
          </form>
        </div>

        <div className="col-span-1 lg:col-span-2 bg-[#121212] rounded-xl border border-gray-800 shadow-lg flex flex-col h-full overflow-hidden">
          
          {viewMode === 'daily' ? (
            <div className="p-4 border-b border-gray-800 text-center bg-[#1a1a1a]">
              <h3 className="text-white font-bold">{new Date(currentDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
            </div>
          ) : (
            <div className="flex border-b border-gray-800 bg-[#1a1a1a]">
              <div className="w-14 shrink-0 border-r border-gray-800"></div>
              {weekDays.map(dayStr => {
                const d = new Date(dayStr);
                const isToday = dayStr === realTodayStr;
                return (
                  <div key={dayStr} className={`flex-1 text-center py-3 border-r border-gray-800 ${isToday ? 'bg-indigo-900/20' : ''}`}>
                    <div className={`text-xs font-bold uppercase ${isToday ? 'text-indigo-400' : 'text-gray-400'}`}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div className={`text-lg font-black ${isToday ? 'text-indigo-400' : 'text-white'}`}>{d.getDate()}</div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar bg-[#0a0a0a]">
            {viewMode === 'daily' ? (
              <div className="relative w-full" style={{ height: '1440px' }}>
                {hours.map((hour) => (
                  <div key={hour.value} className="absolute w-full flex items-start border-t border-gray-800/50" style={{ top: `${hour.value * 60}px`, height: '60px' }}>
                    <span className="text-[10px] text-gray-500 w-14 -mt-2.5 pr-2 text-right bg-[#0a0a0a]">{hour.label}</span>
                  </div>
                ))}
                {currentDate === realTodayStr && (
                  <div className="absolute w-full flex items-center z-10 pointer-events-none" style={{ top: `${nowMins}px` }}>
                    <div className="w-2 h-2 rounded-full bg-indigo-500 ml-12 mr-2 relative -left-1 z-20 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                    <div className="flex-1 border-t-2 border-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                  </div>
                )}
                {visibleBlocksDaily.map((block) => (
                  <div key={block.id} className="absolute left-16 right-4 rounded-md p-3 shadow-sm overflow-hidden flex flex-col justify-start opacity-90 hover:opacity-100 transition-opacity group" style={getBlockStyle(block.startTime, block.endTime, block.color)}>
                    <div className="flex justify-between items-start">
                      <p className="text-white font-bold text-sm leading-tight drop-shadow-md truncate pr-2">{block.title}</p>
                      <div className="flex shrink-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded px-1">
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(block.id); }} className="text-white/70 hover:text-white p-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(block.id, currentDate); }} className="text-white/70 hover:text-red-300 p-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                    </div>
                    <p className="text-white/80 text-[11px] font-medium drop-shadow-md mt-0.5">{block.startTime} - {block.endTime}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {block.location && <span className="text-[9px] bg-black/40 text-white/90 px-1.5 py-0.5 rounded border border-white/20 truncate">📍 {block.location}</span>}
                      {block.thingsToBring && <span className="text-[9px] bg-black/40 text-white/90 px-1.5 py-0.5 rounded border border-white/20 truncate">🎒 {block.thingsToBring}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-w-[800px] relative" style={{ height: '1440px' }}>
                <div className="w-14 shrink-0 border-r border-gray-800 relative bg-[#0a0a0a] z-10">
                  {hours.map((hour) => (
                    <div key={hour.value} className="absolute w-full flex justify-end pr-2" style={{ top: `${hour.value * 60}px` }}>
                      <span className="text-[10px] text-gray-500 -mt-2.5 bg-[#0a0a0a]">{hour.label}</span>
                    </div>
                  ))}
                </div>
                
                {weekDays.map(dayStr => {
                  const dayBlocks = blocks.filter(b => isBlockVisibleOnDate(b, dayStr));
                  const isToday = dayStr === realTodayStr;
                  return (
                    <div key={dayStr} className={`flex-1 relative border-r border-gray-800/50 ${isToday ? 'bg-indigo-900/5' : ''}`}>
                      {hours.map(hour => (
                         <div key={hour.value} className="absolute w-full border-t border-gray-800/30" style={{ top: `${hour.value * 60}px`, height: '60px' }}></div>
                      ))}
                      {isToday && (
                        <div className="absolute w-full border-t-2 border-indigo-500 z-10 shadow-[0_0_8px_rgba(99,102,241,0.8)]" style={{ top: `${nowMins}px` }}></div>
                      )}
                      {dayBlocks.map((block) => (
                        <div 
                          key={block.id} 
                          title={`${block.title}\nLeft-click: Delete\nRight-click: Edit`}
                          onClick={(e) => { e.stopPropagation(); handleDelete(block.id, dayStr); }}
                          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(block.id); }}
                          className="absolute left-1 right-1 rounded p-1.5 shadow-sm overflow-hidden flex flex-col justify-start cursor-pointer hover:brightness-110 hover:z-20 transition-all border border-white/10" 
                          style={getBlockStyle(block.startTime, block.endTime, block.color)}
                        >
                          <p className="text-white font-bold text-[10px] leading-tight truncate">{block.title}</p>
                          <p className="text-white/80 text-[9px] font-medium truncate">{block.startTime}</p>
                          {block.location && <span className="text-[8px] text-white/90 truncate mt-0.5 opacity-80">📍 {block.location}</span>}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      <div className="hidden print:block absolute inset-0 bg-white z-50 p-10 text-black min-h-screen">
        <h1 className="text-4xl font-black border-b-4 border-black pb-4 mb-2 uppercase tracking-tight">
          {viewMode === 'daily' ? 'Daily Itinerary' : 'Weekly Schedule'}
        </h1>
        
        {viewMode === 'daily' ? (
          <>
            <h2 className="text-xl font-bold text-gray-600 mb-8">{new Date(currentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
            {sortedPrintBlocksDaily.length === 0 ? (
              <p className="text-gray-500 italic text-lg">No events scheduled for this day.</p>
            ) : (
              <table className="w-full text-left border-collapse mt-6">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-100">
                    <th className="py-4 px-4 text-sm uppercase tracking-widest text-gray-600 w-1/5">Time Frame</th>
                    <th className="py-4 px-4 text-sm uppercase tracking-widest text-gray-600 w-1/3">Event Title</th>
                    <th className="py-4 px-4 text-sm uppercase tracking-widest text-gray-600">Location</th>
                    <th className="py-4 px-4 text-sm uppercase tracking-widest text-gray-600">Required Materials</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPrintBlocksDaily.map(block => (
                    <tr key={block.id} className="border-b border-gray-300">
                      <td className="py-4 px-4 font-bold text-gray-800 whitespace-nowrap">{block.startTime} - {block.endTime}</td>
                      <td className="py-4 px-4 font-bold text-black text-lg">
                        <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: block.color }}></span>
                        {block.title}
                      </td>
                      <td className="py-4 px-4 text-gray-600 font-medium">{block.location || '-'}</td>
                      <td className="py-4 px-4 text-gray-600">{block.thingsToBring || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        ) : (
          <div className="space-y-8 mt-6">
            {weekDays.map(dayStr => {
              const dayBlocks = blocks.filter(b => isBlockVisibleOnDate(b, dayStr)).sort((a, b) => a.startTime.localeCompare(b.startTime));
              if (dayBlocks.length === 0) return null;
              return (
                <div key={dayStr} className="break-inside-avoid">
                  <h3 className="text-lg font-bold bg-gray-100 border-l-4 border-black pl-3 py-2 mb-4">
                    {new Date(dayStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </h3>
                  <table className="w-full text-left border-collapse">
                    <tbody>
                      {dayBlocks.map(block => (
                        <tr key={block.id} className="border-b border-gray-200">
                          <td className="py-2 px-2 font-bold text-gray-800 w-1/5 whitespace-nowrap">{block.startTime} - {block.endTime}</td>
                          <td className="py-2 px-2 font-bold text-black"><span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: block.color }}></span>{block.title}</td>
                          <td className="py-2 px-2 text-gray-600 text-sm">{block.location || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyPlanner;