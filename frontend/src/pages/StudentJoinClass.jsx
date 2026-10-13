import Layout from '../components/layout/Layout';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const StudentJoinClass = () => {
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classes/available');
        setAvailableClasses(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchClasses();
  }, []);

  const selectedClass = availableClasses.find(c => c._id === selectedClassId);

  const handleJoin = async () => {
    setError('');
    setSuccess('');
    if (!selectedClass) {
      setError('Selected class does not exist');
      return;
    }

    try {
      await api.post('/class-requests', { classId: selectedClass._id });
      setSuccess('Join request sent successfully! Waiting for teacher approval.');
      setTimeout(() => navigate('/student/class'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request');
    }
  };

  return (
    <Layout>
    <div className="p-6 max-w-md mx-auto">
      <div className="mb-4">
        <Link to="/student/class" className="text-blue-600 hover:underline">&larr; Back to Dashboard</Link>
      </div>
      <div className="bg-white p-8 rounded shadow border-t-4 border-blue-600">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Join a Class</h2>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700">Select Class</label>
          <select 
            className="w-full p-2 border rounded" 
            value={selectedClassId} 
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="">-- Select a Class --</option>
            {availableClasses.map(c => (
              <option key={c._id} value={c._id}>
                {c.className}
              </option>
            ))}
          </select>
        </div>

        {selectedClass ? (
          <div className="mb-6 p-4 bg-gray-50 border rounded text-center">
            <p className="text-sm text-gray-500 mb-1">Class found:</p>
            <p className="text-xl font-bold text-gray-800">{selectedClass.className}</p>
            <p className="text-sm text-gray-600">Teacher: {selectedClass.teacherId?.name}</p>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-orange-50 text-orange-700 border border-orange-200 rounded text-center text-sm">
            Please select a class from the dropdown above.
          </div>
        )}

        <button 
          onClick={handleJoin}
          disabled={!selectedClass}
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Send Join Request
        </button>
      </div>
    </div>
    </Layout>
  );
};

export default StudentJoinClass;
