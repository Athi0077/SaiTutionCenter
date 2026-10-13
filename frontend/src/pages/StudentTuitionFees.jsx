import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { AuthContext } from '../context/AuthContext';
import { IndianRupee, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentTuitionFees = () => {
  const { currentUser } = useContext(AuthContext);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const isParent = currentUser?.role === 'parent';

  useEffect(() => {
    const fetchFees = async () => {
      try {
        setLoading(true);
        const res = await api.get('/tuition-fees/my-fees');
        setFees(res.data.data || res.data);
      } catch (err) {
        toast.error('Failed to load fee information');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser?._id) {
      fetchFees();
    }
  }, [currentUser]);

  const totalBilled = fees.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalCompleted = fees.filter(f => f.status === 'COMPLETED').reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalPending = fees.filter(f => f.status !== 'COMPLETED').reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {isParent ? "Child's Tuition Fees" : "My Tuition Fees"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            View your fee records and payment history.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="text-lg font-bold mb-2">Total Billed</h3>
            <div className="text-4xl font-bold mb-1 flex items-center"><IndianRupee size={28} /> {totalBilled}</div>
            <p className="text-white/80 text-sm">Overall tuition charges</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="text-lg font-bold mb-2">Total Completed</h3>
            <div className="text-4xl font-bold mb-1 flex items-center"><IndianRupee size={28} /> {totalCompleted}</div>
            <p className="text-white/80 text-sm">Thank you for your payments</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <h3 className="text-lg font-bold mb-2 relative z-10">Total Pending</h3>
            <div className="text-4xl font-bold mb-1 flex items-center relative z-10"><IndianRupee size={28} /> {totalPending}</div>
            <p className="text-white/80 text-sm relative z-10">Amount left to pay</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0B1120] rounded-2xl shadow-soft border border-gray-100 dark:border-[#1E293B] overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-[#1E293B]">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Fee Details</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading fee records...</div>
          ) : fees.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No fee records found.</div>
          ) : (
            <div className="space-y-4 p-6">
              {fees.map(fee => (
                <div key={fee._id} className="border border-gray-100 dark:border-[#1E293B] rounded-2xl p-6 bg-gray-50/50 dark:bg-[#172235]/50 flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold text-gray-800 dark:text-white">{fee.feeDetails || 'Tuition Fee'}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {fee.feePeriod === 'Yearly' ? '📆 Yearly' : '📅 Monthly'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{fee.batchId?.batchName || 'Tuition Batch'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right mr-4">
                      <div className="text-sm text-gray-500 mb-1">Total Amount</div>
                      <div className="font-bold text-gray-800 dark:text-white text-xl">₹{fee.totalAmount}</div>
                    </div>
                    <div className="w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
                    <div className="text-left ml-2">
                      <div className="text-sm text-gray-500 mb-1">Status</div>
                      {fee.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          <CheckCircle size={14} /> COMPLETED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                          <Clock size={14} /> PENDING
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentTuitionFees;
