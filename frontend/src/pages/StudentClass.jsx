import Layout from '../components/layout/Layout';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import ChatRoom from '../components/common/ChatRoom';

const StudentClass = () => {
  const [classData, setClassData] = useState(null);
  const [staff, setStaff] = useState([]);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clsRes = await api.get('/classes/my-class');
        setClassData(clsRes.data.data);
        setStaff(clsRes.data.staff || []);
      } catch (err) {
        if (err.response?.status === 404) {
          try {
            const reqRes = await api.get('/class-requests/my-requests');
            if (reqRes.data.data.length > 0) {
              setRequest(reqRes.data.data[0]); // most recent request
            }
          } catch (reqErr) {
            console.error("Error fetching requests", reqErr);
          }
        } else {
          setError('Failed to load class information');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <Layout>
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">My Class</h2>

      {!classData && !request && (
        <div className="bg-white p-8 rounded shadow text-center border-t-4 border-blue-600">
          <p className="text-gray-600 mb-6">You haven't joined a class yet.</p>
          <Link to="/student/join-class" className="bg-blue-600 text-white font-bold py-2 px-6 rounded hover:bg-blue-700">
            Join Class
          </Link>
        </div>
      )}

      {request && request.status === 'pending' && !classData && (
        <div className="bg-white p-8 rounded shadow text-center border-t-4 border-orange-500">
          <h3 className="text-xl font-bold mb-2">Join Request</h3>
          <p className="mb-2">Class: <span className="font-semibold">{request.classId?.className}</span></p>
          <p className="text-orange-600 font-semibold mb-4">Status: Pending</p>
          <p className="text-sm text-gray-500">Waiting for Teacher approval.</p>
        </div>
      )}

      {request && request.status === 'rejected' && !classData && (
        <div className="bg-white p-8 rounded shadow text-center border-t-4 border-red-500">
          <h3 className="text-xl font-bold mb-2">Join Request</h3>
          <p className="mb-2">Class: <span className="font-semibold">{request.classId?.className}</span></p>
          <p className="text-red-600 font-semibold mb-6">Status: Rejected</p>
          <Link to="/student/join-class" className="bg-blue-600 text-white font-bold py-2 px-6 rounded hover:bg-blue-700">
            Choose Another Class
          </Link>
        </div>
      )}

      {classData && (
        <div className="bg-white p-6 rounded shadow border-t-4 border-green-600">
          <div className="flex justify-between items-start mb-6 border-b pb-4">
            <div>
              <h3 className="text-3xl font-bold text-gray-800">{classData.className}</h3>
              <p className="text-gray-600 mt-2">Class Teacher: <span className="font-semibold">{classData.teacherId?.name}</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Students</p>
              <p className="text-2xl font-bold">{classData.students?.length}</p>
            </div>
          </div>
          
          <h4 className="text-lg font-bold mb-4">Staff List</h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {staff.length > 0 ? staff.map(s => (
              <Link 
                to={`/student/syllabus/${encodeURIComponent(s.subject)}`} 
                key={s._id} 
                className="bg-gray-50 p-3 rounded border flex justify-between items-center text-gray-700 hover:bg-blue-50 hover:border-blue-200 transition group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold group-hover:text-blue-700">{s.teacherId?.name}</span>
                  {(s.isClassTeacher || classData.teacherId?._id === s.teacherId?._id) && (
                    <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Class Teacher</span>
                  )}
                </div>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded group-hover:bg-blue-200">{s.subject}</span>
              </Link>
            )) : (
              <p className="text-gray-500 text-sm">No staff assigned yet.</p>
            )}
          </ul>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-bold mb-4">Classmates</h4>
              <ul className="grid grid-cols-1 gap-4">
                {classData.students?.map(s => (
                  <li key={s._id} className="bg-gray-50 p-3 rounded border text-gray-700">
                    {s.name}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <ChatRoom entityType="class" entityId={classData._id} />
            </div>
          </div>
        </div>
      )}
    </div>
    </Layout>
  );
};

export default StudentClass;
