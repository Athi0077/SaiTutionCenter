import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { AuthContext } from '../context/AuthContext';
import { Calendar, BookOpen, FileText, CheckCircle, AlertTriangle, TrendingUp, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const StudentTuitionDashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [data, setData] = useState({
    attendance: [],
    homework: [],
    tests: [],
    fees: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [attRes, hwRes, testRes, feeRes] = await Promise.all([
          api.get('/tuition-attendance'),
          api.get('/tuition-homework/my-submissions'),
          api.get('/tuition-tests/my-marks'),
          api.get('/tuition-fees/my-fees'),
        ]);

        setData({
          attendance: attRes.data.data || [],
          homework: hwRes.data.data || [],
          tests: testRes.data.data || [],
          fees: feeRes.data.data || []
        });

      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?._id) {
      fetchDashboardData();
    }
  }, [currentUser]);

  // Calculate stats
  const totalClasses = data.attendance.length;
  const presentClasses = data.attendance.filter(a => a.status === 'present').length;
  const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

  const pendingHomework = data.homework.filter(h => h.status === 'pending').length;
  
  const recentTests = [...data.tests].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);

  const totalBilled = data.fees.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalPaid = data.fees.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  const totalPendingFee = totalBilled - totalPaid;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Tuition Dashboard</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Welcome back, {currentUser?.name}! Here is your progress.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading dashboard...</div>
        ) : (
          <>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link to="/student/tuition-attendance" className="bg-white dark:bg-[#0B1120] rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-[#1E293B] hover:border-indigo-300 dark:hover:border-indigo-700 transition block">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Attendance</p>
                    <h4 className="text-2xl font-bold text-gray-800 dark:text-white">{attendancePercentage}%</h4>
                  </div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${attendancePercentage >= 75 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${attendancePercentage}%` }}></div>
                </div>
              </Link>

              <Link to="/student/tuition-homework" className="bg-white dark:bg-[#0B1120] rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-[#1E293B] hover:border-indigo-300 dark:hover:border-indigo-700 transition block">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Homework</p>
                    <h4 className="text-2xl font-bold text-gray-800 dark:text-white">{pendingHomework} Pending</h4>
                  </div>
                </div>
                {pendingHomework > 0 ? (
                  <p className="text-xs text-orange-500 font-medium flex items-center gap-1"><AlertTriangle size={12}/> Complete them</p>
                ) : (
                  <p className="text-xs text-green-500 font-medium flex items-center gap-1"><CheckCircle size={12}/> All caught up</p>
                )}
              </Link>

              <Link to="/student/tuition-tests" className="bg-white dark:bg-[#0B1120] rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-[#1E293B] hover:border-indigo-300 dark:hover:border-indigo-700 transition block">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Tests</p>
                    <h4 className="text-2xl font-bold text-gray-800 dark:text-white">{data.tests.length} Taken</h4>
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-medium flex items-center gap-1"><TrendingUp size={12}/> View details</p>
              </Link>

              <Link to="/student/tuition-fees" className="bg-white dark:bg-[#0B1120] rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-[#1E293B] hover:border-indigo-300 dark:hover:border-indigo-700 transition block">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
                    <IndianRupee size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Fees Due</p>
                    <h4 className="text-2xl font-bold text-gray-800 dark:text-white">₹{totalPendingFee}</h4>
                  </div>
                </div>
                {totalPendingFee > 0 ? (
                  <p className="text-xs text-red-500 font-medium">Action required</p>
                ) : (
                  <p className="text-xs text-green-500 font-medium">All cleared</p>
                )}
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Test Performance */}
              <div className="bg-white dark:bg-[#0B1120] rounded-2xl shadow-soft border border-gray-100 dark:border-[#1E293B] overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-[#1E293B] flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 dark:text-white">Recent Test Performance</h3>
                  <Link to="/student/tuition-tests" className="text-indigo-600 text-sm font-medium hover:underline">View All</Link>
                </div>
                <div className="p-6 space-y-4">
                  {recentTests.length === 0 ? (
                    <p className="text-gray-500 text-center text-sm">No recent tests taken.</p>
                  ) : (
                    recentTests.map(mark => {
                      const max = mark.testId?.maxMarks || 100;
                      const pct = Math.round((mark.marksObtained / max) * 100);
                      return (
                        <div key={mark._id} className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-white text-sm">{mark.testId?.title || 'Unknown Test'}</p>
                            <p className="text-xs text-gray-500">{new Date(mark.testId?.testDate).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                              <div className={`h-2 rounded-full ${pct >= 75 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }}></div>
                            </div>
                            <span className="font-bold text-gray-800 dark:text-white text-sm w-10 text-right">{pct}%</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl shadow-soft p-6 text-white flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-2">My Schedule</h3>
                  <p className="text-blue-100 text-sm mb-6">
                    Don't forget to check your timetable for upcoming classes and tests.
                  </p>
                </div>
                <Link to="/student/tuition-timetable" className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2.5 rounded-xl font-semibold transition w-fit">
                  <Calendar size={18} /> View Timetable
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default StudentTuitionDashboard;
