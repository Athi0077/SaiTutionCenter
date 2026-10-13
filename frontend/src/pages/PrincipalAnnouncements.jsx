import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Megaphone, Trash2, Send } from 'lucide-react';

const PrincipalAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetAudience: ['teacher', 'student'],
    isImportant: false
  });

  useEffect(() => {
    fetchMyAnnouncements();
  }, []);

  const fetchMyAnnouncements = async () => {
    try {
      const res = await api.get('/announcements/my');
      setAnnouncements(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleAudienceChange = (e) => {
    const value = e.target.value;
    setFormData(prev => {
      const newAudience = prev.targetAudience.includes(value)
        ? prev.targetAudience.filter(v => v !== value)
        : [...prev.targetAudience, value];
      return { ...prev, targetAudience: newAudience };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.targetAudience.length === 0) {
      return toast.error('Please select at least one target audience.');
    }
    
    setSubmitting(true);
    try {
      await api.post('/announcements', formData);
      toast.success('Announcement published!');
      setFormData({ title: '', message: '', targetAudience: ['teacher', 'student'], isImportant: false });
      fetchMyAnnouncements();
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
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Megaphone size={28} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Announcements</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-soft p-6 sticky top-6">
              <h2 className="text-xl font-bold mb-4">Create Announcement</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Title</label>
                  <input 
                    required type="text" 
                    className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="E.g., Tomorrow is a Holiday"
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Message</label>
                  <textarea 
                    required rows="4"
                    className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Enter announcement details..."
                    value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Target Audience</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" value="teacher" checked={formData.targetAudience.includes('teacher')} onChange={handleAudienceChange} className="w-4 h-4 rounded text-primary" />
                      <span className="font-medium">Teachers</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" value="student" checked={formData.targetAudience.includes('student')} onChange={handleAudienceChange} className="w-4 h-4 rounded text-primary" />
                      <span className="font-medium">Students</span>
                    </label>
                  </div>
                </div>
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer p-3 bg-red-50 text-red-700 rounded-xl border border-red-100">
                    <input type="checkbox" checked={formData.isImportant} onChange={e => setFormData({...formData, isImportant: e.target.checked})} className="w-5 h-5 text-red-600 rounded focus:ring-red-500" />
                    <span className="font-bold">Mark as Important</span>
                  </label>
                </div>
                <button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition flex justify-center items-center gap-2 mt-4">
                  <Send size={18} /> {submitting ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h2 className="text-xl font-bold mb-4">Past Announcements</h2>
              {loading ? (
                <p className="text-gray-500">Loading announcements...</p>
              ) : announcements.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-500 font-medium">No announcements published yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map(a => (
                    <div key={a._id} className={`p-5 rounded-xl border relative ${a.isImportant ? 'border-red-200 bg-red-50/30' : 'border-gray-100 bg-white'}`}>
                      <div className="flex justify-between items-start mb-2 pr-8">
                        <h3 className="font-bold text-lg text-gray-800">{a.title}</h3>
                        <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-3 font-medium">Target: {a.targetAudience.join(', ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                      <p className="text-gray-700 whitespace-pre-wrap text-sm bg-white p-4 rounded-lg border border-gray-50">{a.message}</p>
                      <button onClick={() => handleDelete(a._id)} className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition bg-white rounded-full p-1.5 hover:bg-red-50">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrincipalAnnouncements;
