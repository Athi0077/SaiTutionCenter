import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Eye, Edit, Trash2, ClipboardList, CheckSquare } from 'lucide-react';
import TeacherHomeworkApprovals from './TeacherHomeworkApprovals';

const TeacherHomeworkList = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingHomework, setEditingHomework] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', dueDate: '', priority: 'normal', status: 'draft' });

  const fetchHomeworks = async () => {
    try {
      const res = await api.get('/homework/teacher');
      setHomeworks(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeworks();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this homework?")) return;
    try {
      await api.delete(`/homework/${id}`);
      toast.success("Homework deleted successfully");
      fetchHomeworks();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete homework");
    }
  };

  const openEditModal = (hw) => {
    setEditingHomework(hw);
    setEditForm({
      title: hw.title,
      description: hw.description || '',
      dueDate: hw.dueDate ? new Date(hw.dueDate).toISOString().split('T')[0] : '',
      priority: hw.priority || 'normal',
      status: hw.status || 'draft'
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/homework/${editingHomework._id}`, editForm);
      toast.success("Homework updated successfully");
      setEditingHomework(null);
      fetchHomeworks();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update homework");
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex border-b border-gray-200 mb-6 gap-6">
          <button 
            className={`flex items-center gap-2 pb-3 px-2 font-bold text-lg transition border-b-2 ${activeTab === 'list' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            onClick={() => setActiveTab('list')}
          >
            <ClipboardList className="w-5 h-5" /> My Homework
          </button>
          <button 
            className={`flex items-center gap-2 pb-3 px-2 font-bold text-lg transition border-b-2 ${activeTab === 'approvals' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            onClick={() => setActiveTab('approvals')}
          >
            <CheckSquare className="w-5 h-5" /> Approvals
          </button>
        </div>

        {activeTab === 'list' ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-center sm:text-left w-full sm:w-auto dark:text-gray-100">My Homework</h2>
              <Link to="/teacher/homework/create" className="w-full sm:w-auto text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                + Create Homework
              </Link>
            </div>

            {loading ? (
              <div className="p-6">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {homeworks.length > 0 ? (
                  homeworks.map(hw => (
                    <div key={hw._id} className="bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700 rounded shadow dark:shadow-none p-6 border-t-4 border-t-blue-500 dark:border-t-blue-500 flex flex-col hover:-translate-y-1 transition duration-300">
                      <h3 className="text-xl font-bold mb-1 text-gray-800 dark:text-gray-100">{hw.title}</h3>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{hw.subjectId?.name} | {hw.classId?.className}</p>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-grow">
                        <p>Due: {new Date(hw.dueDate).toLocaleDateString()}</p>
                        <p>Status: <span className="font-semibold capitalize text-gray-700 dark:text-gray-300">{hw.status}</span></p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Link to={`/teacher/homework/${hw._id}`} className="flex-1 flex justify-center items-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 rounded font-semibold transition" title="View Submissions">
                          <Eye className="w-5 h-5" />
                        </Link>
                        <button onClick={() => openEditModal(hw)} className="flex-1 flex justify-center items-center bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 py-2 rounded font-semibold transition" title="Edit Homework">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(hw._id)} className="flex-1 flex justify-center items-center bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 py-2 rounded font-semibold transition" title="Delete Homework">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center text-gray-500 dark:text-gray-400 p-6 bg-white dark:bg-card-dark shadow dark:shadow-none border border-gray-100 dark:border-gray-700 rounded">
                    No homework created yet.
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TeacherHomeworkApprovals />
          </div>
        )}
      </div>

    {/* Edit Modal */}
    {editingHomework && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-card-dark rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Edit Homework</h3>
            <button onClick={() => setEditingHomework(null)} className="text-gray-500 hover:text-gray-800 text-2xl font-semibold leading-none">&times;</button>
          </div>
          <form onSubmit={handleUpdate} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Title</label>
              <input type="text" required className="w-full border border-gray-200 dark:border-gray-700 rounded p-2 focus:ring-2 focus:ring-primary focus:outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Description</label>
              <textarea className="w-full border border-gray-200 dark:border-gray-700 rounded p-2 focus:ring-2 focus:ring-primary focus:outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" rows="3" value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})}></textarea>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Due Date</label>
                <input type="date" required className="w-full border border-gray-200 dark:border-gray-700 rounded p-2 focus:ring-2 focus:ring-primary focus:outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" value={editForm.dueDate} onChange={(e) => setEditForm({...editForm, dueDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Priority</label>
                <select className="w-full border border-gray-200 dark:border-gray-700 rounded p-2 focus:ring-2 focus:ring-primary focus:outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" value={editForm.priority} onChange={(e) => setEditForm({...editForm, priority: e.target.value})}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Status</label>
              <select className="w-full border border-gray-200 dark:border-gray-700 rounded p-2 focus:ring-2 focus:ring-primary focus:outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button type="button" onClick={() => setEditingHomework(null)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded font-medium transition">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    )}
    </Layout>
  );
};

export default TeacherHomeworkList;
