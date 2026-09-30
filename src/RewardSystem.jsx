import React, { useState, useEffect, useRef } from 'react';
import { useLocalStorageSync } from './useLocalStorageSync'; 

const RewardSystem = ({ cloudRewards = null, updateCloudData, habits = [] }) => {
  
  // --- THE ULTIMATE SOURCE OF TRUTH ---
  const defaultCategories = [
    {
      id: 'wakeup', name: 'Rise Master', icon: '🌅', desc: 'Wake up at 5:30 AM',
      tiers: [
        { id: 1, name: 'Tier I', target: 7, baseReward: '1 Cheat Day', customReward: '', cheats: 1, level: 'Bronze' },
        { id: 2, name: 'Tier II', target: 21, baseReward: '1 Cheat Day', customReward: 'Fancy Coffee', cheats: 1, level: 'Silver' },
        { id: 3, name: 'Tier III', target: 45, baseReward: '2 Cheat Days', customReward: 'Sleep in extra', cheats: 2, level: 'Gold' }
      ]
    },
    {
      id: 'gym', name: 'Training Titan', icon: '🏋️', desc: 'Hit the gym consistently',
      tiers: [
        { id: 4, name: 'Tier I', target: 10, baseReward: '1 Cheat Day', customReward: '', cheats: 1, level: 'Bronze' },
        { id: 5, name: 'Tier II', target: 20, baseReward: '1 Cheat Day', customReward: 'Thickshake', cheats: 1, level: 'Silver' },
        { id: 6, name: 'Tier III', target: 40, baseReward: '2 Cheat Days', customReward: 'Cheat Meal', cheats: 2, level: 'Gold' }
      ]
    },
    {
      id: 'code', name: 'Coding Legend', icon: '💻', desc: 'Code daily outside coursework for atleast an hour',
      tiers: [
        { id: 7, name: 'Tier I', target: 10, baseReward: '1 Cheat Day', customReward: '', cheats: 1, level: 'Bronze' },
        { id: 8, name: 'Tier II', target: 20, baseReward: '1 Cheat Day', customReward: 'Spend 1 Hr Binge-Watching Your Watchlist', cheats: 1, level: 'Silver' },
        { id: 9, name: 'Tier III', target: 40, baseReward: '2 Cheat Days', customReward: 'Premium dessert', cheats: 2, level: 'Gold' }
      ]
    },
    {
      id: 'finance', name: 'Financial Discipline', icon: '📊', desc: 'Log expenses and track budget',
      tiers: [
        { id: 10, name: 'Tier I', target: 15, baseReward: '1 Cheat Day', customReward: '', cheats: 1, level: 'Bronze' },
        { id: 11, name: 'Tier II', target: 30, baseReward: '1 Cheat Day', customReward: 'Movie outing', cheats: 1, level: 'Silver' },
        { id: 12, name: 'Tier III', target: 60, baseReward: '2 Cheat Days', customReward: 'Buy yourself something special!', cheats: 2, level: 'Gold' }
      ]
    },
    {
      id: 'wealth', name: 'Wealth Builder', icon: '💰', desc: 'Save ₹15 every single day',
      tiers: [
        { id: 13, name: 'Tier I', target: 15, baseReward: '1 Cheat Day', customReward: '', cheats: 1, level: 'Bronze' },
        { id: 14, name: 'Tier II', target: 30, baseReward: '1 Cheat Day', customReward: '₹450 to Premium Fund', cheats: 1, level: 'Silver' },
        { id: 15, name: 'Tier III', target: 60, baseReward: '2 Cheat Days', customReward: 'Buy a Tech Item', cheats: 2, level: 'Gold' }
      ]
    },
    {
      id: 'study', name: 'Academic Focus', icon: '📐', desc: 'Solve 20 complex problems daily',
      tiers: [
        { id: 16, name: 'Tier I', target: 10, baseReward: '1 Cheat Day', customReward: '', cheats: 1, level: 'Bronze' },
        { id: 17, name: 'Tier II', target: 20, baseReward: '1 Cheat Day', customReward: '2-hour Cricket Match', cheats: 1, level: 'Silver' },
        { id: 18, name: 'Tier III', target: 40, baseReward: '2 Cheat Days', customReward: 'Weekend movie outing', cheats: 2, level: 'Gold' }
      ]
    },
    {
      id: 'schedule', name: 'Schedule Adherence', icon: '📅', desc: 'Maintain 100% daily time-blocks',
      tiers: [
        { id: 19, name: 'Tier I', target: 5, baseReward: '1 Cheat Day', customReward: '', cheats: 1, level: 'Bronze' },
        { id: 20, name: 'Tier II', target: 15, baseReward: '1 Cheat Day', customReward: 'Outing with friends', cheats: 1, level: 'Silver' },
        { id: 21, name: 'Tier III', target: 30, baseReward: '2 Cheat Days', customReward: 'High end restaurant meal', cheats: 2, level: 'Gold' }
      ]
    },
    {
      id: 'prep', name: 'Exam Prep Sprint', icon: '🎯', desc: 'Complete all syllabus 1 week before the exam',
      tiers: [{ id: 22, name: 'Gold Tier', target: 1, baseReward: '', customReward: 'Massive Hangout', cheats: 0, level: 'Gold' }]
    },
    {
      id: 'master', name: 'Master Builder', icon: '🏗️', desc: 'Finish building a complete Web App',
      tiers: [{ id: 23, name: 'Gold Tier', target: 1, baseReward: '', customReward: 'Take 2-day coding break', cheats: 0, level: 'Gold' }]
    },
    {
      id: 'excellence', name: 'Academic Excellence', icon: '🎓', desc: 'Maintain > 8.5 CGPA for semester',
      tiers: [{ id: 24, name: 'Gold Tier', target: 1, baseReward: '', customReward: 'Full weekend trip', cheats: 0, level: 'Gold' }]
    },
    {
      id: 'fin_master', name: 'Financial Master', icon: '💎', desc: 'Stay 15% under budget for 2 months',
      tiers: [{ id: 25, name: 'Gold Tier', target: 1, baseReward: '', customReward: 'Transfer all savings to laptop fund', cheats: 0, level: 'Gold' }]
    }
  ];

  const defaultState = { progress: {}, cheats: {}, claimed: [], userOverrides: {}, customCategories: [] };
  defaultCategories.forEach(c => {
    defaultState.progress[c.id] = 0;
    defaultState.cheats[c.id] = 0;
  });

  const [data, setData] = useLocalStorageSync('rewardSystemData', defaultState);
  const [editingCategory, setEditingCategory] = useState(null); 
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const lastWrite = useRef(0);

  useEffect(() => {
    if (cloudRewards && Object.keys(cloudRewards).length > 0) {
      if (Date.now() - lastWrite.current > 2500) {
        setData(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(cloudRewards)) {
            return cloudRewards;
          }
          return prev;
        });
      }
    }
  }, [cloudRewards, setData]);

  const safeData = {
    progress: data?.progress || {},
    cheats: data?.cheats || {},
    claimed: Array.isArray(data?.claimed) ? data.claimed : [],
    userOverrides: data?.userOverrides || {},
    customCategories: Array.isArray(data?.customCategories) ? data.customCategories : []
  };

  // Merge default categories (with overrides) + Custom user-created categories
  const activeCategories = [
    ...defaultCategories.map(cat => {
      const override = safeData.userOverrides[cat.id];
      if (!override) return cat; 
      
      return {
        ...cat,
        name: override.name ?? cat.name,
        icon: override.icon ?? cat.icon,
        desc: override.desc ?? cat.desc,
        tiers: cat.tiers.map(t => ({
          ...t,
          customReward: override.tiers?.[t.id]?.customReward ?? t.customReward
        }))
      };
    }),
    ...safeData.customCategories
  ];

  // --- Core Engine Functions ---

  const handleLog = (groupId) => {
    lastWrite.current = Date.now(); 
    setData(prev => {
      const prevProgress = prev?.progress || {};
      const newData = {
        ...prev,
        progress: { ...prevProgress, [groupId]: (prevProgress[groupId] || 0) + 1 }
      };
      if (updateCloudData) {
         const cleanData = { ...newData };
         updateCloudData('rewards', cleanData);
      }
      return newData;
    });
  };

  const handleClaim = (groupId, tier, isFinalTier) => {
    lastWrite.current = Date.now(); 
    setData(prev => {
      let newClaimed = [...(Array.isArray(prev?.claimed) ? prev.claimed : []), tier.id];
      let newProgress = { ...(prev?.progress || {}) };
      let newCheats = { ...(prev?.cheats || {}) };

      newCheats[groupId] = (newCheats[groupId] || 0) + tier.cheats;

      if (isFinalTier) {
        newProgress[groupId] = 0;
        const groupTierIds = activeCategories.find(c => c.id === groupId).tiers.map(t => t.id);
        newClaimed = newClaimed.filter(id => !groupTierIds.includes(id));
      }

      const newData = { ...prev, progress: newProgress, cheats: newCheats, claimed: newClaimed };
      if (updateCloudData) {
         const cleanData = { ...newData };
         updateCloudData('rewards', cleanData);
      }
      return newData;
    });

    const fullReward = tier.baseReward + (tier.baseReward && tier.customReward ? ' + ' : '') + tier.customReward;
    alert(`🎉 Target hit! You earned: ${fullReward}\n\n${tier.cheats > 0 ? `You now have ${tier.cheats} new Cheat Day(s) for this specific task to protect your streak!` : ''}`);
  };

  const handleMissedDay = (groupId) => {
    const availableCheats = safeData.cheats[groupId] || 0;
    
    if (availableCheats > 0) {
      if (window.confirm(`You have ${availableCheats} Cheat Day(s) available for this task. \n\nDo you want to use 1 Cheat Day to keep your streak alive? (This will consume a cheat day but will NOT add a day to your progress).`)) {
        lastWrite.current = Date.now(); 
        setData(prev => {
          const prevCheats = prev?.cheats || {};
          const newData = {
            ...prev,
            cheats: { ...prevCheats, [groupId]: Math.max(0, (prevCheats[groupId] || 1) - 1) },
          };
          if (updateCloudData) {
             const cleanData = { ...newData };
             updateCloudData('rewards', cleanData);
          }
          return newData;
        });
      }
    } else {
      if (window.confirm("You have 0 Cheat Days for this task. Your streak is broken.\n\nResetting all tiers for this category to 0.")) {
        lastWrite.current = Date.now(); 
        setData(prev => {
          const prevProgress = prev?.progress || {};
          const prevClaimed = Array.isArray(prev?.claimed) ? prev.claimed : [];
          const groupTierIds = activeCategories.find(c => c.id === groupId).tiers.map(t => t.id);
          
          const newData = {
            ...prev,
            progress: { ...prevProgress, [groupId]: 0 },
            claimed: prevClaimed.filter(id => !groupTierIds.includes(id))
          };
          if (updateCloudData) {
             const cleanData = { ...newData };
             updateCloudData('rewards', cleanData);
          }
          return newData;
        });
      }
    }
  };

  const saveCategoryEdit = (e) => {
    e.preventDefault();
    lastWrite.current = Date.now(); 

    if (isCreatingNew) {
      // Create entirely new category
      setData(prev => {
        const newData = { 
          ...prev, 
          customCategories: [...(prev.customCategories || []), editingCategory],
          progress: { ...prev.progress, [editingCategory.id]: 0 },
          cheats: { ...prev.cheats, [editingCategory.id]: 0 }
        };
        if (updateCloudData) updateCloudData('rewards', newData);
        return newData;
      });
    } else if (editingCategory.id.startsWith('custom_')) {
      // Update an existing custom category
      setData(prev => {
        const newCustom = prev.customCategories.map(c => c.id === editingCategory.id ? editingCategory : c);
        const newData = { ...prev, customCategories: newCustom };
        if (updateCloudData) updateCloudData('rewards', newData);
        return newData;
      });
    } else {
      // Override a default category
      setData(prev => {
        const categoryOverride = {
          name: editingCategory.name,
          icon: editingCategory.icon,
          desc: editingCategory.desc,
          tiers: editingCategory.tiers.reduce((acc, tier) => {
            acc[tier.id] = { customReward: tier.customReward };
            return acc;
          }, {})
        };
        const newOverrides = { ...prev.userOverrides, [editingCategory.id]: categoryOverride };
        const newData = { ...prev, userOverrides: newOverrides };
        if (updateCloudData) updateCloudData('rewards', newData);
        return newData;
      });
    }
    
    setEditingCategory(null);
    setIsCreatingNew(false);
  };

  const deleteCustomCategory = (id) => {
    if (window.confirm("Are you sure you want to permanently delete this custom reward track? All progress will be lost.")) {
      lastWrite.current = Date.now();
      setData(prev => {
        const newCustom = prev.customCategories.filter(c => c.id !== id);
        const newData = { ...prev, customCategories: newCustom };
        if (updateCloudData) updateCloudData('rewards', newData);
        return newData;
      });
    }
  };

  const updateEditTier = (tierId, newCustomReward) => {
    setEditingCategory(prev => {
      const newTiers = prev.tiers.map(t => t.id === tierId ? { ...t, customReward: newCustomReward } : t);
      return { ...prev, tiers: newTiers };
    });
  };

  // --- UI TRIGGERS ---
  const startNewCategory = () => {
    setIsCreatingNew(true);
    const newId = `custom_${Date.now()}`;
    setEditingCategory({
      id: newId,
      name: '',
      icon: '🏆',
      desc: '',
      tiers: [
        { id: `${newId}_t1`, name: 'Tier I', target: 7, baseReward: '1 Cheat Day', customReward: '', cheats: 1, level: 'Bronze' },
        { id: `${newId}_t2`, name: 'Tier II', target: 21, baseReward: '1 Cheat Day', customReward: '', cheats: 1, level: 'Silver' },
        { id: `${newId}_t3`, name: 'Tier III', target: 45, baseReward: '2 Cheat Days', customReward: '', cheats: 2, level: 'Gold' }
      ]
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const safeHabitOptions = Array.isArray(habits) ? habits : [];

  const getLevelColor = (level) => {
    if (level === 'Gold') return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/50';
    if (level === 'Silver') return 'text-gray-300 bg-gray-700/20 border-gray-500/50';
    return 'text-orange-500 bg-orange-900/20 border-orange-700/50'; 
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-5 shadow-lg flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Gamified Reward System</h1>
          <p className="text-gray-400 text-sm mt-0.5">Continuous overlapping streaks. Cheat Days are now locked to their specific tasks.</p>
        </div>
        {!editingCategory && (
          <button onClick={startNewCategory} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg transition-colors flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
            Add Custom Challenge
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {activeCategories.map((cat) => {
            const currentProgress = safeData.progress[cat.id] || 0;
            const availableCheats = safeData.cheats[cat.id] || 0;
            const activeTier = cat.tiers.find(t => !safeData.claimed.includes(t.id)) || cat.tiers[cat.tiers.length - 1];
            const pct = Math.min(100, (currentProgress / activeTier.target) * 100);
            const isCustomUserTrack = cat.id.startsWith('custom_');

            // --- EDIT MODE RENDER ---
            if (editingCategory && editingCategory.id === cat.id) {
              return (
                <div key={cat.id} className="bg-[#1a1a1a] rounded-2xl border-2 border-blue-500/50 p-6 shadow-[0_0_15px_rgba(59,130,246,0.1)] flex flex-col h-full animate-in fade-in">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3">
                    <h3 className="text-white font-bold">{isCreatingNew ? 'Create Custom Challenge' : 'Customize Category'}</h3>
                    <button onClick={() => {setEditingCategory(null); setIsCreatingNew(false);}} className="text-gray-400 hover:text-white">✕ Cancel</button>
                  </div>
                  
                  <form onSubmit={saveCategoryEdit} className="space-y-4 flex-1">
                    <div className="grid grid-cols-4 gap-3">
                      <div className="col-span-1">
                        <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Emoji</label>
                        <input type="text" value={editingCategory.icon} onChange={e => setEditingCategory({...editingCategory, icon: e.target.value})} className="w-full bg-black border border-gray-700 rounded-lg p-2 text-center text-xl text-white outline-none focus:border-blue-500" maxLength="2" />
                      </div>
                      <div className="col-span-3">
                        <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Reward Name</label>
                        <input type="text" value={editingCategory.name} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} placeholder="e.g., Bookworm..." className="w-full bg-black border border-gray-700 rounded-lg p-2 text-sm text-white outline-none focus:border-blue-500" required />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Tracked Task</label>
                      <select 
                        onChange={e => setEditingCategory({...editingCategory, desc: e.target.value})}
                        className="w-full bg-black border border-gray-700 rounded-lg p-2 text-sm text-gray-300 outline-none focus:border-blue-500 mb-2"
                      >
                        <option value="">-- Import from Habit Tracker --</option>
                        {safeHabitOptions.map(h => <option key={h.id} value={h.text}>{h.text}</option>)}
                      </select>
                      <input type="text" value={editingCategory.desc} onChange={e => setEditingCategory({...editingCategory, desc: e.target.value})} placeholder="Or type a custom task..." className="w-full bg-black border border-gray-700 rounded-lg p-2 text-sm text-white outline-none focus:border-blue-500" required />
                    </div>

                    <div className="space-y-3 pt-2 border-t border-gray-800">
                      <label className="text-[10px] uppercase text-blue-400 font-bold block mb-1">{isCreatingNew ? 'Set Targets & Rewards' : 'Customize Extra Rewards'}</label>
                      
                      {editingCategory.tiers.map((t, idx) => (
                        <div key={t.id} className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold w-14 shrink-0 ${getLevelColor(t.level)} p-1 rounded text-center`}>{t.level}</span>
                          
                          {/* If creating new, let them edit the target days too */}
                          {isCreatingNew && (
                            <input type="number" min="1" max="365" value={t.target} onChange={(e) => {
                              const newTiers = [...editingCategory.tiers];
                              newTiers[idx].target = Number(e.target.value);
                              setEditingCategory({...editingCategory, tiers: newTiers});
                            }} className="w-12 bg-black border border-gray-700 rounded-lg p-1.5 text-xs text-white outline-none focus:border-blue-500 text-center shrink-0" title="Target Days" />
                          )}
                          
                          <span className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap hidden sm:block">
                            {t.baseReward ? `${t.baseReward} +` : 'Reward:'}
                          </span>
                          
                          <input 
                            type="text" 
                            placeholder={t.level === 'Bronze' && !isCreatingNew ? "Fixed standard reward" : "Reward description..."}
                            value={t.customReward} 
                            disabled={t.level === 'Bronze' && !isCreatingNew}
                            onChange={e => updateEditTier(t.id, e.target.value)} 
                            className="w-full bg-black border border-gray-700 rounded-lg p-1.5 text-xs text-white outline-none focus:border-blue-500 disabled:opacity-50" 
                            required={isCreatingNew}
                          />
                        </div>
                      ))}
                    </div>

                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl shadow-md mt-4 transition-colors">
                      {isCreatingNew ? 'Create Challenge' : 'Save Customization'}
                    </button>
                  </form>
                </div>
              );
            }

            // --- NORMAL MODE RENDER ---
            return (
              <div key={cat.id} className={`bg-[#121212] rounded-2xl border p-6 shadow-lg flex flex-col h-full group relative transition-colors ${isCustomUserTrack ? 'border-indigo-900/50' : 'border-gray-800'}`}>
                
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4 pr-2">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border shadow-inner shrink-0 ${isCustomUserTrack ? 'border-indigo-500/30 bg-indigo-900/10' : 'border-gray-700 bg-black'}`}>
                      {cat.icon}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        {cat.name} 
                        {isCustomUserTrack && <span className="text-[9px] bg-indigo-900/30 text-indigo-400 border border-indigo-900/50 px-1.5 py-0.5 rounded uppercase tracking-wider">Custom</span>}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">{cat.desc}</p>
                    </div>
                  </div>
                  
                  {/* Right Side Controls */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button 
                      onClick={() => setEditingCategory(cat)} 
                      className="text-gray-500 hover:text-white bg-black p-2 rounded-lg border border-gray-800 transition-colors shadow-sm hover:border-gray-600"
                      title="Edit this Reward"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                    </button>
                    
                    {isCustomUserTrack && (
                       <button onClick={() => deleteCustomCategory(cat.id)} className="text-gray-500 hover:text-red-400 bg-black p-2 rounded-lg border border-gray-800 transition-colors shadow-sm hover:border-red-900/50" title="Delete Track">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </button>
                    )}

                    {cat.tiers.length > 1 && (
                      <div className={`px-3 py-1.5 rounded-lg border flex flex-col items-center shrink-0 shadow-sm ${availableCheats > 0 ? 'bg-red-900/20 border-red-500/50 text-red-400' : 'bg-gray-900/50 border-gray-700 text-gray-500'}`}>
                        <span className="text-[9px] font-bold uppercase tracking-wider">Cheat Days</span>
                        <span className="text-lg font-black leading-none mt-0.5">{availableCheats}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tiers List */}
                <div className="flex-1 space-y-3 mb-6">
                  {cat.tiers.map((tier, index) => {
                    const isClaimed = safeData.claimed.includes(tier.id);
                    const isClaimable = !isClaimed && currentProgress >= tier.target;
                    const isFinalTier = index === cat.tiers.length - 1;
                    
                    const fullReward = tier.baseReward + (tier.baseReward && tier.customReward ? ' + ' : '') + tier.customReward;

                    return (
                      <div key={tier.id} className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${isClaimed ? 'bg-emerald-900/10 border-emerald-900/30 opacity-50' : isClaimable ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'bg-black border-gray-800'}`}>
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${getLevelColor(tier.level)}`}>{tier.level}</span>
                            <span className="text-gray-300 font-bold text-sm">{tier.target} Days</span>
                          </div>
                          <p className="text-xs text-emerald-400 font-medium">🎁 {fullReward}</p>
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
                      <div className={`h-full rounded-full transition-all duration-500 ${isCustomUserTrack ? 'bg-indigo-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleMissedDay(cat.id)} title="Missed Day / Use Cheat" className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-red-900/50 hover:text-red-400 text-gray-400 rounded-xl transition-colors border border-gray-700 hover:border-red-900/50">
                      ↺
                    </button>
                    <button onClick={() => handleLog(cat.id)} className={`${isCustomUserTrack ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-blue-600 hover:bg-blue-500'} text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-md`}>
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