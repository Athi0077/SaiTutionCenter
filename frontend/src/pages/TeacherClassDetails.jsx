import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ChatRoom from '../components/common/ChatRoom';
import { Search, Sparkles, User, Key, CheckCircle, Clock, UserPlus, Calendar, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const TeacherClassDetails = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add Student State
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');
  const [studentIdentifierInput, setStudentIdentifierInput] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Password Reset State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [studentToReset, setStudentToReset] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Fee Status State
  const [feeStatuses, setFeeStatuses] = useState({});
  const [feeLoading, setFeeLoading] = useState({});
  const [feeToast, setFeeToast] = useState(null);

  const handleResetPassword = (student) => {
    setStudentToReset(student);
    setTempPassword('');
    setResetModalOpen(true);
  };

  const confirmReset = async () => {
    try {
      setIsResetting(true);
      const res = await api.post(`/users/students/${studentToReset._id}/reset-password`);
      if (res.data.success) {
        setTempPassword(res.data.tempPassword);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  // Fetch fee statuses for the class
  const fetchFeeStatuses = async () => {
    try {
      const res = await api.get(`/fee-status/class/${classId}`);
      if (res.data.success) {
        setFeeStatuses(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch fee statuses:', err);
    }
  };

  // Update a student's fee status
  const handleFeeStatusChange = async (studentId, newStatus) => {
    setFeeLoading((prev) => ({ ...prev, [studentId]: true }));
    setFeeToast(null);
    try {
      const res = await api.put(`/fee-status/student/${studentId}`, { feeStatus: newStatus });
      if (res.data.success) {
        setFeeStatuses((prev) => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            feeStatus: newStatus,
            statusUpdatedAt: new Date().toISOString(),
          },
        }));
        setFeeToast({ type: 'success', message: `Fee status updated to "${newStatus}"` });
      }
    } catch (err) {
      setFeeToast({ type: 'error', message: err.response?.data?.message || 'Failed to update fee status' });
    } finally {
      setFeeLoading((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  // Fetch available registered students for adding to class
  const fetchAvailableStudents = async () => {
    try {
      setLoadingStudents(true);
      const res = await api.get('/general-register/students');
      if (res.data?.success) {
        setAvailableStudents(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load registered students:', err);
      toast.error('Could not fetch student register');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleOpenAddStudentModal = () => {
    setAddStudentModalOpen(true);
    fetchAvailableStudents();
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudentToAdd && !studentIdentifierInput.trim()) {
      toast.error('Please select a student or enter an ID/Name');
      return;
    }

    try {
      setAddingStudent(true);
      const payload = {};
      if (selectedStudentToAdd) {
        payload.studentId = selectedStudentToAdd;
      } else {
        payload.studentIdentifier = studentIdentifierInput.trim();
      }

      const res = await api.post(`/classes/${classId}/students`, payload);
      if (res.data?.success) {
        toast.success(res.data.message || 'Student added to class successfully!');
        setClassData(res.data.data);
        setSelectedStudentToAdd('');
        setStudentIdentifierInput('');
        setAddStudentModalOpen(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add student to class');
    } finally {
      setAddingStudent(false);
    }
  };

  const handleRemoveStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove ${studentName} from this class?`)) {
      return;
    }
    try {
      const res = await api.delete(`/classes/${classId}/students/${studentId}`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Student removed from class');
        setClassData(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove student');
    }
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (feeToast) {
      const timer = setTimeout(() => setFeeToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feeToast]);

  useEffect(() => {
    const fetchClass = async () => {
      try {
        const res = await api.get(`/classes/${classId}`);
        setClassData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load class');
      }
    };
    fetchClass();
    fetchFeeStatuses();
  }, [classId]);

  if (error) return <div className="p-6 text-red-600 font-bold">{error}</div>;
  if (!classData) return <div className="p-6">Loading...</div>;

  const filteredStudents = (classData.students || []).filter((student) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      student.name?.toLowerCase().includes(q) ||
      student.studentId?.toLowerCase().includes(q) ||
      student.grNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <Link to="/teacher/classes" className="text-red-600 font-bold hover:underline flex items-center gap-1 text-xs mb-2">
          &larr; Back to My Classes
        </Link>
      </div>
      
      <div className="bg-gradient-to-r from-red-900 via-rose-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold">{classData.className}</h2>
          <p className="text-xs text-slate-300 mt-1">
            Teacher: <span className="font-bold text-red-200">{classData.teacherId?.name || 'Assigned Staff'}</span> • Enrolled: <span className="font-bold text-red-200">{classData.students?.length || 0} Students</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={`/teacher/attendance`}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition border border-white/20 backdrop-blur-xs"
          >
            <Calendar className="w-4 h-4 text-red-300" /> Take Attendance
          </Link>
          <button
            onClick={handleOpenAddStudentModal}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-lg shadow-red-900/40"
          >
            <UserPlus className="w-4 h-4" /> Add Student
          </button>
          <div className="bg-white/10 px-4 py-2 rounded-2xl text-center border border-white/10 shrink-0">
            <p className="text-[10px] uppercase font-bold text-red-200">Enrolled</p>
            <p className="text-2xl font-black text-white">{classData.students?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Fee status toast notification */}
      {feeToast && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md ${
          feeToast.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <span>{feeToast.type === 'success' ? '✅' : '❌'}</span>
          {feeToast.message}
          <button onClick={() => setFeeToast(null)} className="ml-auto text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3 bg-white dark:bg-[#0b1120] shadow-sm rounded-3xl p-6 border border-gray-100 dark:border-[#1E293B] space-y-4">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-[#1E293B] pb-3">
            <div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <User className="w-5 h-5 text-red-600" /> Student List ({filteredStudents.length})
              </h3>
              <p className="text-xs text-gray-400">Click any student to view their complete academic and performance intelligence.</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students..."
                  className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <button
                onClick={handleOpenAddStudentModal}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {filteredStudents.length > 0 ? (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-gray-50 dark:bg-[#172235] text-gray-600 dark:text-slate-300 font-bold uppercase">
                  <tr>
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3 whitespace-nowrap min-w-[200px]">Student Info</th>
                    <th className="p-3 whitespace-nowrap w-44">Fee Status</th>
                    <th className="p-3 whitespace-nowrap text-right w-full">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#1E293B]">
                  {filteredStudents.map((student, index) => {
                    const status = feeStatuses[student._id]?.feeStatus || 'pending';
                    const isUpdating = feeLoading[student._id];
                    return (
                    <tr key={student._id} className="hover:bg-red-50/30 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3 text-gray-500 font-medium text-center">{index + 1}</td>
                      <td className="p-3 whitespace-nowrap">
                        <Link 
                          to={`/teacher/students/details/${student._id}`}
                          className="font-bold text-gray-900 dark:text-slate-100 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-2 transition"
                        >
                          <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 font-extrabold flex items-center justify-center text-xs overflow-hidden shrink-0">
                            {student.profilePic ? (
                              <img src={student.profilePic} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                              student.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div>{student.name}</div>
                            {classData.classLeader && classData.classLeader._id === student._id && (
                              <span className="bg-yellow-100 text-yellow-800 text-[9px] px-1.5 py-0.5 rounded border border-yellow-200 inline-block mt-0.5">👑 Class Leader</span>
                            )}
                          </div>
                        </Link>
                        <div className="text-gray-400 text-[10px] mt-0.5 font-mono">ID: {student.studentId || 'N/A'}</div>
                      </td>
                      <td className="p-3">
                        <div className="relative w-36">
                          <select
                            id={`fee-status-${student._id}`}
                            value={status}
                            disabled={isUpdating}
                            onChange={(e) => handleFeeStatusChange(student._id, e.target.value)}
                            className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all appearance-none pr-6 w-full
                              ${status === 'completed'
                                ? 'bg-green-50 text-green-700 border-green-200 hover:border-green-400'
                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400'
                              }
                              ${isUpdating ? 'opacity-60 cursor-wait' : ''}
                            `}
                          >
                            <option value="pending">⏳ Pending</option>
                            <option value="completed">✅ Completed</option>
                          </select>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/teacher/students/details/${student._id}`}
                            className="text-[11px] bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-lg font-bold transition inline-flex items-center gap-1 shadow-xs"
                          >
                            <Sparkles className="w-3 h-3" /> View Details
                          </Link>

                          <button 
                            onClick={() => handleResetPassword(student)}
                            className="text-[11px] bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg font-bold transition whitespace-nowrap"
                          >
                            Reset Pwd
                          </button>

                          <button
                            onClick={() => handleRemoveStudent(student._id, student.name)}
                            title="Remove student from class"
                            className="text-[11px] bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 p-2 rounded-lg font-bold transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-xs py-6 text-center">No students found.</p>
          )}
        </div>
        
        <div className="lg:w-1/3">
          <ChatRoom entityType="class" entityId={classData._id} />
        </div>
      </div>

      {resetModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 max-w-md w-full shadow-xl border border-gray-100 dark:border-[#1E293B]">
            <h3 className="text-lg font-extrabold mb-4 text-gray-900 dark:text-slate-100">Reset Student Password</h3>
            {!tempPassword ? (
              <>
                <p className="mb-4 text-xs text-gray-600 dark:text-slate-400">Are you sure you want to reset the password for <span className="font-bold text-gray-900 dark:text-slate-100">{studentToReset?.name}</span>? This will log them out of all active devices immediately.</p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setResetModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                  <button onClick={confirmReset} disabled={isResetting} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 text-xs font-bold rounded-xl disabled:opacity-50">
                    {isResetting ? 'Resetting...' : 'Yes, Reset Password'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 p-4 rounded-2xl mb-4 border border-green-200 dark:border-green-900/50">
                  <p className="font-bold text-xs mb-1">Password Reset Successful!</p>
                  <p className="text-[11px] mb-3">Please share this temporary password with the student:</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-white dark:bg-[#0b1120] px-3 py-2 rounded-xl border font-mono text-base flex-1 text-center font-bold text-emerald-600">{tempPassword}</code>
                    <button onClick={() => navigator.clipboard.writeText(tempPassword)} className="bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-green-700">Copy</button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setResetModalOpen(false)} className="px-4 py-2 bg-gray-800 text-white font-bold text-xs hover:bg-gray-900 rounded-xl">Done</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Student to Class Modal */}
      {addStudentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-[#1E293B] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-slate-100">Add Student to Class</h3>
                  <p className="text-[11px] text-gray-400">Enroll any student into this tuition batch</p>
                </div>
              </div>
              <button
                onClick={() => setAddStudentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Select Registered Student
                </label>
                {loadingStudents ? (
                  <p className="text-xs text-gray-400 py-2">Loading registered students...</p>
                ) : (
                  <select
                    value={selectedStudentToAdd}
                    onChange={(e) => {
                      setSelectedStudentToAdd(e.target.value);
                      if (e.target.value) setStudentIdentifierInput('');
                    }}
                    className="w-full p-2.5 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">-- Choose from General Register ({availableStudents.length} Students) --</option>
                    {availableStudents
                      .filter((s) => !classData.students?.some((cs) => (cs._id || cs) === s._id))
                      .map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.studentId || s.grNumber || 'No ID'}) - {s.standardId?.name || s.standard || 'General'}
                        </option>
                      ))}
                  </select>
                )}
                <p className="text-[10px] text-gray-400 mt-1">Select from students already registered in the tuition center.</p>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-slate-800"></div>
                <span className="shrink-0 mx-3 text-[10px] uppercase font-bold text-gray-400">Or Search by ID / Name</span>
                <div className="flex-grow border-t border-gray-200 dark:border-slate-800"></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Student ID, GR Number, or Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. STU1001, GR-042, or Student Name"
                  value={studentIdentifierInput}
                  onChange={(e) => {
                    setStudentIdentifierInput(e.target.value);
                    if (e.target.value) setSelectedStudentToAdd('');
                  }}
                  className="w-full p-2.5 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-slate-400 text-[11px]">Student not in tuition register?</span>
                <Link
                  to="/teacher/tuition-register"
                  className="text-red-600 dark:text-red-400 font-extrabold hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Register Student
                </Link>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setAddStudentModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingStudent || (!selectedStudentToAdd && !studentIdentifierInput.trim())}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition shadow-md shadow-red-900/20 flex items-center gap-1.5"
                >
                  {addingStudent ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
    </Layout>
  );
};

export default TeacherClassDetails;
