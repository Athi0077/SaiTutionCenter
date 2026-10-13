import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';

const PrincipalClassAttendance = () => {
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [clsRes, attRes] = await Promise.all([
          api.get(`/classes/${classId}`),
          api.get(`/attendance/class/${classId}?date=${date}`)
        ]);
        
        const cls = clsRes.data.data;
        setClassData(cls);

        const existingRecords = attRes.data.data;
        
        // Map all students to show attendance
        const mappedAttendance = cls.students.map(student => {
          const record = existingRecords.find(r => r.studentId._id === student._id);
          return {
            studentId: student._id,
            displayStudentId: student.studentId,
            name: student.name,
            status: record ? record.status : 'not_marked'
          };
        });
        
        setAttendance(mappedAttendance);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [classId, date]);

  const setToday = () => setDate(new Date().toISOString().split('T')[0]);
  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setDate(d.toISOString().split('T')[0]);
  };

  const totalStudents = attendance.length;
  const present = attendance.filter(a => a.status === 'present').length;
  const absent = attendance.filter(a => a.status === 'absent').length;
  const leave = attendance.filter(a => a.status === 'leave').length;
  const notMarked = attendance.filter(a => a.status === 'not_marked').length;
  
  const markedStudents = totalStudents - notMarked;
  const attendanceRate = markedStudents > 0 ? Math.round((present / markedStudents) * 100) : 0;

  if (loading && !classData) return <Layout><div className="p-12 text-center text-gray-500 font-medium">Loading class attendance...</div></Layout>;
  if (!classData) return <Layout><div className="p-12 text-center text-red-500 font-medium">Class not found.</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <Link to="/principal/attendance" className="text-gray-500 hover:text-green-600 transition font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            &larr; Back
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">
            {classData.standard} - {classData.section} Section
          </h2>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-soft border-t-4 border-green-500">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-800">Attendance Statistics</h3>
            
            <div className="flex items-center gap-3">
              <button onClick={setToday} className="px-4 py-2 text-sm font-bold bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">Today</button>
              <button onClick={setYesterday} className="px-4 py-2 text-sm font-bold bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition">Yesterday</button>
              <input 
                type="date" 
                className="border border-gray-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold text-gray-700 bg-gray-50"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-2">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total</p>
              <p className="text-3xl font-bold mt-2 text-gray-800">{totalStudents}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-xs text-green-700 uppercase font-bold tracking-wider">Present</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{present}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <p className="text-xs text-red-700 uppercase font-bold tracking-wider">Absent</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{absent}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <p className="text-xs text-orange-700 uppercase font-bold tracking-wider">Leave</p>
              <p className="text-3xl font-bold text-orange-500 mt-2">{leave}</p>
            </div>
            <div className="text-center p-4 bg-gray-100 rounded-xl">
              <p className="text-xs text-gray-600 uppercase font-bold tracking-wider">Not Marked</p>
              <p className="text-3xl font-bold text-gray-700 mt-2">{notMarked}</p>
            </div>
            <div className="text-center p-4 bg-primary-light rounded-xl">
              <p className="text-xs text-primary uppercase font-bold tracking-wider">Rate</p>
              <p className="text-3xl font-bold text-primary mt-2">{attendanceRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-800">Student List</h3>
            {notMarked === totalStudents && totalStudents > 0 && (
              <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider rounded-full border border-red-100">
                Attendance Not Submitted
              </span>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white border-b border-gray-100 text-gray-500 text-sm">
                  <th className="p-4 font-semibold uppercase tracking-wider">Student Name</th>
                  <th className="p-4 font-semibold uppercase tracking-wider">Student ID</th>
                  <th className="p-4 font-semibold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-gray-400 font-medium">
                      No students found in this class.
                    </td>
                  </tr>
                ) : (
                  attendance.map(student => (
                    <tr key={student.studentId} className="hover:bg-gray-50/50 transition">
                      <td className="p-4 font-bold text-gray-800">{student.name}</td>
                      <td className="p-4 text-gray-500 text-sm font-mono">{student.displayStudentId || 'N/A'}</td>
                      <td className="p-4">
                        {student.status === 'present' && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">Present</span>}
                        {student.status === 'absent' && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">Absent</span>}
                        {student.status === 'leave' && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">On Leave</span>}
                        {student.status === 'not_marked' && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">Not Marked</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrincipalClassAttendance;
