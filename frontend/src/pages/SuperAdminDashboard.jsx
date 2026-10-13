import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Users, GraduationCap, School, ShieldCheck, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const StatCard = ({ icon: Icon, title, value, colorClass, bgClass }) => (
  <div className={`p-6 rounded-2xl border ${bgClass} border-opacity-50 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1`}>
    <div className={`p-4 rounded-xl ${colorClass} bg-opacity-10 flex items-center justify-center`}>
      <Icon className={`w-8 h-8 ${colorClass.replace('bg-', 'text-')}`} />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const SuperAdminDashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/super-admin/dashboard');
        setStats(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6 bg-red-50 text-red-600 rounded-xl border border-red-200">
          <h2 className="text-lg font-bold">Error</h2>
          <p>{error}</p>
        </div>
      </Layout>
    );
  }

  const { stats: counts, totalRegistered, grandTotal, lastUpdated } = stats;

  const pieData = [
    { name: 'Students', value: counts.student, color: '#3b82f6' },
    { name: 'Teachers', value: counts.teacher, color: '#a855f7' },
    { name: 'Principals', value: counts.principal, color: '#f59e0b' },
    { name: 'Parents', value: counts.parent, color: '#10b981' },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gray-900 text-white rounded-2xl p-8 flex justify-between items-center relative overflow-hidden shadow-lg">
          <div className="z-10 relative">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-blue-400" />
              Developer Dashboard
            </h1>
            <p className="text-gray-300 max-w-md mb-4">Welcome back, {currentUser?.name}. Manage your overall system statistics here.</p>
            <button 
              onClick={() => window.location.href='/super-admin/principals'}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition backdrop-blur-sm border border-white/10"
            >
              Manage Principals
            </button>
          </div>
          <div className="absolute right-0 bottom-0 top-0 opacity-20 w-1/3 bg-gradient-to-l from-blue-500 to-transparent"></div>
        </div>

        <div className="flex justify-between items-center px-2">
          <h2 className="text-xl font-bold text-gray-800">System Overview</h2>
          <p className="text-sm text-gray-500">Last updated: {new Date(lastUpdated).toLocaleString()}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            icon={GraduationCap} 
            title="Total Students" 
            value={counts.student} 
            colorClass="bg-blue-500 text-blue-600" 
            bgClass="bg-blue-50 border-blue-100" 
          />
          <StatCard 
            icon={Users} 
            title="Total Teachers" 
            value={counts.teacher} 
            colorClass="bg-purple-500 text-purple-600" 
            bgClass="bg-purple-50 border-purple-100" 
          />
          <StatCard 
            icon={School} 
            title="Total Principals" 
            value={counts.principal} 
            colorClass="bg-amber-500 text-amber-600" 
            bgClass="bg-amber-50 border-amber-100" 
          />
          <StatCard 
            icon={Activity} 
            title="Total Parents" 
            value={counts.parent} 
            colorClass="bg-emerald-500 text-emerald-600" 
            bgClass="bg-emerald-50 border-emerald-100" 
          />
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center items-center text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">Total Registered Accounts</h3>
              <p className="text-5xl font-extrabold text-gray-900 my-4">{totalRegistered}</p>
              <p className="text-sm text-gray-500">Across all 4 active roles (excluding Super Admin)</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 p-6 flex flex-col justify-center items-center text-center">
              <h3 className="text-lg font-bold text-blue-900 mb-2">Total Expected Amount</h3>
              <p className="text-4xl font-extrabold text-blue-700 my-4">{formatCurrency(grandTotal)}</p>
              <p className="text-sm text-blue-600 font-medium">Based on current Account Calculator</p>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-700 mb-6">Account Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default SuperAdminDashboard;
