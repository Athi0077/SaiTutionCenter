import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Users, Calendar, CheckSquare, Target, X, Save, Clock, ChevronRight } from 'lucide-react';
import Layout from '../components/layout/Layout';

const TeacherSpecialClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('list'); // list, students, attendance, progress
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  
  // Attendance State
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});

  // Progress State
  const [progressData, setProgressData] = useState([]);
  const [selectedStudentProgress, setSelectedStudentProgress] = useState(null);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/special-classes');
      setClasses(res.data.data);
    } catch (err) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const openClassView = async (cls, view) => {
    setSelectedClass(cls);
    setActiveView(view);
    
    try {
      if (view === 'students' || view === 'attendance') {
        const res = await api.get(`/special-classes/${cls._id}/enrollments`);
        const enrolled = res.data.data.filter(e => e.status === 'Enrolled');
        setStudents(enrolled);
      }
      
      if (view === 'progress') {
        const progRes = await api.get(`/special-classes/${cls._id}/progress`);
        setProgressData(progRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch class data');
    }
  };

  const fetchAttendanceForDate = async () => {
    try {
      const res = await api.get(`/special-classes/${selectedClass._id}/attendance?date=${attendanceDate}`);
      const records = {};
      res.data.data.forEach(r => {
        records[r.studentId] = r.status;
      });
      setAttendanceRecords(records);
    } catch (err) {
      toast.error('Failed to load attendance');
    }
  };

  useEffect(() => {
    if (activeView === 'attendance' && selectedClass) {
      fetchAttendanceForDate();
    }
  }, [attendanceDate, activeView]);

  const handleMarkAttendance = (studentId, status) => {
    setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const submitAttendance = async () => {
    try {
      const records = Object.keys(attendanceRecords).map(studentId => ({
        studentId,
        status: attendanceRecords[studentId]
      }));
      
      await api.post(`/special-classes/${selectedClass._id}/attendance`, {
        date: attendanceDate,
        records
      });
      toast.success('Attendance saved successfully');
    } catch (err) {
      toast.error('Failed to save attendance');
    }
  };

  const handleProgressChange = (skillIdx, newLevel) => {
    const updatedSkills = [...selectedStudentProgress.skillsProgress];
    updatedSkills[skillIdx].level = newLevel;
    setSelectedStudentProgress({ ...selectedStudentProgress, skillsProgress: updatedSkills });
  };

  const saveProgress = async () => {
    try {
      await api.put(`/special-classes/${selectedClass._id}/progress/${selectedStudentProgress.studentId._id}`, {
        skillsProgress: selectedStudentProgress.skillsProgress,
        feedback: selectedStudentProgress.feedback
      });
      toast.success('Progress updated');
      // refresh progress list
      const progRes = await api.get(`/special-classes/${selectedClass._id}/progress`);
      setProgressData(progRes.data.data);
      setSelectedStudentProgress(null);
    } catch (err) {
      toast.error('Failed to save progress');
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <Layout>
    <div className="p-6 max-w-7xl mx-auto">
      {activeView === 'list' && (
        <>
          <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">My Assigned Classes</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {classes.length === 0 ? (
              <p className="text-gray-500 col-span-full">No special classes assigned to you.</p>
            ) : (
              classes.map(cls => (
                <div key={cls._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded-full">{cls.category}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{cls.status}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{cls.title}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{cls.description}</p>
                    <div className="space-y-2 text-sm text-gray-600 mb-6">
                      <div className="flex items-center gap-2"><Clock size={16} /> {cls.daysOfWeek?.join(', ')} ({cls.startTime} - {cls.endTime})</div>
                      <div className="flex items-center gap-2"><Users size={16} /> {cls.enrolledCount} Students Enrolled</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t pt-4">
                    <button onClick={() => openClassView(cls, 'students')} className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition">
                      <Users size={20} className="mb-1" />
                      <span className="text-xs font-medium">Students</span>
                    </button>
                    <button onClick={() => openClassView(cls, 'attendance')} className="flex flex-col items-center justify-center p-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition">
                      <CheckSquare size={20} className="mb-1" />
                      <span className="text-xs font-medium">Attendance</span>
                    </button>
                    <button onClick={() => openClassView(cls, 'progress')} className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition">
                      <Target size={20} className="mb-1" />
                      <span className="text-xs font-medium">Progress</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeView !== 'list' && (
        <div>
          <button onClick={() => setActiveView('list')} className="flex items-center text-blue-600 hover:text-blue-800 mb-4 font-medium">
            &larr; Back to Classes
          </button>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold">{selectedClass?.title}</h2>
                <p className="text-sm text-gray-500 capitalize">{activeView} Management</p>
              </div>
              {activeView === 'attendance' && (
                <div className="flex gap-4 items-center">
                  <input type="date" className="p-2 border rounded-lg text-sm" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
                  <button onClick={submitAttendance} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Save size={16} /> Save Attendance
                  </button>
                </div>
              )}
            </div>

            <div className="p-6">
              {/* STUDENTS VIEW */}
              {activeView === 'students' && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-sm border-b">
                      <th className="p-3 font-medium">Student Name</th>
                      <th className="p-3 font-medium">ID</th>
                      <th className="p-3 font-medium">Standard & Section</th>
                      <th className="p-3 font-medium">Enrolled Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(enr => (
                      <tr key={enr._id} className="border-b">
                        <td className="p-3 font-medium">{enr.studentId?.name}</td>
                        <td className="p-3 text-gray-500">{enr.studentId?.studentId}</td>
                        <td className="p-3 text-gray-500">{enr.standard} - {enr.section}</td>
                        <td className="p-3 text-gray-500">{new Date(enr.enrolledAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {students.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-gray-500">No students enrolled.</td></tr>}
                  </tbody>
                </table>
              )}

              {/* ATTENDANCE VIEW */}
              {activeView === 'attendance' && (
                <div className="space-y-4">
                  {students.map(enr => (
                    <div key={enr._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <p className="font-bold">{enr.studentId?.name}</p>
                        <p className="text-xs text-gray-500">{enr.standard} - {enr.section}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleMarkAttendance(enr.studentId._id, 'Present')}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${attendanceRecords[enr.studentId._id] === 'Present' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-600 border hover:bg-green-50'}`}
                        >
                          Present
                        </button>
                        <button 
                          onClick={() => handleMarkAttendance(enr.studentId._id, 'Absent')}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${attendanceRecords[enr.studentId._id] === 'Absent' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-gray-600 border hover:bg-red-50'}`}
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  ))}
                  {students.length === 0 && <p className="text-center text-gray-500">No students enrolled.</p>}
                </div>
              )}

              {/* PROGRESS VIEW */}
              {activeView === 'progress' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 p-4 font-bold border-b text-gray-700">Students List</div>
                    <div className="divide-y divide-gray-100 h-96 overflow-y-auto">
                      {progressData.map(prog => (
                        <div 
                          key={prog._id} 
                          onClick={() => setSelectedStudentProgress(JSON.parse(JSON.stringify(prog)))}
                          className={`p-4 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition ${selectedStudentProgress?._id === prog._id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                        >
                          <div>
                            <p className="font-medium">{prog.studentId?.name}</p>
                            <p className="text-xs text-gray-500">{prog.studentId?.studentId}</p>
                          </div>
                          <ChevronRight size={16} className="text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl flex flex-col overflow-hidden bg-gray-50">
                    {selectedStudentProgress ? (
                      <div className="flex-1 flex flex-col">
                        <div className="p-4 border-b bg-white flex justify-between items-center">
                          <h3 className="font-bold text-lg">{selectedStudentProgress.studentId?.name}'s Progress</h3>
                          <button onClick={saveProgress} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">Save</button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-4">Skills Evaluation</h4>
                            <div className="space-y-4">
                              {selectedStudentProgress.skillsProgress.map((skill, idx) => (
                                <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                  <p className="font-medium mb-3">{skill.skillName}</p>
                                  <div className="flex flex-wrap gap-2">
                                    {['Not Started', 'Beginner', 'Developing', 'Good', 'Excellent'].map(level => (
                                      <button
                                        key={level}
                                        onClick={() => handleProgressChange(idx, level)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${skill.level === level ? 'bg-purple-600 text-white shadow-md' : 'bg-white border text-gray-600 hover:bg-purple-50'}`}
                                      >
                                        {level}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Teacher Feedback</h4>
                            <textarea 
                              rows="3" 
                              className="w-full p-3 border rounded-xl text-sm"
                              placeholder="Write optional feedback here..."
                              value={selectedStudentProgress.feedback || ''}
                              onChange={(e) => setSelectedStudentProgress({...selectedStudentProgress, feedback: e.target.value})}
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 p-10 text-center">
                        Select a student from the list to update their progress and feedback.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </Layout>
  );
};

export default TeacherSpecialClasses;
