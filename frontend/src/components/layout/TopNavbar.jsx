import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NotificationContext } from '../../context/NotificationContext';
import { Moon, Sun, PlusCircle, Bell } from 'lucide-react';

const TopNavbar = ({ user, role: propRole }) => {
  const role = (propRole || user?.role || 'student').toLowerCase();
  const { unreadCount } = useContext(NotificationContext);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  const getProfilePath = () => {
    const normRole = (propRole || user?.role || 'student').toLowerCase();
    if (normRole === 'superadmin') return '/super-admin/profile';
    if (normRole.includes('principal')) return '/principal/profile';
    if (normRole === 'teacher') return '/teacher/profile';
    if (normRole.includes('parent')) return '/parent/profile';
    return '/student/profile';
  };

  // Role-based navbar background styles (unified in dark mode)
  const getRoleHeaderStyle = () => {
    const darkNav = 'dark:bg-[#0b1120] dark:bg-none dark:border-b dark:border-[#1E293B]';
    switch (role) {
      case 'superadmin':
        return `bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-900/50 text-white shadow-md ${darkNav}`;
      case 'principal':
        return `bg-gradient-to-r from-emerald-600 to-green-600 border-b border-emerald-700 text-white shadow-md ${darkNav}`;
      case 'teacher':
        return `bg-gradient-to-r from-red-600 to-rose-600 border-b border-red-700 text-white shadow-md ${darkNav}`;
      case 'student':
        return `bg-gradient-to-r from-blue-600 to-indigo-600 border-b border-blue-700 text-white shadow-md ${darkNav}`;
      case 'parent':
      case 'parents':
        return `bg-gradient-to-r from-orange-500 to-amber-600 border-b border-orange-600 text-white shadow-md ${darkNav}`;
      default:
        return `bg-gradient-to-r from-blue-600 to-indigo-600 border-b border-blue-700 text-white shadow-md ${darkNav}`;
    }
  };

  return (
    <header className={`${getRoleHeaderStyle()} flex items-center justify-between px-4 md:px-6 py-3 w-full shrink-0 z-10 transition-colors duration-300`}>
      <div className="flex items-center gap-3 md:hidden">
        <div className="text-2xl">🏛️</div>
        <div className="flex flex-col leading-tight">
          <h1 className="text-base font-bold tracking-wide text-white">StudyMate</h1>
        </div>
      </div>
      <div className="hidden md:block flex-1"></div>
      
      <div className="flex items-center gap-4 md:gap-6 ml-auto">
        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-full text-white/90 hover:text-white hover:bg-white/20 transition" 
          title="Toggle Dark Mode"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5" />}
        </button>
        
        {role === 'teacher' && (
          <Link 
            to="/teacher/homework/create" 
            className="hidden sm:flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white border border-white/30 px-3 py-1.5 rounded-full text-sm font-bold transition shadow-sm backdrop-blur-sm" 
            title="Quick Add Homework"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New HW</span>
          </Link>
        )}

        <Link 
          to="/notifications" 
          className="relative cursor-pointer block p-2 rounded-full hover:bg-white/20 transition text-white/90 hover:text-white"
        >
          <span className="opacity-90 hover:opacity-100 transition"><Bell className="w-5 h-5" /></span>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-yellow-400 text-gray-900 text-[10px] font-extrabold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        
        <Link 
          to={getProfilePath()} 
          className="flex items-center gap-2 hover:bg-white/15 p-1 sm:pr-3 rounded-full transition border border-transparent hover:border-white/20 cursor-pointer"
          title="View My Profile"
        >
          <div className="w-9 h-9 bg-white/20 text-white rounded-full flex items-center justify-center text-sm font-bold border border-white/30 shadow-sm overflow-hidden shrink-0">
            {user?.profilePic ? (
              <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name ? user.name.charAt(0).toUpperCase() : 'U'
            )}
          </div>
          <div className="flex flex-col items-start leading-tight hidden xs:flex sm:flex md:flex">
            <span className="text-sm font-bold tracking-wide text-white">{user?.name || 'User'}</span>
            <span className="text-[11px] text-white/80 capitalize font-medium">{role}</span>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default TopNavbar;
