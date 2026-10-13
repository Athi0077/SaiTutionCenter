import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  User, 
  MessageSquare, 
  History, 
  Loader2, 
  ArrowLeft,
  Check,
  X,
  FileText
} from 'lucide-react';

const TeacherLeaveRequests = () => {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  const [pendingRequests, setPendingRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Action Modal State
  const [actionModal, setActionModal] = useState({
    open: false,
    request: null,
    actionType: null, // 'approve' or 'reject'
    comment: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      if (activeTab === 'pending') {
        const res = await api.get('/leave-requests/teacher?status=pending');
        setPendingRequests(res.data.data || []);
      } else {
        const res = await api.get('/leave-requests/teacher?status=history');
        setHistoryRequests(res.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (req, actionType) => {
    setActionModal({
      open: true,
      request: req,
      actionType,
      comment: ''
    });
  };

  const handleConfirmAction = async () => {
    const { request, actionType, comment } = actionModal;
    if (!request || !actionType) return;

    try {
      setIsProcessing(true);
      await api.patch(`/leave-requests/${request._id}/${actionType}`, {
        comment
      });

      toast.success(`Leave request ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
      
      setActionModal({ open: false, request: null, actionType: null, comment: '' });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${actionType} leave request`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <Link to="/teacher/attendance" className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:underline mb-2">
            <ArrowLeft size={14} /> Back to Attendance
          </Link>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-red-600" /> Leave Requests Management
              </h2>
              <p className="text-xs text-gray-500">Review student leave applications and inspect past approval history.</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-slate-800 gap-4">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 px-1 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock size={16} /> Pending Requests
            {pendingRequests.length > 0 && activeTab === 'pending' && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full font-extrabold">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-1 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History size={16} /> Leave History
          </button>
        </div>

        {/* Pending Requests Tab */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {loading ? (
              <div className="py-12 flex justify-center items-center text-gray-400">
                <Loader2 size={32} className="animate-spin text-red-600" />
              </div>
            ) : pendingRequests.length > 0 ? (
              pendingRequests.map(req => (
                <div 
                  key={req._id} 
                  className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 border-l-4 border-l-orange-500 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition hover:shadow-md"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-sm shrink-0">
                        {req.studentId?.name ? req.studentId.name.charAt(0) : 'S'}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-base">
                          {req.studentId?.name || 'Student'}{' '}
                          <span className="text-xs font-semibold text-gray-500">
                            ({req.classId?.className || 'Class'})
                          </span>
                        </h4>
                        <p className="text-xs font-mono text-gray-400">ID: {req.studentId?.studentId || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-xl w-fit">
                      <Calendar size={14} /> Leave Date: {new Date(req.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Reason for Leave:</p>
                      <p className="text-xs text-gray-700 dark:text-slate-300 font-medium">"{req.reason}"</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-slate-800">
                    <button 
                      onClick={() => openActionModal(req, 'approve')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5"
                    >
                      <Check size={16} /> Approve
                    </button>
                    <button 
                      onClick={() => openActionModal(req, 'reject')}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition flex items-center gap-1.5"
                    >
                      <X size={16} /> Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-12 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl text-gray-500 space-y-2">
                <Clock className="w-12 h-12 text-gray-300 mx-auto" />
                <p className="font-bold text-base text-gray-700 dark:text-slate-300">No Pending Leave Requests</p>
                <p className="text-xs text-gray-400">All student leave requests have been reviewed.</p>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {loading ? (
              <div className="py-12 flex justify-center items-center text-gray-400">
                <Loader2 size={32} className="animate-spin text-red-600" />
              </div>
            ) : historyRequests.length > 0 ? (
              historyRequests.map(req => (
                <div 
                  key={req._id} 
                  className={`bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 border-l-4 p-5 rounded-2xl shadow-sm space-y-3 ${
                    req.status === 'approved' ? 'border-l-emerald-500' : 'border-l-rose-500'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold flex items-center justify-center text-sm shrink-0">
                        {req.studentId?.name ? req.studentId.name.charAt(0) : 'S'}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-base">
                          {req.studentId?.name || 'Student'}{' '}
                          <span className="text-xs font-semibold text-gray-500">
                            ({req.classId?.className || 'Class'})
                          </span>
                        </h4>
                        <p className="text-xs font-mono text-gray-400">ID: {req.studentId?.studentId || 'N/A'}</p>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                      req.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {req.status === 'approved' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {req.status === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                    <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                      <span className="text-gray-400 font-medium block mb-1">Leave Date & Reason:</span>
                      <p className="font-bold text-blue-600 mb-1">
                        📅 {new Date(req.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-gray-700 dark:text-slate-300">"{req.reason}"</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                      <span className="text-gray-400 font-medium block mb-1">Approval Info & Message:</span>
                      <p className="font-semibold text-gray-800 dark:text-slate-200">
                        Reviewed by: <span className="font-bold">{req.reviewedBy?.name || 'Teacher'}</span>
                      </p>
                      {req.reviewedAt && (
                        <p className="text-[11px] text-gray-400">Date: {new Date(req.reviewedAt).toLocaleString()}</p>
                      )}
                      {req.comment ? (
                        <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                          💬 "{req.comment}"
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-gray-400 italic">No custom comment added.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-12 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl text-gray-500 space-y-2">
                <History className="w-12 h-12 text-gray-300 mx-auto" />
                <p className="font-bold text-base text-gray-700 dark:text-slate-300">No Leave History Available</p>
                <p className="text-xs text-gray-400">Approved or rejected leave requests will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Action Confirmation Modal */}
        {actionModal.open && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                  {actionModal.actionType === 'approve' ? '✅ Approve Leave Request' : '❌ Reject Leave Request'}
                </h3>
                <button 
                  onClick={() => setActionModal({ open: false, request: null, actionType: null, comment: '' })}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-gray-600 dark:text-slate-300 space-y-2">
                <p>Student: <strong className="text-gray-900 dark:text-white">{actionModal.request?.studentId?.name}</strong></p>
                <p>Leave Date: <strong className="text-blue-600">{new Date(actionModal.request?.date).toLocaleDateString()}</strong></p>
                <p className="bg-gray-50 dark:bg-slate-800 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700">Reason: "{actionModal.request?.reason}"</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">
                  Approval Message / Comment <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={actionModal.comment}
                  onChange={(e) => setActionModal(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder={actionModal.actionType === 'approve' ? "e.g., Approved. Take care and catch up on missed homework!" : "e.g., Rejected due to upcoming term exams."}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500 h-24 font-medium text-gray-900 dark:text-white placeholder-gray-400"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal({ open: false, request: null, actionType: null, comment: '' })}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={isProcessing}
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-60 ${
                    actionModal.actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isProcessing && <Loader2 size={14} className="animate-spin" />}
                  {isProcessing ? 'Processing...' : actionModal.actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherLeaveRequests;
