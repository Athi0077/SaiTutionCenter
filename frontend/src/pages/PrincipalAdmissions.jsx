import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import toast from 'react-hot-toast';

const PrincipalAdmissions = () => {
  const { id } = useParams(); // academic year ID
  const navigate = useNavigate();
  
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    name: '', password: '', classId: '', rollNumber: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classes');
        setClasses(res.data.data);
      } catch (err) {
        toast.error("Failed to fetch classes");
      }
    };
    fetchClasses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/admissions', { ...formData, academicYearId: id });
      toast.success("Student admitted successfully!");
      navigate('/principal/academic-years');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to admit student');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout role="principal">
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">New Admission</h2>
        <div className="bg-white p-8 rounded-2xl shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Student Name</label>
              <input 
                type="text" 
                required
                className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password (Default)</label>
                <input 
                  type="password" 
                  required
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Assign Class</label>
                <select 
                  required
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  value={formData.classId}
                  onChange={e => setFormData({...formData, classId: e.target.value})}
                >
                  <option value="">Select a class...</option>
                  {classes.map(c => (
                    <option key={c._id} value={c._id}>{c.className}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Roll Number (Optional)</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.rollNumber}
                  onChange={e => setFormData({...formData, rollNumber: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => navigate(-1)}
                className="px-6 py-3 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="px-6 py-3 rounded-xl font-medium text-white bg-primary hover:bg-primary-dark transition disabled:opacity-50"
              >
                {submitting ? 'Admitting...' : 'Admit Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default PrincipalAdmissions;
