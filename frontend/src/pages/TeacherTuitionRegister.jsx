import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { UserPlus, IndianRupee } from 'lucide-react';

const TeacherTuitionRegister = () => {
  const [loading, setLoading] = useState(true);
  const { currentUser } = useContext(AuthContext);
  const [standards, setStandards] = useState([]);
  
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    password: '',
    gender: 'Male',
    standardId: '',
    feeAmount: '',
    feePeriod: 'Monthly',
    feeDetails: 'Monthly Tuition'
  });

  const currentUserId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    fetchStandards();
  }, []);

  const fetchStandards = async () => {
    try {
      setLoading(true);
      const res = await api.get('/standards');
      const stds = res.data?.data || [];
      setStandards(stds);
      if (stds.length > 0) {
        setFormData(prev => ({ ...prev, standardId: stds[0]._id }));
      }
    } catch (error) {
      toast.error('Failed to load standards');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!formData.studentId.trim() || !formData.name.trim() || !formData.password.trim() || !formData.feeAmount || !formData.feeDetails.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Create student and automatically create tuition fee record
      const res = await api.post('/general-register/tuition-students/register', formData);
      toast.success(res.data.message || 'Tuition student registered successfully', { duration: 5000 });
      
      // Reset form
      setFormData({
        studentId: '',
        name: '',
        password: '',
        gender: 'Male',
        standardId: standards.length > 0 ? standards[0]._id : '',
        feeAmount: '',
        feePeriod: 'Monthly',
        feeDetails: 'Monthly Tuition'
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg flex items-center gap-4">
          <UserPlus size={32} className="text-white/80" />
          <div>
            <h2 className="text-2xl font-bold">Tuition Student Registration</h2>
            <p className="text-blue-100 mt-1">Register a new student and setup their fee automatically.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center p-8 text-gray-500">Loading...</div>
        ) : (
          <form onSubmit={handleRegister} className="bg-white dark:bg-[#0B1120] rounded-2xl shadow-soft border border-gray-100 dark:border-[#1E293B] p-8 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Student ID <span className="text-red-500">*</span>
                </label>
                <input 
                  required 
                  type="text" 
                  className="w-full border border-gray-200 dark:border-[#334155] bg-gray-50 dark:bg-[#172235] text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                  value={formData.studentId} 
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} 
                  placeholder="e.g. STU001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input 
                  required 
                  type="text" 
                  className="w-full border border-gray-200 dark:border-[#334155] bg-gray-50 dark:bg-[#172235] text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="Student Full Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input 
                  required 
                  type="text" 
                  className="w-full border border-gray-200 dark:border-[#334155] bg-gray-50 dark:bg-[#172235] text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                  value={formData.password} 
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                  placeholder="Login Password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select 
                  required
                  className="w-full border border-gray-200 dark:border-[#334155] bg-gray-50 dark:bg-[#172235] text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                  value={formData.gender} 
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Standard <span className="text-red-500">*</span>
                </label>
                <select 
                  required
                  className="w-full border border-gray-200 dark:border-[#334155] bg-gray-50 dark:bg-[#172235] text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                  value={formData.standardId} 
                  onChange={(e) => setFormData({ ...formData, standardId: e.target.value })} 
                >
                  {standards.length === 0 && <option value="">No standards available</option>}
                  {standards.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-[#1E293B] pt-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <IndianRupee size={20} className="text-green-600" /> Initial Fee Setup
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#172235] px-3 py-1 rounded-full font-semibold border border-gray-200 dark:border-[#334155]">
                  Auto resets on cycle start
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fee Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    required 
                    type="number" 
                    className="w-full border border-gray-200 dark:border-[#334155] bg-gray-50 dark:bg-[#172235] text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                    value={formData.feeAmount} 
                    onChange={(e) => setFormData({ ...formData, feeAmount: e.target.value })} 
                    placeholder="e.g. 2500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fee Frequency / Cycle <span className="text-red-500">*</span>
                  </label>
                  <select 
                    required 
                    className="w-full border border-gray-200 dark:border-[#334155] bg-gray-50 dark:bg-[#172235] text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition cursor-pointer font-medium" 
                    value={formData.feePeriod} 
                    onChange={(e) => {
                      const period = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        feePeriod: period,
                        feeDetails: period === 'Monthly' ? 'Monthly Tuition' : 'Yearly Tuition'
                      }));
                    }}
                  >
                    <option value="Monthly">📅 Month (Auto 1st Pending)</option>
                    <option value="Yearly">📆 Year (Auto Yearly Incomplete)</option>
                  </select>
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fee Details <span className="text-red-500">*</span>
                  </label>
                  <input 
                    required 
                    type="text" 
                    className="w-full border border-gray-200 dark:border-[#334155] bg-gray-50 dark:bg-[#172235] text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                    value={formData.feeDetails} 
                    onChange={(e) => setFormData({ ...formData, feeDetails: e.target.value })} 
                    placeholder="e.g. Monthly Maths Tuition"
                  />
                </div> */}
              </div>

              <div className="mt-3 p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl text-xs text-blue-800 dark:text-blue-300">
                {formData.feePeriod === 'Monthly' ? (
                  <span>🔄 <strong>Monthly Cycle:</strong> Every 1st date of the month, fee status automatically changes to <strong>Pending</strong>. Teachers can manually mark it <strong>Completed</strong> when the student pays.</span>
                ) : (
                  <span>🔄 <strong>Yearly Cycle:</strong> Once a year, fee status automatically changes to <strong>Incomplete (Pending)</strong>. Teachers can manually mark it <strong>Completed</strong> when the student pays.</span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                className="px-8 py-3 text-sm font-semibold bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
              >
                Register & Create Fee
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default TeacherTuitionRegister;
