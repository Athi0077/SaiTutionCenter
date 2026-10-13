import React, { useContext } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import MobileBottomNav from './MobileBottomNav';
import { AuthContext } from '../../context/AuthContext';
import PomodoroTimer from '../common/PomodoroTimer';

import { motion } from 'framer-motion';

import { useLocation, Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Layout = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const location = useLocation();
  const baseRole = currentUser?.role || 'student'; // Fallback to student theme
  const isTempPrincipalView = baseRole === 'teacher' && currentUser?.tempPrincipalAccess && location.pathname.startsWith('/principal');
  const role = isTempPrincipalView ? 'principal' : baseRole;

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-[#0b1120] text-gray-800 dark:text-gray-100 overflow-hidden`}>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar role={role} />
      </div>

      <div className="flex-1 flex flex-col w-full overflow-hidden">
        <TopNavbar user={currentUser} role={role} />
        
        {isTempPrincipalView && (
          <div className="bg-purple-600 text-white px-3 py-2 text-xs md:text-sm font-semibold flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 shadow-inner z-10 text-center">
            <div className="flex items-center gap-1.5">
              <ShieldAlert size={14} className="shrink-0 md:w-4 md:h-4" />
              <span>Teacher Account — Temp Principal Access</span>
            </div>
            <Link to="/teacher/dashboard" className="md:ml-4 underline hover:text-purple-200">Switch to Teacher Dashboard</Link>
          </div>
        )}
        
        {baseRole === 'teacher' && currentUser?.tempPrincipalAccess && !isTempPrincipalView && (
          <div className="bg-purple-100 text-purple-800 px-3 py-2 text-xs md:text-sm font-semibold flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 shadow-inner z-10 border-b border-purple-200 text-center">
            <div className="flex items-center gap-1.5">
              <ShieldAlert size={14} className="shrink-0 md:w-4 md:h-4" />
              <span>You have active Temporary Principal Access.</span>
            </div>
            <Link to="/principal/dashboard" className="md:ml-4 underline hover:text-purple-600">Switch to Principal Dashboard</Link>
          </div>
        )}

        {/* Main content scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="max-w-7xl mx-auto w-full pb-28 md:pb-4"
          >
            {children}
          </motion.div>
          {role === 'student' && <PomodoroTimer />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <MobileBottomNav role={role} />
      </div>
    </div>
  );
};

export default Layout;
