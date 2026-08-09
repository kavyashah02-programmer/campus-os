import React, { useState, useEffect } from 'react';

const RewardSystem = () => {
  // 7 Categories × 3 Tiers = 21 Total Tasks. Overlapping progress engine ensures streaks never break when claiming lower tiers.
  const initialTasks = [
    // 1. Early Bird Track
    { id: 1, groupId: 'wakeup', title: 'Early Bird I', desc: 'Wake up at 5:30 AM for 7 days', target: 7, progress: 0, reward: '1 Cheat Day + Fancy Coffee', icon: '🌅', tier: 'Bronze' },
    { id: 2, groupId: 'wakeup', title: 'Early Bird II', desc: 'Wake up at 5:30 AM for 21 days', target: 21, progress: 0, reward: '1 Cheat Day + Sleep in extra', icon: '🌅', tier: 'Silver' },
    { id: 3, groupId: 'wakeup', title: 'Early Bird III', desc: 'Wake up at 5:30 AM for 45 days', target: 45, progress: 0, reward: '2 Cheat Days + Buy new tech accessory', icon: '👑', tier: 'Gold' },

    // 2. Gym Track
    { id: 4, groupId: 'gym', title: 'Gym Rat I', desc: 'Hit the gym 10 days in a row', target: 10, progress: 0, reward: '1 Cheat Day + Thickshake', icon: '🏋️', tier: 'Bronze' },
    { id: 5, groupId: 'gym', title: 'Gym Rat II', desc: 'Hit the gym 20 days in a row', target: 20, progress: 0, reward: '1 Cheat Day + Cheat Meal', icon: '💪', tier: 'Silver' },
    { id: 6, groupId: 'gym', title: 'Gym Rat III', desc: 'Hit the gym 40 days in a row', target: 40, progress: 0, reward: '2 Cheat Days + Buy new gym gear', icon: '🏆', tier: 'Gold' },

    // 3. Coding Track
    { id: 7, groupId: 'code', title: 'Code Monkey I', desc: 'Code daily outside coursework for 10 days', target: 10, progress: 0, reward: '1 Cheat Day + 1 Hr TMKOC binge', icon: '💻', tier: 'Bronze' },
    { id: 8, groupId: 'code', title: 'Code Monkey II', desc: 'Code daily outside coursework for 20 days', target: 20, progress: 0, reward: '1 Cheat Day + Premium dessert', icon: '🚀', tier: 'Silver' },
    { id: 9, groupId: 'code', title: 'Code Monkey III', desc: 'Code daily outside coursework for 40 days', target: 40, progress: 0, reward: '2 Cheat Days + Full day off to relax', icon: '💻', tier: 'Gold' },

    // 4. Wealth Builder Track (NEW)
    { id: 10, groupId: 'wealth', title: 'Wealth Builder I', desc: 'Save ₹15 every day for 15 days', target: 15, progress: 0, reward: '1 Cheat Day + ₹225 to Premium Course/AI Fund', icon: '💰', tier: 'Bronze' },
    { id: 11, groupId: 'wealth', title: 'Wealth Builder II', desc: 'Save ₹15 every day for 30 days', target: 30, progress: 0, reward: '1 Cheat Day + ₹450 to Premium Course/AI Fund', icon: '📈', tier: 'Silver' },
    { id: 12, groupId: 'wealth', title: 'Wealth Builder III', desc: 'Save ₹15 every day for 60 days', target: 60, progress: 0, reward: '2 Cheat Days + Buy Premium Course / AI Subscription!', icon: '💎', tier: 'Gold' },

    // 5. Academic Focus Track
    { id: 13, groupId: 'study', title: 'Academic Focus I', desc: 'Solve 5 complex Math/Physics problems daily for 10 days', target: 10, progress: 0, reward: '1 Cheat Day + 2-hour Cricket Match', icon: '📐', tier: 'Bronze' },
    { id: 14, groupId: 'study', title: 'Academic Focus II', desc: 'Solve 5 complex problems daily for 20 days', target: 20, progress: 0, reward: '1 Cheat Day + Evening out with friends', icon: '🔬', tier: 'Silver' },
    { id: 15, groupId: 'study', title: 'Academic Focus III', desc: 'Solve 5 complex problems daily for 40 days', target: 40, progress: 0, reward: '2 Cheat Days + Weekend movie outing', icon: '🎓', tier: 'Gold' },

    // 6. Hostel Cleanliness Track
    { id: 16, groupId: 'clean', title: 'Hostel Cleanliness I', desc: 'Keep room clean & laundry done for 7 days', target: 7, progress: 0, reward: '1 Cheat Day', icon: '🧹', tier: 'Bronze' },
    { id: 17, groupId: 'clean', title: 'Hostel Cleanliness II', desc: 'Keep room clean & laundry done for 21 days', target: 21, progress: 0, reward: '1 Cheat Day + Order Pizza', icon: '🧺', tier: 'Silver' },
    { id: 18, groupId: 'clean', title: 'Hostel Cleanliness III', desc: 'Keep room clean & laundry done for 45 days', target: 45, progress: 0, reward: '2 Cheat Days + Bollywood Music night off', icon: '✨', tier: 'Gold' },

    // 7. Discipline & Schedule Track
    { id: 19, groupId: 'schedule', title: 'Discipline I', desc: 'Maintain 100% daily schedule blocks for 5 days', target: 5, progress: 0, reward: '1 Cheat Day', icon: '📅', tier: 'Bronze' },
    { id: 20, groupId: 'schedule', title: 'Discipline II', desc: 'Maintain 100% daily schedule blocks for 15 days', target: 15, progress: 0, reward: '1 Cheat Day + Evening Cricket Tournament', icon: '⏱️', tier: 'Silver' },
    { id: 21, groupId: 'schedule', title: 'Discipline III', desc: 'Maintain 100% daily schedule blocks for 30 days', target: 30, progress: 0, reward: '2 Cheat Days + Major Tech Upgrade Fund', icon: '🎯', tier: 'Gold' },
  ];

  // Using _v2 to ensure your browser updates to the new 21-task list automatically
  const [rewardTasks, setRewardTasks] = useState(() => {
    const saved = localStorage.getItem('react_rewards_v2');
    return saved ? JSON.parse(saved) : initialTasks;
  });

  const [cheatDays, setCheatDays] = useState(() => {
    return Number(localStorage.getItem('react_cheat_days')) || 0;
  });

  useEffect(() => {
    localStorage.setItem('react_rewards_v2', JSON.stringify(rewardTasks));
    localStorage.setItem('react_cheat_days', cheatDays.toString());
  }, [rewardTasks, cheatDays]);

  // +1 Log updates ALL tiers in that group simultaneously
  const updateProgress = (groupId, delta) => {
    setRewardTasks(rewardTasks.map(task => {
      if (task.groupId === groupId) {
        return { ...task, progress: Math.max(0, Math.min(task.target, task.progress + delta)) };
      }
      return task;
    }));
  };

  const claimReward = (id) => {
    const task = rewardTasks.find(t => t.id === id);
    let earnedCheats = task.tier === 'Gold' ? 2 : 1;
    setCheatDays(prev => prev + earnedCheats);
    
    alert(`🎉 Target hit! You earned: ${task.reward}\n\nYou now have ${earnedCheats} new Cheat Day(s) to use whenever you lose a streak!`);
    
    // Resets ONLY this specific tier. Higher tiers keep their overlapping progress!
    setRewardTasks(rewardTasks.map(t => t.id === id ? { ...t, progress: 0 } : t));
  };

  const resetGroupStreak = (groupId) => {
    if(cheatDays > 0) {
      if(window.confirm(`You missed a day! Do you want to use 1 of your ${cheatDays} Cheat Days to keep your streak alive?`)) {
        setCheatDays(prev => prev - 1);
        return; // Streak saved!
      }
    }
    if(window.confirm("No cheat days used. Streak broken. Resetting all tiers for this category to 0.")) {
      setRewardTasks(rewardTasks.map(t => t.groupId === groupId ? { ...t, progress: 0 } : t));
    }
  };

  const getTierColor = (tier) => {
    if (tier === 'Gold') return 'border-yellow-500 bg-yellow-900/20 text-yellow-400';
    if (tier === 'Silver') return 'border-gray-400 bg-gray-700/20 text-gray-300';
    return 'border-orange-700 bg-orange-900/20 text-orange-500'; // Bronze
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Gamified Reward System</h1>
          <p className="text-gray-400 text-sm mt-0.5">Build streaks to earn Cheat Days. Claiming Tier I keeps Tier II's streak alive!</p>
        </div>
        <div className="bg-red-900/20 border border-red-900/50 px-6 py-2 rounded-xl text-center">
          <p className="text-xs text-red-400 font-bold uppercase tracking-wider mb-1">Cheat Days Available</p>
          <p className="text-3xl font-black text-white">{cheatDays}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
        {rewardTasks.map(task => {
          const isComplete = task.progress === task.target;
          const percentage = (task.progress / task.target) * 100;

          return (
            <div key={task.id} className={`p-5 rounded-2xl border transition-all ${isComplete ? 'bg-emerald-900/20 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#121212] border-gray-800'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${getTierColor(task.tier)}`}>
                    {task.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold text-lg">{task.title}</h3>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getTierColor(task.tier)}`}>{task.tier}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{task.desc}</p>
                    <p className="text-xs font-bold text-emerald-400 mt-1">🎁 Reward: {task.reward}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className="flex-1 md:w-48">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white">{task.progress} / {task.target}</span>
                    </div>
                    <div className="w-full bg-black rounded-full h-2.5 border border-gray-700 overflow-hidden">
                      <div className={`h-2.5 rounded-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isComplete ? (
                      <>
                        <button onClick={() => resetGroupStreak(task.groupId)} title="Reset / Use Cheat Day" className="w-8 h-8 rounded-lg bg-gray-800 text-gray-400 hover:bg-red-900/50 hover:text-red-400 flex items-center justify-center transition-colors">↺</button>
                        <button onClick={() => updateProgress(task.groupId, 1)} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors">+1 Log</button>
                      </>
                    ) : (
                      <button onClick={() => claimReward(task.id)} className="px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all animate-bounce">
                        Claim Reward!
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RewardSystem;