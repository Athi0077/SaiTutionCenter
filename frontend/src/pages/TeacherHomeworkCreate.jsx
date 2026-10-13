import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

const TeacherHomeworkCreate = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('normal');
  const [status, setStatus] = useState('published');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const clsRes = await api.get('/classes/my-classes');
        setClasses(clsRes.data.data);
      } catch (err) {
        console.error("Error loading classes", err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!classId) {
        setSubjects([]);
        return;
      }
      try {
        const res = await api.get(`/classes/${classId}/subjects`);
        setSubjects(res.data.data);
      } catch (err) {
        console.error("Error loading subjects", err);
      }
    };
    fetchSubjects();
  }, [classId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await api.post('/homework', {
        classId,
        subjectId,
        title,
        description,
        dueDate,
        priority,
        status,
        attachments: [] // Cloudinary integration can be added here
      });
      navigate('/teacher/homework');
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating homework');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <Link to="/teacher/homework" className="text-blue-600 hover:underline">&larr; Back</Link>
      </div>
      
      <div className="bg-white p-8 rounded shadow border-t-4 border-blue-600">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Homework</h2>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Class</label>
              <select className="w-full p-2 border rounded" value={classId} onChange={(e) => setClassId(e.target.value)} required>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Subject</label>
              <select className="w-full p-2 border rounded" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required disabled={!classId}>
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              {classId && subjects.length === 0 && <p className="text-xs text-red-500 mt-1">No subjects assigned to this class.</p>}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 font-semibold text-gray-700">Title</label>
            <input type="text" className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 font-semibold text-gray-700">Description</label>
            <textarea className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-32" value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Due Date</label>
              <input type="datetime-local" className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
            
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Priority</label>
              <select className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-4 border-t pt-4">
            <button type="button" onClick={() => {setStatus('draft'); handleSubmit(new Event('submit'));}} className="px-6 py-2 bg-gray-200 text-gray-800 font-bold rounded hover:bg-gray-300" disabled={loading}>
              Save Draft
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700" disabled={loading}>
              Publish
            </button>
          </div>
        </form>
      </div>
    </div>
    </Layout>
  );
};

export default TeacherHomeworkCreate;
