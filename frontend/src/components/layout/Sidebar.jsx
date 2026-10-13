import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Home, ClipboardList, BookOpen, Calendar, Bell, Users, FileText, CheckSquare, Layers, LogOut, CalendarDays, User, Contact, MessageSquare, Megaphone, Shield, Cake, ClipboardCheck, GraduationCap, Gamepad2, Zap, PartyPopper, ChevronDown, ChevronUp, Clock, Hand } from 'lucide-react';
import { requestForToken } from '../../firebaseInit';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export const navConfig = {
  student: [
    { name: 'Dashboard', path: '/student/dashboard', icon: Home },
    { name: 'Subjects', path: '/student/class', icon: BookOpen },
    { name: 'Homework', path: '/student/homework', icon: ClipboardList },
    { name: 'Projects', path: '/student/projects', icon: FileText },
    { name: 'Tests', path: '/student/tests', icon: ClipboardCheck },
    { name: 'Exams', path: '/student/exams', icon: GraduationCap },
    { name: 'Hand Raises', path: '/student/hand-raises', icon: Hand },
    { name: 'My Todos', path: '/student/todos', icon: CheckSquare },
    { name: 'Report Card', path: '/student/report-card', icon: FileText },
    { name: 'Calendar', path: '/student/calendar', icon: Calendar },
    { name: 'Attendance', path: '/student/attendance', icon: Calendar },
    { name: 'Timetable', path: '/student/timetable', icon: CalendarDays },
    { name: 'Tuition Timetable', path: '/student/tuition-timetable', icon: CalendarDays },
    { name: 'Tuition Attendance', path: '/student/tuition-attendance', icon: Calendar },
    { name: 'Tuition Homework', path: '/student/tuition-homework', icon: ClipboardList },
    { name: 'Tuition Tests', path: '/student/tuition-tests', icon: ClipboardCheck },
    { name: 'Tuition Fees', path: '/student/tuition-fees', icon: FileText },
    { name: 'Analytics', path: '/student/analytics', icon: Layers },
    { name: 'Resource Library', path: '/student/resources', icon: Layers },
    { name: 'Fun Activities', path: '/student/fun-activities', icon: Gamepad2 },
    { name: 'Events', path: '/student/events', icon: PartyPopper },
    { name: 'Special Classes', path: '/student/special-classes', icon: Zap },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: "Today's Birthdays", path: '/student/birthdays', icon: Cake },
    { name: 'My ID Card', path: '/student/my-id-card', icon: Contact },
    { name: 'Help Center', path: '/student/reports', icon: MessageSquare },
    { name: 'Profile', path: '/student/profile', icon: User }
  ],
  teacher: [
    { name: 'Dashboard', path: '/teacher/dashboard', icon: Home },
    { name: 'My Classes', path: '/teacher/classes', icon: Layers },
    { name: 'Students List', path: '/teacher/students', icon: Contact },
    { name: 'Add Tuition Students', path: '/teacher/tuition-register', icon: Contact },
    { name: 'Tuition Fees', path: '/teacher/tuition-fees', icon: FileText },
    { name: 'Attendance', path: '/teacher/attendance', icon: Calendar },
    { name: 'Calendar', path: '/teacher/calendar', icon: Calendar },
    { name: 'Class Timetable', path: '/teacher/timetable', icon: CalendarDays },
    { name: 'Teacher Timetable', path: '/teacher/my-timetable', icon: CalendarDays },
    { name: 'Tuition Timetable', path: '/teacher/tuition-timetable', icon: CalendarDays },
    { name: 'Syllabus', path: '/teacher/syllabus', icon: BookOpen },
    { name: 'Parents', path: '/teacher/parents', icon: Contact },
    { name: 'Homework', path: '/teacher/homework', icon: ClipboardList },
    { name: 'Projects', path: '/teacher/projects', icon: FileText },
    { name: 'Tests', path: '/teacher/tests', icon: ClipboardCheck },
    { name: 'Exams', path: '/teacher/exams', icon: GraduationCap },
    { name: 'Fun Activities', path: '/teacher/fun-activities', icon: Gamepad2 },
    { name: 'Announcements', path: '/teacher/announcements', icon: Megaphone },
    { name: 'Student Leaves', path: '/teacher/student-leaves', icon: FileText },
    { name: 'Leave Requests', path: '/teacher/leave-requests', icon: FileText },
    { name: 'Hand Raises', path: '/teacher/hand-raises', icon: Hand },
    { name: 'Todos & Tasks', path: '/teacher/todos', icon: CheckSquare },
    { name: 'Special Classes', path: '/teacher/special-classes', icon: Zap },
    { name: "Today's Birthdays", path: '/teacher/birthdays', icon: Cake },
    { name: 'Events', path: '/teacher/events', icon: PartyPopper },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'My ID Card', path: '/teacher/my-id-card', icon: Contact },
    { name: 'Help Center', path: '/teacher/reports', icon: MessageSquare },
    { name: 'Profile', path: '/teacher/profile', icon: User }
  ],
  principal: [
    { name: 'Dashboard', path: '/principal/dashboard', icon: Home },
    { name: 'Attendance', path: '/principal/attendance', icon: Calendar },
    { name: 'Calendar', path: '/principal/calendar', icon: Calendar },
    { name: 'Teachers', path: '/principal/teachers', icon: Users },
    { name: 'Standards & Sections', path: '/principal/standards', icon: BookOpen },
    { name: 'Teacher Assignments', path: '/principal/assignments', icon: Users },
    { name: 'Students', path: '/principal/students', icon: Users },
    { name: 'Classes', path: '/principal/classes', icon: Layers },

    { name: 'Tuition Sessions', path: '/principal/tuition-sessions', icon: CalendarDays },
    { name: 'Tuition Fees', path: '/principal/tuition-fees', icon: FileText },
    { name: 'Parents', path: '/principal/parents', icon: Contact },
    { name: 'Staff Leave', path: '/principal/staff-leave', icon: Users },
    { name: 'Substitute Mgmt', path: '/principal/substitutes', icon: Users },
    { name: 'Academic Years', path: '/principal/academic-years', icon: CalendarDays },
    { name: 'Temp Access', path: '/principal/temporary-access', icon: Shield },
    { name: 'Exams', path: '/principal/exams', icon: GraduationCap },
    { name: 'Homework', path: '/principal/homework', icon: ClipboardList },
    { name: 'Events', path: '/principal/events', icon: PartyPopper },
    { name: 'Fun Activities', path: '/principal/fun-activities', icon: Gamepad2 },
    { name: 'Special Classes', path: '/principal/special-classes', icon: Zap },
    { name: 'Announcements', path: '/principal/announcements', icon: Megaphone },
    { name: 'Motivational Quotes', path: '/principal/quotes', icon: MessageSquare },
    { name: 'Hand Raises', path: '/principal/hand-raises', icon: Hand },
    { name: 'Work Assignments', path: '/principal/todos', icon: CheckSquare },
    { name: "Today's Birthdays", path: '/principal/birthdays', icon: Cake },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'ID Card Management', path: '/principal/id-cards', icon: Contact },
    { name: 'My ID Card', path: '/principal/my-id-card', icon: Contact },

    { name: 'Help Center', path: '/principal/reports', icon: MessageSquare },
    { name: 'Profile', path: '/principal/profile', icon: User }
    // { name: 'AI Student Insights', path: '/principal/ai-dashboard', icon: Sparkles },
  ],
  parent: [
    { name: 'Dashboard', path: '/parent/dashboard', icon: Home },
    { name: 'Tuition Fees', path: '/student/tuition-fees', icon: FileText },
    { name: 'Activities', path: '/parent/activities', icon: ClipboardList },
    { name: 'Calendar', path: '/parent/calendar', icon: Calendar },
    { name: 'Special Classes', path: '/parent/special-classes', icon: Zap },
    { name: 'Hand Raises', path: '/parent/hand-raises', icon: Hand },
    { name: 'Timetable', path: '/student/timetable', icon: CalendarDays },
    { name: 'Help Center', path: '/parent/reports', icon: MessageSquare },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Profile', path: '/parent/profile', icon: User }
  ],
  superadmin: [
    { name: 'Dashboard', path: '/super-admin/dashboard', icon: Home },
    { name: 'Principals', path: '/super-admin/principals', icon: Users },
    { name: 'Amount Calculator', path: '/super-admin/calculator', icon: FileText },
    { name: 'Profile', path: '/super-admin/profile', icon: User }
  ],

};

