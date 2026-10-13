import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';

const PrincipalApprovals = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/users/pending-teachers');
      setTeachers(res.data.data);
    } catch (err) {
      setError('Failed to fetch pending teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/users/${id}/approve`);
      setTeachers(teachers.filter((t) => t._id !== id));
    } catch (err) {
      alert("Error approving teacher");
    }
  };

  const handleReject = async (id) => {
    try {
      await api.patch(`/users/${id}/reject`);
      setTeachers(teachers.filter((t) => t._id !== id));
    } catch (err) {
      alert("Error rejecting teacher");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Pending Teacher Approvals</h2>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : teachers.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-soft text-center">
            <p className="text-gray-500">No pending approvals found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teachers.map((teacher) => (
              <div key={teacher._id} className="bg-white p-6 rounded-2xl shadow-soft">
                <h3 className="text-lg font-bold text-gray-800">{teacher.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{teacher.email}</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleApprove(teacher._id)}
                    className="bg-green-100 text-green-700 font-semibold px-4 py-2 rounded-lg hover:bg-green-200 transition flex-1"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleReject(teacher._id)}
                    className="bg-red-100 text-red-700 font-semibold px-4 py-2 rounded-lg hover:bg-red-200 transition flex-1"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PrincipalApprovals;
