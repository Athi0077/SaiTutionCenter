import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { AuthContext } from '../context/AuthContext';
import { IndianRupee, Users, CheckCircle, Clock, ChevronRight, Edit3, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminTuitionFees = () => {
  const { currentUser } = useContext(AuthContext);
  const [fees, setFees] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  
  const [updateData, setUpdateData] = useState({
    status: 'PENDING',
    feePeriod: 'Monthly',
    feeAmount: '',
    feeDetails: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [feesRes, stdsRes, classesRes] = await Promise.all([
        api.get('/tuition-fees'),
        api.get('/standards'),
        currentUser.role === 'teacher' ? api.get('/classes/my-classes') : api.get('/classes')
      ]);
      
      const allFees = feesRes.data.data || feesRes.data;
      
      // Determine accessible batches based on role
      let accessibleBatches = [];
      if (currentUser.role === 'teacher') {
        const myClasses = classesRes.data.data; // Already filtered by /my-classes
        if (stdsRes.data?.data) {
          stdsRes.data.data.forEach(std => {
            std.sections?.forEach(sec => {
              if (myClasses.some(c => c.standard === std.name && c.section === sec.name)) {
                accessibleBatches.push({ ...sec, batchName: `${std.name} - ${sec.name}` });
              }
            });
          });
        }
      } else {
        // Principal/Admin sees all
        if (stdsRes.data?.data) {
          stdsRes.data.data.forEach(std => {
            std.sections?.forEach(sec => {
              accessibleBatches.push({ ...sec, batchName: `${std.name} - ${sec.name}` });
            });
          });
        }
      }

      // Filter fees to only those in accessible batches
      const batchIds = accessibleBatches.map(b => b._id.toString());
      const filteredFees = allFees.filter(f => f.batchId && batchIds.includes(f.batchId._id ? f.batchId._id.toString() : f.batchId.toString()));

      setBatches(accessibleBatches);
      setFees(filteredFees);
    } catch (error) {
      toast.error('Failed to load fee data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleUpdateClick = (fee) => {
    setEditingFee(fee);
    setUpdateData({
      status: fee.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
      feePeriod: fee.feePeriod || 'Monthly',
      feeAmount: fee.totalAmount || '',
      feeDetails: fee.feeDetails || ''
    });
    setShowUpdateModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/tuition-fees/${editingFee._id}/status`, updateData);
      toast.success('Fee updated successfully');
      setShowUpdateModal(false);
      fetchData(); // Refresh data
    } catch (err) {
      toast.error('Failed to update fee');
    }
  };

  // Stats
  const totalStudents = fees.length;
  const completedFees = fees.filter(f => f.status === 'COMPLETED').length;
  const pendingFees = totalStudents - completedFees;

  // Group fees by batch
  const feesByBatch = batches.map(batch => {
    const batchFees = fees.filter(f => {
      const fbId = f.batchId?._id || f.batchId;
      return fbId === batch._id;
    });
    return {
      ...batch,
      totalStudents: batchFees.length,
      completed: batchFees.filter(f => f.status === 'COMPLETED').length,
      pending: batchFees.filter(f => f.status !== 'COMPLETED').length,
      fees: batchFees
    };
  }).filter(b => b.totalStudents > 0); // Only show batches with registered tuition students

  const selectedBatch = selectedBatchId ? feesByBatch.find(b => b._id === selectedBatchId) : null;

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        
        {/* Header & Global Stats */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Tuition Fees Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#0B1120] rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-[#1E293B] flex items-center gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full text-blue-600 dark:text-blue-400">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</p>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{totalStudents}</h3>
              </div>
            </div>
            <div className="bg-white dark:bg-[#0B1120] rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-[#1E293B] flex items-center gap-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full text-green-600 dark:text-green-400">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fees Completed</p>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{completedFees}</h3>
              </div>
            </div>
            <div className="bg-white dark:bg-[#0B1120] rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-[#1E293B] flex items-center gap-4">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-full text-orange-600 dark:text-orange-400">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fees Pending</p>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{pendingFees}</h3>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center p-12 text-gray-500">Loading fee data...</div>
        ) : (
          <div className="space-y-6">
            {!selectedBatch ? (
              <>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-8 mb-4">Tuition Batches</h3>
                {feesByBatch.length === 0 ? (
                  <div className="bg-white dark:bg-[#0B1120] rounded-2xl p-12 text-center shadow-soft border border-gray-100 dark:border-[#1E293B] text-gray-500">
                    No students have been registered for tuition fees yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {feesByBatch.map(batch => (
                      <div key={batch._id} className="bg-white dark:bg-[#0B1120] rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-[#1E293B] flex flex-col justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-3">{batch.batchName}</h4>
                          <div className="flex justify-between items-center text-sm mb-1">
                            <span className="text-gray-500 dark:text-gray-400">Total Students</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{batch.totalStudents}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm mb-1">
                            <span className="text-green-600 dark:text-green-400">Completed</span>
                            <span className="font-semibold text-green-700 dark:text-green-300">{batch.completed}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm mb-4">
                            <span className="text-orange-500 dark:text-orange-400">Pending</span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">{batch.pending}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedBatchId(batch._id)}
                          className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 dark:bg-[#172235] dark:hover:bg-[#1E293B] text-gray-700 dark:text-gray-200 py-2.5 rounded-xl transition font-medium text-sm"
                        >
                          View Fees <ChevronRight size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-[#0B1120] rounded-2xl shadow-soft border border-gray-100 dark:border-[#1E293B] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-[#1E293B] flex justify-between items-center bg-gray-50 dark:bg-[#172235]">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{selectedBatch.batchName} - Fee Details</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage fees for students in this batch.</p>
                  </div>
                  <button 
                    onClick={() => setSelectedBatchId(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-[#334155] rounded-xl hover:bg-gray-50 dark:hover:bg-[#1E293B] transition"
                  >
                    Back to Batches
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-white dark:bg-[#0B1120] border-b border-gray-100 dark:border-[#1E293B]">
                      <tr>
                        <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">Student Name</th>
                        <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">Fee Amount</th>
                        <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">Fee Details & Cycle</th>
                        <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">Status</th>
                        <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-[#1E293B] bg-white dark:bg-[#0B1120]">
                      {selectedBatch.fees.map(fee => (
                        <tr key={fee._id} className="hover:bg-gray-50 dark:hover:bg-[#172235] transition">
                          <td className="p-4">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{fee.studentId?.name || 'Unknown'}</span>
                            <div className="text-xs text-gray-500">{fee.studentId?.studentId || ''}</div>
                          </td>
                          <td className="p-4 font-medium text-gray-800 dark:text-gray-200">
                            ₹{fee.totalAmount}
                          </td>
                          <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                            <div className="font-medium text-gray-800 dark:text-gray-200">{fee.feeDetails || 'Tuition Fee'}</div>
                            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {fee.feePeriod === 'Yearly' ? '📆 Yearly Cycle' : '📅 Monthly (1st Reset)'}
                            </span>
                          </td>
                          <td className="p-4">
                            {fee.status === 'COMPLETED' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
                                <CheckCircle size={14} /> COMPLETED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-bold">
                                <Clock size={14} /> PENDING
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <button 
                              onClick={() => handleUpdateClick(fee)}
                              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded-lg transition"
                            >
                              <Edit3 size={14} /> Update
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Update Fee Modal */}
      <AnimatePresence>
        {showUpdateModal && editingFee && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-[#0B1120] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-[#1E293B]"
            >
              <div className="p-5 border-b border-gray-100 dark:border-[#1E293B] bg-gray-50 dark:bg-[#172235] flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Update Student Fee</h3>
                <button 
                  onClick={() => setShowUpdateModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
                <div className="mb-4 bg-gray-50 dark:bg-[#172235] p-3 rounded-xl border border-gray-100 dark:border-[#334155]">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">Student</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200 mt-1">{editingFee.studentId?.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select 
                    required
                    className="w-full border border-gray-200 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition font-semibold" 
                    value={updateData.status} 
                    onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                  >
                    <option value="PENDING">⏳ PENDING (Incomplete)</option>
                    <option value="COMPLETED">✅ COMPLETED (Paid)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Billing Cycle (Frequency)
                  </label>
                  <select 
                    required
                    className="w-full border border-gray-200 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                    value={updateData.feePeriod} 
                    onChange={(e) => setUpdateData({ ...updateData, feePeriod: e.target.value })}
                  >
                    <option value="Monthly">📅 Month (Auto resets to Pending on 1st)</option>
                    <option value="Yearly">📆 Year (Auto resets to Pending yearly)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fee Amount (₹) (Optional)
                  </label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-200 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                    value={updateData.feeAmount} 
                    onChange={(e) => setUpdateData({ ...updateData, feeAmount: e.target.value })} 
                  />
                </div>
                
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fee Details (Optional)
                  </label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-200 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                    value={updateData.feeDetails} 
                    onChange={(e) => setUpdateData({ ...updateData, feeDetails: e.target.value })} 
                  />
                </div> */}

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowUpdateModal(false)}
                    className="flex-1 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 hover:bg-gray-100 dark:bg-[#1E293B] dark:hover:bg-[#334155] rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-md transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </Layout>
  );
};

export default AdminTuitionFees;
