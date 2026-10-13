import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';

const TeacherAttendance = () => {
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionRecord, setSessionRecord] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setMessage('');
      try {
        const clsRes = await api.get(`/classes/${classId}`);
        setClassData(clsRes.data.data);

        const attRes = await api.get(`/attendance/session/${classId}?date=${date}`);
        const existingSession = attRes.data.data;
        setSessionRecord(existingSession);
        
        // Map students to attendance state
        const initialAttendance = clsRes.data.data.students.map(student => {
          let recordStatus = 'present';
          if (existingSession && existingSession.records) {
            const match = existingSession.records.find(r => (r.studentId?._id || r.studentId) === student._id);
            if (match) recordStatus = match.status;
          }
          return {
            studentId: student._id,
            name: student.name,
            status: recordStatus
          };
        });
        setAttendance(initialAttendance);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [classId, date]);

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => prev.map(a => a.studentId === studentId ? { ...a, status } : a));
  };

  const markAllPresent = () => {
    setAttendance(prev => prev.map(a => ({ ...a, status: 'present' })));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        classId,
        date,
        session: 'DAILY',
        attendance: attendance.map(a => ({ studentId: a.studentId, status: a.status }))
      };
      await api.post('/attendance/session', payload);
      setMessage('Attendance saved successfully');
      
      // Re-fetch to lock the UI
      const attRes = await api.get(`/attendance/session/${classId}?date=${date}`);
      setSessionRecord(attRes.data.data);
    } catch (err) {
      if (err.response?.status === 409) {
        setMessage('Attendance has already been submitted for this class today.');
      } else {
        setMessage(err.response?.data?.message || 'Failed to save attendance');
      }
    } finally {
      setSaving(false);
    }
  };

  const stats = attendance.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, { present: 0, absent: 0, leave: 0 });

  if (loading) return <div className="p-6">Loading...</div>;
  if (!classData) return <div className="p-6">Class not found</div>;

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link to="/teacher/attendance" className="text-blue-600 hover:underline">&larr; Back to Attendance</Link>
      </div>

      <div className="bg-white p-6 shadow rounded border-t-4 border-blue-600 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold">{classData.className} Attendance</h2>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date:</label>
            <input 
              type="date" 
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold w-full sm:w-auto"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]} // prevent future dates
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4 bg-gray-50 p-4 rounded border">
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 font-bold text-sm">
            <span className="text-green-700">Present: {stats.present}</span>
            <span className="text-red-700">Absent: {stats.absent}</span>
            <span className="text-orange-600">Leave: {stats.leave}</span>
          </div>
          {!sessionRecord && (
            <button 
              onClick={markAllPresent} 
              className="w-full md:w-auto bg-green-100 text-green-800 px-4 py-2 rounded text-sm font-bold border border-green-300 hover:bg-green-200"
            >
              Mark All Present
            </button>
          )}
        </div>

        {sessionRecord ? (
          <div className="p-4 rounded mb-4 font-semibold bg-green-50 border border-green-200 text-green-800 flex flex-col md:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">✅</span>
              <span>Attendance Completed for Today</span>
            </div>
            <div className="text-sm font-medium text-green-700">
              Submitted by {sessionRecord.submittedBy?.name || 'Teacher'} at {new Date(sessionRecord.submittedAt).toLocaleTimeString()}
            </div>
          </div>
        ) : message && (
          <div className={`p-3 rounded mb-4 font-semibold ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        <div className="border rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-100/80 border-b">
                <th className="p-3 text-sm md:text-base font-bold text-gray-700">Student Name</th>
                <th className="p-3 text-sm md:text-base font-bold text-gray-700 text-right sm:text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendance.map(student => (
                <tr key={student.studentId} className="hover:bg-gray-50/80 transition">
                  <td className="p-3 font-bold text-gray-900 text-sm md:text-base">{student.name}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end sm:justify-start gap-1.5 sm:gap-2">
                      <label
                        title="Present"
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border text-xs sm:text-sm font-black flex items-center justify-center cursor-pointer transition select-none ${
                          student.status === 'present'
                            ? 'bg-green-600 text-white border-green-600 shadow-xs'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-green-50 hover:text-green-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                        } ${sessionRecord ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`status-${student.studentId}`}
                          value="present"
                          checked={student.status === 'present'}
                          onChange={() => !sessionRecord && handleStatusChange(student.studentId, 'present')}
                          disabled={!!sessionRecord}
                          className="sr-only"
                        />
                        P
                      </label>

                      <label
                        title="Absent"
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border text-xs sm:text-sm font-black flex items-center justify-center cursor-pointer transition select-none ${
                          student.status === 'absent'
                            ? 'bg-red-600 text-white border-red-600 shadow-xs'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                        } ${sessionRecord ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`status-${student.studentId}`}
                          value="absent"
                          checked={student.status === 'absent'}
                          onChange={() => !sessionRecord && handleStatusChange(student.studentId, 'absent')}
                          disabled={!!sessionRecord}
                          className="sr-only"
                        />
                        A
                      </label>

                      <label
                        title="Leave"
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border text-xs sm:text-sm font-black flex items-center justify-center cursor-pointer transition select-none ${
                          student.status === 'leave'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-amber-50 hover:text-amber-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                        } ${sessionRecord ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`status-${student.studentId}`}
                          value="leave"
                          checked={student.status === 'leave'}
                          onChange={() => !sessionRecord && handleStatusChange(student.studentId, 'leave')}
                          disabled={!!sessionRecord}
                          className="sr-only"
                        />
                        L
                      </label>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!sessionRecord && (
          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full md:w-auto bg-blue-600 text-white font-bold px-8 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        )}
      </div>
    </div>
    </Layout>
  );
};

export default TeacherAttendance;