const Sidebar = ({ role }) => {
  const { logout, currentUser } = useContext(AuthContext);
  const location = useLocation();
  const normRole = (role || 'student').toLowerCase();
  const navItems = navConfig[normRole] || navConfig.student;
  const [expandedMenus, setExpandedMenus] = useState({});
  const [fcmPermission, setFcmPermission] = useState(Notification.permission);

  const toggleMenu = (name) => {
    setExpandedMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const enableNotifications = async () => {
    try {
      const fcmToken = await requestForToken();
      if (fcmToken) {
        await api.post('/users/fcm-token', { token: fcmToken });
        setFcmPermission('granted');
        toast.success("Notifications enabled successfully!");
      } else {
        setFcmPermission('denied');
        toast.error("Please allow notifications in browser settings.");
      }
    } catch (err) {
      console.log('Error getting token', err);
      toast.error("Failed to enable notifications.");
    }
  };

  // Light mode: role-specific tints. Dark mode: unified navy sidebar with precise colors.
  const getRoleSidebarTheme = () => {
    const darkSidebar = 'dark:!bg-[#0B1120] dark:border-r dark:border-[#1E293B]';
    const darkActive = 'dark:!bg-[#059669] dark:!text-[#FFFFFF] dark:shadow-none [&>svg]:dark:!text-[#FFFFFF]';
    const darkInactive = 'dark:!text-[#E2E8F0] dark:hover:!bg-[#172235] dark:hover:!text-[#FFFFFF] [&>svg]:dark:!text-[#CBD5E1] hover:[&>svg]:dark:!text-[#34D399]';
    
    switch (normRole) {
      case 'superadmin':
        return {
          aside: `bg-indigo-50/80 border-r border-indigo-200/60 ${darkSidebar}`,
          logoAccent: 'text-indigo-600 dark:text-[#E2E8F0]',
          activeItem: `bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 ${darkActive}`,
          inactiveItem: `text-gray-700 hover:bg-indigo-100/70 hover:text-indigo-700 ${darkInactive}`
        };
      case 'principal':
        return {
          aside: `bg-emerald-50/80 border-r border-emerald-200/60 ${darkSidebar}`,
          logoAccent: 'text-emerald-600 dark:text-[#E2E8F0]',
          activeItem: `bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 ${darkActive}`,
          inactiveItem: `text-gray-700 hover:bg-emerald-100/70 hover:text-emerald-700 ${darkInactive}`
        };
      case 'teacher':
        return {
          aside: `bg-red-50/80 border-r border-red-200/60 ${darkSidebar}`,
          logoAccent: 'text-red-600 dark:text-[#E2E8F0]',
          activeItem: `bg-red-600 text-white shadow-sm shadow-red-600/30 ${darkActive}`,
          inactiveItem: `text-gray-700 hover:bg-red-100/70 hover:text-red-700 ${darkInactive}`
        };
      case 'student':
        return {
          aside: `bg-blue-50/80 border-r border-blue-200/60 ${darkSidebar}`,
          logoAccent: 'text-blue-600 dark:text-[#E2E8F0]',
          activeItem: `bg-blue-600 text-white shadow-sm shadow-blue-600/30 ${darkActive}`,
          inactiveItem: `text-gray-700 hover:bg-blue-100/70 hover:text-blue-700 ${darkInactive}`
        };
      case 'parent':
      case 'parents':
        return {
          aside: `bg-orange-50/80 border-r border-orange-200/60 ${darkSidebar}`,
          logoAccent: 'text-orange-500 dark:text-[#E2E8F0]',
          activeItem: `bg-orange-500 text-white shadow-sm shadow-orange-500/30 ${darkActive}`,
          inactiveItem: `text-gray-700 hover:bg-orange-100/70 hover:text-orange-700 ${darkInactive}`
        };

      default:
        return {
          aside: `bg-blue-50/80 border-r border-blue-200/60 ${darkSidebar}`,
          logoAccent: 'text-blue-600 dark:text-[#E2E8F0]',
          activeItem: `bg-blue-600 text-white shadow-sm shadow-blue-600/30 ${darkActive}`,
          inactiveItem: `text-gray-700 hover:bg-blue-100/70 hover:text-blue-700 ${darkInactive}`
        };
    }
  };

  const theme = getRoleSidebarTheme();

  return (
    <aside className={`w-64 h-screen ${theme.aside} backdrop-blur-xl flex flex-col shadow-lg z-20 transition-colors duration-300`}>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-[#F1F5F9]">Study<span className={theme.logoAccent}>Mate</span></h2>
        <p className="text-xs text-gray-500 dark:text-slate-500 font-medium">School Management</p>
      </div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 dark:[&::-webkit-scrollbar-track]:bg-[#0B1120] dark:[&::-webkit-scrollbar-thumb]:bg-[#475569] dark:[&::-webkit-scrollbar-thumb]:rounded-full dark:[&::-webkit-scrollbar-thumb:hover]:bg-[#64748B]">
        {navItems.filter(item => {
          if (role === 'principal' && currentUser?.tempPrincipalAccess && currentUser?.role === 'teacher') {
            const hiddenPaths = ['/principal/teachers', '/principal/temporary-access', '/principal/admissions'];
            if (hiddenPaths.some(hp => item.path.startsWith(hp))) return false;
          }
          return true;
        }).map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const IconComponent = item.icon;
          
          if (item.subItems) {
            const isExpanded = expandedMenus[item.name] || item.subItems.some(sub => location.pathname.startsWith(sub.path));
            return (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    isExpanded ? theme.activeItem : theme.inactiveItem
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-5 h-5" />
                    {item.name}
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isExpanded && (
                  <div className="pl-11 pr-2 py-1 space-y-1">
                    {item.subItems.map(subItem => {
                      const isSubActive = location.pathname.startsWith(subItem.path);
                      const SubIcon = subItem.icon;
                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isSubActive 
                              ? 'text-gray-900 bg-gray-100/80 dark:text-white dark:bg-[#1E293B]' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#172235]'
                          }`}
                        >
                          <SubIcon className="w-4 h-4 opacity-70" />
                          {subItem.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                isActive 
                  ? theme.activeItem 
                  : theme.inactiveItem
              }`}
            >
              <IconComponent className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200/50 dark:border-[#1E293B]">
        {fcmPermission !== 'granted' && (
          <button onClick={enableNotifications} className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-400 transition font-medium text-sm">
             <Bell className="w-4 h-4" /> Enable Notifications
          </button>
        )}
        <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/60 text-gray-700 hover:bg-red-50 hover:text-red-600 dark:bg-[#0B1120] dark:border dark:border-[#334155] dark:text-[#E2E8F0] dark:hover:bg-[#172235] dark:hover:text-[#E2E8F0] transition shadow-xs">
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

