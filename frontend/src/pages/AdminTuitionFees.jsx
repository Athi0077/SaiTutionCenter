import React, { useState, useEffect, useContext, useMemo } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { AuthContext } from '../context/AuthContext';
import { IndianRupee, Users, CheckCircle, Clock, ChevronRight, Edit3, X, Check, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminTuitionFees = () => {
  const { currentUser } = useContext(AuthContext);
  const [fees, setFees] = useState([]);
  const [standards, setStandards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedStandardId, setSelectedStandardId] = useState(null);
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
        currentUser?.role === 'teacher' ? api.get('/classes/my-classes') : api.get('/classes')
      ]);
      
      const allFees = feesRes.data?.data || feesRes.data || [];
      const allStandards = stdsRes.data?.data || stdsRes.data || [];
      const allClasses = classesRes.data?.data || classesRes.data || [];

      // Determine accessible fees
      let accessibleFees = allFees;
      if (currentUser?.role === 'teacher') {
        const myClassStudentIds = new Set();
        allClasses.forEach(c => {
          (c.students || []).forEach(s => {
            const sid = (s._id || s)?.toString();
            if (sid) myClassStudentIds.add(sid);
          });
        });

        if (myClassStudentIds.size > 0) {
          accessibleFees = allFees.filter(f => {
            const sid = (f.studentId?._id || f.studentId)?.toString();
            return sid && myClassStudentIds.has(sid);
          });
        }
      }

      setFees(accessibleFees);
      setStandards(allStandards);
      setClasses(allClasses);
    } catch (error) {
      toast.error('Failed to load fee data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Group fees by standard
  const feesByStandard = useMemo(() => {
    const assignedFeeIds = new Set();
    const groups = [];

    // Map through each standard defined in system
    standards.forEach(std => {
      const stdNameLower = (std.name || '').trim().toLowerCase();
      const stdFees = fees.filter(f => {
        // 1. Direct standardId match
        const fStdId = (f.standardId?._id || f.standardId)?.toString();
        if (fStdId && fStdId === std._id?.toString()) return true;

        const fStdName = (f.standardId?.name || '').trim().toLowerCase();
        if (fStdName && (fStdName === stdNameLower || fStdName.includes(stdNameLower))) return true;

        // 2. Class standard match
        const fClassStd = (
          f.classId?.standard || 
          f.classId?.className || 
          f.batchId?.standard || 
          f.batchId?.className || 
          f.batchId?.batchName || 
          ''
        ).trim().toLowerCase();
        if (fClassStd && (fClassStd === stdNameLower || fClassStd.includes(stdNameLower))) return true;

        // 3. Match from student's enrolled Class
        const studentId = (f.studentId?._id || f.studentId)?.toString();
        if (studentId) {
          const studentClass = classes.find(c => 
            (c.standardId?.toString() === std._id?.toString() || (c.standard || '').trim().toLowerCase() === stdNameLower) &&
            (c.students || []).some(s => (s._id || s)?.toString() === studentId)
          );
          if (studentClass) return true;
        }

        return false;
      });

      stdFees.forEach(f => assignedFeeIds.add(f._id));

      if (stdFees.length > 0) {
        const completedCount = stdFees.filter(f => f.status === 'COMPLETED' || f.status === 'Paid').length;
        const totalAmount = stdFees.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
        const collectedAmount = stdFees.reduce((acc, curr) => acc + (curr.paidAmount || (curr.status === 'COMPLETED' || curr.status === 'Paid' ? curr.totalAmount : 0)), 0);

        groups.push({
          _id: std._id,
          name: std.name.toLowerCase().includes('standard') ? std.name : `${std.name} Standard`,
          totalStudents: stdFees.length,
          completed: completedCount,
          pending: stdFees.length - completedCount,
          totalAmount,
          collectedAmount,
          pendingAmount: totalAmount - collectedAmount,
          fees: stdFees
        });
      }
    });

    // Unassigned fees group if any student fee didn't map to a specific standard
    const remainingFees = fees.filter(f => !assignedFeeIds.has(f._id));
    if (remainingFees.length > 0) {
      const completedCount = remainingFees.filter(f => f.status === 'COMPLETED' || f.status === 'Paid').length;
      const totalAmount = remainingFees.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
      const collectedAmount = remainingFees.reduce((acc, curr) => acc + (curr.paidAmount || (curr.status === 'COMPLETED' || curr.status === 'Paid' ? curr.totalAmount : 0)), 0);

      groups.push({
        _id: 'general',
        name: 'General / All Tuition Students',
        totalStudents: remainingFees.length,
        completed: completedCount,
        pending: remainingFees.length - completedCount,
        totalAmount,
        collectedAmount,
        pendingAmount: totalAmount - collectedAmount,
        fees: remainingFees
      });
    }

    return groups;
  }, [fees, standards, classes]);

  const selectedStandard = selectedStandardId ? feesByStandard.find(g => g._id === selectedStandardId) : null;

  // Global Stats
  const totalStudents = fees.length;
  const completedFees = fees.filter(f => f.status === 'COMPLETED' || f.status === 'Paid').length;
  const pendingFees = totalStudents - completedFees;
  const totalCollectedRupees = fees.reduce((acc, curr) => acc + (curr.paidAmount || (curr.status === 'COMPLETED' || curr.status === 'Paid' ? curr.totalAmount : 0)), 0);
  const totalPendingRupees = fees.reduce((acc, curr) => acc + Math.max(0, (curr.totalAmount || 0) - (curr.paidAmount || (curr.status === 'COMPLETED' || curr.status === 'Paid' ? curr.totalAmount : 0))), 0);

  // Quick toggle between COMPLETED and PENDING
  const handleToggleStatus = async (fee) => {
    const isCompleted = fee.status === 'COMPLETED' || fee.status === 'Paid';
    const newStatus = isCompleted ? 'PENDING' : 'COMPLETED';
    
    // Optimistic UI update
    setFees(prev => prev.map(f => {
      if (f._id === fee._id) {
        return {
          ...f,
          status: newStatus,
          paidAmount: newStatus === 'COMPLETED' ? f.totalAmount : 0
        };
      }
      return f;
    }));

    try {
      await api.put(`/tuition-fees/${fee._id}/status`, { status: newStatus });
      toast.success(newStatus === 'COMPLETED' ? 'Marked as Completed! 🎉' : 'Marked as Pending! ⏳');
    } catch (err) {
      toast.error('Failed to update fee status');
      fetchData(); // Rollback on failure
    }
  };

  const handleUpdateClick = (fee) => {
    setEditingFee(fee);
    setUpdateData({
      status: (fee.status === 'COMPLETED' || fee.status === 'Paid') ? 'COMPLETED' : 'PENDING',
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
      fetchData();
    } catch (err) {
      toast.error('Failed to update fee');
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        
        {/* Header & Global Stats */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Tuition Fees Management</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Track tuition fee collections, statuses, and monthly rollovers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Students */}
            <div className="bg-white dark:bg-[#0B1120] rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-[#1E293B] flex items-center gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full text-blue-600 dark:text-blue-400">
                <Users size={26} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</p>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{totalStudents}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Registered for Tuition</p>
              </div>
            </div>

            {/* Fees Completed */}
            <div className="bg-white dark:bg-[#0B1120] rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-[#1E293B] flex items-center gap-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full text-green-600 dark:text-green-400">
                <CheckCircle size={26} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fees Completed</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold text-green-600 dark:text-green-400">{completedFees}</h3>
                  <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                    (₹{totalCollectedRupees})
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Paid tuition fees</p>
              </div>
            </div>

            {/* Fees Pending */}
            <div className="bg-white dark:bg-[#0B1120] rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-[#1E293B] flex items-center gap-4">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-full text-orange-600 dark:text-orange-400">
                <Clock size={26} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fees Pending</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold text-orange-600 dark:text-orange-400">{pendingFees}</h3>
                  <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">
                    (₹{totalPendingRupees})
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Awaiting collection</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center p-12 text-gray-500">Loading fee data...</div>
        ) : (
          <div className="space-y-6">
            {!selectedStandard ? (
              <>
                <div className="flex justify-between items-center mt-8 mb-4">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">Tuition Standards</h3>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-[#1E293B] px-3 py-1 rounded-full">
                    {feesByStandard.length} Standards with Students
                  </span>
                </div>

                {feesByStandard.length === 0 ? (
                  <div className="bg-white dark:bg-[#0B1120] rounded-2xl p-12 text-center shadow-soft border border-gray-100 dark:border-[#1E293B] text-gray-500">
                    <IndianRupee size={48} className="mx-auto mb-3 opacity-40" />
                    <p className="font-semibold text-base text-gray-700 dark:text-gray-300">No students have been registered for tuition fees yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Register tuition students to view fee status and track collections.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {feesByStandard.map(stdGroup => (
                      <div key={stdGroup._id} className="bg-white dark:bg-[#0B1120] rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-[#1E293B] flex flex-col justify-between hover:border-indigo-200 dark:hover:border-indigo-900 transition">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="text-lg font-bold text-gray-800 dark:text-white">{stdGroup.name}</h4>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              ₹{stdGroup.totalAmount} Total
                            </span>
                          </div>

                          <div className="space-y-2 mb-4 bg-gray-50 dark:bg-[#172235] p-3 rounded-xl border border-gray-100 dark:border-[#334155]/50">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Total Students</span>
                              <span className="font-semibold text-gray-800 dark:text-gray-200">{stdGroup.totalStudents}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                <CheckCircle size={14} /> Completed
                              </span>
                              <span className="font-semibold text-green-700 dark:text-green-300">
                                {stdGroup.completed} <span className="text-xs text-green-600 font-normal">(₹{stdGroup.collectedAmount})</span>
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-orange-500 dark:text-orange-400 flex items-center gap-1">
                                <Clock size={14} /> Pending
                              </span>
                              <span className="font-semibold text-orange-600 dark:text-orange-400">
                                {stdGroup.pending} <span className="text-xs text-orange-500 font-normal">(₹{stdGroup.pendingAmount})</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={() => setSelectedStandardId(stdGroup._id)}
                          className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 py-2.5 rounded-xl transition font-semibold text-sm"
                        >
                          View Fees ({stdGroup.totalStudents}) <ChevronRight size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-[#0B1120] rounded-2xl shadow-soft border border-gray-100 dark:border-[#1E293B] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-[#1E293B] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 dark:bg-[#172235]">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      {selectedStandard.name} - Fee Details
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Showing {selectedStandard.totalStudents} student{selectedStandard.totalStudents > 1 ? 's' : ''} • {selectedStandard.completed} Completed • {selectedStandard.pending} Pending
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedStandardId(null)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-[#334155] rounded-xl hover:bg-gray-50 dark:hover:bg-[#1E293B] transition"
                  >
                    <ArrowLeft size={16} /> Back to Standards
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[850px]">
                    <thead className="bg-white dark:bg-[#0B1120] border-b border-gray-100 dark:border-[#1E293B]">
                      <tr>
                        <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">Student</th>
                        <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">Fee Amount</th>
                        <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">Cycle & Details</th>
                        <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">Status</th>
                        <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-sm text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-[#1E293B] bg-white dark:bg-[#0B1120]">
                      {selectedStandard.fees.map(fee => {
                        const isCompleted = fee.status === 'COMPLETED' || fee.status === 'Paid';
                        return (
                          <tr key={fee._id} className="hover:bg-gray-50/70 dark:hover:bg-[#172235]/50 transition">
                            <td className="p-4">
                              <span className="font-semibold text-gray-800 dark:text-gray-200">{fee.studentId?.name || 'Unknown'}</span>
                              <div className="text-xs text-gray-500 font-mono mt-0.5">{fee.studentId?.studentId || fee.studentId?.rollNumber || ''}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-gray-800 dark:text-gray-200 text-base">
                                ₹{fee.totalAmount}
                              </div>
                              <div className="text-xs text-gray-500">
                                Paid: ₹{fee.paidAmount || (isCompleted ? fee.totalAmount : 0)}
                              </div>
                            </td>
                            <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                              <div className="font-medium text-gray-800 dark:text-gray-200">{fee.feeDetails || 'Tuition Fee'}</div>
                              <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                {fee.feePeriod === 'Yearly' ? '📆 Yearly Cycle' : '📅 Monthly (1st Reset)'}
                              </span>
                            </td>
                            <td className="p-4">
                              {isCompleted ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
                                  <CheckCircle size={14} /> COMPLETED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-bold">
                                  <Clock size={14} /> PENDING
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Quick One-Click Toggle Button */}
                                <button
                                  onClick={() => handleToggleStatus(fee)}
                                  className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition ${
                                    isCompleted 
                                      ? 'bg-orange-50 hover:bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-300 border border-orange-200 dark:border-orange-800' 
                                      : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                                  }`}
                                  title={isCompleted ? "Mark fee as pending" : "Mark fee as completed (paid)"}
                                >
                                  {isCompleted ? (
                                    <>
                                      <Clock size={13} /> Mark Pending
                                    </>
                                  ) : (
                                    <>
                                      <Check size={13} /> Mark Completed
                                    </>
                                  )}
                                </button>

                                {/* Edit details button */}
                                <button 
                                  onClick={() => handleUpdateClick(fee)}
                                  className="text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 font-medium text-xs flex items-center gap-1 bg-gray-100 hover:bg-indigo-50 dark:bg-[#1E293B] dark:hover:bg-indigo-900/30 px-2.5 py-1.5 rounded-lg transition"
                                  title="Edit fee details"
                                >
                                  <Edit3 size={13} /> Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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
                    <option value="PENDING">⏳ PENDING (Awaiting Payment)</option>
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
                    <option value="Monthly">📅 Monthly (Auto resets to Pending on 1st)</option>
                    <option value="Yearly">📆 Yearly (Auto resets to Pending yearly)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fee Amount (₹)
                  </label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-200 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                    value={updateData.feeAmount} 
                    onChange={(e) => setUpdateData({ ...updateData, feeAmount: e.target.value })} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fee Details / Description
                  </label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-200 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                    value={updateData.feeDetails} 
                    onChange={(e) => setUpdateData({ ...updateData, feeDetails: e.target.value })} 
                  />
                </div>

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
