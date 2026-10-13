// import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './routes/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import api from './utils/api';

import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import NotificationsPage from './pages/NotificationsPage';
import VerifyID from './pages/VerifyID';
import DigitalIDCard from './pages/DigitalIDCard';
import IDCardManagement from './pages/IDCardManagement';

import PrincipalDashboard from './pages/PrincipalDashboard';
import PrincipalClasses from './pages/PrincipalClasses';
import PrincipalHomework from './pages/PrincipalHomework';
import PrincipalAttendance from './pages/PrincipalAttendance';
import PrincipalClassAttendance from './pages/PrincipalClassAttendance';
import PrincipalTeachers from './pages/PrincipalTeachers';
import PrincipalStandards from './pages/PrincipalStandards';
import PrincipalAssignments from './pages/PrincipalAssignments';
import PrincipalAcademicYears from './pages/PrincipalAcademicYears';
import PrincipalAcademicYearCreate from './pages/PrincipalAcademicYearCreate';
import PrincipalPromotionPreview from './pages/PrincipalPromotionPreview';
import PrincipalAdmissions from './pages/PrincipalAdmissions';
import PrincipalStudents from './pages/PrincipalStudents';
import PrincipalClassStudents from './pages/PrincipalClassStudents';
import PrincipalStudentDetails from './pages/PrincipalStudentDetails';
import PrincipalParents from './pages/PrincipalParents';
import PrincipalExams from './pages/PrincipalExams';
import PrincipalCreateExam from './pages/PrincipalCreateExam';
import PrincipalEditExam from './pages/PrincipalEditExam';
import PrincipalAnnouncements from './pages/PrincipalAnnouncements';
import PrincipalQuotes from './pages/PrincipalQuotes';
import PrincipalAIDashboard from './pages/PrincipalAIDashboard';
import PrincipalAIStudentAnalysis from './pages/PrincipalAIStudentAnalysis';
import PrincipalAIClassAnalytics from './pages/PrincipalAIClassAnalytics';
import PrincipalAIAssistant from './pages/PrincipalAIAssistant';
import PrincipalAIReports from './pages/PrincipalAIReports';
import PrincipalAIProgress from './pages/PrincipalAIProgress';
import PrincipalSubstituteManagement from './pages/PrincipalSubstituteManagement';
import PrincipalStaffLeave from './pages/PrincipalStaffLeave';


import TeacherDashboard from './pages/TeacherDashboard';
import TeacherClasses from './pages/TeacherClasses';
import TeacherClassDetails from './pages/TeacherClassDetails';
import TeacherStudentDetails from './pages/TeacherStudentDetails';
import TeacherJoinRequests from './pages/TeacherJoinRequests';
import TeacherHomeworkList from './pages/TeacherHomeworkList';
import TeacherHomeworkApprovals from './pages/TeacherHomeworkApprovals';
import TeacherHomeworkCreate from './pages/TeacherHomeworkCreate';
import TeacherHomeworkDetails from './pages/TeacherHomeworkDetails';
import TeacherSubmissionReview from './pages/TeacherSubmissionReview';
import TeacherProjects from './pages/TeacherProjects';
import TeacherProjectCreate from './pages/TeacherProjectCreate';
import TeacherProjectApprovals from './pages/TeacherProjectApprovals';
import TeacherTests from './pages/TeacherTests';
import TeacherTestCreate from './pages/TeacherTestCreate';
import TeacherTestDetails from './pages/TeacherTestDetails';
import TeacherAttendanceList from './pages/TeacherAttendanceList';
import TeacherAttendance from './pages/TeacherAttendance';
import TeacherLeaveRequests from './pages/TeacherLeaveRequests';
import TeacherStudentList from './pages/TeacherStudentList';
import TeacherSyllabus from './pages/TeacherSyllabus';
import TeacherExams from './pages/TeacherExams';
import TeacherAnnouncements from './pages/TeacherAnnouncements';
import TeacherMyLeaveRequests from './pages/TeacherMyLeaveRequests';

