import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Shield, Clock, Plus, X, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const PrincipalTemporaryAccess = () => {
  const [records, setRecords] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    teacherId: '',
    duration: '1',
    customStart: '',
    customEnd: '',
    reason: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordsRes, teachersRes] = await Promise.all([
        api.get('/temporary-principal-access'),
        api.get('/principal/teachers')
      ]);
      setRecords(recordsRes.data.data);
      setTeachers(teachersRes.data.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async (e) => {
    e.preventDefault();
    if (!formData.teacherId) return toast.error('Select a teacher');
    if (!formData.reason.trim()) return toast.error('Reason is required');

    let startAt = new Date();
    let expiresAt = new Date();

    if (formData.duration === 'Custom') {
      if (!formData.customStart || !formData.customEnd) {
        return toast.error('Please specify custom start and end times');
      }
      startAt = new Date(formData.customStart);
      expiresAt = new Date(formData.customEnd);
      
      if (startAt >= expiresAt) {
        return toast.error('Start time must be before expiry time');
      }
    } else {
      const days = parseInt(formData.duration);
      expiresAt.setDate(expiresAt.getDate() + days);
    }

    if (!window.confirm(`Are you sure you want to grant temporary Principal access to this teacher until ${expiresAt.toLocaleString()}?`)) {
      return;
    }

    try {
      await api.post('/temporary-principal-access', {
        teacherId: formData.teacherId,
        startAt: startAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        reason: formData.reason
      });
      toast.success('Temporary access granted successfully');
      setIsModalOpen(false);
      setFormData({ teacherId: '', duration: '1', customStart: '', customEnd: '', reason: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to grant access');
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm("Are you sure you want to revoke this access immediately?")) return;
    try {
      await api.patch(`/temporary-principal-access/${id}/revoke`);
      toast.success('Access revoked');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke access');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 w-max"><CheckCircle size={12}/> Active</span>;
      case 'Scheduled': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 w-max"><Clock size={12}/> Scheduled</span>;
      case 'Revoked': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 w-max"><AlertTriangle size={12}/> Revoked</span>;
      case 'Expired': return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 w-max"><Clock size={12}/> Expired</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">{status}</span>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="text-purple-600" /> Temporary Principal Access
          </h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-purple-700 transition font-semibold"
          >
            <Plus size={20} /> Grant Principal Access
          </button>
        </div>

        <div className="bg-white shadow-soft rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading access records...</div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Records Found</h3>
              <p className="text-gray-500">No temporary principal access has been granted yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-gray-600">
                    <th className="p-4 font-semibold">Teacher</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Start Time</th>
                    <th className="p-4 font-semibold">Expiry Time</th>
                    <th className="p-4 font-semibold">Reason</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {records.map(record => (
                    <tr key={record._id} className="hover:bg-gray-50/50 transition">
                      <td className="p-4">
                        <div className="font-bold text-gray-800">{record.teacherId?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{record.teacherId?.email}</div>
                      </td>
                      <td className="p-4">{getStatusBadge(record.status)}</td>
                      <td className="p-4 text-gray-600">{new Date(record.startAt).toLocaleString()}</td>
                      <td className="p-4 text-gray-600">{new Date(record.expiresAt).toLocaleString()}</td>
                      <td className="p-4 text-gray-600 max-w-[200px] truncate" title={record.reason}>{record.reason}</td>
                      <td className="p-4 text-right">
                        {(record.status === 'Active' || record.status === 'Scheduled') && (
                          <button 
                            onClick={() => handleRevoke(record._id)}
                            className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Grant Access Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Shield className="text-purple-600" /> Grant Access
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form id="grant-access-form" onSubmit={handleGrantAccess} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Select Teacher *</label>
                    <select 
                      required
                      value={formData.teacherId} onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select a Teacher</option>
                      {teachers.map(t => (
                        <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Access Duration *</label>
                    <select 
                      required
                      value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="1">1 Day (24 Hours)</option>
                      <option value="2">2 Days (48 Hours)</option>
                      <option value="3">3 Days (72 Hours)</option>
                      <option value="7">7 Days (1 Week)</option>
                      <option value="Custom">Custom Date & Time</option>
                    </select>
                  </div>
                  
                  {formData.duration === 'Custom' && (
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date & Time</label>
                        <input 
                          type="datetime-local" required
                          value={formData.customStart} onChange={(e) => setFormData({...formData, customStart: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Date & Time</label>
                        <input 
                          type="datetime-local" required
                          value={formData.customEnd} onChange={(e) => setFormData({...formData, customEnd: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Reason for Access *</label>
                    <textarea 
                      required
                      value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 min-h-[80px]"
                      placeholder="e.g. Covering principal duties during leave..."
                    />
                  </div>
                </form>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  form="grant-access-form"
                  type="submit"
                  className="bg-purple-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-purple-700 transition flex items-center gap-2"
                >
                  <Shield size={18} /> Grant Access
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PrincipalTemporaryAccess;
