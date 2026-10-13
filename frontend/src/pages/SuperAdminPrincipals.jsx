import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Users, Plus, Edit, Key, PowerOff, Power, X } from 'lucide-react';

const SuperAdminPrincipals = () => {
  const [principals, setPrincipals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedPrincipal, setSelectedPrincipal] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [resetForm, setResetForm] = useState({ newPassword: '' });
  const [formLoading, setFormLoading] = useState(false);

  const fetchPrincipals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/principals');
      setPrincipals(res.data.data);
    } catch (error) {
      toast.error('Failed to load principals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrincipals();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post('/super-admin/principals', createForm);
      toast.success('Principal created successfully');
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', email: '', password: '', phone: '' });
      fetchPrincipals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create principal');
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPrincipal) return;
    
    setFormLoading(true);
    try {
      await api.put(`/super-admin/principals/${selectedPrincipal._id}/reset-password`, { newPassword: resetForm.newPassword });
      toast.success('Password reset successfully');
      setIsResetPasswordModalOpen(false);
      setResetForm({ newPassword: '' });
      setSelectedPrincipal(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (principal) => {
    const action = principal.status === 'active' ? 'deactivate' : 'activate';
    
    if (action === 'deactivate') {
      if (!window.confirm(`Are you sure you want to deactivate ${principal.name}? They will no longer be able to log in.`)) {
        return;
      }
    }
    
    try {
      await api.put(`/super-admin/principals/${principal._id}/${action}`);
      toast.success(`Principal ${action}d successfully`);
      fetchPrincipals();
    } catch (error) {
      toast.error(`Failed to ${action} principal`);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Principal Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage all principal accounts in the system</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          <span>Add Principal</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Phone</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Created By</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Loading...</td>
                </tr>
              ) : principals.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No principals found</td>
                </tr>
              ) : (
                principals.map((principal) => (
                  <tr key={principal._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800 dark:text-gray-100">{principal.name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{principal.email}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{principal.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        principal.status === 'active' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {principal.status.charAt(0).toUpperCase() + principal.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {principal.createdBy ? principal.createdBy.name : <span className="text-gray-400">Legacy Account</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => {
                            setSelectedPrincipal(principal);
                            setIsResetPasswordModalOpen(true);
                          }}
                          className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition"
                          title="Reset Password"
                        >
                          <Key size={18} />
                        </button>
                        
                        <button 
                          onClick={() => handleToggleStatus(principal)}
                          className={`transition ${principal.status === 'active' ? 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400' : 'text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400'}`}
                          title={principal.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {principal.status === 'active' ? <PowerOff size={18} /> : <Power size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Create Principal Account</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-2.5 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input 
                    type="email" 
                    required
                    className="w-full p-2.5 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <input 
                    type="password" 
                    required
                    minLength={8}
                    className="w-full p-2.5 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number (Optional)</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-70"
                  >
                    {formLoading ? 'Creating...' : 'Create Principal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetPasswordModalOpen && selectedPrincipal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Reset Principal Password</h2>
              <button onClick={() => setIsResetPasswordModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Resetting password for <strong>{selectedPrincipal.name}</strong> ({selectedPrincipal.email}).
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                  <input 
                    type="text" 
                    required
                    minLength={8}
                    className="w-full p-2.5 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={resetForm.newPassword}
                    onChange={(e) => setResetForm({...resetForm, newPassword: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long.</p>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsResetPasswordModalOpen(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-70"
                  >
                    {formLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPrincipals;
