import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { MessageSquare, Plus, Edit3, Trash2, Send, CheckCircle, Clock } from 'lucide-react';

const PrincipalQuotes = () => {
  const { currentUser } = useContext(AuthContext);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  
  const [formData, setFormData] = useState({
    quote: '',
    author: '',
    audience: 'both'
  });
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const res = await api.get('/quotes');
      setQuotes(res.data.data);
    } catch (err) {
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (quote = null) => {
    if (quote) {
      setEditingQuote(quote);
      setFormData({
        quote: quote.quote,
        author: quote.author || '',
        audience: quote.audience
      });
    } else {
      setEditingQuote(null);
      setFormData({ quote: '', author: '', audience: 'both' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingQuote) {
        await api.put(`/quotes/${editingQuote._id}`, formData);
        toast.success('Quote updated');
      } else {
        await api.post('/quotes', formData);
        toast.success('Quote created as draft');
      }
      setShowModal(false);
      fetchQuotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving quote');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id) => {
    if (!window.confirm("Publishing this quote will immediately replace the current quote for its audience. Proceed?")) {
      return;
    }
    try {
      await api.post(`/quotes/${id}/publish`);
      toast.success("Quote published successfully!");
      fetchQuotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish quote');
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm("Archive this quote?")) return;
    try {
      await api.delete(`/quotes/${id}`);
      toast.success("Quote archived");
      fetchQuotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive quote');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'published': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Published</span>;
      case 'draft': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> Draft</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-bold">{status}</span>;
    }
  };

  // Find currently active quotes to display at the top
  const currentStudentQuote = quotes.find(q => q.status === 'published' && (q.audience === 'students' || q.audience === 'both'));
  const currentTeacherQuote = quotes.find(q => q.status === 'published' && (q.audience === 'teachers' || q.audience === 'both'));

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
              <MessageSquare className="text-primary w-8 h-8" />
              Motivational Quotes
            </h1>
            <p className="text-gray-500 mt-1">Manage daily inspiration for students and teachers</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-dark transition shadow-soft flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> New Quote
          </button>
        </div>

        {/* Current Quotes Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-blue-800 font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Current Student Quote
            </h3>
            {currentStudentQuote ? (
              <div className="bg-white/60 p-4 rounded-xl shadow-sm border border-white">
                <p className="text-gray-800 font-medium italic">"{currentStudentQuote.quote}"</p>
                <p className="text-gray-500 text-sm mt-2 font-semibold">— {currentStudentQuote.author}</p>
              </div>
            ) : (
              <p className="text-blue-600/70 text-sm font-medium">No active quote for students.</p>
            )}
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-green-800 font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Current Teacher Quote
            </h3>
            {currentTeacherQuote ? (
              <div className="bg-white/60 p-4 rounded-xl shadow-sm border border-white">
                <p className="text-gray-800 font-medium italic">"{currentTeacherQuote.quote}"</p>
                <p className="text-gray-500 text-sm mt-2 font-semibold">— {currentTeacherQuote.author}</p>
              </div>
            ) : (
              <p className="text-green-600/70 text-sm font-medium">No active quote for teachers.</p>
            )}
          </div>
        </div>

        {/* Quotes List */}
        <div className="bg-white rounded-3xl shadow-soft p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quote History</h2>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>)}
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="font-medium">No quotes found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-gray-400 font-semibold border-b border-gray-100">
                    <th className="pb-3 px-4">Quote</th>
                    <th className="pb-3 px-4">Audience</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4">Published At</th>
                    <th className="pb-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {quotes.map((q) => (
                    <tr key={q._id} className="hover:bg-gray-50/50 transition">
                      <td className="py-4 px-4 max-w-md">
                        <p className="font-medium text-gray-800 truncate" title={q.quote}>"{q.quote}"</p>
                        <p className="text-xs text-gray-500">— {q.author}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className="capitalize text-sm font-semibold text-gray-600">{q.audience}</span>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(q.status)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        {q.publishedAt ? new Date(q.publishedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          {q.status !== 'archived' && (
                            <button 
                              onClick={() => handleOpenModal(q)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {q.status === 'draft' && (
                            <button 
                              onClick={() => handlePublish(q._id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Publish Now"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {q.status !== 'archived' && (
                            <button 
                              onClick={() => handleArchive(q._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Archive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quote Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingQuote ? 'Edit Quote' : 'New Quote'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quote Content *</label>
                <textarea
                  required
                  rows="4"
                  maxLength={500}
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-none"
                  placeholder="Enter the motivational quote..."
                  value={formData.quote}
                  onChange={(e) => setFormData({...formData, quote: e.target.value})}
                ></textarea>
                <div className="text-right text-xs text-gray-400 mt-1">{formData.quote.length}/500</div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Author (Optional)</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  placeholder="e.g. Albert Einstein"
                  value={formData.author}
                  onChange={(e) => setFormData({...formData, author: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Target Audience *</label>
                <select
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition bg-white"
                  value={formData.audience}
                  onChange={(e) => setFormData({...formData, audience: e.target.value})}
                >
                  <option value="both">Both Students & Teachers</option>
                  <option value="students">Students Only</option>
                  <option value="teachers">Teachers Only</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-dark transition disabled:opacity-70"
                >
                  {submitting ? 'Saving...' : (editingQuote ? 'Save Changes' : 'Save as Draft')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default PrincipalQuotes;
