import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navConfig } from './Sidebar';
import { AuthContext } from '../../context/AuthContext';
import { Menu, X, LogOut } from 'lucide-react';

const MobileBottomNav = ({ role }) => {
  const location = useLocation();
  const { logout } = useContext(AuthContext);
  const [showMore, setShowMore] = useState(false);
  
  const allNavItems = navConfig[role] || navConfig.student;
  
  const visibleItems = allNavItems.slice(0, 4);
  const hiddenItems = allNavItems.slice(4);

  let activeTextClass = 'text-blue-700 dark:text-blue-400';
  let activeBgClass = 'bg-blue-100 dark:bg-blue-950/50';
  
  if (role === 'superadmin') {
    activeTextClass = 'text-indigo-600 dark:text-indigo-400';
    activeBgClass = 'bg-indigo-100 dark:bg-indigo-950/50';
  } else if (role === 'principal') {
    activeTextClass = 'text-emerald-700 dark:text-emerald-400';
    activeBgClass = 'bg-emerald-100 dark:bg-emerald-950/50';
  } else if (role === 'teacher') {
    activeTextClass = 'text-red-700 dark:text-red-400';
    activeBgClass = 'bg-red-100 dark:bg-red-950/50';
  } else if (role === 'parent' || role === 'parents') {
    activeTextClass = 'text-orange-700 dark:text-orange-400';
    activeBgClass = 'bg-orange-100 dark:bg-orange-950/50';
  }

  // Common muted color for inactive state
  const inactiveClass = 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 bg-transparent';

  return (
    <>
      {/* Overlay for More Menu */}
      {showMore && (
        <div 
          className="fixed inset-0 bg-black/20 z-40" 
          onClick={() => setShowMore(false)} 
        />
      )}

      {/* More Menu Sheet */}
      <div className={`fixed bottom-16 left-0 w-full bg-white dark:bg-[#0b1120] rounded-t-3xl shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.5)] z-40 transition-transform duration-300 p-6 ${showMore ? 'translate-y-0' : 'translate-y-[200%]'}`}>
        <div className="w-12 h-1.5 bg-gray-200 dark:bg-[#1E293B] rounded-full mx-auto mb-6"></div>
        <div className="grid grid-cols-4 gap-y-6 gap-x-2">
          {hiddenItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const IconComp = item.icon;
            return (
              <Link 
                key={item.path}
                to={item.path}
                onClick={() => setShowMore(false)}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl transition ${
                  isActive ? `${activeBgClass} ${activeTextClass}` : inactiveClass
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  <IconComp className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-semibold text-center leading-tight">
                  {item.name}
                </span>
              </Link>
            );
          })}
          
          <button 
            onClick={() => { setShowMore(false); logout(); }}
            className="flex flex-col items-center justify-center p-2 rounded-2xl transition bg-transparent text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
          >
            <div className="flex items-center justify-center mb-1">
              <LogOut className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-semibold text-center leading-tight">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Bottom Nav */}
      <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-[#0b1120] border-t border-gray-200 dark:border-[#1E293B] px-2 py-2 flex justify-around items-center shadow-sm pb-safe z-50">
        {visibleItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const IconComp = item.icon;
          return (
            <Link 
              key={item.path}
              to={item.path} 
              onClick={() => setShowMore(false)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition flex-1 max-w-[80px] ${
                isActive ? `${activeBgClass} ${activeTextClass}` : inactiveClass
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                <IconComp className="w-6 h-6 stroke-[2px]" />
              </div>
              <span className="text-[11px] font-semibold tracking-wide whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                {item.name.split(' ')[0]}
              </span>
            </Link>
          );
        })}
        
        {/* Show "More" button if there are hidden items, or Logout button directly if hiddenItems is empty */}
        {hiddenItems.length > 0 ? (
          <button 
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition flex-1 max-w-[80px] ${
              showMore ? `${activeBgClass} ${activeTextClass}` : inactiveClass
            }`}
          >
            <div className="flex items-center justify-center mb-1">
              {showMore ? <X className="w-6 h-6 stroke-[2px]" /> : <Menu className="w-6 h-6 stroke-[2px]" />}
            </div>
            <span className="text-[11px] font-semibold tracking-wide">More</span>
          </button>
        ) : (
          <button 
            onClick={logout}
            className="flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition flex-1 max-w-[80px] text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
          >
            <div className="flex items-center justify-center mb-1">
              <LogOut className="w-6 h-6 stroke-[2px]" />
            </div>
            <span className="text-[11px] font-semibold tracking-wide">Logout</span>
          </button>
        )}
      </div>
    </>
  );
};

export default MobileBottomNav;