import StudentDashboard from './pages/StudentDashboard';
import StudentClass from './pages/StudentClass';
import StudentJoinClass from './pages/StudentJoinClass';
import StudentHomeworkList from './pages/StudentHomeworkList';
import StudentHomeworkDetails from './pages/StudentHomeworkDetails';
import StudentHomeworkHistory from './pages/StudentHomeworkHistory';
import StudentProjects from './pages/StudentProjects';
import StudentProjectDetails from './pages/StudentProjectDetails';
import StudentTests from './pages/StudentTests';
import StudentTestDetails from './pages/StudentTestDetails';
import StudentAttendance from './pages/StudentAttendance';
import StudentLeaveRequest from './pages/StudentLeaveRequest';
import StudentSyllabus from './pages/StudentSyllabus';
import StudentExams from './pages/StudentExams';
import StudentReportCard from './pages/StudentReportCard';
import StudentResources from './pages/StudentResources';
import StudentAnalytics from './pages/StudentAnalytics';
import Profile from './pages/Profile';
import ParentDashboard from './pages/ParentDashboard';
import ParentActivities from './pages/ParentActivities';

import HandRaisesPage from './pages/HandRaisesPage';

import PrincipalReports from './pages/PrincipalReports';
import TeacherReports from './pages/TeacherReports';
import StudentReports from './pages/StudentReports';
import ParentReports from './pages/ParentReports';
import TeacherTimetable from './pages/TeacherTimetable';
import TeacherPersonalTimetable from './pages/TeacherPersonalTimetable';
import StudentTimetable from './pages/StudentTimetable';

import PrincipalTodos from './pages/PrincipalTodos';
import PrincipalTemporaryAccess from './pages/PrincipalTemporaryAccess';
import TeacherTodos from './pages/TeacherTodos';
import StudentTodos from './pages/StudentTodos';

import AdminTuitionSessions from './pages/AdminTuitionSessions';
import TeacherTuitionTimetable from './pages/TeacherTuitionTimetable';
import TeacherTuitionAttendance from './pages/TeacherTuitionAttendance';
import TeacherTuitionHomework from './pages/TeacherTuitionHomework';
import TeacherTuitionTests from './pages/TeacherTuitionTests';
import TeacherTuitionRegister from './pages/TeacherTuitionRegister';
import StudentTuitionTimetable from './pages/StudentTuitionTimetable';
import StudentTuitionAttendance from './pages/StudentTuitionAttendance';
import StudentTuitionHomework from './pages/StudentTuitionHomework';
import StudentTuitionTests from './pages/StudentTuitionTests';
import AdminTuitionFees from './pages/AdminTuitionFees';
import StudentTuitionFees from './pages/StudentTuitionFees';
import ParentTuitionDashboard from './pages/ParentTuitionDashboard';
import StudentTuitionDashboard from './pages/StudentTuitionDashboard';
import AdminTuitionDashboard from './pages/AdminTuitionDashboard';

import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminCalculator from './pages/SuperAdminCalculator';
import SuperAdminPrincipals from './pages/SuperAdminPrincipals';
import SuperAdminProfile from './pages/SuperAdminProfile';
import InstallPrompt from './components/InstallPrompt';
import ReloadPrompt from './components/ReloadPrompt';
import { useState, useEffect, useContext } from 'react';
import { WifiOff } from 'lucide-react';
import PrincipalEvents from './pages/PrincipalEvents';
import TeacherEvents from './pages/TeacherEvents';
import StudentEvents from './pages/StudentEvents';
import BirthdayCelebration from './pages/BirthdayCelebration';
import PrincipalSpecialClasses from './pages/PrincipalSpecialClasses';
import TeacherSpecialClasses from './pages/TeacherSpecialClasses';
import StudentSpecialClasses from './pages/StudentSpecialClasses';
import TeacherFunActivities from './pages/TeacherFunActivities';
import StudentFunActivities from './pages/StudentFunActivities';
import PrincipalFunActivities from './pages/PrincipalFunActivities';
import SchoolCalendarPage from './pages/SchoolCalendarPage';

