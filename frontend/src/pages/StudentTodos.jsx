import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Plus, CheckCircle, Clock, AlertCircle, Trash2, Edit2, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSocket } from '../services/socket';

const StudentTodos = () => {
  const [activeTab, setActiveTab] = useState('teacher-tasks'); // 'teacher-tasks' | 'personal-tasks'
  const [teacherTasks, setTeacherTasks] = useState([]);
  const [personalTasks, setPersonalTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  
  const [selectedTask, setSelectedTask] = useState(null);
  const [updateFormData, setUpdateFormData] = useState({
    status: 'Pending',
    completionRemarks: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    dueDate: ''
  });

  // Filters
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'teacher-tasks') {
        const res = await api.get('/todos/my');
        setTeacherTasks(res.data.data.filter(t => t.taskType === 'TEACHER_TO_STUDENT'));
      } else {
        const res = await api.get('/todos/my');
        setPersonalTasks(res.data.data.filter(t => t.taskType === 'STUDENT_PERSONAL'));
      }
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.on('new_todo', (data) => {
        toast.success(data.message || 'New task received');
        fetchData();
      });
      socket.on('todo_status_updated', (data) => {
        toast.success(data.message || 'Task status updated');
        fetchData();
      });

      return () => {
        socket.off('new_todo');
        socket.off('todo_status_updated');
      };
    }
  }, [activeTab]);

  const handleCreatePersonalTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/todos', {
        ...formData,
        taskType: 'STUDENT_PERSONAL'
      });
      toast.success('Personal Todo created');
      setIsCreateModalOpen(false);
      setFormData({ title: '', description: '', priority: 'Medium', dueDate: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create personal todo');
    }
  };

  const handleDeletePersonalTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this personal task?")) return;
    try {
      await api.delete(`/todos/${id}`);
      toast.success("Task deleted");
      setPersonalTasks(personalTasks.filter(t => t._id !== id));
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const openUpdateModal = (task) => {
    setSelectedTask(task);
    setUpdateFormData({
      status: task.myAssignment?.status || 'Pending',
      completionRemarks: task.myAssignment?.completionRemarks || '',
      submissionAttachment: task.myAssignment?.submissionAttachment || ''
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/todos/${selectedTask._id}/status`, updateFormData);
      toast.success('Status updated successfully');
      setIsUpdateModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">Completed</span>;
      case 'In Progress': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">In Progress</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">Pending</span>;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getFilteredTasks = (taskList) => {
    return taskList.filter(task => {
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterPriority !== 'All' && task.priority !== filterPriority) return false;
      
      if (filterStatus !== 'All') {
        if (filterStatus !== task.myAssignment?.status) return false;
      }
      return true;
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">My Todos</h2>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('teacher-tasks')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${activeTab === 'teacher-tasks' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              School Assignments
            </button>
            <button
              onClick={() => setActiveTab('personal-tasks')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${activeTab === 'personal-tasks' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Personal Todos
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select 
            value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select 
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {activeTab === 'teacher-tasks' && (
          <div>
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading tasks...</div>
            ) : teacherTasks.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl shadow-soft text-center">
                <CheckCircle className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-700 mb-2">No School Assignments!</h3>
                <p className="text-gray-500">Your teachers haven't assigned any tasks yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {getFilteredTasks(teacherTasks).map(task => (
                  <div key={task._id} className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-800">{task.title}</h3>
                        {getStatusBadge(task.myAssignment?.status)}
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                          {task.priority} Priority
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 whitespace-pre-wrap">{task.description}</p>
                      <div className="text-xs text-gray-500 flex flex-wrap items-center gap-4">
                        <span>Teacher: {task.createdBy?.name || 'Unknown'}</span>
                        <span>Assigned: {new Date(task.assignedAt).toLocaleDateString()}</span>
                        {task.dueDate && <span className={task.isOverdue && task.myAssignment?.status !== 'Completed' ? 'text-red-500 font-bold' : ''}>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <button 
                      onClick={() => openUpdateModal(task)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-semibold transition shrink-0"
                    >
                      Update Status
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'personal-tasks' && (
          <div>
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition font-semibold"
              >
                <Plus size={20} /> Create Personal Todo
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading tasks...</div>
            ) : personalTasks.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl shadow-soft text-center">
                <CheckCircle className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-700 mb-2">No Personal Todos</h3>
                <p className="text-gray-500">Create tasks here just for yourself. Teachers cannot see these.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {getFilteredTasks(personalTasks).map(task => (
                  <div key={task._id} className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-800">{task.title}</h3>
                        {getStatusBadge(task.myAssignment?.status)}
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                          {task.priority} Priority
                        </span>
                      </div>
                      {task.description && <p className="text-gray-600 text-sm mb-3 whitespace-pre-wrap">{task.description}</p>}
                      <div className="text-xs text-gray-500 flex flex-wrap items-center gap-4">
                        {task.dueDate && <span className={task.isOverdue && task.myAssignment?.status !== 'Completed' ? 'text-red-500 font-bold' : ''}>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => openUpdateModal(task)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-semibold transition"
                      >
                        Update
                      </button>
                      <button 
                        onClick={() => handleDeletePersonalTask(task._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition border border-transparent hover:border-red-200"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Personal Task Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">New Personal Todo</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <form id="create-personal-task-form" onSubmit={handleCreatePersonalTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Task Title *</label>
                    <input 
                      type="text" required
                      value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Buy notebooks"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                    <textarea 
                      value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                      <select 
                        value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date</label>
                      <input 
                        type="date" 
                        value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </form>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  form="create-personal-task-form"
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  Create Todo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        {isUpdateModalOpen && selectedTask && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Update Status</h3>
                <button onClick={() => setIsUpdateModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <form id="update-status-form" onSubmit={handleUpdateStatus} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                    <select 
                      value={updateFormData.status} onChange={(e) => setUpdateFormData({...updateFormData, status: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Remarks (Optional)</label>
                    <textarea 
                      value={updateFormData.completionRemarks} onChange={(e) => setUpdateFormData({...updateFormData, completionRemarks: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                      placeholder="Add any notes about your progress..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Submission Attachment URL (Optional)</label>
                    <input 
                      type="url" 
                      value={updateFormData.submissionAttachment} onChange={(e) => setUpdateFormData({...updateFormData, submissionAttachment: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      placeholder="https://link-to-file.com"
                    />
                  </div>
                </form>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
                <button 
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  form="update-status-form"
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  Save Update
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default StudentTodos;
