import Layout from '../components/layout/Layout';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const StudentAttendance = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await api.get('/attendance/my');
        setData(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!data) return <div className="p-6">Data unavailable</div>;

  const { records, stats } = data;

  return (
    <Layout>
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Attendance</h2>
        <Link to="/student/leave/request" className="bg-orange-500 text-white px-4 py-2 rounded font-bold hover:bg-orange-600">
          Request Leave
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 shadow rounded text-center border-b-4 border-blue-500">
          <p className="text-sm text-gray-500 uppercase font-semibold">Attendance Rate</p>
          <p className="text-4xl font-bold text-blue-600 mt-2">{stats.percentage}%</p>
        </div>
        <div className="bg-white p-6 shadow rounded text-center">
          <p className="text-sm text-gray-500 uppercase font-semibold">Present</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.present}</p>
        </div>
        <div className="bg-white p-6 shadow rounded text-center">
          <p className="text-sm text-gray-500 uppercase font-semibold">Absent</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.absent}</p>
        </div>
        <div className="bg-white p-6 shadow rounded text-center">
          <p className="text-sm text-gray-500 uppercase font-semibold">Leave</p>
          <p className="text-3xl font-bold text-orange-500 mt-2">{stats.leave}</p>
        </div>
      </div>

      <div className="bg-white shadow rounded p-6">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h3 className="text-xl font-bold">Recent History</h3>
          <Link to="/student/attendance/history" className="text-blue-600 font-semibold hover:underline">View All &rarr;</Link>
        </div>
        
        {records.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {records.slice(0, 10).map(r => (
              <li key={r._id} className="py-3 flex justify-between items-center">
                <span className="font-semibold text-gray-700">{new Date(r.date).toLocaleDateString()}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize
                  ${r.status === 'present' ? 'bg-green-100 text-green-800' : 
                    r.status === 'absent' ? 'bg-red-100 text-red-800' : 
                    'bg-orange-100 text-orange-800'}`}
                >
                  {r.status} {r.status === 'present' ? '🟢' : r.status === 'absent' ? '🔴' : '🟡'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center py-4">No attendance records found.</p>
        )}
      </div>
    </div>
    </Layout>
  );
};

export default StudentAttendance;
