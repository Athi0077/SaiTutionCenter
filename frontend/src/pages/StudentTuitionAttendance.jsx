import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Calendar as CalendarIcon, Check, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const StudentTuitionAttendance = () => {
  const { currentUser } = useContext(AuthContext);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/tuition-attendance?studentId=${currentUser._id}`);
        setAttendance(res.data.data || res.data);
      } catch (err) {
        toast.error('Failed to load attendance');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser?._id) {
      fetchAttendance();
    }
  }, [currentUser]);

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const totalCount = attendance.length;
  const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Tuition Attendance</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">View your tuition class attendance history.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="text-lg font-bold mb-2">Overall Attendance</h3>
            <div className="text-4xl font-bold mb-1">{percentage}%</div>
            <p className="text-white/80 text-sm">{presentCount} out of {totalCount} classes attended</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0B1120] rounded-2xl shadow-soft border border-gray-100 dark:border-[#1E293B] overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-[#1E293B]">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Recent Classes</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading history...</div>
          ) : attendance.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No attendance records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#172235] text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-[#1E293B]">
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Batch</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[#1E293B]">
                  {attendance.sort((a,b) => new Date(b.date) - new Date(a.date)).map(record => (
                    <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-[#172235] transition text-gray-700 dark:text-gray-200">
                      <td className="p-4 font-semibold">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="p-4">{record.batchId?.batchName || 'Unknown Batch'}</td>
                      <td className="p-4">
                        {record.status === 'present' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                            <Check size={14} /> Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-semibold">
                            <X size={14} /> Absent
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentTuitionAttendance;
