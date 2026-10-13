import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, Calendar, Check, X, FileText, Loader2 } from 'lucide-react';

const PrincipalStaffLeave = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState({
    open: false,
    leaveId: null,
    status: '',
    rejectionReason: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/staff-leave');
      setLeaves(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load staff leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    try {
      setIsProcessing(true);
      const res = await api.put(`/staff-leave/${actionModal.leaveId}/status`, {
        status: actionModal.status,
        rejectionReason: actionModal.rejectionReason
      });
      if (res.data.success) {
        toast.success(`Leave request ${actionModal.status.toLowerCase()} successfully`);
        fetchLeaves();
        setActionModal({ open: false, leaveId: null, status: '', rejectionReason: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update leave status');
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingLeaves = leaves.filter(l => l.status === 'Pending');
  const historyLeaves = leaves.filter(l => l.status !== 'Pending');

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-50 flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Staff Leave Management</h2>
            <p className="text-gray-500 font-semibold">Review and manage teacher leave requests</p>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="text-red-500 w-5 h-5" /> Pending Requests
          </h3>
          {pendingLeaves.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {pendingLeaves.map((leave) => (
                <div key={leave._id} className="bg-white p-5 rounded-2xl shadow-soft border border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0">
                      {leave.teacherId?.name?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{leave.teacherId?.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        {new Date(leave.startDate).toLocaleDateString()}
                        {new Date(leave.startDate).getTime() !== new Date(leave.endDate).getTime() && ` - ${new Date(leave.endDate).toLocaleDateString()}`}
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 ml-2">{leave.leaveType}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mt-2">
                        <p className="text-gray-700 text-sm font-medium">"{leave.reason}"</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 justify-end shrink-0">
                    <button 
                      onClick={() => setActionModal({ open: true, leaveId: leave._id, status: 'Approved', rejectionReason: '' })}
                      className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-bold rounded-xl transition flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button 
                      onClick={() => setActionModal({ open: true, leaveId: leave._id, status: 'Rejected', rejectionReason: '' })}
                      className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white font-bold rounded-xl transition flex items-center gap-1"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl shadow-soft text-center border border-dashed border-gray-200">
              <p className="text-gray-500 font-medium">No pending leave requests.</p>
            </div>
          )}
        </div>

        <div className="space-y-6 pt-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-gray-400 w-5 h-5" /> Leave History
          </h3>
          {historyLeaves.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {historyLeaves.map((leave) => (
                <div key={leave._id} className="bg-white p-5 rounded-2xl shadow-soft border border-gray-50 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-xs">
                        {leave.teacherId?.name?.charAt(0) || 'T'}
                      </div>
                      <span className="font-bold text-gray-900">{leave.teacherId?.name}</span>
                    </div>
                    {leave.status === 'Approved' ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Approved
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Rejected
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 font-medium mb-2">
                    {new Date(leave.startDate).toLocaleDateString()}
                    {new Date(leave.startDate).getTime() !== new Date(leave.endDate).getTime() && ` - ${new Date(leave.endDate).toLocaleDateString()}`}
                  </div>
                  
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 mb-2">
                    <p className="text-gray-500 text-xs truncate">"{leave.reason}"</p>
                  </div>

                  {leave.status === 'Rejected' && leave.rejectionReason && (
                    <p className="text-xs text-red-600 mt-2 font-medium">Reason: {leave.rejectionReason}</p>
                  )}
                  {leave.approvedBy && (
                    <p className="text-xs text-gray-400 mt-2">Action by: {leave.approvedBy.name}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl shadow-soft text-center border border-dashed border-gray-200">
              <p className="text-gray-500 font-medium">No leave history.</p>
            </div>
          )}
        </div>

        {/* Action Modal */}
        {actionModal.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {actionModal.status === 'Approved' ? 'Approve Leave' : 'Reject Leave'}
              </h3>
              
              {actionModal.status === 'Rejected' && (
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Rejection Reason</label>
                  <textarea 
                    required 
                    rows="3"
                    value={actionModal.rejectionReason}
                    onChange={(e) => setActionModal({...actionModal, rejectionReason: e.target.value})}
                    placeholder="Provide a reason for rejection..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-medium text-gray-700"
                  ></textarea>
                </div>
              )}
              
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setActionModal({ open: false, leaveId: null, status: '', rejectionReason: '' })}
                  className="w-1/2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAction}
                  disabled={isProcessing || (actionModal.status === 'Rejected' && !actionModal.rejectionReason)}
                  className={`w-1/2 py-3 rounded-xl font-bold transition shadow-md flex justify-center items-center gap-2 text-white ${
                    actionModal.status === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  } disabled:opacity-50`}
                >
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PrincipalStaffLeave;
