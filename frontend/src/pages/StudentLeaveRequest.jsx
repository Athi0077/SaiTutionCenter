import Layout from '../components/layout/Layout';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  FileText, 
  Loader2, 
  Send,
  MessageCircle
} from 'lucide-react';

const StudentLeaveRequest = () => {
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // History State
  const [myRequests, setMyRequests] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    fetchMyLeaveRequests();
  }, []);

  const fetchMyLeaveRequests = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get('/leave-requests/my');
      setMyRequests(res.data.data || []);
    } catch (err) {
      console.error('Failed to load my leave requests history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!reason.trim()) {
      setError('Leave reason is required.');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/leave-requests', { date, reason });
      setSuccess('Leave request submitted successfully.');
      setDate('');
      setReason('');
      fetchMyLeaveRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <Link to="/student/attendance" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline mb-2">
            <ArrowLeft size={14} /> Back to Attendance
          </Link>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" /> Apply & Track Leave Requests
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Submit Form Block */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 border-t-4 border-t-blue-500 space-y-4">
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-500" /> Request Leave
            </h3>
            
            {error && <div className="bg-red-50 text-red-700 p-3 rounded-2xl text-xs font-semibold border border-red-200">{error}</div>}
            {success && <div className="bg-green-50 text-green-700 p-3 rounded-2xl text-xs font-semibold border border-green-200">{success}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block mb-1.5 font-bold text-gray-700 dark:text-slate-300">Leave Date</label>
                <input 
                  type="date" 
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900 dark:text-white text-xs"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block mb-1.5 font-bold text-gray-700 dark:text-slate-300">Reason</label>
                <textarea 
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl h-28 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900 dark:text-white text-xs"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Medical reasons, family event..."
                  required
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl shadow-md transition disabled:opacity-50 text-xs flex justify-center items-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>

          {/* Leave Request History Block */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" /> My Leave Requests History
              </h3>
              <span className="text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 px-2.5 py-1 rounded-full">
                {myRequests.length} Requests
              </span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {historyLoading ? (
                <div className="py-12 flex justify-center items-center text-gray-400">
                  <Loader2 size={28} className="animate-spin text-blue-600" />
                </div>
              ) : myRequests.length > 0 ? (
                myRequests.map((req) => (
                  <div 
                    key={req._id}
                    className={`p-4 rounded-2xl border transition space-y-2 ${
                      req.status === 'approved' 
                        ? 'bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40' 
                        : req.status === 'rejected'
                        ? 'bg-rose-50/40 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40'
                        : 'bg-amber-50/40 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-slate-200">
                        <Calendar size={14} className="text-blue-600" />
                        {new Date(req.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1 uppercase ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                          : req.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                      }`}>
                        {req.status === 'approved' && <CheckCircle size={12} />}
                        {req.status === 'rejected' && <XCircle size={12} />}
                        {req.status === 'pending' && <Clock size={12} />}
                        {req.status}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-slate-400 font-medium">
                      Reason: <span className="font-semibold text-gray-800 dark:text-slate-200">"{req.reason}"</span>
                    </p>

                    {/* Teacher Approval / Rejection Comment & Review Info */}
                    {req.status !== 'pending' && (
                      <div className="pt-2 border-t border-gray-200/60 dark:border-slate-800 text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-gray-500 dark:text-slate-400">
                          <span>Reviewed by: <strong>{req.reviewedBy?.name || 'Class Teacher'}</strong></span>
                          {req.reviewedAt && <span>{new Date(req.reviewedAt).toLocaleDateString()}</span>}
                        </div>

                        {req.comment ? (
                          <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-emerald-800 dark:text-emerald-300 font-bold flex items-start gap-1.5">
                            <MessageCircle size={14} className="shrink-0 mt-0.5" />
                            <span>Teacher Note: "{req.comment}"</span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-500 italic">
                            {req.status === 'approved' ? 'Approved by Class Teacher' : 'Rejected by Class Teacher'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No leave requests submitted yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentLeaveRequest;
