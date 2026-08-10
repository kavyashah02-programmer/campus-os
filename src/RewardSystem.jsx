import React, { useState, useEffect } from 'react';

const RewardSystem = () => {
  // --- 11 Categories (7 Multi-Tier, 4 Gold-Only) ---
  const categories = [
    {
      id: 'wakeup', name: 'Early Bird', icon: '🌅', desc: 'Wake up at 5:30 AM',
      tiers: [
        { id: 1, name: 'Tier I', target: 7, reward: '1 Cheat Day ', cheats: 1, level: 'Bronze' },
        { id: 2, name: 'Tier II', target: 21, reward: '1 Cheat Day + Fancy Coffee', cheats: 1, level: 'Silver' },
        { id: 3, name: 'Tier III', target: 45, reward: '2 Cheat Days + Sleep in extra', cheats: 2, level: 'Gold' }
      ]
    },
    {
      id: 'gym', name: 'Gym Rat', icon: '🏋️', desc: 'Hit the gym consistently',
      tiers: [
        { id: 4, name: 'Tier I', target: 10, reward: '1 Cheat Day ', cheats: 1, level: 'Bronze' },
        { id: 5, name: 'Tier II', target: 20, reward: '1 Cheat Day + Thickshake', cheats: 1, level: 'Silver' },
        { id: 6, name: 'Tier III', target: 40, reward: '2 Cheat Days + Cheat Meal', cheats: 2, level: 'Gold' }
      ]
    },
    {
      id: 'code', name: 'Code Monkey', icon: '💻', desc: 'Code daily outside coursework for atleast an hour',
      tiers: [
        { id: 7, name: 'Tier I', target: 10, reward: '1 Cheat Day ', cheats: 1, level: 'Bronze' },
        { id: 8, name: 'Tier II', target: 20, reward: '1 Cheat Day + 1 Hr binge watch your show/anime', cheats: 1, level: 'Silver' },
        { id: 9, name: 'Tier III', target: 40, reward: '2 Cheat Days + Premium dessert', cheats: 2, level: 'Gold' }
      ]
    },
    {
      id: 'finance', name: 'Financial Discipline', icon: '📊', desc: 'Log expenses and track budget',
      tiers: [
        { id: 10, name: 'Tier I', target: 15, reward: '1 Cheat Day', cheats: 1, level: 'Bronze' },
        { id: 11, name: 'Tier II', target: 30, reward: '1 Cheat Day + Movie outing', cheats: 1, level: 'Silver' },
        { id: 12, name: 'Tier III', target: 60, reward: '2 Cheat Days + Buy yourself something special!', cheats: 2, level: 'Gold' }
      ]
    },
    {
      id: 'wealth', name: 'Wealth Builder', icon: '💰', desc: 'Save ₹15 every single day',
      tiers: [
        { id: 13, name: 'Tier I', target: 15, reward: '1 Cheat Day ', cheats: 1, level: 'Bronze' },
        { id: 14, name: 'Tier II', target: 30, reward: '1 Cheat Day + ₹450 to Premium AI Fund/Software/Courses', cheats: 1, level: 'Silver' },
        { id: 15, name: 'Tier III', target: 60, reward: '2 Cheat Days + Buy Premium Course / AI Subscription! or Buy a Tech Item', cheats: 2, level: 'Gold' }
      ]
    },
    {
      id: 'study', name: 'Academic Focus', icon: '📐', desc: 'Solve 20 complex problems daily',
      tiers: [
        { id: 16, name: 'Tier I', target: 10, reward: '1 Cheat Day', cheats: 1, level: 'Bronze' },
        { id: 17, name: 'Tier II', target: 20, reward: '1 Cheat Day + 2-hour Cricket/Football Match', cheats: 1, level: 'Silver' },
        { id: 18, name: 'Tier III', target: 40, reward: '2 Cheat Days + Weekend movie outing', cheats: 2, level: 'Gold' }
      ]
    },
    {
      id: 'schedule', name: 'Schedule Adherence', icon: '📅', desc: 'Maintain 100% daily time-blocks',
      tiers: [
        { id: 19, name: 'Tier I', target: 5, reward: '1 Cheat Day', cheats: 1, level: 'Bronze' },
        { id: 20, name: 'Tier II', target: 15, reward: '1 Cheat Day + Go for an outing with friends', cheats: 1, level: 'Silver' },
        { id: 21, name: 'Tier III', target: 30, reward: '2 Cheat Days + High end restaurant meal', cheats: 2, level: 'Gold' }
      ]
    },
    // --- GOLD ONLY TASKS ---
    {
      id: 'prep', name: 'Exam Prep Sprint', icon: '🎯', desc: 'Complete all syllabus before exam',
      tiers: [{ id: 22, name: 'Gold Tier', target: 1, reward: 'Massive 4-hour Cricket Match & Hangout', cheats: 0, level: 'Gold' }]
    },
    {
      id: 'master', name: 'Master Builder', icon: '🏗️', desc: 'Finish building a complete Web App',
      tiers: [{ id: 23, name: 'Gold Tier', target: 1, reward: 'Showcase Web App & Take 2-day coding break', cheats: 0, level: 'Gold' }]
    },
    {
      id: 'excellence', name: 'Academic Excellence', icon: '🎓', desc: 'Maintain > 8 CGPA for semester',
      tiers: [{ id: 24, name: 'Gold Tier', target: 1, reward: 'Major tech upgrade or full weekend trip', cheats: 0, level: 'Gold' }]
    },
    {
      id: 'fin_master', name: 'Financial Master', icon: '💎', desc: 'Stay 15% under budget for 2 months',
      tiers: [{ id: 25, name: 'Gold Tier', target: 1, reward: 'Transfer all savings to ultimate laptop fund', cheats: 0, level: 'Gold' }]
    }
  ];

  // --- Unified State Management ---
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('react_rewards_v3');
    if (saved) return JSON.parse(saved);
    
    // Default Empty State
    const initialState = { progress: {}, cheats: {}, claimed: [] };
    categories.forEach(c => {
      initialState.progress[c.id] = 0;
      initialState.cheats[c.id] = 0;
    });
    return initialState;
  });

  useEffect(() => {
    localStorage.setItem('react_rewards_v3', JSON.stringify(data));
  }, [data]);

  // --- Core Engine Functions ---

  // 1. Log a productive day
  const handleLog = (groupId) => {
    setData(prev => ({
      ...prev,
      progress: { ...prev.progress, [groupId]: (prev.progress[groupId] || 0) + 1 }
    }));
  };

  // 2. Claim a specific tier
  const handleClaim = (groupId, tier, isFinalTier) => {
    setData(prev => {
      let newClaimed = [...prev.claimed, tier.id];
      let newProgress = { ...prev.progress };
      let newCheats = { ...prev.cheats };

      // Award specific cheat days
      newCheats[groupId] = (newCheats[groupId] || 0) + tier.cheats;

      // REJUVENATION LOGIC: If this is Tier III (or a Gold-only task), it resets the whole category
      if (isFinalTier) {
        newProgress[groupId] = 0;
        // Unclaim all tiers belonging to this group
        const groupTierIds = categories.find(c => c.id === groupId).tiers.map(t => t.id);
        newClaimed = newClaimed.filter(id => !groupTierIds.includes(id));
      }

      return { progress: newProgress, cheats: newCheats, claimed: newClaimed };
    });

    alert(`🎉 Target hit! You earned: ${tier.reward}\n\n${tier.cheats > 0 ? `You now have ${tier.cheats} new Cheat Day(s) for this specific task to protect your streak!` : ''}`);
  };

  // 3. Missed a day / Use Cheat Day
  const handleMissedDay = (groupId) => {
    const availableCheats = data.cheats[groupId] || 0;
    
    if (availableCheats > 0) {
      if (window.confirm(`You have ${availableCheats} Cheat Day(s) available for this task. \n\nDo you want to use 1 Cheat Day to instantly fill the gap (+1 progress) and keep your streak counting?`)) {
        setData(prev => ({
          ...prev,
          cheats: { ...prev.cheats, [groupId]: prev.cheats[groupId] - 1 },
          progress: { ...prev.progress, [groupId]: prev.progress[groupId] + 1 }
        }));
      }
    } else {
      if (window.confirm("You have 0 Cheat Days for this task. Your streak is broken.\n\nResetting all tiers for this category to 0.")) {
        setData(prev => {
          const groupTierIds = categories.find(c => c.id === groupId).tiers.map(t => t.id);
          return {
            ...prev,
            progress: { ...prev.progress, [groupId]: 0 },
            claimed: prev.claimed.filter(id => !groupTierIds.includes(id))
          };
        });
      }
    }
  };

  // --- UI Helpers ---
  const getLevelColor = (level) => {
    if (level === 'Gold') return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/50';
    if (level === 'Silver') return 'text-gray-300 bg-gray-700/20 border-gray-500/50';
    return 'text-orange-500 bg-orange-900/20 border-orange-700/50'; // Bronze
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Gamified Reward System</h1>
          <p className="text-gray-400 text-sm mt-0.5">Continuous overlapping streaks. Cheat Days are now locked to their specific tasks.</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {categories.map((cat) => {
            const currentProgress = data.progress[cat.id] || 0;
            const availableCheats = data.cheats[cat.id] || 0;
            
            // Find the active target for the progress bar (first unclaimed tier)
            const activeTier = cat.tiers.find(t => !data.claimed.includes(t.id)) || cat.tiers[cat.tiers.length - 1];
            const pct = Math.min(100, (currentProgress / activeTier.target) * 100);

            return (
              <div key={cat.id} className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg flex flex-col h-full">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-gray-700 bg-black shadow-inner shrink-0">
                      {cat.icon}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{cat.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{cat.desc}</p>
                    </div>
                  </div>
                  
                  {/* Task-Specific Cheat Badge */}
                  {cat.tiers.length > 1 && (
                    <div className={`px-3 py-1.5 rounded-lg border flex flex-col items-center shrink-0 ${availableCheats > 0 ? 'bg-red-900/20 border-red-500/50 text-red-400' : 'bg-gray-900/50 border-gray-700 text-gray-500'}`}>
                      <span className="text-[9px] font-bold uppercase tracking-wider">Cheat Days</span>
                      <span className="text-lg font-black leading-none mt-0.5">{availableCheats}</span>
                    </div>
                  )}
                </div>

                {/* Tiers List */}
                <div className="flex-1 space-y-3 mb-6">
                  {cat.tiers.map((tier, index) => {
                    const isClaimed = data.claimed.includes(tier.id);
                    const isClaimable = !isClaimed && currentProgress >= tier.target;
                    const isFinalTier = index === cat.tiers.length - 1;

                    return (
                      <div key={tier.id} className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${isClaimed ? 'bg-emerald-900/10 border-emerald-900/30 opacity-50' : isClaimable ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'bg-black border-gray-800'}`}>
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${getLevelColor(tier.level)}`}>{tier.level}</span>
                            <span className="text-gray-300 font-bold text-sm">{tier.target} Days</span>
                          </div>
                          <p className="text-xs text-emerald-400 font-medium">🎁 {tier.reward}</p>
                        </div>
                        
                        <div className="shrink-0">
                          {isClaimable && (
                            <button onClick={() => handleClaim(cat.id, tier, isFinalTier)} className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg font-black text-xs shadow-lg transition-transform hover:scale-105 animate-pulse">
                              Claim!
                            </button>
                          )}
                          {isClaimed && <span className="text-emerald-500 text-xs font-bold px-2">✓ Claimed</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progress Bar & Buttons */}
                <div className="mt-auto border-t border-gray-800 pt-5 flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-gray-400 uppercase tracking-wider">Progress</span>
                      <span className="text-white">{currentProgress} / {activeTier.target}</span>
                    </div>
                    <div className="w-full bg-black rounded-full h-2.5 border border-gray-700 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleMissedDay(cat.id)} title="Missed Day / Use Cheat" className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-red-900/50 hover:text-red-400 text-gray-400 rounded-xl transition-colors border border-gray-700 hover:border-red-900/50">
                      ↺
                    </button>
                    <button onClick={() => handleLog(cat.id)} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-md">
                      +1 Log
                    </button>
                  </div>
                </div>

              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
};

export default RewardSystem;