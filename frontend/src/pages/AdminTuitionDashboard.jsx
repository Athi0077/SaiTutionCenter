import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Layers, CalendarDays, CheckCircle, IndianRupee, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminTuitionDashboard = () => {
  const [data, setData] = useState({
    batches: [],
    sessions: [],
    fees: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [batchRes, sessionRes, feesRes] = await Promise.all([
          api.get('/batches'),
          api.get('/tuition-sessions'),
          api.get('/tuition-fees')
        ]);

        setData({
          batches: batchRes.data || [],
          sessions: sessionRes.data.data || [],
          fees: feesRes.data.data || feesRes.data || []
        });
      } catch (err) {
        toast.error('Failed to load tuition dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalBatches = data.batches.length;
  let totalStudents = 0;
  data.batches.forEach(b => { totalStudents += (b.students?.length || 0); });

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysSessions = data.sessions.filter(s => s.dayOfWeek === new Date().toLocaleDateString('en-US', { weekday: 'long' }) || s.sessionDate?.startsWith(todayStr));

  const totalFees = data.fees.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalCollected = data.fees.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  const pendingFees = totalFees - totalCollected;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Admin Tuition Dashboard</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Overview of tuition operations and financials.</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading dashboard...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#0B1120] rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-[#1E293B]">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Students</p>
                  <h4 className="text-2xl font-bold text-gray-800 dark:text-white">{totalStudents}</h4>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0B1120] rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-[#1E293B]">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Layers size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Batches</p>
                  <h4 className="text-2xl font-bold text-gray-800 dark:text-white">{totalBatches}</h4>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0B1120] rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-[#1E293B]">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
                  <CalendarDays size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Today's Sessions</p>
                  <h4 className="text-2xl font-bold text-gray-800 dark:text-white">{todaysSessions.length}</h4>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0B1120] rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-[#1E293B]">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
                  <IndianRupee size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Fee Collection</p>
                  <h4 className="text-2xl font-bold text-gray-800 dark:text-white">₹{totalCollected}</h4>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0B1120] rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-[#1E293B]">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                  <IndianRupee size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Pending Fees</p>
                  <h4 className="text-2xl font-bold text-gray-800 dark:text-white">₹{pendingFees}</h4>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0B1120] rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-[#1E293B]">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">System Status</p>
                  <h4 className="text-2xl font-bold text-gray-800 dark:text-white">Operational</h4>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminTuitionDashboard;
