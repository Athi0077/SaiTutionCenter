import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const TeacherProjectCreate = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    classId: '',
    subjectId: '',
    startDate: '',
    dueDate: '',
    maxMarks: '',
    status: 'published'
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const classRes = await api.get('/classes/my-classes');
        setClasses(classRes.data.data);
      } catch (err) {
        setError('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!formData.classId) {
        setSubjects([]);
        return;
      }
      try {
        const res = await api.get(`/classes/${formData.classId}/subjects`);
        setSubjects(res.data.data);
      } catch (err) {
        console.error("Error loading subjects", err);
      }
    };
    fetchSubjects();
  }, [formData.classId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/projects', formData);
      setSuccess('Project created successfully!');
      setTimeout(() => navigate('/teacher/projects'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  if (loading) return <Layout><div className="p-6">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Create New Project</h1>
        
        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">{success}</div>}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Project Title</label>
            <input 
              type="text" 
              name="title" 
              required 
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
              <select name="classId" required value={formData.classId} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none">
                <option value="">Select Class</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>{c.className}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
              <select name="subjectId" required value={formData.subjectId} onChange={handleChange} disabled={!formData.classId} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none">
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
              {formData.classId && subjects.length === 0 && <p className="text-xs text-red-500 mt-1">No subjects assigned to you for this class.</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
              <input type="date" name="startDate" required value={formData.startDate} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
              <input type="date" name="dueDate" required value={formData.dueDate} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea name="description" required rows="3" value={formData.description} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Instructions</label>
            <textarea name="instructions" rows="4" value={formData.instructions} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Max Marks</label>
              <input type="number" name="maxMarks" value={formData.maxMarks} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-dark transition">
            Create Project
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default TeacherProjectCreate;
