import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Sparkles, Users, BookOpen, CheckCircle, AlertTriangle, Search, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, bgClass, textClass, value, label }) => (
  <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-5 rounded-2xl shadow-soft flex flex-col items-center justify-center text-center gap-2 hover:-translate-y-1 transition duration-300">
    <div className={`w-12 h-12 ${bgClass} ${textClass} rounded-full flex items-center justify-center font-bold text-xl`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">{label}</p>
    </div>
  </div>
);

const PrincipalAIDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [search, page]);

  const fetchOverview = async () => {
    try {
      const res = await api.get('/principal/ai/overview');
      setOverview(res.data.data);
    } catch (err) {
      toast.error('Failed to load AI overview metrics');
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/principal/ai/students?search=${search}&page=${page}&limit=10`);
      setStudents(res.data.data);
      setTotalPages(res.data.pagination.pages);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden shadow-lg gap-4">
          <div className="z-10 relative text-white">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-yellow-300" />
              AI Student Insights
            </h1>
            <p className="text-blue-100 max-w-md text-sm">Leverage AI to deeply understand student performance and identify actionable academic trends.</p>
          </div>
          <div className="z-10 relative flex flex-wrap gap-3 mt-4 md:mt-0">
            <button 
              onClick={() => navigate('/principal/ai-dashboard/class-analytics')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-6 py-2 rounded-xl font-semibold transition flex items-center justify-center gap-2"
            >
              Class Analytics
            </button>
            <button 
              onClick={() => navigate('/principal/ai-reports')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-6 py-2 rounded-xl font-semibold transition flex items-center justify-center gap-2"
            >
              AI Student Reports
            </button>
            <button 
              onClick={() => navigate('/principal/ai-progress')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-6 py-2 rounded-xl font-semibold transition flex items-center justify-center gap-2"
            >
              Progress & Interventions
            </button>
            <button 
              onClick={() => navigate('/principal/ai-assistant')}
              className="bg-yellow-400 hover:bg-yellow-500 text-indigo-900 border border-yellow-300 px-6 py-2 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
            >
              AI Chat Assistant
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard icon={Users} bgClass="bg-blue-100" textClass="text-blue-600" value={overview?.totalStudents || 0} label="Total Students" />
          <StatCard icon={BookOpen} bgClass="bg-purple-100" textClass="text-purple-600" value={overview?.studentsWithExams || 0} label="With Exam Records" />
          <StatCard icon={CheckCircle} bgClass="bg-emerald-100" textClass="text-emerald-600" value={`${overview?.overallExamAverage || 0}%`} label="Overall Average" />
          <StatCard icon={Users} bgClass="bg-orange-100" textClass="text-orange-600" value={`${overview?.averageAttendance || 0}%`} label="Avg Attendance" />
          <StatCard icon={AlertTriangle} bgClass="bg-red-100" textClass="text-red-600" value={overview?.studentsRequiringAttention || 0} label="Needs Attention" />
        </div>

        {/* Directory Section */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-soft p-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-lg font-bold text-gray-800">Student Directory</h2>
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100 bg-gray-50/50">
                    <th className="p-4 font-medium rounded-tl-xl">Student</th>
                    <th className="p-4 font-medium">Standard & Section</th>
                    <th className="p-4 font-medium">Attendance</th>
                    <th className="p-4 font-medium">Latest Exam</th>
                    <th className="p-4 font-medium rounded-tr-xl">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={student.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`} alt={student.name} className="w-10 h-10 rounded-full border border-gray-200" />
                          <div>
                            <p className="font-semibold text-gray-800">{student.name}</p>
                            <p className="text-xs text-gray-500">{student.grNumber || student.studentId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{student.classInfo}</td>
                      <td className="p-4 text-gray-600">{student.attendancePercentage}%</td>
                      <td className="p-4 text-gray-600">{student.latestExamPerformance}</td>
                      <td className="p-4">
                        <button
                          onClick={() => navigate(`/principal/ai-student/${student._id}`)}
                          className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition group"
                        >
                          <Sparkles className="w-4 h-4" />
                          View AI Analysis
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold disabled:opacity-50">Prev</button>
                  <span className="text-sm font-medium text-gray-600">Page {page} of {totalPages}</span>
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold disabled:opacity-50">Next</button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-12 text-gray-500">
              <p>No students found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PrincipalAIDashboard;
