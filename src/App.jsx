import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';

// --- FIREBASE IMPORTS ---
import { auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

import Sidebar from './Sidebar';
import HabitHeatmap from './HabitHeatmap';
import LaundryTracker from './LaundryTracker';
import HabitTracker from './HabitTracker';
import DailyPlanner from './DailyPlanner';
import TaskManager from './TaskManager';
import FitnessTracker from './FitnessTracker';
import CGPACalculator from './CGPACalculator';
import ExamTracker from './ExamTracker';
import FinanceTracker from './FinanceTracker';
import RewardSystem from './RewardSystem';
import Library from './Library';
import AnimalDonation from './AnimalDonation';

function App() {
  // --- FIREBASE AUTH STATE ---
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [currentView, setCurrentView] = useState('dashboard');
  const [timeStr, setTimeStr] = useState('');

  const [focusMode, setFocusMode] = useState('stopwatch'); 
  const [timerTarget, setTimerTarget] = useState(45); 
  const [studyTime, setStudyTime] = useState(0); 
  const [isStudying, setIsStudying] = useState(false);
  
  const [spotifyEmbed, setSpotifyEmbed] = useState(() => localStorage.getItem('react_spotify') || 'https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?theme=0');

  // --- HABIT HISTORY DATABASE (Still LocalStorage for now) ---
  const [habits, setHabits] = useState([
    { id: 1, text: "Wake Up at 05:30" }, { id: 2, text: "Jogging 15 mins" }, { id: 3, text: "Gym 30 - 60 mins" },
    { id: 4, text: "4-5 hour study" }, { id: 5, text: "Revision" }, { id: 6, text: "Coding 2 hr" }, { id: 7, text: "Leisure time" }
  ]);

  const [habitLogs, setHabitLogs] = useState(() => {
    const saved = localStorage.getItem('react_habit_logs');
    return saved ? JSON.parse(saved) : {};
  });

  // Watch for Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsCheckingAuth(false);
    });
    return () => unsubscribe(); // Cleanup
  }, []);

  useEffect(() => { localStorage.setItem('react_habit_logs', JSON.stringify(habitLogs)); }, [habitLogs]);

  const getLocalDateStr = (d = new Date()) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // --- TRUE STREAK CALCULATOR ---
  let currentStreak = 0;
  const nowForStreak = new Date();
  nowForStreak.setHours(0,0,0,0);
  
  for (let i = 0; i < 365; i++) {
    const d = new Date(nowForStreak);
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateStr(d);
    
    const logs = habitLogs[dateStr] || {};
    const completed = Object.values(logs).filter(Boolean).length;
    const pct = habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0;
    
    if (pct >= 75) {
      currentStreak++;
    } else if (i === 0) {
      continue; 
    } else {
      break; 
    }
  }

  // --- WEEKLY PRODUCTIVITY CHART DATA ---
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date(); 
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - (6 - i));
    return getLocalDateStr(d);
  });
  
  const overviewSeriesData = last7Days.map(dStr => {
    const logs = habitLogs[dStr] || {};
    const c = Object.values(logs).filter(Boolean).length;
    return habits.length > 0 ? Math.round((c / habits.length) * 100) : 0;
  });
  const overviewCategories = last7Days.map(dStr => new Date(dStr).toLocaleDateString('en-US', {weekday: 'short'}));

  const overviewOptions = { chart: { type: 'area', toolbar: { show: false }, background: 'transparent' }, colors: ['#10b981'], fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] } }, dataLabels: { enabled: false }, stroke: { curve: 'smooth', width: 2 }, xaxis: { categories: overviewCategories, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: '#6b7280' } } }, yaxis: { show: false, min: 0, max: 100 }, grid: { show: false }, theme: { mode: 'dark' } };
  const overviewSeries = [{ name: 'Completion %', data: overviewSeriesData }];

  useEffect(() => {
    if (!user) return; 
    const clockInterval = setInterval(() => setTimeStr(new Date().toLocaleTimeString()), 1000);
    if (!("Notification" in window)) return;
    const taskInterval = setInterval(() => {
      const storedTasks = JSON.parse(localStorage.getItem('react_tasks') || '[]');
      const now = new Date();
      const todayStr = getLocalDateStr(now);
      const nowMins = (now.getHours() * 60) + now.getMinutes();

      storedTasks.forEach(task => {
        if (task.completed || task.date !== todayStr || !task.time) return;
        const [hrs, mins] = task.time.split(':').map(Number);
        const targetMins = (hrs * 60) + mins;
        const diffMins = targetMins - nowMins;

        if (diffMins === 60 && Notification.permission === "granted") new Notification("Task Due in 1 Hour", { body: task.title });
        else if (diffMins === 5 && Notification.permission === "granted") new Notification("Starting in 5 Mins", { body: task.title });
      });
    }, 60000); 

    return () => { clearInterval(clockInterval); clearInterval(taskInterval); };
  }, [user]);

  useEffect(() => {
    let timerInterval = null;
    if (isStudying) {
      timerInterval = setInterval(() => {
        setStudyTime(prev => {
          const newTime = prev + 1;
          if (focusMode === 'timer' && newTime >= timerTarget * 60) {
            setIsStudying(false);
            setTimeout(() => alert("Target Reached! Great focus session."), 100);
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [isStudying, focusMode, timerTarget]);

  // --- FIREBASE AUTH HANDLERS ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setEmail(''); setPassword('');
    } catch (err) {
      // Clean up Firebase error messages
      setAuthError(err.message.replace('Firebase: ', '').replace('(auth/', '').replace(').', ''));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStudyTimer = () => setIsStudying(!isStudying);
  const takeBreak = () => { alert("Taking a 10 minute break! Resetting focus tracker."); setIsStudying(false); setStudyTime(0); };
  const handleSpotifyLink = (e) => {
    let link = e.target.value;
    if (link.includes('spotify.com') && !link.includes('/embed/')) link = link.replace('spotify.com/', 'spotify.com/embed/');
    setSpotifyEmbed(link); localStorage.setItem('react_spotify', link);
  };
  const getFullSpotifyLink = () => spotifyEmbed.replace('/embed', '').split('?')[0];
  const formatTimer = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const displaySeconds = focusMode === 'stopwatch' ? studyTime : Math.max(0, (timerTarget * 60) - studyTime);
  const canTakeBreak = studyTime >= 1800; 
  
  const todayLogs = habitLogs[getLocalDateStr()] || {};
  const completedTodayCount = Object.values(todayLogs).filter(Boolean).length;
  const progressPercentage = habits.length > 0 ? Math.round((completedTodayCount / habits.length) * 100) : 0;

  // --- LOADING STATE ---
  if (isCheckingAuth) {
    return (
      <div className="flex h-screen bg-black items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- LOCK SCREEN (FIREBASE AUTH) ---
  if (!user) {
    return (
      <div className="flex h-screen bg-black items-center justify-center font-sans">
        <div className="bg-[#121212] border border-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">CampusOS Cloud</h1>
          <p className="text-gray-500 text-sm mb-6">{isLoginMode ? 'Enter your credentials to unlock.' : 'Create a new account.'}</p>
          
          {authError && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-400 text-xs p-3 rounded-lg mb-4 text-left">
              ⚠️ {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-center focus:border-blue-500 outline-none" placeholder="Email Address" />
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 text-center tracking-[0.2em] focus:border-blue-500 outline-none" placeholder="••••••••" />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg">
              {isLoginMode ? 'Login' : 'Sign Up'}
            </button>
          </form>

          <button onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(''); }} className="text-blue-400 text-sm mt-6 hover:text-blue-300 transition-colors">
            {isLoginMode ? "Need an account? Sign Up" : "Already have an account? Log In"}
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN APP ---
  return (
    <div className="flex h-screen bg-black font-sans overflow-hidden">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

      <main className="flex-1 p-4 md:p-10 overflow-y-auto print:p-0 print:overflow-visible">
        {currentView === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white">Dashboard</h2>
                <p className="text-gray-400 mt-1">Keep going. You're building something great.</p>
              </div>
              <div className="flex items-center gap-4">
                {/* NEW: Logout Button & User Email */}
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-500 font-medium">{user.email}</span>
                  <button onClick={handleLogout} className="text-sm font-bold text-red-400 hover:text-red-300 transition-colors">Log Out</button>
                </div>
                <div className="flex flex-col items-end bg-[#121212] border border-gray-800 px-5 py-2 rounded-xl shadow-lg">
                  <span className="text-gray-400 font-medium text-xs">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                  <span className="text-white font-black text-xl tracking-wider font-mono">{timeStr}</span>
                </div>
              </div>
            </header>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="col-span-1 xl:col-span-2 bg-[#121212] rounded-xl p-6 border border-gray-800 shadow-lg">
                 <h3 className="text-gray-300 font-semibold text-sm uppercase tracking-wider mb-2">Weekly Productivity (Completion %)</h3>
                 <ReactApexChart options={overviewOptions} series={overviewSeries} type="area" height={160} />
              </div>

              <div className="col-span-1 flex flex-col gap-6">
                <div className={`rounded-xl p-6 border shadow-lg flex flex-col justify-center items-center text-center transition-colors duration-500 ${progressPercentage > 75 ? 'bg-emerald-900/20 border-emerald-900/50' : 'bg-[#121212] border-gray-800'}`}>
                   <h3 className={`${progressPercentage > 75 ? 'text-emerald-500' : 'text-gray-500'} font-semibold text-sm uppercase tracking-wider mb-2`}>Current Streak</h3>
                   <p className="text-5xl font-bold text-white flex items-center gap-2">{progressPercentage > 75 ? '🔥' : '🧊'} {currentStreak}<span className={`text-lg font-normal mt-3 ${progressPercentage > 75 ? 'text-emerald-400' : 'text-gray-600'}`}>days</span></p>
                   <p className="text-xs text-gray-500 mt-2 text-center">{progressPercentage}% / 75% required</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-[#121212] rounded-xl p-6 border border-gray-800 shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden">
                 {isStudying && <div className="absolute inset-0 bg-blue-900/10 animate-pulse border-2 border-blue-500/50 rounded-xl pointer-events-none"></div>}
                 <div className="flex justify-between items-center w-full mb-4 z-10">
                   <h3 className="text-blue-400 font-bold text-sm uppercase tracking-wider">Deep Work</h3>
                   <div className="flex bg-black p-1 rounded-lg border border-gray-800">
                     <button onClick={() => { setFocusMode('stopwatch'); setStudyTime(0); setIsStudying(false); }} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors ${focusMode === 'stopwatch' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>Stopwatch</button>
                     <button onClick={() => { setFocusMode('timer'); setStudyTime(0); setIsStudying(false); }} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors ${focusMode === 'timer' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>Timer</button>
                   </div>
                 </div>

                 {focusMode === 'timer' && !isStudying && studyTime === 0 ? (
                   <div className="mb-2 flex items-center z-10">
                     <input type="number" min="1" max="300" value={timerTarget} onChange={(e) => setTimerTarget(Number(e.target.value))} className="bg-black border border-gray-700 text-white text-center rounded-lg px-2 py-1 w-16 text-lg font-bold focus:border-blue-500 outline-none" />
                     <span className="text-gray-500 text-xs ml-2 font-bold uppercase">mins</span>
                   </div>
                 ) : ( <div className="mb-2 h-[36px]"></div> )}

                 <div className="text-6xl font-black text-white font-mono mb-6 z-10 drop-shadow-md">{formatTimer(displaySeconds)}</div>
                 
                 <div className="flex gap-4 w-full px-8 z-10">
                   <button onClick={toggleStudyTimer} className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors shadow-lg ${isStudying ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>{isStudying ? 'Pause' : 'Start Focus'}</button>
                   <button onClick={takeBreak} disabled={!canTakeBreak} className={`flex-1 py-3 rounded-xl font-bold transition-all ${canTakeBreak ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}>Take 10m Break</button>
                 </div>
                 {!canTakeBreak ? <p className="text-[10px] text-gray-500 mt-3 z-10">Break unlocks after 30 mins of active focus.</p> : <p className="text-[10px] text-emerald-500 font-bold mt-3 z-10">Break Unlocked!</p>}
               </div>

               <div className="bg-[#121212] rounded-xl p-6 border border-gray-800 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-green-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.84-.12-.96-.54-.12-.42.12-.84.54-.96 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.36 1.08zm1.44-3.18c-.3.42-.84.54-1.26.24-3.24-1.98-8.16-2.58-11.94-1.44-.48.18-1.02-.06-1.2-.54-.18-.48.06-1.02.54-1.2 4.32-1.32 9.72-.66 13.5 1.62.48.3.6 0.84.36 1.32zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.12-1.38-.72-.18-.6.12-1.2.72-1.38 4.2-1.32 11.28-1.08 15.9 1.68.54.3.72.96.42 1.5-.24.54-.84.72-1.38.42z"/></svg> Study Vibes
                      </h3>
                      <input type="text" placeholder="Paste Playlist Link..." onChange={handleSpotifyLink} className="bg-black border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-1.5 w-36 focus:border-green-500 outline-none transition-colors" />
                    </div>
                    <iframe style={{borderRadius: '12px'}} src={spotifyEmbed} width="100%" height="152" frameBorder="0" allowFullScreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                  </div>
                  <button onClick={() => window.open(getFullSpotifyLink(), '_blank')} className="mt-4 w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(29,185,84,0.2)]">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> Open Full Playlist in Spotify App
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-8"><HabitHeatmap habitLogs={habitLogs} /></div>
          </div>
        )}

        {currentView === 'tasks' && <TaskManager />}
        {currentView === 'planner' && <DailyPlanner />}
        {currentView === 'habits' && <HabitTracker habits={habits} setHabits={setHabits} habitLogs={habitLogs} setHabitLogs={setHabitLogs} />}
        {currentView === 'cgpa' && <CGPACalculator />}
        {currentView === 'exams' && <ExamTracker />}
        {currentView === 'fitness' && <FitnessTracker />}
        {currentView === 'finance' && <FinanceTracker />}
        {currentView === 'rewards' && <RewardSystem />}
        {currentView === 'library' && <Library />}
        {currentView === 'donate' && <AnimalDonation />}
        
        {currentView === 'laundry' && (
          <div className="animate-in fade-in duration-500 h-full max-w-4xl mx-auto">
             <header className="mb-8"><h2 className="text-3xl font-bold text-white">Hostel Laundry Centre</h2></header>
            <LaundryTracker />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;