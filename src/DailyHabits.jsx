import React, { useState } from 'react';

const DailyHabits = () => {
  // 1. The State
  // This holds your daily tasks. We are pre-filling it with some engineering and health targets.
  const [habits, setHabits] = useState([
    { id: 1, text: "Review Engineering Math Notes", completed: true },
    { id: 2, text: "Work on Web Application Logic", completed: false },
    { id: 3, text: "Data Structures Practice", completed: false },
    { id: 4, text: "Drink 2L of Water", completed: true },
    { id: 5, text: "Focus for 25 minutes (Pomodoro)", completed: false },
  ]);

  // 2. The Logic
  // This function flips a habit from false to true (or true to false) when clicked.
  const toggleHabit = (id) => {
    setHabits(habits.map(habit => 
      habit.id === id ? { ...habit, completed: !habit.completed } : habit
    ));
  };

  // Automatically calculate progress based on the checked boxes
  const completedCount = habits.filter(h => h.completed).length;
  const progressPercentage = Math.round((completedCount / habits.length) * 100) || 0;

  // 3. The UI
  return (
    <div className="bg-[#121212] rounded-xl p-6 shadow-lg border border-gray-800 w-full max-w-2xl flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-gray-200 font-semibold text-lg">Daily Habits</h3>
        <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-md">Today</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Completion</span>
          <span className="text-green-500 font-bold">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-500 ease-in-out" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-3 flex-1">
        {habits.map((habit) => (
          <label 
            key={habit.id} 
            className="flex items-center space-x-3 cursor-pointer group p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
          >
            <div className="relative flex items-center justify-center">
              <input 
                type="checkbox" 
                className="peer appearance-none w-5 h-5 border-2 border-gray-600 rounded-md checked:bg-green-500 checked:border-green-500 cursor-pointer transition-colors"
                checked={habit.completed}
                onChange={() => toggleHabit(habit.id)}
              />
              {/* Custom SVG Checkmark */}
              <svg 
                className="absolute w-3 h-3 text-black opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth="3"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className={`text-sm transition-colors ${habit.completed ? 'text-gray-500 line-through' : 'text-gray-300 group-hover:text-white'}`}>
              {habit.text}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default DailyHabits;