import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';

// 1. Accept the new cloud props from App.jsx
const FitnessTracker = ({ cloudFitness = {}, updateCloudData }) => {
  const getLocalDateStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  const [fitnessDate, setFitnessDate] = useState(getLocalDateStr());
  const [exercise, setExercise] = useState(0);
  const [sleep, setSleep] = useState(0);
  const [water, setWater] = useState(0);
  const [coffee, setCoffee] = useState(0);  // Coffee state
  const [shakes, setShakes] = useState(0);  // Shakes state
  const [isSaved, setIsSaved] = useState(true); // Tracks unsaved changes

  // 2. Initialize state with cloud data
  const [allData, setAllData] = useState(cloudFitness);

  // 3. Keep local state synced if cloud data changes
  useEffect(() => {
    setAllData(cloudFitness);
  }, [cloudFitness]);

  // Warn before closing browser tab if unsaved
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isSaved) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSaved]);

  useEffect(() => {
    const dayData = allData[fitnessDate] || { exercise: 0, sleep: 0, water: 0, coffee: 0, shakes: 0 };
    setExercise(dayData.exercise || 0); 
    setSleep(dayData.sleep || 0); 
    setWater(dayData.water || 0); 
    setCoffee(dayData.coffee || 0); 
    setShakes(dayData.shakes || 0);
    setIsSaved(true);
  }, [fitnessDate, allData]);

  const handleDateChange = (newDate) => {
    if (!isSaved && !window.confirm("You have unsaved fitness data for this date! Proceed without saving?")) return;
    setFitnessDate(newDate);
  };

  // 4. Update the save function to push to the cloud universally
  const handleSave = () => {
    const newData = { ...allData, [fitnessDate]: { exercise, sleep, water, coffee, shakes } };
    setAllData(newData);
    updateCloudData('fitness', newData);
    setIsSaved(true);
    setTimeout(() => { setIsSaved(false); setIsSaved(true); }, 2000); // Visual ping
  };

  const adjustCounter = (setter, current, amount) => { 
    setter(Math.max(0, current + amount)); 
    setIsSaved(false); 
  };

  // --- Monthly Analytics Graph (Only maps Exercise, Sleep, and Water) ---
  const [year, month] = fitnessDate.split('-');
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);
  
  const seriesExercise = []; const seriesSleep = []; const seriesWater = [];
  daysArray.forEach(d => {
    const dStr = `${year}-${month}-${String(d).padStart(2, '0')}`;
    const logs = allData[dStr] || { exercise: 0, sleep: 0, water: 0 };
    seriesExercise.push(logs.exercise || 0);
    seriesSleep.push(logs.sleep || 0);
    seriesWater.push(logs.water || 0);
  });

  const chartOptions = {
    chart: { type: 'line', toolbar: { show: false }, background: 'transparent' },
    colors: ['#3b82f6', '#6366f1', '#0ea5e9'],
    stroke: { curve: 'smooth', width: 2 },
    xaxis: { categories: daysArray, labels: { style: { colors: '#6b7280' } } },
    yaxis: [{ title: { text: "Minutes / Hrs", style: { color: '#6b7280' } }, labels: { style: { colors: '#6b7280' } } }],
    theme: { mode: 'dark' }, legend: { position: 'top', labels: { colors: '#fff' } }
  };

  const chartSeries = [
    { name: 'Gym (mins)', data: seriesExercise },
    { name: 'Sleep (hrs)', data: seriesSleep },
    { name: 'Water (glasses)', data: seriesWater }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Fitness & Wellness</h1>
        </div>
        <div>
          <input type="date" value={fitnessDate} onChange={(e) => handleDateChange(e.target.value)} className="border border-gray-700 bg-black text-white rounded-xl px-4 py-2 text-sm font-semibold outline-none focus:border-blue-500 [color-scheme:dark]" />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        
        <div className="lg:col-span-1 space-y-6 overflow-y-auto custom-scrollbar pr-2 h-full">
          {/* Activity & Sleep Section */}
          <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 space-y-8 shadow-lg">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Activity & Sleep
            </h2>
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Exercise / Gym Time</label>
                <span className="text-lg font-extrabold text-blue-500">{exercise} min</span>
              </div>
              <input type="range" min="0" max="180" step="15" value={exercise} onChange={(e) => {setExercise(Number(e.target.value)); setIsSaved(false);}} className="w-full accent-blue-500" />
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sleep Duration</label>
                <span className="text-lg font-extrabold text-indigo-500">{sleep} hrs</span>
              </div>
              <input type="range" min="0" max="12" step="0.5" value={sleep} onChange={(e) => {setSleep(Number(e.target.value)); setIsSaved(false);}} className="w-full accent-indigo-500" />
            </div>
          </div>

          {/* Drinks & Fluids Section */}
          <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 space-y-4 shadow-lg">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
              <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> Drinks & Fluids
            </h2>
            
            {/* Water */}
            <div className="flex items-center justify-between p-3 bg-sky-900/20 rounded-xl border border-sky-900/30">
              <div className="flex items-center gap-3"><span className="text-xl">💧</span><span className="font-bold text-sm text-sky-400">Water</span></div>
              <div className="flex items-center bg-black rounded-xl border border-gray-700">
                <button onClick={() => adjustCounter(setWater, water, -1)} className="w-10 h-10 font-bold text-gray-400">-</button>
                <span className="w-8 text-center font-extrabold text-sm text-white">{water}</span>
                <button onClick={() => adjustCounter(setWater, water, 1)} className="w-10 h-10 font-bold text-sky-500">+</button>
              </div>
            </div>

            {/* Coffee */}
            <div className="flex items-center justify-between p-3 bg-amber-900/20 rounded-xl border border-amber-900/30">
              <div className="flex items-center gap-3"><span className="text-xl">☕</span><span className="font-bold text-sm text-amber-400">Coffee</span></div>
              <div className="flex items-center bg-black rounded-xl border border-gray-700">
                <button onClick={() => adjustCounter(setCoffee, coffee, -1)} className="w-10 h-10 font-bold text-gray-400">-</button>
                <span className="w-8 text-center font-extrabold text-sm text-white">{coffee}</span>
                <button onClick={() => adjustCounter(setCoffee, coffee, 1)} className="w-10 h-10 font-bold text-amber-500">+</button>
              </div>
            </div>

            {/* Fruit Shakes */}
            <div className="flex items-center justify-between p-3 bg-rose-900/20 rounded-xl border border-rose-900/30">
              <div className="flex items-center gap-3"><span className="text-xl">🥤</span><span className="font-bold text-sm text-rose-400">Fruit Shakes</span></div>
              <div className="flex items-center bg-black rounded-xl border border-gray-700">
                <button onClick={() => adjustCounter(setShakes, shakes, -1)} className="w-10 h-10 font-bold text-gray-400">-</button>
                <span className="w-8 text-center font-extrabold text-sm text-white">{shakes}</span>
                <button onClick={() => adjustCounter(setShakes, shakes, 1)} className="w-10 h-10 font-bold text-rose-500">+</button>
              </div>
            </div>
          </div>

          <button onClick={handleSave} className={`w-full font-bold py-4 rounded-2xl shadow-md transition-all duration-300 flex items-center justify-center gap-2 ${isSaved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white animate-pulse'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {isSaved ? "Saved Successfully!" : "Save Today's Metrics"}
          </button>
        </div>

        <div className="lg:col-span-2 bg-[#121212] rounded-2xl border border-gray-800 shadow-lg p-6 flex flex-col h-full overflow-hidden">
          <h2 className="text-base font-bold text-white mb-4">Monthly Analytics ({new Date(year, month-1).toLocaleDateString('en-US',{month:'long'})})</h2>
          <div className="flex-1 min-h-[300px]">
            <ReactApexChart options={chartOptions} series={chartSeries} type="line" height="100%" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default FitnessTracker;