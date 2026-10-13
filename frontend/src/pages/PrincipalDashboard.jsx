import React, { useContext, useState, useEffect, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import TotalAttendanceReport from '../components/dashboard/TotalAttendanceReport';
import toast from 'react-hot-toast';
import { AlertCircle, ArrowRight, Contact } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock trend data for sparklines
const upTrend = [{ value: 10 }, { value: 25 }, { value: 45 }, { value: 30 }, { value: 60 }, { value: 75 }, { value: 95 }];
const stableTrend = [{ value: 50 }, { value: 52 }, { value: 49 }, { value: 55 }, { value: 50 }, { value: 58 }, { value: 60 }];
const volatileTrend = [{ value: 20 }, { value: 80 }, { value: 40 }, { value: 90 }, { value: 50 }, { value: 85 }, { value: 70 }];

const StatCard = ({ icon, bgIconClass, borderClass, value, label, trendData, strokeColor }) => (
  <div className={`bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl border border-white/40 dark:border-slate-700 p-5 rounded-2xl shadow-soft flex flex-col items-center justify-center text-center gap-2 border-b-4 ${borderClass} hover:-translate-y-1 transition duration-300 relative overflow-hidden group`}>
    <div className={`w-12 h-12 ${bgIconClass} rounded-full flex items-center justify-center font-bold text-xl relative z-10 group-hover:scale-110 transition-transform`}>{icon}</div>
    <div className="relative z-10">
      <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
      <p className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mt-1">{label}</p>
    </div>
    {trendData && (
      <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30 pointer-events-none translate-y-2 group-hover:translate-y-0 group-hover:opacity-50 transition-all duration-500">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <Line type="monotone" dataKey="value" stroke={strokeColor} strokeWidth={3} dot={false} isAnimationActive={true} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

const PrincipalDashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [stats, setStats] = useState({ standards: 0, sections: 0, teachers: 0, assignments: 0 });
  const [teacherRequests, setTeacherRequests] = useState([]);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);

  const [schoolNameInput, setSchoolNameInput] = useState('');
  const [savingSchoolName, setSavingSchoolName] = useState(false);

  // Tuition specific state
  const [tuitionData, setTuitionData] = useState({ batches: [], sessions: [], fees: [] });
  const [tuitionLoading, setTuitionLoading] = useState(true);

  // New states for Tuition Attendance block
  const [selectedTuitionBatch, setSelectedTuitionBatch] = useState('all');
  const [selectedTuitionSession, setSelectedTuitionSession] = useState('');
  const [selectedTuitionDate, setSelectedTuitionDate] = useState(new Date().toISOString().split('T')[0]);
  const [tuitionAttendanceData, setTuitionAttendanceData] = useState([]);
  const [tuitionAttendanceLoading, setTuitionAttendanceLoading] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard/principal');
        setDashboardData(res.data.data);
        
        const [stdsRes, asgRes, usersRes, reqRes, reportsRes, schoolNameRes, sessionRes, feesRes, batchesRes] = await Promise.all([
          api.get('/standards'),
          api.get('/teacher-assignments'),
          api.get('/users/active-teachers'),
          api.get('/users/pending-teachers'),
          api.get('/reports'),
          api.get('/id-card/school-name').catch(() => ({ data: { schoolName: 'StudyMate School' } })),
          api.get('/tuition-sessions').catch(() => ({ data: { data: [] } })),
          api.get('/tuition-fees').catch(() => ({ data: { data: [] } })),
          api.get('/batches').catch(() => ({ data: [] }))
        ]);
        
        setStats({
          standards: stdsRes.data.data.length,
          sections: 0,
          teachers: usersRes.data.data.length,
          assignments: asgRes.data.data.length
        });

        setTeacherAssignments(asgRes.data.data.slice(0, 5));
        setTeacherRequests(reqRes.data.data ? reqRes.data.data.slice(0, 5) : []);

        if (schoolNameRes.data?.schoolName) {
          setSchoolNameInput(schoolNameRes.data.schoolName);
        }
        
        if (reportsRes?.data?.data) {
          const unresolved = reportsRes.data.data.filter(r => r.status !== 'CLOSED' && r.status !== 'RESOLVED');
          unresolved.sort((a, b) => {
            const p = { "Urgent": 3, "High": 2, "Normal": 1 };
            return (p[b.priority] || 0) - (p[a.priority] || 0);
          });
          setPendingReports(unresolved.slice(0, 4));
        }

        // Use /batches API directly — no longer derived from sections
        const allBatches = Array.isArray(batchesRes.data) ? batchesRes.data : (batchesRes.data?.data || []);

        setTuitionData({
          batches: allBatches,
          sessions: sessionRes.data?.data || [],
          fees: feesRes.data?.data || feesRes.data || []
        });
      } catch (err) {
        console.error(err);
      } finally {
        setTuitionLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // Set default batch when data loads
  useEffect(() => {
    if (tuitionData.batches.length > 0 && !selectedTuitionBatch) {
      setSelectedTuitionBatch('all');
    }
  }, [tuitionData.batches, selectedTuitionBatch]);

  // Fetch tuition attendance when batch, session, or date changes
  useEffect(() => {
    const fetchTuitionAttendance = async () => {
      try {
        setTuitionAttendanceLoading(true);
        let url = `/tuition-attendance?date=${selectedTuitionDate}`;
        if (selectedTuitionBatch && selectedTuitionBatch !== 'all') {
          url += `&batchId=${selectedTuitionBatch}`;
        }
        if (selectedTuitionSession) {
          url += `&sessionId=${selectedTuitionSession}`;
        }
        const res = await api.get(url);
        setTuitionAttendanceData(res.data?.data || []);
      } catch (err) {
        console.error("Failed to load tuition attendance", err);
      } finally {
        setTuitionAttendanceLoading(false);
      }
    };
    fetchTuitionAttendance();
  }, [selectedTuitionBatch, selectedTuitionSession, selectedTuitionDate]);

  const handleSetSchoolName = async (e) => {
    e.preventDefault();
    if (!schoolNameInput.trim()) {
      return toast.error("Please enter a valid school name");
    }

    try {
      setSavingSchoolName(true);
      const res = await api.put('/id-card/school-name', { schoolName: schoolNameInput.trim() });
      if (res.data?.success) {
        toast.success("School Name updated on all ID Cards! 🪪");
        setSchoolNameInput(res.data.schoolName);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update School Name");
    } finally {
      setSavingSchoolName(false);
    }
  };

  const totalBatches = tuitionData.batches.length;
  const uniqueTuitionStudents = new Set();
  tuitionData.batches.forEach(b => {
    (b.students || []).forEach(s => {
      const id = (s._id || s)?.toString();
      if (id) uniqueTuitionStudents.add(id);
    });
  });
  const totalTuitionStudents = uniqueTuitionStudents.size > 0 
    ? uniqueTuitionStudents.size 
    : (dashboardData?.totalStudents || 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysSessions = tuitionData.sessions.filter(s => s.dayOfWeek === new Date().toLocaleDateString('en-US', { weekday: 'long' }) || s.sessionDate?.startsWith(todayStr));

  const totalFees = tuitionData.fees.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalCollected = tuitionData.fees.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  const pendingFees = totalFees - totalCollected;

  // Tuition Attendance Calcs
  const isAllBatches = !selectedTuitionBatch || selectedTuitionBatch === 'all';
  const activeBatch = isAllBatches ? null : tuitionData.batches.find(b => b._id === selectedTuitionBatch);

  // Collect students according to selected batch or all batches
  const displayedStudents = useMemo(() => {
    if (isAllBatches) {
      const studentMap = new Map();
      tuitionData.batches.forEach(b => {
        const batchTitle = b.name ? `${b.name}` : (b.batchName || 'Tuition Batch');
        (b.students || []).forEach(s => {
          const id = (s._id || s)?.toString();
          if (id && !studentMap.has(id)) {
            studentMap.set(id, {
              ...(typeof s === 'object' ? s : { _id: s }),
              batchName: batchTitle,
              batchId: b._id
            });
          }
        });
      });
      return Array.from(studentMap.values());
    } else {
      const batchTitle = activeBatch?.name ? `${activeBatch.name}` : (activeBatch?.batchName || 'Tuition Batch');
      return (activeBatch?.students || []).map(s => ({
        ...(typeof s === 'object' ? s : { _id: s }),
        batchName: batchTitle,
        batchId: activeBatch?._id
      }));
    }
  }, [isAllBatches, tuitionData.batches, activeBatch]);

  const totalDisplayStudents = displayedStudents.length;
  const displayedStudentIds = useMemo(() => new Set(displayedStudents.map(s => (s._id || s)?.toString())), [displayedStudents]);

  // Attendance records for current view
  const relevantAttendance = useMemo(() => {
    return tuitionAttendanceData.filter(a => {
      const sId = (a.studentId?._id || a.studentId)?.toString();
      return displayedStudentIds.has(sId);
    });
  }, [tuitionAttendanceData, displayedStudentIds]);

  const { presentCount, absentCount, leaveCount } = useMemo(() => {
    const studentStatusMap = new Map();
    relevantAttendance.forEach(a => {
      const sId = (a.studentId?._id || a.studentId)?.toString();
      if (sId) {
        if (!studentStatusMap.has(sId) || a.status === 'present') {
          studentStatusMap.set(sId, a.status);
        }
      }
    });
    let p = 0, ab = 0, l = 0;
    studentStatusMap.forEach(st => {
      if (st === 'present') p++;
      else if (st === 'absent') ab++;
      else if (st === 'leave') l++;
    });
    return { presentCount: p, absentCount: ab, leaveCount: l };
  }, [relevantAttendance]);
  
  const attendanceRate = totalDisplayStudents > 0 
    ? Math.round((presentCount / totalDisplayStudents) * 100) 
    : 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-8 flex justify-between items-center relative overflow-hidden">
          <div className="z-10 relative">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-emerald-100 mb-2">Good Morning, {currentUser?.name}! 👋</h1>
            <p className="text-gray-600 dark:text-emerald-200/80 max-w-md">Manage your school efficiently and build a brighter future for every student.</p>
          </div>
          <div className="absolute right-0 bottom-0 top-0 opacity-20 w-1/3 bg-gradient-to-l from-green-500 to-transparent"></div>
        </div>


        {/* Tuition Overview Grid */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Tuition Operations Overview</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">View real-time tuition statistics and financials.</p>
          </div>
        </div>

        {tuitionLoading ? (
           <div className="p-4 text-center text-sm text-gray-500">Loading tuition stats...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard icon="👥" bgIconClass="bg-blue-100 text-blue-600" borderClass="border-blue-500" trendData={upTrend} strokeColor="#3b82f6" value={totalTuitionStudents} label="Tuition Students" />
            {/* <StatCard icon="📚" bgIconClass="bg-purple-100 text-purple-600" borderClass="border-purple-500" trendData={stableTrend} strokeColor="#a855f7" value={totalBatches} label="Total Batches" /> */}
            {/* <StatCard icon="📅" bgIconClass="bg-orange-100 text-orange-600" borderClass="border-orange-500" trendData={volatileTrend} strokeColor="#f97316" value={todaysSessions.length} label="Today's Sessions" /> */}
            <StatCard icon="₹" bgIconClass="bg-green-100 text-green-600" borderClass="border-green-500" trendData={upTrend} strokeColor="#22c55e" value={`₹${totalCollected}`} label="Fee Collected" />
            <StatCard icon="⚠️" bgIconClass="bg-red-100 text-red-600" borderClass="border-red-500" trendData={stableTrend} strokeColor="#ef4444" value={`₹${pendingFees}`} label="Pending Fees" />
          </div>
        )}

        {/* Daily Tuition Attendance */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 mt-8">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Daily Tuition Attendance</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">View real-time tuition attendance by batch or overall.</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <select
              value={selectedTuitionBatch}
              onChange={(e) => {
                setSelectedTuitionBatch(e.target.value);
                setSelectedTuitionSession('');
              }}
              className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              <option value="all">🌟 All Students (Overall)</option>
              {tuitionData.batches.map(b => (
                <option key={b._id} value={b._id}>{b.name ? `${b.name}` : b.batchName || 'Unknown Batch'}</option>
              ))}
            </select>
            
            {!isAllBatches && selectedTuitionBatch && tuitionData.sessions.some(s => s.batchId === selectedTuitionBatch || s.batchId?._id === selectedTuitionBatch) && (
              <select
                value={selectedTuitionSession}
                onChange={(e) => setSelectedTuitionSession(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="">All Sessions</option>
                {tuitionData.sessions
                  .filter(s => s.batchId === selectedTuitionBatch || s.batchId?._id === selectedTuitionBatch)
                  .map(s => (
                    <option key={s._id} value={s._id}>{s.subject || 'Session'} — {s.startTime} - {s.endTime}</option>
                ))}
              </select>
            )}

            <input
              type="date"
              value={selectedTuitionDate}
              onChange={(e) => setSelectedTuitionDate(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </div>

        {tuitionData.batches.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 bg-white/50 rounded-2xl">
            No tuition batches available. Create a batch first.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard icon="🎓" bgIconClass="bg-blue-100 text-blue-600" borderClass="border-blue-500" value={totalDisplayStudents} label={isAllBatches ? "Overall Students" : "Total Students"} />
              <StatCard icon="✅" bgIconClass="bg-green-100 text-green-600" borderClass="border-green-500" value={presentCount} label={isAllBatches ? "Total Present" : "Present"} />
              <StatCard icon="❌" bgIconClass="bg-red-100 text-red-600" borderClass="border-red-500" value={absentCount} label={isAllBatches ? "Total Absent" : "Absent"} />
              <StatCard icon="🛌" bgIconClass="bg-amber-100 text-amber-600" borderClass="border-amber-500" value={leaveCount} label={isAllBatches ? "Total On Leave" : "On Leave"} />
              <StatCard icon="📊" bgIconClass="bg-indigo-100 text-indigo-600" borderClass="border-indigo-500" value={`${attendanceRate}%`} label={isAllBatches ? "Overall Attendance" : "Attendance Rate"} />
            </div>

            {/* Attendance Table */}
            <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl border border-white/40 dark:border-slate-700 rounded-2xl shadow-soft p-6 overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  {isAllBatches ? "Student Attendance Details (Overall Students)" : `Student Attendance Details — ${activeBatch?.name || activeBatch?.batchName || ''}`}
                </h2>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {isAllBatches ? "🌟 All Batches (Overall)" : (activeBatch?.name || activeBatch?.batchName)}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-slate-700">
                      <th className="pb-3 font-medium px-4">Student Name</th>
                      <th className="pb-3 font-medium px-4">Student ID</th>
                      <th className="pb-3 font-medium px-4">Batch</th>
                      <th className="pb-3 font-medium px-4">Status</th>
                      <th className="pb-3 font-medium px-4">Marked By</th>
                      <th className="pb-3 font-medium px-4">Session / Class Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedStudents.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-gray-500">
                          {isAllBatches ? "No students found across any tuition batches." : "No students enrolled in this batch."}
                        </td>
                      </tr>
                    ) : tuitionAttendanceLoading ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-gray-500">Loading attendance data...</td>
                      </tr>
                    ) : (
                      displayedStudents.map(student => {
                        const sId = (student._id || student)?.toString();
                        const record = tuitionAttendanceData.find(a => {
                          const aStudentId = (a.studentId?._id || a.studentId)?.toString();
                          return aStudentId === sId;
                        });
                        const status = record?.status || 'not_marked';
                        
                        let statusUI = <span className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-medium text-xs">Not Marked</span>;
                        if (status === 'present') statusUI = <span className="px-2.5 py-1 rounded-md bg-green-100 text-green-700 font-semibold text-xs inline-flex items-center gap-1">✓ Present</span>;
                        if (status === 'absent') statusUI = <span className="px-2.5 py-1 rounded-md bg-red-100 text-red-700 font-semibold text-xs inline-flex items-center gap-1">✕ Absent</span>;
                        if (status === 'leave') statusUI = <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 font-semibold text-xs inline-flex items-center gap-1">⏱ Leave</span>;

                        const sessionTime = record?.sessionId 
                          ? (typeof record.sessionId === 'object' && record.sessionId.startTime 
                              ? `${record.sessionId.startTime} - ${record.sessionId.endTime}` 
                              : 'Recorded')
                          : '—';

                        return (
                          <tr key={sId} className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition">
                            <td className="py-3 px-4 font-semibold text-gray-800 dark:text-white">{student.name || 'Unnamed Student'}</td>
                            <td className="py-3 px-4 text-gray-500 text-xs font-mono">{student.studentId || student.rollNumber || (sId ? sId.substring(0, 8) : '—')}</td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                                {student.batchName || record?.batchId?.name || record?.batchId?.batchName || 'Tuition'}
                              </span>
                            </td>
                            <td className="py-3 px-4">{statusUI}</td>
                            <td className="py-3 px-4 text-gray-500 text-xs">{record?.markedBy?.name || '—'}</td>
                            <td className="py-3 px-4 text-gray-500 text-xs">{sessionTime}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}


        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            <TotalAttendanceReport />

            {/* Analytics Charts */}
            {dashboardData?.monthlyAttendance?.length > 0 && dashboardData?.homeworkCompletion?.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly Attendance Trends */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-soft p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Monthly Attendance Trends</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dashboardData.monthlyAttendance} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        <Line type="monotone" dataKey="present" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Present (%)" />
                        <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} name="Absent (%)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Homework Completion Rates */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-soft p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Homework Completion</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.homeworkCompletion} margin={{ top: 5, right: 20, bottom: 5, left: -20 }} barSize={32}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="standard" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                        <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="completionRate" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Completion Rate (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Teacher Assignments */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-soft p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">Teacher Assignments</h2>
                <Link to="/principal/assignments" className="text-primary text-sm font-semibold">View All →</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-100">
                      <th className="pb-3 font-medium">Teacher</th>
                      <th className="pb-3 font-medium">Class & Section</th>
                      <th className="pb-3 font-medium">Subject</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherAssignments.length > 0 ? teacherAssignments.map(asg => (
                      <tr key={asg._id} className="border-b border-gray-50 last:border-0">
                        <td className="py-3 font-medium text-gray-800">{asg.teacherId?.name || 'Unknown'}</td>
                        <td className="py-3 text-gray-500">{asg.standardId?.name} - {asg.sectionId?.name}</td>
                        <td className="py-3 text-gray-500">{asg.subject || 'General'}</td>
                        <td className="py-3"><span className="px-2 py-1 bg-green-50 text-green-600 rounded-md text-xs font-semibold">Assigned</span></td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" className="py-4 text-center text-gray-500">No assignments found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>

          <div className="space-y-6">
            {/* Action Center */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-soft p-6">
               <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  Action Center
               </h2>
               <div className="flex flex-col gap-3">
                 <Link to="/principal/teachers?tab=pending" className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-blue-50 hover:border-blue-100 border border-transparent transition group">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">👥</div>
                     <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition">Teacher Registrations</span>
                   </div>
                   {teacherRequests.length > 0 ? (
                     <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-md">{teacherRequests.length} Pending</span>
                   ) : (
                     <span className="text-gray-400 text-xs">All cleared</span>
                   )}
                 </Link>

                 <Link to="/principal/leave-requests" className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-purple-50 hover:border-purple-100 border border-transparent transition group">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">📅</div>
                     <span className="text-sm font-semibold text-gray-700 group-hover:text-purple-700 transition">Leave Requests</span>
                   </div>
                   <span className="text-gray-400 text-xs">All cleared</span>
                 </Link>

                 <Link to="/principal/exams" className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 hover:border-emerald-100 border border-transparent transition group">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">📝</div>
                     <span className="text-sm font-semibold text-gray-700 group-hover:text-emerald-700 transition">Exam Approvals</span>
                   </div>
                   <span className="text-gray-400 text-xs">All cleared</span>
                 </Link>
               </div>
            </div>

            {/* Unresolved Reports Widget */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-soft p-6">
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-500 animate-pulse" />
                    Needs Attention
                 </h2>
                 <Link to="/principal/reports" className="text-primary text-sm font-semibold flex items-center gap-1">
                    View All <ArrowRight className="w-4 h-4" />
                 </Link>
               </div>
               <div className="space-y-3">
                  {pendingReports.length > 0 ? pendingReports.map((report) => (
                    <div key={report._id} className="p-3 bg-orange-50 border border-orange-100 rounded-xl hover:shadow-sm transition">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-orange-700 bg-orange-200 px-2 py-0.5 rounded-md">
                          {report.priority}
                        </span>
                        <span className="text-[10px] text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">{report.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">From: {report.reporterId?.name} ({report.reporterRole})</p>
                      <Link to="/principal/reports" className="mt-2 text-xs font-bold text-blue-600 block hover:underline">
                        Resolve Now →
                      </Link>
                    </div>
                  )) : (
                    <div className="p-4 bg-green-50 rounded-xl text-center border border-green-100">
                      <p className="text-green-700 font-semibold text-sm">All caught up! 🎉</p>
                      <p className="text-green-600 text-xs mt-1">No pending reports.</p>
                    </div>
                  )}
               </div>
            </div>

            {/* ID Card School Name Setting Widget */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-soft p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                <Contact className="w-5 h-5 text-indigo-600" />
                ID Card School Name
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Set the official school name displayed on all digital ID cards.
              </p>
              <form onSubmit={handleSetSchoolName} className="flex gap-2">
                <input 
                  type="text" 
                  value={schoolNameInput}
                  onChange={(e) => setSchoolNameInput(e.target.value)}
                  placeholder="e.g. ABC School"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button 
                  type="submit" 
                  disabled={savingSchoolName}
                  className="bg-primary text-white font-extrabold px-5 py-2 rounded-xl text-sm hover:bg-primary-dark transition disabled:opacity-50 shadow-soft uppercase tracking-wider"
                >
                  {savingSchoolName ? 'Saving...' : 'SET'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrincipalDashboard;