const RootRoute = () => {
  const { isAuthenticated, loading, currentUser } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!isAuthenticated || !currentUser) return <Navigate to="/login" replace />;
  
  if (currentUser.role === 'superadmin') return <Navigate to="/super-admin/dashboard" replace />;
  if (currentUser.role === 'principal' || currentUser.role === 'main_principal') return <Navigate to="/principal/dashboard" replace />;
  if (currentUser.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  if (currentUser.role === 'parent' || currentUser.role === 'parents') return <Navigate to="/parent/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const ThemeUpdater = () => {
    const { currentUser } = useContext(AuthContext);
    
    useEffect(() => {
      let color = '#ffffff'; // default
      if (currentUser) {
        if (currentUser.role === 'principal' || currentUser.role === 'main_principal') color = '#10b981'; // green
        else if (currentUser.role === 'teacher') color = '#ef4444'; // red
        else if (currentUser.role === 'student') color = '#3b82f6'; // blue
        else if (currentUser.role === 'parent' || currentUser.role === 'parents') color = '#f97316'; // orange
      }
      
      let metaThemeColor = document.querySelector("meta[name='theme-color']");
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", color);
      } else {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.name = "theme-color";
        metaThemeColor.content = color;
        document.head.appendChild(metaThemeColor);
      }
    }, [currentUser]);

    return null;
  };

  const FCMUpdater = () => {
    const { currentUser, token } = useContext(AuthContext);
    
    useEffect(() => {
      if (currentUser && token) {
        import('./firebaseInit').then(({ requestForToken, onMessageListener }) => {
          requestForToken().then((fcmToken) => {
            if (fcmToken) {
              api.post('/users/fcm-token', { token: fcmToken })
                .catch(err => console.error('Failed to save FCM token', err));
            }
          });
          
          import('react-hot-toast').then(({ toast }) => {
            onMessageListener((payload) => {
              console.log('Received foreground message', payload);
              toast.success(`${payload.notification.title}: ${payload.notification.body}`, {
                duration: 5000,
                position: 'top-right',
              });
            });
          });
        }).catch(err => console.log('Firebase not initialized yet', err));
      }
    }, [currentUser, token]);

    return null;
  };

  return (
    <AuthProvider>
      <ThemeUpdater />
      <FCMUpdater />
      <NotificationProvider>
        <Router>
          <Toaster position="top-right" />
          {isOffline && (
            <div className="fixed top-0 left-0 right-0 bg-red-500 text-white px-4 py-2 text-center text-sm font-medium z-[100] flex items-center justify-center gap-2">
              <WifiOff size={16} />
              You are currently offline. Some features may be unavailable.
            </div>
          )}
          <InstallPrompt />
          <ReloadPrompt />
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Navigate to="/login" replace />} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            <Route path="/verify-id/:verificationId" element={<VerifyID />} />

            {/* Global Protected Routes */}
            <Route path="/notifications" element={<ProtectedRoute allowedRoles={['principal', 'teacher', 'student', 'parent']}><NotificationsPage /></ProtectedRoute>} />
            <Route path="/birthdays" element={<ProtectedRoute allowedRoles={['principal', 'teacher', 'student', 'parent']}><BirthdayCelebration /></ProtectedRoute>} />

            {/* Super Admin Routes */}
            <Route path="/super-admin/dashboard" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/super-admin/calculator" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminCalculator /></ProtectedRoute>} />
            <Route path="/super-admin/principals" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminPrincipals /></ProtectedRoute>} />
            <Route path="/super-admin/profile" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminProfile /></ProtectedRoute>} />

            {/* Principal Routes */}
            <Route path="/principal/dashboard" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalDashboard /></ProtectedRoute>} />
            <Route path="/principal/fun-activities" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalFunActivities /></ProtectedRoute>} />
            <Route path="/principal/birthdays" element={<ProtectedRoute allowedRoles={['principal']}><BirthdayCelebration /></ProtectedRoute>} />
            <Route path="/principal/events" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalEvents /></ProtectedRoute>} />
            <Route path="/principal/calendar" element={<ProtectedRoute allowedRoles={['principal']}><SchoolCalendarPage /></ProtectedRoute>} />
            <Route path="/principal/special-classes" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalSpecialClasses /></ProtectedRoute>} />
            <Route path="/principal/quotes" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalQuotes /></ProtectedRoute>} />
            <Route path="/principal/announcements" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalAnnouncements /></ProtectedRoute>} />
            <Route path="/principal/classes" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalClasses /></ProtectedRoute>} />
            <Route path="/principal/tuition-dashboard" element={<ProtectedRoute allowedRoles={['principal', 'superadmin']}><AdminTuitionDashboard /></ProtectedRoute>} />

            <Route path="/principal/tuition-sessions" element={<ProtectedRoute allowedRoles={['principal']}><AdminTuitionSessions /></ProtectedRoute>} />
            <Route path="/principal/tuition-fees" element={<ProtectedRoute allowedRoles={['principal']}><AdminTuitionFees /></ProtectedRoute>} />
            <Route path="/principal/homework" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalHomework /></ProtectedRoute>} />
            <Route path="/principal/teachers" element={<ProtectedRoute allowedRoles={['main_principal']}><PrincipalTeachers /></ProtectedRoute>} />
            <Route path="/principal/id-cards" element={<ProtectedRoute allowedRoles={['principal']}><IDCardManagement /></ProtectedRoute>} />
            <Route path="/principal/my-id-card" element={<ProtectedRoute allowedRoles={['principal']}><DigitalIDCard /></ProtectedRoute>} />
            <Route path="/principal/temporary-access" element={<ProtectedRoute allowedRoles={['main_principal']}><PrincipalTemporaryAccess /></ProtectedRoute>} />
            <Route path="/principal/attendance" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalAttendance /></ProtectedRoute>} />
            <Route path="/principal/attendance/:classId" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalClassAttendance /></ProtectedRoute>} />
            <Route path="/principal/standards" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalStandards /></ProtectedRoute>} />
            <Route path="/principal/assignments" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalAssignments /></ProtectedRoute>} />
            <Route path="/principal/academic-years" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalAcademicYears /></ProtectedRoute>} />
            <Route path="/principal/academic-years/create" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalAcademicYearCreate /></ProtectedRoute>} />
            <Route path="/principal/academic-years/:id/promotion/preview" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalPromotionPreview /></ProtectedRoute>} />
            <Route path="/principal/academic-years/:id/admissions" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalAdmissions /></ProtectedRoute>} />
            <Route path="/principal/students" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalStudents /></ProtectedRoute>} />
            <Route path="/principal/substitutes" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalSubstituteManagement /></ProtectedRoute>} />
            <Route path="/principal/staff-leave" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalStaffLeave /></ProtectedRoute>} />
            <Route path="/principal/students/details/:studentId" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalStudentDetails /></ProtectedRoute>} />
            <Route path="/principal/student-details/:studentId" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalStudentDetails /></ProtectedRoute>} />
            <Route path="/principal/students/:classId" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalClassStudents /></ProtectedRoute>} />
            <Route path="/principal/parents" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalParents /></ProtectedRoute>} />
            <Route path="/principal/exams" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalExams /></ProtectedRoute>} />
            <Route path="/principal/exams/create" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalCreateExam /></ProtectedRoute>} />
            <Route path="/principal/exams/edit/:id" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalEditExam /></ProtectedRoute>} />
            <Route path="/principal/todos" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalTodos /></ProtectedRoute>} />
            <Route path="/principal/hand-raises" element={<ProtectedRoute allowedRoles={['principal']}><HandRaisesPage /></ProtectedRoute>} />
            <Route path="/principal/reports" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalReports /></ProtectedRoute>} />
            <Route path="/principal/profile" element={<ProtectedRoute allowedRoles={['principal']}><Profile /></ProtectedRoute>} />
            <Route path="/principal/ai-dashboard" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalAIDashboard /></ProtectedRoute>} />
            <Route path="/principal/ai-dashboard/class-analytics" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalAIClassAnalytics /></ProtectedRoute>} />
            <Route path="/principal/ai-assistant" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalAIAssistant /></ProtectedRoute>} />
            <Route path="/principal/ai-reports" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalAIReports /></ProtectedRoute>} />
            <Route path="/principal/ai-progress" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalAIProgress /></ProtectedRoute>} />
            <Route path="/principal/ai-student/:studentId" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalAIStudentAnalysis /></ProtectedRoute>} />



            {/* Teacher Routes */}
            <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/fun-activities" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherFunActivities /></ProtectedRoute>} />
            <Route path="/teacher/birthdays" element={<ProtectedRoute allowedRoles={['teacher']}><BirthdayCelebration /></ProtectedRoute>} />
            <Route path="/teacher/events" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherEvents /></ProtectedRoute>} />
            <Route path="/teacher/calendar" element={<ProtectedRoute allowedRoles={['teacher']}><SchoolCalendarPage /></ProtectedRoute>} />
            <Route path="/teacher/special-classes" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherSpecialClasses /></ProtectedRoute>} />
            <Route path="/teacher/announcements" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherAnnouncements /></ProtectedRoute>} />
            <Route path="/teacher/classes" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherClasses /></ProtectedRoute>} />
            <Route path="/teacher/students/details/:studentId" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherStudentDetails /></ProtectedRoute>} />
            <Route path="/teacher/student-details/:studentId" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherStudentDetails /></ProtectedRoute>} />
            <Route path="/teacher/classes/:classId" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherClassDetails /></ProtectedRoute>} />
            <Route path="/teacher/class-requests" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherJoinRequests /></ProtectedRoute>} />
            <Route path="/teacher/homework" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherHomeworkList /></ProtectedRoute>} />
            <Route path="/teacher/homework-approvals" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherHomeworkApprovals /></ProtectedRoute>} />
            <Route path="/teacher/homework/create" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherHomeworkCreate /></ProtectedRoute>} />
            <Route path="/teacher/homework/:id" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherHomeworkDetails /></ProtectedRoute>} />
            <Route path="/teacher/submissions/:submissionId" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherSubmissionReview /></ProtectedRoute>} />
            
            <Route path="/teacher/projects" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherProjects /></ProtectedRoute>} />
            <Route path="/teacher/parents" element={<ProtectedRoute allowedRoles={['teacher']}><PrincipalParents /></ProtectedRoute>} />
            <Route path="/teacher/projects/create" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherProjectCreate /></ProtectedRoute>} />
            <Route path="/teacher/project-approvals" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherProjectApprovals /></ProtectedRoute>} />
            
            <Route path="/teacher/tests" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherTests /></ProtectedRoute>} />
            <Route path="/teacher/tests/create" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherTestCreate /></ProtectedRoute>} />
            <Route path="/teacher/tests/:id/edit" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherTestCreate /></ProtectedRoute>} />
            <Route path="/teacher/tests/:id" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherTestDetails /></ProtectedRoute>} />
            
            <Route path="/teacher/attendance" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherAttendanceList /></ProtectedRoute>} />
            <Route path="/teacher/attendance/:classId" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherAttendance /></ProtectedRoute>} />
            <Route path="/teacher/student-leaves" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherLeaveRequests /></ProtectedRoute>} />
            <Route path="/teacher/leave-requests" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherMyLeaveRequests /></ProtectedRoute>} />
            <Route path="/teacher/students" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherStudentList /></ProtectedRoute>} />
            <Route path="/teacher/syllabus" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherSyllabus /></ProtectedRoute>} />
            <Route path="/teacher/exams" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherExams /></ProtectedRoute>} />
            <Route path="/teacher/reports" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherReports /></ProtectedRoute>} />
            <Route path="/teacher/timetable" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherTimetable /></ProtectedRoute>} />
            <Route path="/teacher/tuition-timetable" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherTuitionTimetable /></ProtectedRoute>} />
            <Route path="/teacher/tuition-attendance" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherTuitionAttendance /></ProtectedRoute>} />
            <Route path="/teacher/tuition-homework" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherTuitionHomework /></ProtectedRoute>} />
            <Route path="/teacher/tuition-tests" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherTuitionTests /></ProtectedRoute>} />
            <Route path="/teacher/tuition-fees" element={<ProtectedRoute allowedRoles={['teacher']}><AdminTuitionFees /></ProtectedRoute>} />
            <Route path="/teacher/tuition-register" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherTuitionRegister /></ProtectedRoute>} />
            <Route path="/teacher/my-timetable" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherPersonalTimetable /></ProtectedRoute>} />
            <Route path="/teacher/hand-raises" element={<ProtectedRoute allowedRoles={['teacher']}><HandRaisesPage /></ProtectedRoute>} />
            <Route path="/teacher/todos" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherTodos /></ProtectedRoute>} />
            <Route path="/teacher/profile" element={<ProtectedRoute allowedRoles={['teacher']}><Profile /></ProtectedRoute>} />
            <Route path="/teacher/my-id-card" element={<ProtectedRoute allowedRoles={['teacher']}><DigitalIDCard /></ProtectedRoute>} />

            {/* Student Routes */}
            <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/fun-activities" element={<ProtectedRoute allowedRoles={['student', 'parent']}><StudentFunActivities /></ProtectedRoute>} />
            <Route path="/student/birthdays" element={<ProtectedRoute allowedRoles={['student']}><BirthdayCelebration /></ProtectedRoute>} />
            <Route path="/student/events" element={<ProtectedRoute allowedRoles={['student']}><StudentEvents /></ProtectedRoute>} />
            <Route path="/student/calendar" element={<ProtectedRoute allowedRoles={['student']}><SchoolCalendarPage /></ProtectedRoute>} />
            <Route path="/student/special-classes" element={<ProtectedRoute allowedRoles={['student', 'parent']}><StudentSpecialClasses /></ProtectedRoute>} />
            <Route path="/student/class" element={<ProtectedRoute allowedRoles={['student']}><StudentClass /></ProtectedRoute>} />
            <Route path="/student/join-class" element={<ProtectedRoute allowedRoles={['student']}><StudentJoinClass /></ProtectedRoute>} />
            <Route path="/student/homework" element={<ProtectedRoute allowedRoles={['student']}><StudentHomeworkList /></ProtectedRoute>} />
            <Route path="/student/homework/history" element={<ProtectedRoute allowedRoles={['student']}><StudentHomeworkHistory /></ProtectedRoute>} />
            <Route path="/student/homework/:id" element={<ProtectedRoute allowedRoles={['student']}><StudentHomeworkDetails /></ProtectedRoute>} />
            
            <Route path="/student/projects" element={<ProtectedRoute allowedRoles={['student']}><StudentProjects /></ProtectedRoute>} />
            <Route path="/student/projects/:id" element={<ProtectedRoute allowedRoles={['student']}><StudentProjectDetails /></ProtectedRoute>} />
            
            <Route path="/student/tests" element={<ProtectedRoute allowedRoles={['student']}><StudentTests /></ProtectedRoute>} />
            <Route path="/student/tests/:id" element={<ProtectedRoute allowedRoles={['student']}><StudentTestDetails /></ProtectedRoute>} />
            
            <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['student']}><StudentAttendance /></ProtectedRoute>} />
            <Route path="/student/leave/request" element={<ProtectedRoute allowedRoles={['student']}><StudentLeaveRequest /></ProtectedRoute>} />
            <Route path="/student/syllabus/:subjectId" element={<ProtectedRoute allowedRoles={['student']}><StudentSyllabus /></ProtectedRoute>} />
            <Route path="/student/exams" element={<ProtectedRoute allowedRoles={['student']}><StudentExams /></ProtectedRoute>} />

            <Route path="/student/report-card" element={<ProtectedRoute allowedRoles={['student']}><StudentReportCard /></ProtectedRoute>} />
            <Route path="/student/resources" element={<ProtectedRoute allowedRoles={['student']}><StudentResources /></ProtectedRoute>} />
            <Route path="/student/analytics" element={<ProtectedRoute allowedRoles={['student']}><StudentAnalytics /></ProtectedRoute>} />
            <Route path="/student/reports" element={<ProtectedRoute allowedRoles={['student']}><StudentReports /></ProtectedRoute>} />
            <Route path="/student/timetable" element={<ProtectedRoute allowedRoles={['student', 'parent']}><StudentTimetable /></ProtectedRoute>} />
            <Route path="/student/tuition-timetable" element={<ProtectedRoute allowedRoles={['student', 'parent']}><StudentTuitionTimetable /></ProtectedRoute>} />
            <Route path="/student/tuition-attendance" element={<ProtectedRoute allowedRoles={['student', 'parent']}><StudentTuitionAttendance /></ProtectedRoute>} />
            <Route path="/student/tuition-homework" element={<ProtectedRoute allowedRoles={['student', 'parent']}><StudentTuitionHomework /></ProtectedRoute>} />
            <Route path="/student/tuition-tests" element={<ProtectedRoute allowedRoles={['student', 'parent']}><StudentTuitionTests /></ProtectedRoute>} />
            <Route path="/student/tuition-dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentTuitionDashboard /></ProtectedRoute>} />
            <Route path="/student/tuition-fees" element={<ProtectedRoute allowedRoles={['student', 'parent']}><StudentTuitionFees /></ProtectedRoute>} />
            <Route path="/student/todos" element={<ProtectedRoute allowedRoles={['student']}><StudentTodos /></ProtectedRoute>} />
            <Route path="/student/hand-raises" element={<ProtectedRoute allowedRoles={['student']}><HandRaisesPage /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['student']}><Profile /></ProtectedRoute>} />
            <Route path="/student/my-id-card" element={<ProtectedRoute allowedRoles={['student']}><DigitalIDCard /></ProtectedRoute>} />

            <Route path="/parent/dashboard" element={<ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>} />
            <Route path="/parent/tuition-dashboard" element={<ProtectedRoute allowedRoles={['parent']}><ParentTuitionDashboard /></ProtectedRoute>} />
            <Route path="/parent/activities" element={<ProtectedRoute allowedRoles={['parent']}><ParentActivities /></ProtectedRoute>} />
            <Route path="/parent/calendar" element={<ProtectedRoute allowedRoles={['parent']}><SchoolCalendarPage /></ProtectedRoute>} />

            <Route path="/parent/special-classes" element={<ProtectedRoute allowedRoles={['parent']}><StudentSpecialClasses /></ProtectedRoute>} />
            <Route path="/parent/hand-raises" element={<ProtectedRoute allowedRoles={['parent']}><HandRaisesPage /></ProtectedRoute>} />
            <Route path="/parent/reports" element={<ProtectedRoute allowedRoles={['parent']}><ParentReports /></ProtectedRoute>} />
            <Route path="/parent/profile" element={<ProtectedRoute allowedRoles={['parent']}><Profile /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
