import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import toast from 'react-hot-toast';

const PrincipalAcademicYearCreate = () => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) return toast.error("All fields are required");

    try {
      setSubmitting(true);
      await api.post('/academic-years', { name, startDate, endDate });
      toast.success('Academic Year created successfully!');
      navigate('/principal/academic-years');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create academic year');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout role="principal">
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Create Next Academic Year</h2>
        <div className="bg-white p-8 rounded-2xl shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Academic Year Name</label>
              <input 
                type="text" 
                className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. 2027-2028"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                <input 
                  type="date" 
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                <input 
                  type="date" 
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
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
                {submitting ? 'Creating...' : 'Create Academic Year'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default PrincipalAcademicYearCreate;
