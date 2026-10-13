import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Plus, Edit2, Trash2, X, Clock, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminTuitionSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  
  const [formData, setFormData] = useState({
    batchId: '',
    subjectId: '',
    teacherId: '',
    sessionType: 'recurring',
    dayOfWeek: 'Monday',
    sessionDate: '',
    startTime: '',
    endTime: '',
    room: ''
  });

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, standardsRes, teachersRes, subjectsRes] = await Promise.all([
        api.get('/tuition-sessions'),
        api.get('/standards'),
        api.get('/users/active-teachers'), // Correct endpoint to get teachers
        api.get('/subjects')
      ]);
      setSessions(sessionsRes.data);
      
      const allSections = [];
      if (standardsRes.data?.data) {
        standardsRes.data.data.forEach(std => {
          std.sections?.forEach(sec => {
            allSections.push({ ...sec, batchName: `${std.name} - ${sec.name}` });
          });
        });
      }
      setBatches(allSections);

      setTeachers(teachersRes.data.data || teachersRes.data || []);
      setSubjects(subjectsRes.data.data || subjectsRes.data || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleOpenModal = (session = null) => {
    if (session) {
      setEditingSession(session);
      setFormData({
        batchId: session.batchId?._id || '',
        subjectId: session.subjectId?._id || '',
        teacherId: session.teacherId?._id || '',
        sessionType: session.sessionType || 'recurring',
        dayOfWeek: session.dayOfWeek || 'Monday',
        sessionDate: session.sessionDate ? session.sessionDate.split('T')[0] : '',
        startTime: session.startTime || '',
        endTime: session.endTime || '',
        room: session.room || ''
      });
    } else {
      setEditingSession(null);
      setFormData({
        batchId: batches.length > 0 ? batches[0]._id : '',
        subjectId: '', // Ideally from batch's subjects
        teacherId: '', // Ideally from batch's teachers
        sessionType: 'recurring',
        dayOfWeek: 'Monday',
        sessionDate: '',
        startTime: '',
        endTime: '',
        room: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSession(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.sessionType === 'recurring') {
        payload.sessionDate = null;
      } else {
        payload.dayOfWeek = null;
      }

      if (editingSession) {
        await api.put(`/tuition-sessions/${editingSession._id}`, payload);
        toast.success('Session updated successfully');
      } else {
        await api.post('/tuition-sessions', payload);
        toast.success('Session created successfully');
      }
      handleCloseModal();
      fetchInitialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save session');
    }
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this session?")) return;
    try {
      await api.delete(`/tuition-sessions/${sessionId}`);
      toast.success('Session deleted successfully');
      fetchInitialData();
    } catch (err) {
      toast.error('Failed to delete session');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Tuition Timetable</h2>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus size={18} /> New Session
          </button>
        </div>

        <div className="bg-white dark:bg-[#0B1120] shadow-soft rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1E293B]">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading sessions...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#172235] text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-[#1E293B]">
                    <th className="p-4 font-medium">Batch</th>
                    <th className="p-4 font-medium">Subject & Teacher</th>
                    <th className="p-4 font-medium">Schedule</th>
                    <th className="p-4 font-medium">Time & Room</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[#1E293B]">
                  {sessions.length > 0 ? (
                    sessions.map(session => (
                      <tr key={session._id} className="hover:bg-gray-50 dark:hover:bg-[#172235] transition text-gray-700 dark:text-gray-200">
                        <td className="p-4 font-bold">
                          {session.batchId?.standardId?.name 
                            ? `${session.batchId.standardId.name} - ${session.batchId.name}`
                            : (session.batchId?.name || session.batchId?.batchName || 'Unknown Batch')}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-gray-800 dark:text-gray-200">{session.subjectId?.name || 'Unknown Subject'}</div>
                          <div className="text-xs text-gray-500">{session.teacherId?.name || 'Unknown Teacher'}</div>
                        </td>
                        <td className="p-4">
                          {session.sessionType === 'recurring' ? (
                            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                              <CalendarIcon size={14} /> {session.dayOfWeek}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
                              <CalendarIcon size={14} /> {session.sessionDate ? new Date(session.sessionDate).toLocaleDateString() : ''}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                            <Clock size={14} /> {session.startTime} - {session.endTime}
                          </div>
                          {session.room && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <MapPin size={12} /> {session.room}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button 
                            onClick={() => handleOpenModal(session)}
                            className="p-2 text-indigo-500 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(session._id)}
                            className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition dark:bg-red-900/20 dark:hover:bg-red-900/40"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">No sessions scheduled yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-gray-100 dark:border-[#1E293B] my-8">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-[#1E293B] sticky top-0 bg-white dark:bg-[#0f172a] z-10">
                <h3 className="font-bold text-lg dark:text-white">
                  {editingSession ? 'Edit Session' : 'Schedule Session'}
                </h3>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Batch *</label>
                    <select
                      required
                      value={formData.batchId}
                      onChange={(e) => setFormData({...formData, batchId: e.target.value})}
                      className="w-full p-2.5 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    >
                      <option value="">Select Batch</option>
                      {batches.map(b => (
                        <option key={b._id} value={b._id}>{b.batchName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject *</label>
                    <select
                      required
                      value={formData.subjectId}
                      onChange={(e) => setFormData({...formData, subjectId: e.target.value})}
                      className="w-full p-2.5 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teacher *</label>
                  <select
                    required
                    value={formData.teacherId}
                    onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-[#1E293B] pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session Type</label>
                    <select
                      value={formData.sessionType}
                      onChange={(e) => setFormData({...formData, sessionType: e.target.value})}
                      className="w-full p-2.5 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    >
                      <option value="recurring">Recurring (Weekly)</option>
                      <option value="one-time">One-time (Specific Date)</option>
                    </select>
                  </div>
                  
                  {formData.sessionType === 'recurring' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Day of Week</label>
                      <select
                        value={formData.dayOfWeek}
                        onChange={(e) => setFormData({...formData, dayOfWeek: e.target.value})}
                        className="w-full p-2.5 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                      >
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session Date</label>
                      <input
                        type="date"
                        required={formData.sessionType === 'one-time'}
                        value={formData.sessionDate}
                        onChange={(e) => setFormData({...formData, sessionDate: e.target.value})}
                        className="w-full p-2.5 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time *</label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      className="w-full p-2.5 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time *</label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                      className="w-full p-2.5 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room (Optional)</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({...formData, room: e.target.value})}
                    placeholder="e.g. Room 101"
                    className="w-full p-2.5 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>

                <div className="pt-4 flex gap-3 sticky bottom-0 bg-white dark:bg-[#0f172a] pb-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-2.5 border border-gray-200 dark:border-[#334155] rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E293B] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-semibold text-white transition shadow-sm"
                  >
                    {editingSession ? 'Update Session' : 'Schedule'}
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

export default AdminTuitionSessions;
