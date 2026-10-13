import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Plus, CheckCircle, Clock, AlertCircle, Trash2, Edit2, ChevronDown, ChevronUp, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSocket } from '../services/socket';

const PrincipalTodos = () => {
  const [tasks, setTasks] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    assignedAt: new Date().toISOString().split('T')[0],
    dueDate: '',
    classId: '',
    subjectId: '',
    attachment: '',
    assignees: [] // Array of teacher IDs
  });

  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [expandedTask, setExpandedTask] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, teachersRes, classesRes, subjectsRes] = await Promise.all([
        api.get('/todos/created'),
        api.get('/principal/teachers'),
        api.get('/classes'),
        api.get('/subjects')
      ]);
      setTasks(tasksRes.data.data.filter(t => t.taskType === 'PRINCIPAL_TO_TEACHER'));
      setTeachers(teachersRes.data.data);
      setClasses(classesRes.data.data || []);
      setSubjects(subjectsRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.on('todo_status_updated', (data) => {
        toast.success(data.message || 'Task status updated by teacher');
        fetchData();
      });

      return () => {
        socket.off('todo_status_updated');
      };
    }
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (formData.assignees.length === 0) {
      return toast.error('Please select at least one teacher');
    }
    try {
      const payload = {
        ...formData,
        taskType: 'PRINCIPAL_TO_TEACHER'
      };
      if (!payload.classId) delete payload.classId;
      if (!payload.subjectId) delete payload.subjectId;

      await api.post('/todos', payload);
      toast.success('Task created and assigned successfully');
      setIsModalOpen(false);
      setFormData({ title: '', description: '', priority: 'Medium', assignedAt: new Date().toISOString().split('T')[0], dueDate: '', classId: '', subjectId: '', attachment: '', assignees: [] });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/todos/${id}`);
      toast.success("Task deleted");
      setTasks(tasks.filter(t => t._id !== id));
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const toggleAssignee = (teacherId) => {
    if (formData.assignees.includes(teacherId)) {
      setFormData({ ...formData, assignees: formData.assignees.filter(id => id !== teacherId) });
    } else {
      setFormData({ ...formData, assignees: [...formData.assignees, teacherId] });
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

  const filteredTasks = tasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterPriority !== 'All' && task.priority !== filterPriority) return false;
    
    if (filterStatus !== 'All') {
      const isCompleted = task.assignments?.every(a => a.status === 'Completed');
      if (filterStatus === 'Completed' && !isCompleted) return false;
      if (filterStatus === 'Pending' && isCompleted) return false;
    }
    return true;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Work Assignments (To Teachers)</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition font-semibold"
          >
            <Plus size={20} /> Assign Task
          </button>
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
            <option value="Pending">Pending / In Progress</option>
            <option value="Completed">Completed by All</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-soft text-center">
            <CheckCircle className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Tasks Created</h3>
            <p className="text-gray-500">You have not assigned any tasks matching your filters yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTasks.map(task => (
              <div key={task._id} className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
                <div 
                  className="p-5 cursor-pointer hover:bg-gray-50 transition flex justify-between items-center"
                  onClick={() => setExpandedTask(expandedTask === task._id ? null : task._id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-gray-800">{task.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                        {task.priority} Priority
                      </span>
                      {task.isOverdue && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1"><AlertCircle size={12}/> Overdue</span>}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-4">
                      <span>Assigned: {new Date(task.assignedAt).toLocaleDateString()}</span>
                      {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                      <span>Assignees: {task.assignments?.length || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                    </button>
                    {expandedTask === task._id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                  </div>
                </div>

                {expandedTask === task._id && (
                  <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                    <p className="text-gray-700 mb-4 whitespace-pre-wrap">{task.description}</p>
                    
                    <h4 className="font-semibold text-gray-800 mb-3">Teacher Progress</h4>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="p-3 font-semibold text-gray-600">Teacher</th>
                            <th className="p-3 font-semibold text-gray-600">Status</th>
                            <th className="p-3 font-semibold text-gray-600">Completed At</th>
                            <th className="p-3 font-semibold text-gray-600">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {task.assignments.map((assignment, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="p-3 font-medium text-gray-800">{assignment.assignee?.name || 'Unknown'}</td>
                              <td className="p-3">{getStatusBadge(assignment.status)}</td>
                              <td className="p-3 text-gray-500">
                                {assignment.completedAt ? new Date(assignment.completedAt).toLocaleString() : '-'}
                              </td>
                              <td className="p-3 text-gray-600 italic">
                                {assignment.completionRemarks || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Assign New Task</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <form id="create-task-form" onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Task Title *</label>
                    <input 
                      type="text" required
                      value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Submit mid-term reports"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                    <textarea 
                      value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                      placeholder="Task details..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                      <input 
                        type="date" 
                        value={formData.assignedAt} onChange={(e) => setFormData({...formData, assignedAt: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      />
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
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Class / Section (Optional)</label>
                      <select 
                        value={formData.classId} onChange={(e) => setFormData({...formData, classId: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Class</option>
                        {classes.map(c => (
                          <option key={c._id} value={c._id}>{c.className} {c.section ? `(${c.section})` : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Subject (Optional)</label>
                      <select 
                        value={formData.subjectId} onChange={(e) => setFormData({...formData, subjectId: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Subject</option>
                        {subjects.map(s => (
                          <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Attachment URL (Optional)</label>
                      <input 
                        type="url" 
                        value={formData.attachment} onChange={(e) => setFormData({...formData, attachment: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                        placeholder="https://link-to-file.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Assign To Teachers *</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-[150px] overflow-y-auto space-y-2">
                      {teachers.map(t => (
                        <label key={t._id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-1 rounded transition">
                          <input 
                            type="checkbox"
                            checked={formData.assignees.includes(t._id)}
                            onChange={() => toggleAssignee(t._id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="font-medium text-gray-700">{t.name}</span>
                        </label>
                      ))}
                      {teachers.length === 0 && <p className="text-gray-500 text-sm">No teachers available</p>}
                    </div>
                  </div>
                </form>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  form="create-task-form"
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PrincipalTodos;
