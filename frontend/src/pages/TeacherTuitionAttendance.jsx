import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { AuthContext } from '../context/AuthContext';
import { Check, X, ArrowLeft, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const TeacherTuitionAttendance = () => {
  const { currentUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get('sessionId');
  const batchId = queryParams.get('batchId');
  const date = queryParams.get('date') || new Date().toISOString().split('T')[0];

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionId || !batchId) {
      toast.error('Session or Batch information missing');
      navigate('/teacher/tuition-timetable');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch batch to get students
        const batchRes = await api.get(`/batches`); // In a real app we'd have /batches/:id
        const batch = batchRes.data.find(b => b._id === batchId);
        
        if (!batch) throw new Error('Batch not found');
        
        // Setup initial attendance state based on students in batch
        const initialAtt = {};
        batch.students?.forEach(student => {
            // Need the full student object to display, but assuming batch.students might be populated. 
            // If not, we might only have IDs. Let's assume it returns { _id, name, rollNumber }
            initialAtt[student._id || student] = 'present';
        });
        
        // Fetch existing attendance if any
        const existingAttRes = await api.get(`/tuition-attendance?batchId=${batchId}&sessionId=${sessionId}&date=${date}`);
        if (existingAttRes.data.data && existingAttRes.data.data.length > 0) {
            existingAttRes.data.data.forEach(record => {
                initialAtt[record.studentId._id || record.studentId] = record.status;
            });
        }

        // To display students properly, we might need a students lookup if batch.students isn't populated
        // Let's assume it's populated for this demo, or we fetch it.
        // I will use batch.students as is, assuming populated.
        setStudents(batch.students || []);
        setAttendance(initialAtt);
      } catch (err) {
        toast.error('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId, batchId, date, navigate]);

  const handleMark = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const studentData = Object.keys(attendance).map(studentId => ({
        studentId,
        status: attendance[studentId]
      }));

      await api.post('/tuition-attendance', {
        batchId,
        sessionId,
        date,
        students: studentData
      });
      toast.success('Attendance marked successfully');
      navigate('/teacher/tuition-timetable');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/teacher/tuition-timetable')}
            className="p-2 bg-gray-100 dark:bg-[#1E293B] rounded-full hover:bg-gray-200 dark:hover:bg-[#334155] transition text-gray-700 dark:text-gray-300"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Mark Attendance</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Date: {new Date(date).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0B1120] rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-[#1E293B]">
          {loading ? (
            <div className="text-center p-8 text-gray-500">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="text-center p-8 text-gray-500 flex flex-col items-center">
              <Users size={48} className="text-gray-300 mb-4" />
              <p>No students found in this batch.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map(student => {
                  const sId = student._id || student;
                  const sName = student.name || 'Unknown Student';
                  const sStatus = attendance[sId];
                  
                  return (
                    <div key={sId} className="flex justify-between items-center p-4 border border-gray-100 dark:border-[#1E293B] rounded-xl">
                      <span className="font-semibold text-gray-800 dark:text-gray-200 truncate pr-2">
                        {sName}
                      </span>
                      <div className="flex bg-gray-100 dark:bg-[#172235] rounded-lg overflow-hidden border border-gray-200 dark:border-[#334155]">
                        <button
                          onClick={() => handleMark(sId, 'present')}
                          className={`px-3 py-1.5 flex items-center justify-center gap-1 text-sm font-medium transition ${
                            sStatus === 'present' ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1E293B]'
                          }`}
                        >
                          <Check size={14} /> P
                        </button>
                        <button
                          onClick={() => handleMark(sId, 'absent')}
                          className={`px-3 py-1.5 flex items-center justify-center gap-1 text-sm font-medium transition ${
                            sStatus === 'absent' ? 'bg-red-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1E293B]'
                          }`}
                        >
                          <X size={14} /> A
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-[#1E293B] flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Submit Attendance'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TeacherTuitionAttendance;
