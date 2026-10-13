import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Calendar, User, Clock, CheckCircle, AlertTriangle, XCircle, Search, RefreshCw, UserCheck } from 'lucide-react';

const PrincipalSubstituteManagement = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [uncoveredPeriods, setUncoveredPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [actionModal, setActionModal] = useState({ open: false, period: null, isReassign: false });
  const [selectedSubstitute, setSelectedSubstitute] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [periodsRes, teachersRes] = await Promise.all([
        api.get(`/substitutes/uncovered?date=${selectedDate}`),
        api.get('/principal/teachers')
      ]);
      setUncoveredPeriods(periodsRes.data.data || []);
      setTeachers(teachersRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load substitute data');
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (period, isReassign = false) => {
    setActionModal({ open: true, period, isReassign });
    setSelectedSubstitute(isReassign ? period.substituteAssignment.substituteTeacherId._id : '');
  };

  const handleAssignSubstitute = async (e) => {
    e.preventDefault();
    if (!selectedSubstitute) return toast.error('Please select a substitute teacher');

    try {
      setIsProcessing(true);
      const { period, isReassign } = actionModal;

      if (isReassign) {
        await api.put(`/substitutes/${period.substituteAssignment._id}`, {
          substituteTeacherId: selectedSubstitute
        });
        toast.success('Substitute reassigned successfully');
      } else {
        await api.post('/substitutes', {
          originalTeacherId: period.originalTeacher._id,
          substituteTeacherId: selectedSubstitute,
          classId: period.class._id,
          sectionId: period.section?._id,
          subjectId: period.subject._id,
          timetableId: period.timetableId,
          date: selectedDate,
          periodNumber: period.periodNumber,
          startTime: period.startTime,
          endTime: period.endTime,
          reason: 'STAFF_LEAVE'
        });
        toast.success('Substitute assigned successfully');
      }

      setActionModal({ open: false, period: null, isReassign: false });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign substitute');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to cancel this substitute assignment?')) return;
    
    try {
      await api.put(`/substitutes/${assignmentId}`, { status: 'CANCELLED' });
      toast.success('Assignment cancelled');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel assignment');
    }
  };

  const getStatusBadge = (status, period) => {
    if (status === 'COMPLETED') {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
          <CheckCircle size={14} /> Completed
        </span>
      );
    }
    if (status === 'ASSIGNED') {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold border border-yellow-200">
          <UserCheck size={14} /> {period.substituteAssignment?.substituteTeacherId?.name} Assigned
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold border border-rose-200 animate-pulse">
        <AlertTriangle size={14} /> Substitute Required
      </span>
    );
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-6 h-6 text-purple-600" /> Substitute Management
            </h2>
            <p className="text-xs text-gray-500 mt-1">Manage temporary teacher replacements for staff on leave.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 text-gray-800 dark:text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex justify-center items-center">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : uncoveredPeriods.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">All Covered!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">There are no uncovered periods for this date.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {uncoveredPeriods.map((period, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-lg">
                      {period.periodNumber}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        {period.class?.className} {period.section?.name && `- ${period.section.name}`}
                      </h4>
                      <p className="text-xs text-purple-600 font-semibold">{period.subject?.name}</p>
                    </div>
                  </div>
                  {getStatusBadge(period.status, period)}
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3 mb-4 space-y-2 border border-gray-100 dark:border-slate-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Original Teacher:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{period.originalTeacher?.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Time:</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{period.startTime} - {period.endTime}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Reason:</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300 text-rose-600 dark:text-rose-400">Staff Leave</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {period.status === 'REQUIRED' && (
                    <button
                      onClick={() => openAssignModal(period)}
                      className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Assign Substitute
                    </button>
                  )}
                  {period.status === 'ASSIGNED' && (
                    <>
                      <button
                        onClick={() => openAssignModal(period, true)}
                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold transition"
                      >
                        Change
                      </button>
                      <button
                        onClick={() => handleCancelAssignment(period.substituteAssignment._id)}
                        className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition border border-rose-100"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {period.status === 'COMPLETED' && (
                    <div className="flex-1 py-2 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-not-allowed">
                      <CheckCircle size={14} /> Session Already Completed
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Assign Modal */}
        {actionModal.open && actionModal.period && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-xl border border-gray-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  {actionModal.isReassign ? 'Reassign Substitute' : 'Assign Substitute'}
                </h3>
                <button onClick={() => setActionModal({ open: false, period: null, isReassign: false })} className="text-gray-400 hover:text-gray-600">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl mb-5 space-y-2 border border-purple-100 dark:border-purple-800/30">
                <p className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Clock size={16} className="text-purple-600" />
                  Period {actionModal.period.periodNumber} ({actionModal.period.startTime} - {actionModal.period.endTime})
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Class: <span className="font-bold">{actionModal.period.class?.className} {actionModal.period.section?.name && `- ${actionModal.period.section.name}`}</span>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Subject: <span className="font-bold text-purple-600">{actionModal.period.subject?.name}</span>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Original: <span className="font-bold line-through opacity-70">{actionModal.period.originalTeacher?.name}</span>
                </p>
              </div>

              <form onSubmit={handleAssignSubstitute}>
                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Select Substitute Teacher <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedSubstitute}
                    onChange={(e) => setSelectedSubstitute(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-gray-800 dark:text-white"
                  >
                    <option value="" disabled>Select a teacher...</option>
                    {teachers
                      .filter(t => t._id !== actionModal.period.originalTeacher._id)
                      .map(t => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-500 mt-2">
                    Note: The system will automatically verify if the selected teacher is available during this period.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActionModal({ open: false, period: null, isReassign: false })}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-gray-300 rounded-xl text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <UserCheck size={14} />}
                    {isProcessing ? 'Processing...' : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default PrincipalSubstituteManagement;
