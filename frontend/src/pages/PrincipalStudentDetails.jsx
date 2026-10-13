import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  Sparkles, 
  ArrowLeft, 
  User, 
  BookOpen, 
  Calendar, 
  FileText, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  BarChart3, 
  Activity, 
  TrendingUp, 
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  Users,
  Shield,
  Layers,
  Search,
  ChevronRight
} from 'lucide-react';

const CATEGORY_ICONS = {
  quiz: '🧠',
  maths_challenge: '🔢',
  word_scramble: '🔤',
  image_challenge: '🖼️',
  puzzle: '🧩',
  true_false: '✓',
  fill_blank: '📝',
  match_pair: '🔗',
};

const CATEGORY_NAMES = {
  quiz: 'Quiz',
  maths_challenge: 'Maths Challenge',
  word_scramble: 'Word Scramble',
  image_challenge: 'Image Challenge',
  puzzle: 'Puzzle',
  true_false: 'True or False',
  fill_blank: 'Fill in the Blanks',
  match_pair: 'Match the Pair',
};

const PrincipalStudentDetails = () => {
  const { studentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchStudentDetails();
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/principal/students/details/${studentId}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-pulse">
          <div className="h-44 bg-gray-200 dark:bg-slate-800 rounded-3xl"></div>
          <div className="h-12 bg-gray-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-32 bg-gray-200 dark:bg-slate-800 rounded-2xl"></div>
            <div className="h-32 bg-gray-200 dark:bg-slate-800 rounded-2xl"></div>
            <div className="h-32 bg-gray-200 dark:bg-slate-800 rounded-2xl"></div>
            <div className="h-32 bg-gray-200 dark:bg-slate-800 rounded-2xl"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!data || !data.student) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-16 space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Student Record Not Found</h2>
          <p className="text-sm text-gray-500">The requested student details could not be found or you do not have permission to access them.</p>
          <Link to="/principal/students" className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Students Directory
          </Link>
        </div>
      </Layout>
    );
  }

  const { student, class: studentClass, metrics, personalFamilyDetails, attendance, homework, tests, exams, projects, funActivities, performanceAnalytics, recentActivityTimeline } = data;

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'personal', label: '👤 Personal & Family' },
    { id: 'attendance', label: '📅 Attendance' },
    { id: 'homework', label: '📚 Homework' },
    { id: 'tests', label: '📝 Tests' },
    { id: 'exams', label: '🎓 Exams' },
    { id: 'projects', label: '📁 Projects' },
    { id: 'fun_activities', label: '🎯 Fun Activities' },
    { id: 'analytics', label: '📈 Analytics' },
    { id: 'timeline', label: '⚡ Recent Activity' },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between">
          <Link 
            to={studentClass ? `/principal/students/${studentClass.id}` : '/principal/students'} 
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to {studentClass ? `${studentClass.className} Students` : 'Class Directory'}
          </Link>
          <span className="text-xs font-bold text-gray-400">Student ID: {student.studentId}</span>
        </div>

        {/* Header Profile Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left z-10">
            {/* Student Avatar */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-white/20 bg-white/10 flex items-center justify-center text-4xl shrink-0 overflow-hidden shadow-lg backdrop-blur-md">
              {student.profilePic ? (
                <img src={student.profilePic} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-extrabold text-emerald-200">{student.name.charAt(0)}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-bold border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Student Intelligence Profile
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{student.name}</h1>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-300 font-medium">
                <span className="px-2.5 py-1 bg-white/10 rounded-lg backdrop-blur-xs font-bold text-emerald-300">
                  {studentClass ? studentClass.className : 'Unassigned Class'}
                </span>
                <span>• Roll No: <strong>{student.studentId}</strong></span>
                {student.grNumber !== 'N/A' && <span>• GR: <strong>{student.grNumber}</strong></span>}
                {studentClass?.teacherName && <span>• Teacher: <strong>{studentClass.teacherName}</strong></span>}
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-3 shrink-0 z-10 w-full md:w-auto justify-center">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl text-center min-w-[90px]">
              <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Attendance</p>
              <p className="text-2xl font-black text-white">{metrics.attendancePercentage}%</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl text-center min-w-[90px]">
              <p className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Academic</p>
              <p className="text-2xl font-black text-white">{metrics.overallAcademicScore}%</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl text-center min-w-[90px]">
              <p className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">Activities</p>
              <p className="text-2xl font-black text-white">{metrics.activityAverage}%</p>
            </div>
          </div>

          <div className="absolute right-0 top-0 bottom-0 opacity-10 w-1/3 bg-gradient-to-l from-emerald-400 to-transparent pointer-events-none"></div>
        </div>

        {/* Horizontally Scrollable Tab Bar */}
        <div className="bg-white dark:bg-[#0b1120] p-2 rounded-2xl border border-gray-100 dark:border-[#1E293B] shadow-xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENT SECTIONS */}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="bg-white dark:bg-[#0b1120] p-4 rounded-2xl border border-gray-100 dark:border-[#1E293B] shadow-xs text-center space-y-1">
                <p className="text-xs font-bold text-emerald-600 uppercase">Attendance</p>
                <p className="text-2xl font-black text-gray-900 dark:text-slate-100">{metrics.attendancePercentage}%</p>
                <span className="text-[10px] text-gray-400">{attendance.presentCount}/{attendance.totalSessions} Days</span>
              </div>

              <div className="bg-white dark:bg-[#0b1120] p-4 rounded-2xl border border-gray-100 dark:border-[#1E293B] shadow-xs text-center space-y-1">
                <p className="text-xs font-bold text-purple-600 uppercase">Academic</p>
                <p className="text-2xl font-black text-gray-900 dark:text-slate-100">{metrics.overallAcademicScore}%</p>
                <span className="text-[10px] text-gray-400">Combined Rating</span>
              </div>

              <div className="bg-white dark:bg-[#0b1120] p-4 rounded-2xl border border-gray-100 dark:border-[#1E293B] shadow-xs text-center space-y-1">
                <p className="text-xs font-bold text-blue-600 uppercase">Homework</p>
                <p className="text-2xl font-black text-gray-900 dark:text-slate-100">{metrics.homeworkCompletionRate}%</p>
                <span className="text-[10px] text-gray-400">{homework.completedCount}/{homework.totalAssigned} Done</span>
              </div>

              <div className="bg-white dark:bg-[#0b1120] p-4 rounded-2xl border border-gray-100 dark:border-[#1E293B] shadow-xs text-center space-y-1">
                <p className="text-xs font-bold text-indigo-600 uppercase">Test Avg</p>
                <p className="text-2xl font-black text-gray-900 dark:text-slate-100">{metrics.testAverage}%</p>
                <span className="text-[10px] text-gray-400">{tests.totalTests} Tests</span>
              </div>

              <div className="bg-white dark:bg-[#0b1120] p-4 rounded-2xl border border-gray-100 dark:border-[#1E293B] shadow-xs text-center space-y-1">
                <p className="text-xs font-bold text-amber-600 uppercase">Exam Avg</p>
                <p className="text-2xl font-black text-gray-900 dark:text-slate-100">{metrics.examAverage}%</p>
                <span className="text-[10px] text-gray-400">Grade {exams.overallGrade}</span>
              </div>

              <div className="bg-white dark:bg-[#0b1120] p-4 rounded-2xl border border-gray-100 dark:border-[#1E293B] shadow-xs text-center space-y-1">
                <p className="text-xs font-bold text-teal-600 uppercase">Project Avg</p>
                <p className="text-2xl font-black text-gray-900 dark:text-slate-100">{metrics.projectAverage}%</p>
                <span className="text-[10px] text-gray-400">{projects.totalProjects} Projects</span>
              </div>

              <div className="bg-white dark:bg-[#0b1120] p-4 rounded-2xl border border-gray-100 dark:border-[#1E293B] shadow-xs text-center space-y-1">
                <p className="text-xs font-bold text-rose-600 uppercase">Fun Activities</p>
                <p className="text-2xl font-black text-gray-900 dark:text-slate-100">{metrics.activityAverage}%</p>
                <span className="text-[10px] text-gray-400">{funActivities.totalCompleted} Completed</span>
              </div>
            </div>

            {/* Quick Performance Visual Meter Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Academic Progress Meter */}
              <div className="bg-white dark:bg-[#0b1120] p-6 rounded-3xl border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" /> Academic Breakdown Meter
                </h3>

                <div className="space-y-3 text-xs font-bold">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600 dark:text-slate-400">Exams Average ({metrics.examAverage}%)</span>
                      <span className="text-emerald-600">{exams.overallGrade}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${metrics.examAverage}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600 dark:text-slate-400">Class Tests ({metrics.testAverage}%)</span>
                      <span className="text-indigo-600">{tests.gradedTestsCount} Graded</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full" style={{ width: `${metrics.testAverage}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600 dark:text-slate-400">Homework Completion ({metrics.homeworkCompletionRate}%)</span>
                      <span className="text-blue-600">{homework.completedCount} Completed</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full" style={{ width: `${metrics.homeworkCompletionRate}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600 dark:text-slate-400">Projects Performance ({metrics.projectAverage}%)</span>
                      <span className="text-amber-600">{projects.completedProjects} Submitted</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${metrics.projectAverage}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance & Activity Engagement */}
              <div className="bg-white dark:bg-[#0b1120] p-6 rounded-3xl border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-rose-600" /> Attendance & Engagement
                </h3>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/50">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Days Present</p>
                    <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100">{attendance.presentCount}</p>
                  </div>

                  <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/50">
                    <p className="text-xs font-bold text-rose-700 dark:text-rose-300">Days Absent</p>
                    <p className="text-2xl font-black text-rose-900 dark:text-rose-100">{attendance.absentCount}</p>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/50">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300">Activities Done</p>
                    <p className="text-2xl font-black text-blue-900 dark:text-blue-100">{funActivities.totalCompleted}</p>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Pending Activities</p>
                    <p className="text-2xl font-black text-amber-900 dark:text-amber-100">{funActivities.pendingCount}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: PERSONAL & FAMILY DETAILS */}
        {activeTab === 'personal' && (
          <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-6">
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-slate-100 flex items-center gap-2 border-b border-gray-100 dark:border-[#1E293B] pb-4">
              <User className="w-5 h-5 text-emerald-600" /> Student Personal & Family Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              
              {/* Personal Block */}
              <div className="space-y-3 p-5 bg-gray-50 dark:bg-[#172235] rounded-2xl border border-gray-200 dark:border-[#334155]">
                <h4 className="font-extrabold text-emerald-700 dark:text-emerald-400 text-xs uppercase tracking-wider">Student Profile Details</h4>

                <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-gray-500 font-medium">Full Name:</span>
                  <span className="font-bold text-gray-900 dark:text-slate-100">{personalFamilyDetails.name}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-gray-500 font-medium">Roll / Student ID:</span>
                  <span className="font-bold text-gray-900 dark:text-slate-100">{personalFamilyDetails.rollNumber}</span>
                </div>

                {personalFamilyDetails.grNumber !== 'N/A' && (
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-800">
                    <span className="text-gray-500 font-medium">GR Number:</span>
                    <span className="font-bold text-gray-900 dark:text-slate-100">{personalFamilyDetails.grNumber}</span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-gray-500 font-medium">Class & Section:</span>
                  <span className="font-bold text-indigo-600">{personalFamilyDetails.classSection}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-gray-500 font-medium">Gender:</span>
                  <span className="font-bold text-gray-900 dark:text-slate-100">{personalFamilyDetails.gender}</span>
                </div>

                {personalFamilyDetails.dateOfBirth && (
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-800">
                    <span className="text-gray-500 font-medium">Date of Birth:</span>
                    <span className="font-bold text-gray-900 dark:text-slate-100">{new Date(personalFamilyDetails.dateOfBirth).toLocaleDateString()}</span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-gray-500 font-medium">Blood Group:</span>
                  <span className="font-bold text-rose-600">{personalFamilyDetails.bloodGroup}</span>
                </div>
              </div>

              {/* Family & Contact Block */}
              <div className="space-y-3 p-5 bg-gray-50 dark:bg-[#172235] rounded-2xl border border-gray-200 dark:border-[#334155]">
                <h4 className="font-extrabold text-blue-700 dark:text-blue-400 text-xs uppercase tracking-wider">Family & Contact Info</h4>

                <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-gray-500 font-medium">Parent / Guardian:</span>
                  <span className="font-bold text-gray-900 dark:text-slate-100">
                    {personalFamilyDetails?.parentName && personalFamilyDetails.parentName !== 'Not Linked' ? personalFamilyDetails.parentName : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-gray-500 font-medium">Parent Contact Phone:</span>
                  <span className="font-bold text-purple-600">
                    {personalFamilyDetails?.parentPhone ? personalFamilyDetails.parentPhone : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-gray-500 font-medium">Emergency Contact:</span>
                  <span className="font-bold text-emerald-600">
                    {personalFamilyDetails?.emergencyContact ? personalFamilyDetails.emergencyContact : 'N/A'}
                  </span>
                </div>

                <div className="py-1">
                  <span className="text-gray-500 font-medium block mb-1">Residential Address:</span>
                  <p className="font-medium text-gray-800 dark:text-slate-200 bg-white dark:bg-[#0b1120] p-3 rounded-xl border border-gray-200 dark:border-[#334155]">
                    {personalFamilyDetails?.address && personalFamilyDetails.address !== 'Address not registered' ? personalFamilyDetails.address : 'N/A'}
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: ATTENDANCE */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-4">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" /> Attendance Overview & Session Logs
              </h3>

              {/* Attendance Session Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-center">
                  <p className="text-xs font-bold text-emerald-600 uppercase">Present</p>
                  <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100">{attendance.presentCount} Days</p>
                </div>

                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl text-center">
                  <p className="text-xs font-bold text-rose-600 uppercase">Absent</p>
                  <p className="text-2xl font-black text-rose-900 dark:text-rose-100">{attendance.absentCount} Days</p>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl text-center">
                  <p className="text-xs font-bold text-amber-600 uppercase">Approved Leaves</p>
                  <p className="text-2xl font-black text-amber-900 dark:text-amber-100">{attendance.leaveCount} Days</p>
                </div>

                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl text-center">
                  <p className="text-xs font-bold text-indigo-600 uppercase">Attendance Rate</p>
                  <p className="text-2xl font-black text-indigo-900 dark:text-indigo-200 mt-1">
                    {metrics.attendancePercentage}%
                  </p>
                </div>
              </div>

              {/* Monthly Attendance Table */}
              {attendance.monthlyAttendance.length > 0 && (
                <div className="pt-4 space-y-3">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200">Monthly Attendance Summary</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {attendance.monthlyAttendance.map((m, i) => (
                      <div key={i} className="p-3 bg-gray-50 dark:bg-[#172235] rounded-xl border text-xs font-bold flex justify-between items-center">
                        <span>{m.month}</span>
                        <span className="text-emerald-600">{m.present}/{m.total} ({m.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Attendance Logs */}
            <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-4">
              <h4 className="text-base font-extrabold text-gray-900 dark:text-slate-100">Date-wise Attendance Log</h4>
              {attendance.recentRecords.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center">No attendance records marked yet.</p>
              ) : (
                <div className="overflow-x-auto border border-gray-100 dark:border-[#1E293B] rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-[#172235] font-bold uppercase text-gray-600 dark:text-slate-300">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-[#1E293B] font-medium">
                      {attendance.recentRecords.map((r) => (
                        <tr key={r._id}>
                          <td className="p-3 font-semibold">{new Date(r.date).toLocaleDateString()}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              r.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: HOMEWORK */}
        {activeTab === 'homework' && (
          <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1E293B] pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" /> Homework Performance
                </h3>
                <p className="text-xs text-gray-500">Track assigned, completed and pending homework tasks.</p>
              </div>

              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
                Completion: {homework.completionRate}%
              </span>
            </div>

            {homework.homeworkList.length === 0 ? (
              <p className="text-xs text-gray-500 py-8 text-center">No homework tasks assigned yet.</p>
            ) : (
              <div className="overflow-x-auto border border-gray-100 dark:border-[#1E293B] rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-[#172235] font-bold uppercase text-gray-600 dark:text-slate-300">
                    <tr>
                      <th className="p-3">Title</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Marks</th>
                      <th className="p-3">Feedback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#1E293B] font-medium">
                    {homework.homeworkList.map((hw, i) => (
                      <tr key={i}>
                        <td className="p-3 font-semibold">{hw.title}</td>
                        <td className="p-3 text-indigo-600 font-bold">{hw.subject}</td>
                        <td className="p-3">{new Date(hw.dueDate).toLocaleDateString()}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            hw.status === 'completed' || hw.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : hw.status === 'late_unsubmitted'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {hw.status}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold">
                          {hw.marksObtained !== null ? `${hw.marksObtained} / ${hw.maxMarks}` : '-'}
                        </td>
                        <td className="p-3 text-gray-500 italic">{hw.feedback || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: TESTS */}
        {activeTab === 'tests' && (
          <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1E293B] pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" /> Class Tests Performance
                </h3>
                <p className="text-xs text-gray-500">Test scores and subject percentage ratings.</p>
              </div>

              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-200">
                Test Avg: {tests.testAverage}%
              </span>
            </div>

            {tests.testList.length === 0 ? (
              <p className="text-xs text-gray-500 py-8 text-center">No test records available.</p>
            ) : (
              <div className="overflow-x-auto border border-gray-100 dark:border-[#1E293B] rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-[#172235] font-bold uppercase text-gray-600 dark:text-slate-300">
                    <tr>
                      <th className="p-3">Test Title</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-center">Score</th>
                      <th className="p-3 text-center">Percentage</th>
                      <th className="p-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#1E293B] font-medium">
                    {tests.testList.map((t, i) => (
                      <tr key={i}>
                        <td className="p-3 font-semibold">{t.title}</td>
                        <td className="p-3 text-indigo-600 font-bold">{t.subject}</td>
                        <td className="p-3">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="p-3 text-center font-bold">
                          {t.marksObtained !== null ? `${t.marksObtained} / ${t.maxMarks}` : '-'}
                        </td>
                        <td className="p-3 text-center font-extrabold text-emerald-600">
                          {t.percentage !== null ? `${t.percentage}%` : '-'}
                        </td>
                        <td className="p-3 text-gray-500 italic">{t.feedback || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: EXAMS */}
        {activeTab === 'exams' && (
          <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1E293B] pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" /> Examination Marks & Grades
                </h3>
                <p className="text-xs text-gray-500">Official term examination results and overall grade.</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                  Exam Avg: {exams.examAverage}%
                </span>
                <span className="text-xs font-extrabold text-white bg-amber-600 px-3 py-1.5 rounded-full">
                  Grade {exams.overallGrade}
                </span>
              </div>
            </div>

            {exams.examList.length === 0 ? (
              <p className="text-xs text-gray-500 py-8 text-center">No published exam results found.</p>
            ) : (
              <div className="overflow-x-auto border border-gray-100 dark:border-[#1E293B] rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-[#172235] font-bold uppercase text-gray-600 dark:text-slate-300">
                    <tr>
                      <th className="p-3">Exam Name</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3 text-center">Marks</th>
                      <th className="p-3 text-center">Percentage</th>
                      <th className="p-3 text-center">Grade</th>
                      <th className="p-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#1E293B] font-medium">
                    {exams.examList.map((em, i) => (
                      <tr key={i}>
                        <td className="p-3 font-semibold">{em.examName}</td>
                        <td className="p-3 text-emerald-600 font-bold">{em.subject}</td>
                        <td className="p-3 text-center font-bold">
                          {em.isAbsent ? <span className="text-red-500">Absent</span> : `${em.marksObtained} / ${em.maxMarks}`}
                        </td>
                        <td className="p-3 text-center font-extrabold text-indigo-600">{em.percentage}%</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-extrabold rounded">
                            {em.grade}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500 italic">{em.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1E293B] pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-teal-600" /> Academic Projects
                </h3>
                <p className="text-xs text-gray-500">Status and marks for assigned student projects.</p>
              </div>

              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200">
                Project Rating: {projects.projectAverage}%
              </span>
            </div>

            {projects.projectList.length === 0 ? (
              <p className="text-xs text-gray-500 py-8 text-center">No projects assigned yet.</p>
            ) : (
              <div className="overflow-x-auto border border-gray-100 dark:border-[#1E293B] rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-[#172235] font-bold uppercase text-gray-600 dark:text-slate-300">
                    <tr>
                      <th className="p-3">Project Title</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Marks</th>
                      <th className="p-3">Feedback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#1E293B] font-medium">
                    {projects.projectList.map((p, i) => (
                      <tr key={i}>
                        <td className="p-3 font-semibold">{p.title}</td>
                        <td className="p-3 text-teal-600 font-bold">{p.subject}</td>
                        <td className="p-3">{new Date(p.dueDate).toLocaleDateString()}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold">
                          {p.marksObtained !== null ? `${p.marksObtained} / ${p.maxMarks}` : '-'}
                        </td>
                        <td className="p-3 text-gray-500 italic">{p.feedback || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: FUN ACTIVITIES */}
        {activeTab === 'fun_activities' && (
          <div className="space-y-6">
            {/* Category Performance Breakdown */}
            <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-600" /> 8 Category Performance Breakdown
                </h3>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200">
                  Overall Score: {funActivities.activityAverage}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {funActivities.categoryPerformance.map((cat) => (
                  <div key={cat.category} className="p-3.5 bg-gray-50 dark:bg-[#172235] rounded-2xl border text-center space-y-1">
                    <p className="text-xl">{CATEGORY_ICONS[cat.category]}</p>
                    <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{CATEGORY_NAMES[cat.category]}</p>
                    <p className="text-lg font-black text-rose-600">{cat.averagePercentage}%</p>
                    <p className="text-[10px] text-gray-400 font-medium">{cat.completed} Completed</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Attempts History */}
            <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-4">
              <h4 className="text-base font-extrabold text-gray-900 dark:text-slate-100">Activity Attempts Log</h4>
              {funActivities.recentAttempts.length === 0 ? (
                <p className="text-xs text-gray-500 py-6 text-center">No fun activity submissions recorded yet.</p>
              ) : (
                <div className="overflow-x-auto border border-gray-100 dark:border-[#1E293B] rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-[#172235] font-bold uppercase text-gray-600 dark:text-slate-300">
                      <tr>
                        <th className="p-3">Activity</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Subject</th>
                        <th className="p-3 text-center">Score</th>
                        <th className="p-3 text-center">Percentage</th>
                        <th className="p-3">Submitted At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-[#1E293B] font-medium">
                      {funActivities.recentAttempts.map((attempt) => (
                        <tr key={attempt.submissionId}>
                          <td className="p-3 font-semibold">{attempt.title}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded">
                              {CATEGORY_ICONS[attempt.activityType]} {CATEGORY_NAMES[attempt.activityType]}
                            </span>
                          </td>
                          <td className="p-3 text-indigo-600 font-bold">{attempt.subject}</td>
                          <td className="p-3 text-center font-bold">{attempt.score} / {attempt.totalMarks}</td>
                          <td className="p-3 text-center font-extrabold text-emerald-600">{attempt.percentage}%</td>
                          <td className="p-3">{new Date(attempt.submittedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 9: PERFORMANCE ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-6">
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-slate-100 flex items-center gap-2 border-b border-gray-100 dark:border-[#1E293B] pb-4">
              <TrendingUp className="w-5 h-5 text-emerald-600" /> Student Performance Dashboard
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-gray-50 dark:bg-[#172235] rounded-3xl border space-y-4">
                <h4 className="text-sm font-extrabold text-gray-800 dark:text-slate-200">Academic Component Comparison</h4>
                <div className="space-y-4 text-xs font-bold">
                  {performanceAnalytics.academicTrend.map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-slate-400">{item.component}</span>
                        <span className="text-emerald-600 font-black">{item.score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full" 
                          style={{ width: `${item.score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-[#172235] rounded-3xl border space-y-4 flex flex-col justify-between">
                <h4 className="text-sm font-extrabold text-gray-800 dark:text-slate-200">Overall Academic Health Rating</h4>
                
                <div className="text-center py-6 space-y-2">
                  <div className="w-28 h-28 rounded-full border-8 border-emerald-500 bg-white dark:bg-[#0b1120] text-emerald-600 flex items-center justify-center text-3xl font-black mx-auto shadow-inner">
                    {metrics.overallAcademicScore}%
                  </div>
                  <p className="text-sm font-extrabold text-gray-800 dark:text-slate-200">Overall Performance Score</p>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Calculated across all attendance, homework, class tests, term exams, projects and fun activities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: RECENT ACTIVITY TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-6">
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-slate-100 flex items-center gap-2 border-b border-gray-100 dark:border-[#1E293B] pb-4">
              <Clock className="w-5 h-5 text-indigo-600" /> Chronological Student Activity Log
            </h3>

            {recentActivityTimeline.length === 0 ? (
              <p className="text-xs text-gray-500 py-8 text-center">No recent activity events recorded.</p>
            ) : (
              <div className="relative border-l-2 border-emerald-200 dark:border-emerald-900/60 ml-4 space-y-6 py-2">
                {recentActivityTimeline.map((item) => (
                  <div key={item.id} className="ml-6 relative">
                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-600 border-4 border-white dark:border-[#0b1120]"></div>
                    <div className="bg-gray-50 dark:bg-[#172235] p-4 rounded-2xl border border-gray-200 dark:border-[#334155] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-gray-900 dark:text-slate-100">{item.title}</span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${item.badgeColor}`}>
                          {item.badgeText}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{item.subtitle}</p>
                      <p className="text-[10px] text-gray-400 pt-1">{new Date(item.date).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


      </div>
    </Layout>
  );
};

export default PrincipalStudentDetails;
