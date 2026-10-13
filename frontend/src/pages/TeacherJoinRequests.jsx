import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const TeacherJoinRequests = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await api.get('/class-requests/my-classes');
      setRequests(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests');
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id, action) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/class-requests/${id}/${action}`);
      setSuccess(`Request ${action}d successfully`);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} request`);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Join Requests</h2>
        <Link to="/teacher/classes" className="text-blue-600 hover:underline">Back to My Classes</Link>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

      <div className="bg-white shadow rounded">
        {requests.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {requests.map(req => (
              <li key={req._id} className="p-4 flex flex-col md:flex-row justify-between md:items-center">
                <div className="mb-4 md:mb-0">
                  <div className="font-bold text-lg text-blue-800">{req.classId.className}</div>
                  <div className="text-gray-800 font-medium">{req.studentId.name}</div>
                  <div className="text-sm text-gray-500 font-mono">ID: {req.studentId.studentId || 'N/A'}</div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAction(req._id, 'approve')}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-semibold"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleAction(req._id, 'reject')}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-semibold"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 text-center text-gray-500">No pending requests.</div>
        )}
      </div>
    </div>
    </Layout>
  );
};

export default TeacherJoinRequests;
