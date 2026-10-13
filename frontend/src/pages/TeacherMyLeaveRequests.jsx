import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Calendar, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';

const TeacherMyLeaveRequests = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    leaveType: 'Casual',
    reason: ''
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/staff-leave/my');
      setLeaves(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/staff-leave', formData);
      if (res.data.success) {
        toast.success('Leave request submitted successfully');
        setShowModal(false);
        fetchLeaves();
        setFormData({ startDate: '', endDate: '', leaveType: 'Casual', reason: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request');
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'Approved') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'Rejected') return <XCircle className="w-5 h-5 text-red-500" />;
    return <Clock className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusStyle = (status) => {
    if (status === 'Approved') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'Rejected') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-soft border border-gray-50 gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">My Leave Requests</h2>
            <p className="text-gray-500 font-semibold">Manage your staff leave requests here</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-primary hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-md"
          >
            <Plus className="w-5 h-5" />
            New Request
          </button>
        </div>

        {loading ? (
          <div className="text-center p-12 text-gray-500">Loading requests...</div>
        ) : leaves.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaves.map((leave) => (
              <div key={leave._id} className="bg-white p-6 rounded-3xl shadow-soft border border-gray-50 flex flex-col hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${getStatusStyle(leave.status)}`}>
                    {getStatusIcon(leave.status)} {leave.status}
                  </span>
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {leave.leaveType}
                  </span>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-gray-700 font-bold mb-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {new Date(leave.startDate).toLocaleDateString()}
                    {new Date(leave.startDate).getTime() !== new Date(leave.endDate).getTime() && ` - ${new Date(leave.endDate).toLocaleDateString()}`}
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Reason</p>
                    <p className="text-gray-700 text-sm font-medium">{leave.reason}</p>
                  </div>
                </div>

                {leave.status === 'Rejected' && leave.rejectionReason && (
                  <div className="mt-auto pt-3 border-t border-gray-100">
                    <p className="text-xs text-red-600 font-medium"><span className="font-bold">Rejection Reason:</span> {leave.rejectionReason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl shadow-soft text-center border border-dashed border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Leave Requests</h3>
            <p className="text-gray-500">You haven't submitted any leave requests yet.</p>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Request Leave</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Start Date</label>
                    <input 
                      type="date" 
                      required 
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">End Date</label>
                    <input 
                      type="date" 
                      required 
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-gray-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Leave Type</label>
                  <select 
                    value={formData.leaveType}
                    onChange={(e) => setFormData({...formData, leaveType: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-gray-700"
                  >
                    <option value="Casual">Casual</option>
                    <option value="Sick">Sick</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Reason</label>
                  <textarea 
                    required 
                    rows="3"
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    placeholder="Briefly explain the reason..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-medium text-gray-700"
                  ></textarea>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="w-1/2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition">Cancel</button>
                  <button type="submit" className="w-1/2 py-3 bg-primary hover:bg-red-700 text-white rounded-xl font-bold transition shadow-md">Submit</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherMyLeaveRequests;
