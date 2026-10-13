import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Users, Eye, Check, X, Clock, Settings, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';

const PrincipalSpecialClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [formData, setFormData] = useState({
    title: '', category: 'General Skills', description: '', instructorId: '',
    startDate: '', endDate: '', daysOfWeek: [], startTime: '', endTime: '', venue: '',
    maxStudents: '', enrollmentMode: 'Approval', status: 'Draft', skills: []
  });

  const fetchClasses = async () => {
    try {
      const res = await api.get('/special-classes');
      setClasses(res.data.data);
    } catch (err) {
      toast.error('Failed to load special classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/users/active-teachers');
      setTeachers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const handleOpenModal = (cls = null) => {
    if (cls) {
      setFormData({
        ...cls,
        startDate: cls.startDate ? cls.startDate.split('T')[0] : '',
        endDate: cls.endDate ? cls.endDate.split('T')[0] : '',
        maxStudents: cls.maxStudents || '',
        instructorId: cls.instructorId?._id || cls.instructorId,
        skills: cls.skills || []
      });
      setSelectedClass(cls);
    } else {
      setFormData({
        title: '', category: 'General Skills', description: '', instructorId: '',
        startDate: '', endDate: '', daysOfWeek: [], startTime: '', endTime: '', venue: '',
        maxStudents: '', enrollmentMode: 'Approval', status: 'Draft', skills: []
      });
      setSelectedClass(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, skills: typeof formData.skills === 'string' ? formData.skills.split(',').map(s=>s.trim()) : formData.skills };
      if (selectedClass) {
        await api.put(`/special-classes/${selectedClass._id}`, payload);
        toast.success('Special class updated');
      } else {
        await api.post('/special-classes', payload);
        toast.success('Special class created');
      }
      setIsModalOpen(false);
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving class');
    }
  };

  const updateStatus = async (id, action) => {
    try {
      await api.post(`/special-classes/${id}/${action}`);
      toast.success('Status updated');
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleOpenEnrollments = async (cls) => {
    setSelectedClass(cls);
    try {
      const res = await api.get(`/special-classes/${cls._id}/enrollments`);
      setEnrollments(res.data.data);
      setIsEnrollmentModalOpen(true);
    } catch (err) {
      toast.error('Failed to load enrollments');
    }
  };

  const handleEnrollmentAction = async (enrollmentId, action) => {
    try {
      await api.post(`/special-classes/${selectedClass._id}/enrollments/${enrollmentId}/${action}`);
      toast.success(`Enrollment ${action}d`);
      // Refresh enrollments
      const res = await api.get(`/special-classes/${selectedClass._id}/enrollments`);
      setEnrollments(res.data.data);
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || `Error trying to ${action} enrollment`);
    }
  };

  return (
    <Layout>
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Special Classes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage enrichment and training programs</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Add Class
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map(cls => (
            <div key={cls._id} className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-5 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${cls.status === 'Active' ? 'bg-green-100 text-green-700' : cls.status === 'Draft' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
                  {cls.status}
                </span>
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">{cls.category}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{cls.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{cls.description}</p>
              
              <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-300 flex-1">
                <div className="flex items-center gap-2"><Users size={16} /> Instructor: {cls.instructorId?.name || 'Unassigned'}</div>
                <div className="flex items-center gap-2"><Clock size={16} /> {cls.daysOfWeek?.join(', ')} ({cls.startTime} - {cls.endTime})</div>
                <div className="flex items-center justify-between text-xs font-medium text-gray-500 mt-2">
                  <span>Enrolled: {cls.enrolledCount} {cls.maxStudents ? `/ ${cls.maxStudents}` : ''}</span>
                  {cls.pendingCount > 0 && <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{cls.pendingCount} Pending</span>}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-2">
                <button onClick={() => handleOpenModal(cls)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700" title="Edit">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleOpenEnrollments(cls)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/30" title="Manage Enrollments">
                  <Users size={16} />
                </button>
                {cls.status === 'Draft' && <button onClick={() => updateStatus(cls._id, 'publish')} className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100">Publish</button>}
                {cls.status === 'Published' && <button onClick={() => updateStatus(cls._id, 'open-registration')} className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100">Open Reg.</button>}
                {cls.status === 'Registration Open' && <button onClick={() => updateStatus(cls._id, 'close-registration')} className="text-xs px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg font-medium hover:bg-orange-100">Close Reg.</button>}
                {(cls.status === 'Registration Closed' || cls.status === 'Registration Open') && <button onClick={() => updateStatus(cls._id, 'start')} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100">Start Class</button>}
                {cls.status === 'Active' && <button onClick={() => updateStatus(cls._id, 'complete')} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Complete</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedClass ? 'Edit Special Class' : 'Create Special Class'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input type="text" required className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select required className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {['Language', 'Sports', 'Arts', 'Music', 'Technology', 'Science', 'General Skills', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea rows="3" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Instructor</label>
                  <select required className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" value={formData.instructorId} onChange={e => setFormData({...formData, instructorId: e.target.value})}>
                    <option value="">Select Teacher</option>
                    {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Venue</label>
                  <input type="text" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input type="date" required className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input type="date" required className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Days of Week</label>
                  <div className="flex flex-wrap gap-3">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                      <label key={d} className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500"
                          checked={formData.daysOfWeek.includes(d)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, daysOfWeek: [...formData.daysOfWeek, d]});
                            } else {
                              setFormData({...formData, daysOfWeek: formData.daysOfWeek.filter(day => day !== d)});
                            }
                          }}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{d}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <input type="time" required className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Time</label>
                    <input type="time" required className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Max Students</label>
                  <input type="number" placeholder="Leave empty for unlimited" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" value={formData.maxStudents} onChange={e => setFormData({...formData, maxStudents: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Enrollment Mode</label>
                  <select className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" value={formData.enrollmentMode} onChange={e => setFormData({...formData, enrollmentMode: e.target.value})}>
                    <option value="Approval">Approval Required</option>
                    <option value="Direct">Direct Enrollment</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Skills (Comma separated)</label>
                <input type="text" placeholder="e.g. Speaking, Vocabulary, Grammar" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" value={Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enrollments Modal */}
      {isEnrollmentModalOpen && selectedClass && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold">Enrollments: {selectedClass.title}</h2>
              <button onClick={() => setIsEnrollmentModalOpen(false)}><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {enrollments.length === 0 ? (
                <p className="text-center text-gray-500">No enrollments yet.</p>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 text-sm">
                    <tr>
                      <th className="p-3">Student</th>
                      <th className="p-3">Standard/Section</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map(enr => (
                      <tr key={enr._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="p-3 font-medium">{enr.studentId?.name}</td>
                        <td className="p-3 text-sm text-gray-500">{enr.standard} - {enr.section}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            enr.status === 'Enrolled' ? 'bg-green-100 text-green-700' :
                            enr.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                            enr.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {enr.status}
                          </span>
                        </td>
                        <td className="p-3 flex gap-2">
                          {enr.status === 'Pending' && (
                            <>
                              <button onClick={() => handleEnrollmentAction(enr._id, 'approve')} className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100"><Check size={16} /></button>
                              <button onClick={() => handleEnrollmentAction(enr._id, 'reject')} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"><X size={16} /></button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
    </Layout>
  );
};

export default PrincipalSpecialClasses;
