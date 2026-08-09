import React from 'react';

const Sidebar = ({ currentView, setCurrentView }) => {
  // All navigation modules for CampusOS
  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard', color: 'text-blue-500' },
    { id: 'tasks', icon: '✅', label: 'Task Manager', color: 'text-indigo-500' },
    { id: 'planner', icon: '📅', label: 'Daily Planner', color: 'text-purple-500' },
    { id: 'habits', icon: '🔄', label: 'Habit Tracker', color: 'text-emerald-500' },
    { id: 'fitness', icon: '💪', label: 'Fitness & Health', color: 'text-sky-500' },
    { id: 'finance', icon: '💰', label: 'Finance & Budget', color: 'text-emerald-400' },
    { id: 'cgpa', icon: '📈', label: 'CGPA Calculator', color: 'text-yellow-500' },
    { id: 'exams', icon: '📝', label: 'Exams Tracker', color: 'text-red-500' },
    { id: 'library', icon: '📚', label: 'Digital Library', color: 'text-blue-400' },
    { id: 'laundry', icon: '🧺', label: 'Laundry Centre', color: 'text-cyan-500' },
    { id: 'rewards', icon: '🎁', label: 'Rewards', color: 'text-orange-500' },
    { id: 'donate', icon: '❤️', label: 'Animal Donation', color: 'text-rose-500' }
  ];

  return (
    <aside className="w-20 lg:w-64 bg-[#121212] border-r border-gray-800 flex flex-col h-full shadow-2xl transition-all duration-300 z-50">
      
      {/* App Logo / Header */}
      <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-800 shrink-0">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="hidden lg:block text-xl font-black text-white ml-3 tracking-tight">CampusOS</h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-6 px-3 space-y-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              title={item.label}
              className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-gray-800/80 shadow-md border border-gray-700/50' 
                  : 'hover:bg-gray-900/50 border border-transparent'
              }`}
            >
              <span className={`text-xl flex items-center justify-center w-8 h-8 rounded-lg ${isActive ? '' : 'opacity-80 group-hover:opacity-100 transition-opacity'} ${item.color}`}>
                {item.icon}
              </span>
              <span className={`hidden lg:block ml-3 text-sm font-bold tracking-wide transition-colors ${
                isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'
              }`}>
                {item.label}
              </span>
              
              {/* Active Indicator Dot */}
              {isActive && (
                <div className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
              )}
            </button>
          );
        })}

        {/* August AI WhatsApp Quick Link */}
        <a 
          href="https://wa.me/+918738030604" 
          target="_blank" 
          rel="noopener noreferrer"
          title="Chat with August AI"
          className="w-full flex items-center p-3 rounded-xl transition-all duration-200 group bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 mt-4"
        >
          <span className="text-xl flex items-center justify-center w-8 h-8 rounded-lg">
            🤖
          </span>
          <span className="hidden lg:block ml-3 text-sm font-bold tracking-wide text-blue-400 group-hover:text-blue-300">
            August AI
          </span>
        </a>
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-800 shrink-0 hidden lg:block">
        <div className="bg-black border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Version</p>
          <p className="text-xs font-black text-gray-300 mt-0.5">Cloud Sync Enabled</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;