import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const TeacherAttendanceList = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classes/my-classes');
        setClasses(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Attendance</h2>
        <Link to="/teacher/student-leaves" className="bg-orange-500 text-white px-4 py-2 rounded font-bold hover:bg-orange-600">
          Student Leaves
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <p>Loading...</p>
        ) : classes.length > 0 ? (
          classes.map(cls => (
            <div key={cls._id} className="bg-white border-l-4 border-blue-500 rounded shadow p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">{cls.className}</h3>
                <p className="text-gray-600 mb-4">Students: {cls.students?.length}</p>
              </div>
              <div className="flex gap-2">
                <Link to={`/teacher/attendance/${cls._id}`} className="bg-blue-600 text-white px-4 py-2 rounded font-semibold text-center hover:bg-blue-700 flex-1">
                  Take Attendance
                </Link>
                <Link to={`/teacher/attendance/${cls._id}/report`} className="bg-gray-100 text-gray-800 border px-4 py-2 rounded font-semibold text-center hover:bg-gray-200 flex-1">
                  Report
                </Link>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No classes found.</p>
        )}
      </div>
    </div>
    </Layout>
  );
};

export default TeacherAttendanceList;
