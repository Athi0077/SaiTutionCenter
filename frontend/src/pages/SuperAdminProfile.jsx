import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Camera, 
  Trash2, 
  LogOut, 
  CheckCircle2, 
  KeyRound 
} from 'lucide-react';

const SuperAdminProfile = () => {
  const { currentUser, updateUser, logout } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || ''
      }));
    }
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return toast.error("Full Name cannot be empty");
    }

    if (!formData.email.trim()) {
      return toast.error("Email Address cannot be empty");
    }

    if (formData.password) {
      if (formData.password.length < 6) {
        return toast.error("Password must be at least 6 characters long");
      }
      if (formData.password !== formData.confirmPassword) {
        return toast.error("Passwords do not match");
      }
    }

    try {
      setSubmitting(true);
      const res = await api.put('/users/profile', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        password: formData.password || undefined
      });

      if (res.data.success) {
        toast.success("Super Admin Profile updated successfully!");
        if (updateUser) {
          updateUser(res.data.user);
        }
        setFormData(prev => ({
          ...prev,
          password: '',
          confirmPassword: ''
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      return toast.error("Profile picture must be 1 MB or less.");
    }

    const picData = new FormData();
    picData.append('profilePic', file);

    try {
      setUploadingPic(true);
      const res = await api.post('/users/profile/upload', picData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('Profile picture updated!');
        if (updateUser) {
          updateUser({ profilePic: res.data.url });
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload picture');
    } finally {
      setUploadingPic(false);
    }
  };

  const handlePicDelete = async () => {
    try {
      setUploadingPic(true);
      const res = await api.delete('/users/profile/upload');
      if (res.data.success) {
        toast.success('Profile picture removed!');
        if (updateUser) {
          updateUser({ profilePic: '' });
        }
      }
    } catch (err) {
      toast.error('Failed to remove picture');
    } finally {
      setUploadingPic(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6 pb-8">
        
        {/* Banner Card - Exact Centered Layout from Screenshot */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden flex flex-col items-center text-center">
          
          {/* Centered Avatar Box */}
          <div className="relative group mb-4">
            {currentUser?.profilePic ? (
              <img 
                src={currentUser.profilePic} 
                alt="Super Admin Profile" 
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-indigo-500/30 shadow-2xl" 
              />
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl sm:text-5xl font-extrabold text-white shadow-2xl border-4 border-white/20">
                {currentUser?.name?.charAt(0).toUpperCase() || 'S'}
              </div>
            )}
            
            {/* Camera Upload Icon */}
            <label 
              className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2.5 rounded-2xl cursor-pointer hover:bg-indigo-500 transition-all shadow-lg border-2 border-white/40"
              title="Upload Profile Picture"
            >
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePicUpload} 
                disabled={uploadingPic} 
              />
              <Camera className="w-4 h-4" />
            </label>
          </div>

          {/* Role Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-2 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" /> Super Admin Profile
          </div>

          {/* User Name */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">{currentUser?.name || 'Super Admin'}</h1>
          
          {/* Email */}
          <p className="text-slate-300 text-sm flex items-center justify-center gap-1.5 mb-2">
            <Mail className="w-4 h-4 text-indigo-300 shrink-0" />
            {currentUser?.email}
          </p>
          
          {/* Remove Picture Link */}
          {currentUser?.profilePic && (
            <button 
              type="button" 
              onClick={handlePicDelete} 
              disabled={uploadingPic} 
              className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-semibold mb-4 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove Profile Photo
            </button>
          )}

          {/* Prominent Red Logout Button */}
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-2xl shadow-lg shadow-red-600/30 transition transform active:scale-95 border border-red-500/40 text-sm mt-2"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>

        </div>

        {/* Profile Settings Form */}
        <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-[#1E293B]">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Account Information Section */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-1 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Account Information
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                Update your Super Admin display name and primary contact email address.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                    SUPER ADMIN NAME <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input 
                      type="text" 
                      name="name"
                      required
                      placeholder="Enter Full Name"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                    EMAIL ADDRESS <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input 
                      type="email" 
                      name="email"
                      required
                      placeholder="admin@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Contact Details Section */}
            <div className="pt-2">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-1 flex items-center gap-2">
                <Phone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Contact Information
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                Optional phone number and location details for your administrative contact.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                    PHONE NUMBER
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input 
                      type="tel" 
                      name="phone"
                      placeholder="+91 9876543210"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                    ADDRESS / OFFICE LOCATION
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input 
                      type="text" 
                      name="address"
                      placeholder="Headquarters Office, City"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-[#1E293B]" />

            {/* Change Password Section */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-1 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Security & Password Management
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                Leave password fields blank if you do not wish to change your password.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                    NEW PASSWORD
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input 
                      type="password" 
                      name="password"
                      placeholder="Enter new password"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                    CONFIRM NEW PASSWORD
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input 
                      type="password" 
                      name="confirmPassword"
                      placeholder="Confirm new password"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={logout}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 transition"
              >
                <LogOut className="w-4 h-4" /> Logout Session
              </button>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50 shadow-lg shadow-indigo-600/30"
              >
                <CheckCircle2 className="w-5 h-5" />
                {submitting ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </Layout>
  );
};

export default SuperAdminProfile;
