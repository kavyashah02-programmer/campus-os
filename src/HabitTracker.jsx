import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';

// 1. Accept updateCloudData alongside the state props from App.jsx
const HabitTracker = ({ habits, setHabits, habitLogs, setHabitLogs, updateCloudData }) => {
  const getLocalDateStr = (d = new Date()) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayStr = getLocalDateStr();
  const [logDate, setLogDate] = useState(todayStr);
  const [viewMonth, setViewMonth] = useState(todayStr.substring(0, 7));
  const [newHabitText, setNewHabitText] = useState('');
  const [selectedAnalysisHabit, setSelectedAnalysisHabit] = useState('');

  // Set default selected habit for analysis chart on load
  useEffect(() => {
    if (habits.length > 0 && !selectedAnalysisHabit) {
      setSelectedAnalysisHabit(habits[0].id.toString());
    }
  }, [habits, selectedAnalysisHabit]);

  // --- 2. Update toggle to push to the cloud ---
  const toggleHabit = (id) => {
    const dayLogs = habitLogs[logDate] || {};
    const newHabitLogs = { 
      ...habitLogs, 
      [logDate]: { ...dayLogs, [id]: !dayLogs[id] } 
    };
    
    setHabitLogs(newHabitLogs); // Update Dashboard UI immediately
    if (updateCloudData) updateCloudData('habitLogs', newHabitLogs); // Push to Firebase
  };

  // --- 3. Update add to push to the cloud ---
  const addHabit = (e) => {
    e.preventDefault();
    if (!newHabitText.trim()) return;
    
    const newHabits = [...habits, { id: Date.now(), text: newHabitText }];
    setHabits(newHabits);
    if (updateCloudData) updateCloudData('habits', newHabits);
    
    setNewHabitText('');
  };

  // --- 4. Update delete to push to the cloud ---
  const deleteHabit = (id) => {
    if(window.confirm("Delete this habit entirely?")) {
      const newHabits = habits.filter(h => h.id !== id);
      setHabits(newHabits);
      if (updateCloudData) updateCloudData('habits', newHabits);
    }
  };

  // --- CHART 1: Daily Donut Math ---
  const dayLogs = habitLogs[logDate] || {};
  const completedCount = habits.filter(h => dayLogs[h.id]).length;
  const pendingCount = habits.length - completedCount;
  const pct = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;
  
  const donutOptions = { 
    chart: { type: 'donut', background: 'transparent' }, 
    labels: ['Done', 'Pending'], 
    colors: ['#3b82f6', '#1f2937'], 
    stroke: { show: false }, 
    dataLabels: { enabled: false }, 
    legend: { position: 'bottom', labels: { colors: '#9ca3af' } }, 
    plotOptions: { 
      pie: { 
        donut: { 
          size: '75%',
          labels: {
            show: true,
            name: { show: false },
            value: { show: true, fontSize: '28px', fontWeight: 800, color: '#ffffff', formatter: () => `${pct}%` },
            total: { show: true, showAlways: true, label: 'Total', formatter: () => `${pct}%` }
          }
        } 
      } 
    }, 
    theme: { mode: 'dark' } 
  };

  // --- CHART 2: Monthly Line Math ---
  const [year, month] = viewMonth.split('-');
  const daysInMonth = new Date(year, month, 0).getDate();
  const trendData = [];
  const daysArray = [];
  let totalPct = 0; let daysTracked = 0;
  
  for(let i=1; i<=daysInMonth; i++) {
    daysArray.push(i);
    const dStr = `${viewMonth}-${String(i).padStart(2, '0')}`;
    
    if (dStr > todayStr) { trendData.push(null); continue; } 
    
    const dLogs = habitLogs[dStr] || {};
    const cCount = habits.filter(h => dLogs[h.id]).length;
    const dayPct = habits.length > 0 ? Math.round((cCount / habits.length) * 100) : 0;
    
    trendData.push(dayPct);
    if (Object.keys(dLogs).length > 0) { totalPct += dayPct; daysTracked++; }
  }
  const avgMonthly = daysTracked > 0 ? Math.round(totalPct / daysTracked) : 0;
  
  const monthlyOptions = { chart: { type: 'line', toolbar: { show: false }, background: 'transparent' }, colors: ['#3b82f6'], stroke: { curve: 'straight', width: 2 }, markers: { size: 4, colors: ['#3b82f6'], strokeColors: '#121212', strokeWidth: 2 }, xaxis: { categories: daysArray, labels: { style: { colors: '#6b7280' } }, axisBorder: { show: false }, axisTicks: { show: false } }, yaxis: { min: 0, max: 100, tickAmount: 5, labels: { formatter: (val) => val + "%", style: { colors: '#6b7280' } } }, grid: { borderColor: '#1f2937', strokeDashArray: 0 }, theme: { mode: 'dark' } };

  // --- CHART 3: Stepline Analysis Math ---
  const analysisData = [];
  for(let i=1; i<=daysInMonth; i++) {
    const dStr = `${viewMonth}-${String(i).padStart(2, '0')}`;
    if (dStr > todayStr) { analysisData.push(null); continue; }
    const dLogs = habitLogs[dStr] || {};
    analysisData.push(dLogs[selectedAnalysisHabit] ? 1 : 0);
  }
  const analysisOptions = { chart: { type: 'line', toolbar: { show: false }, background: 'transparent' }, colors: ['#10b981'], stroke: { curve: 'stepline', width: 2 }, xaxis: { categories: daysArray, labels: { style: { colors: '#6b7280' } }, axisBorder: { show: false }, axisTicks: { show: false } }, yaxis: { min: 0, max: 1, tickAmount: 1, labels: { formatter: (val) => val === 1 ? 'Yes' : 'No', style: { colors: '#6b7280' } } }, grid: { borderColor: '#1f2937', strokeDashArray: 0 }, theme: { mode: 'dark' } };

  return (
    <div className="w-full flex flex-col h-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#121212] p-6 rounded-xl border border-gray-800 shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Habit Tracker</h2>
          <p className="text-gray-400 text-sm">Maintain consistency with your daily routine.</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end">
          <label className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">View Month</label>
          <input type="month" value={viewMonth} onChange={(e) => setViewMonth(e.target.value)} className="bg-black border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 [color-scheme:dark]" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 flex flex-col space-y-6">
          <div className="bg-[#121212] p-6 rounded-xl border border-gray-800 shadow-lg flex flex-col h-full">
            <label className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">Log Data For Date</label>
            <input 
              type="date" 
              value={logDate} 
              onChange={(e) => {
                setLogDate(e.target.value);
                setViewMonth(e.target.value.substring(0, 7)); // Auto-sync charts to selected date
              }} 
              className="w-full bg-black border border-gray-700 text-white px-4 py-3 rounded-lg mb-6 focus:outline-none focus:border-blue-500 [color-scheme:dark]" 
            />

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar mb-4">
              {habits.map((habit) => {
                const isCompleted = dayLogs[habit.id] || false;
                return (
                  <div key={habit.id} className="flex items-center justify-between bg-[#1a1a1a] p-4 rounded-lg border border-gray-800 group hover:border-gray-600 transition-colors">
                    <label className="flex items-center space-x-4 cursor-pointer flex-1">
                      <div className="relative flex items-center justify-center">
                        <input type="checkbox" checked={isCompleted} onChange={() => toggleHabit(habit.id)} className="peer appearance-none w-5 h-5 border-2 border-gray-600 rounded bg-black checked:bg-blue-500 checked:border-blue-500 cursor-pointer transition-colors" />
                        <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className={`text-sm font-medium transition-colors ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{habit.text}</span>
                    </label>
                    <button onClick={() => deleteHabit(habit.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    </button>
                  </div>
                );
              })}
            </div>

            <form onSubmit={addHabit} className="mt-auto">
              <input type="text" placeholder="Add New Habit..." value={newHabitText} onChange={(e) => setNewHabitText(e.target.value)} className="w-full bg-black border border-gray-700 border-dashed text-white px-4 py-3 rounded-lg focus:outline-none focus:border-solid focus:border-blue-500 placeholder-gray-600 text-center" />
            </form>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-2 flex flex-col space-y-6">
          <div className="bg-[#121212] p-6 rounded-xl border border-gray-800 shadow-lg">
            <h3 className="text-white font-semibold text-lg flex items-center mb-4"><span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> Daily Completion</h3>
            <div className="flex justify-center items-center h-48"><ReactApexChart options={donutOptions} series={[completedCount, pendingCount]} type="donut" height={220} /></div>
          </div>

          <div className="bg-[#121212] p-6 rounded-xl border border-gray-800 shadow-lg relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold text-lg flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> Monthly Trend</h3>
              <span className="bg-[#1a1a1a] text-blue-400 border border-blue-900/50 px-3 py-1 rounded-md text-sm font-semibold">Avg: {avgMonthly}%</span>
            </div>
            <div className="mt-2 -ml-2"><ReactApexChart options={monthlyOptions} series={[{ name: 'Avg Completion', data: [...trendData] }]} type="line" height={200} /></div>
          </div>

          <div className="bg-[#121212] p-6 rounded-xl border border-gray-800 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold text-lg flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> Habit Analysis</h3>
              <select value={selectedAnalysisHabit} onChange={(e) => setSelectedAnalysisHabit(e.target.value)} className="bg-black border border-gray-700 text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-emerald-500">
                {habits.map(h => <option key={h.id} value={h.id.toString()}>{h.text}</option>)}
              </select>
            </div>
            <div className="mt-2 -ml-2"><ReactApexChart options={analysisOptions} series={[{ name: 'Completed', data: [...analysisData] }]} type="line" height={200} /></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitTracker;