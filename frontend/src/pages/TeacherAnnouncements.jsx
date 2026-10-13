import React, { useState, useEffect, useContext } from 'react';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Megaphone, Trash2, Send, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const TeacherAnnouncements = () => {
  const { currentUser } = useContext(AuthContext);
  const [announcements, setAnnouncements] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetAudience: ['student'],
    classId: '',
    isImportant: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all tuition classes for announcement broadcast
      const classRes = await api.get('/classes/my-classes');
      const designatedClasses = classRes.data?.data || [];
      
      setMyClasses(designatedClasses);
      
      if (designatedClasses.length > 0) {
        setFormData(prev => ({ ...prev, classId: designatedClasses[0]._id }));
      }

      const annRes = await api.get('/announcements/my');
      setAnnouncements(annRes.data.data);
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.classId) {
      return toast.error('Please select a class.');
    }
    
    setSubmitting(true);
    try {
      await api.post('/announcements', formData);
      toast.success('Announcement published!');
      setFormData(prev => ({ ...prev, title: '', message: '', isImportant: false }));
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a._id !== id));
      toast.success('Announcement deleted');
    } catch (err) {
      toast.error('Failed to delete announcement');
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <Megaphone size={28} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Class Announcements</h1>
        </div>

        {myClasses.length === 0 && !loading ? (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-xl flex items-start gap-4">
            <AlertCircle className="text-amber-500 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-amber-800 text-lg mb-1">No Classes Available</h3>
              <p className="text-amber-700">No active classes found to broadcast announcements.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-card-dark rounded-2xl shadow-soft p-6 sticky top-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Create Announcement</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Select Class</label>
                    <select 
                      required 
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})}
                    >
                      {myClasses.map(c => (
                        <option key={c._id} value={c._id}>{c.className}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Sent only to students of this class</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Title</label>
                    <input 
                      required type="text" 
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      placeholder="E.g., Bring craft materials tomorrow"
                      value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Message</label>
                    <textarea 
                      required rows="4"
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      placeholder="Enter announcement details..."
                      value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
                    />
                  </div>
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30">
                      <input type="checkbox" checked={formData.isImportant} onChange={e => setFormData({...formData, isImportant: e.target.checked})} className="w-5 h-5 text-red-600 rounded focus:ring-red-500" />
                      <span className="font-bold">Mark as Important</span>
                    </label>
                  </div>
                  <button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition flex justify-center items-center gap-2 mt-4">
                    <Send size={18} /> {submitting ? 'Publishing...' : 'Broadcast to Class'}
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-card-dark rounded-2xl shadow-soft p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">My Past Broadcasts</h2>
                {loading ? (
                  <p className="text-gray-500">Loading announcements...</p>
                ) : announcements.length === 0 ? (
                  <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500 font-medium">No announcements published yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {announcements.map(a => (
                      <div key={a._id} className={`p-5 rounded-xl border relative ${a.isImportant ? 'border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-900/10' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/50'}`}>
                        <div className="flex justify-between items-start mb-2 pr-8">
                          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{a.title}</h3>
                          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full whitespace-nowrap">
                            {new Date(a.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">Broadcasted to: {a.classId?.className || 'Class'}</p>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-50 dark:border-gray-700">{a.message}</p>
                        <button onClick={() => handleDelete(a._id)} className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition bg-white dark:bg-gray-800 rounded-full p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
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

export default TeacherAnnouncements;
