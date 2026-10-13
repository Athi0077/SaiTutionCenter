import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { ChevronRight, CheckCircle, Circle, Plus, Trash2, Edit2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSocket } from '../services/socket';

const TeacherSyllabus = () => {
  const { currentUser } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ chapterNumber: '', chapterTitle: '', description: '', learningObjectives: '', estimatedCompletionDate: '', referenceMaterials: '' });

  useEffect(() => {
    fetchAssignments();

    const socket = getSocket();
    if (socket) {
      const handleSyllabusUpdate = () => {
        fetchAssignments();
        // optionally refresh chapters if one is active, but toggleStatus does this already locally.
      };
      socket.on('syllabus_updated', handleSyllabusUpdate);
      return () => {
        socket.off('syllabus_updated', handleSyllabusUpdate);
      };
    }
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/syllabus/my-assignments');
      const data = res.data.data || [];
      setAssignments(data);
      if (data.length > 0 && !activeAssignment) {
        loadChapters(data[0]);
      }
    } catch (err) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const loadChapters = async (assignment) => {
    setActiveAssignment(assignment);
    try {
      const subj = encodeURIComponent(assignment.subject || 'Class Teacher');
      const res = await api.get(`/syllabus/class/${assignment.classId}/subject/${subj}`);
      setChapters(res.data.data);
    } catch (err) {
      toast.error('Failed to load chapters');
    }
  };

  const handleSaveChapter = async (e) => {
    e.preventDefault();
    try {
      if (formData._id) {
        await api.put(`/syllabus/chapters/${formData._id}`, formData);
        toast.success('Chapter updated');
      } else {
        await api.post('/syllabus/chapters', {
          ...formData,
          classId: activeAssignment.classId,
          subject: activeAssignment.subject || 'Class Teacher'
        });
        toast.success('Chapter added');
      }
      setShowModal(false);
      loadChapters(activeAssignment);
      fetchAssignments(); // refresh progress
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save chapter');
    }
  };

  const toggleStatus = async (chapter) => {
    try {
      const newStatus = chapter.status === 'Completed' ? 'Pending' : 'Completed';
      await api.patch(`/syllabus/chapters/${chapter._id}/completion`, { status: newStatus });
      toast.success(`Chapter marked as ${newStatus}`);
      loadChapters(activeAssignment);
      fetchAssignments();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const deleteChapter = async (id) => {
    if (!window.confirm("Delete this chapter?")) return;
    try {
      await api.delete(`/syllabus/chapters/${id}`);
      toast.success('Chapter deleted');
      loadChapters(activeAssignment);
      fetchAssignments();
    } catch (err) {
      toast.error('Failed to delete chapter');
    }
  };

  if (loading) return <Layout><div className="p-6">Loading syllabus...</div></Layout>;

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Syllabus</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Assignments List */}
          <div className="md:col-span-1 bg-white p-4 rounded-2xl shadow-soft">
            <h3 className="font-bold text-gray-800 mb-4 px-2">Your Subjects</h3>
            <div className="space-y-2">
              {assignments.map(a => (
                <button
                  key={a.assignmentId}
                  onClick={() => loadChapters(a)}
                  className={`w-full text-left p-3 rounded-xl transition flex justify-between items-center ${activeAssignment?.assignmentId === a.assignmentId ? 'bg-purple-100 border-purple-200' : 'bg-gray-50 hover:bg-gray-100 border-gray-100'} border`}
                >
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{a.className}</div>
                    <div className="text-xs text-gray-500 font-medium">{a.subject || 'Class Teacher'}</div>
                    <div className="text-xs mt-1">
                      <span className="text-purple-600 font-bold">{a.progress.percentage}%</span>
                      <span className="text-gray-400 ml-1">({a.progress.completed}/{a.progress.total})</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </button>
              ))}
              {assignments.length === 0 && <p className="text-sm text-gray-500 px-2">No subjects assigned.</p>}
            </div>
          </div>

          {/* Chapters Panel */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-soft">
            {activeAssignment ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{activeAssignment.className}</h3>
                    <p className="text-gray-600 font-medium">{activeAssignment.subject || 'Class Teacher'} Syllabus</p>
                  </div>
                  <button onClick={() => { setFormData({ chapterNumber: chapters.length + 1, chapterTitle: '', description: '', learningObjectives: '', estimatedCompletionDate: '', referenceMaterials: '' }); setShowModal(true); }} className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700 transition flex items-center gap-2 text-sm">
                    <Plus size={16} /> Add Chapter
                  </button>
                </div>

                <div className="space-y-3">
                  {chapters.length > 0 ? chapters.map(c => (
                    <div key={c._id} className={`p-4 rounded-xl border flex items-center gap-4 ${c.status === 'Completed' ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-200'}`}>
                      <button onClick={() => toggleStatus(c)} className={`${c.status === 'Completed' ? 'text-green-500' : 'text-gray-400 hover:text-green-500'} transition`}>
                        {c.status === 'Completed' ? <CheckCircle size={24} /> : <Circle size={24} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold text-sm ${c.status === 'Completed' ? 'text-green-800' : 'text-gray-800'}`}>
                          Chapter {c.chapterNumber}: {c.chapterTitle}
                        </h4>
                        {c.description && <p className="text-xs text-gray-500 truncate">{c.description}</p>}
                        {c.status === 'Completed' && c.completedAt && (
                          <p className="text-[10px] text-green-600 font-bold mt-1 uppercase tracking-wider">Completed {new Date(c.completedAt).toLocaleDateString()}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setFormData(c); setShowModal(true); }} className="text-gray-400 hover:text-blue-500"><Edit2 size={16} /></button>
                        <button onClick={() => deleteChapter(c._id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
                      <p>Syllabus not added yet.</p>
                      <button onClick={() => { setFormData({ chapterNumber: 1, chapterTitle: '', description: '', learningObjectives: '', estimatedCompletionDate: '', referenceMaterials: '' }); setShowModal(true); }} className="text-purple-600 font-bold text-sm mt-2">Create First Chapter</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
                <div className="text-4xl mb-4">📖</div>
                <p>Select a subject from the list to manage its syllabus.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-800">{formData._id ? 'Edit' : 'Add'} Chapter</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700"><XCircle size={24} /></button>
              </div>
              <form onSubmit={handleSaveChapter} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Chapter No.</label>
                    <input type="number" required min="1" value={formData.chapterNumber} onChange={e => setFormData({...formData, chapterNumber: e.target.value})} className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Title</label>
                    <input type="text" required value={formData.chapterTitle} onChange={e => setFormData({...formData, chapterTitle: e.target.value})} className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm" placeholder="e.g. Tamil Mozhi" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Description (Optional)</label>
                  <textarea rows="2" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm" placeholder="Brief topics covered..."></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Learning Objectives (Optional)</label>
                  <textarea rows="2" value={formData.learningObjectives || ''} onChange={e => setFormData({...formData, learningObjectives: e.target.value})} className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm" placeholder="What will students learn?"></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Estimated Completion Date (Optional)</label>
                    <input type="date" value={formData.estimatedCompletionDate ? formData.estimatedCompletionDate.split('T')[0] : ''} onChange={e => setFormData({...formData, estimatedCompletionDate: e.target.value})} className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Reference Materials (Optional)</label>
                    <input type="text" value={formData.referenceMaterials || ''} onChange={e => setFormData({...formData, referenceMaterials: e.target.value})} className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm" placeholder="e.g. Page 45, YouTube link..." />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700">Save Chapter</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default TeacherSyllabus;
