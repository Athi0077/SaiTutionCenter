import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import Layout from '../layout/Layout';
import toast from 'react-hot-toast';
import { X, Search, Filter, MessageSquare, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  "Academic Issue", "Attendance Issue", "Exam / Marks Issue",
  "Homework Issue", "Teacher-Related Complaint", "Student-Related Complaint",
  "Fee-Related Query", "School Facilities", "Bullying / Safety Concern",
  "General Question", "Request", "Suggestion", "Other"
];

const ReportsDashboard = ({ role }) => {
  const { currentUser } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  
  // New Report Form
  const [formData, setFormData] = useState({
    title: "", category: "General Question", description: "", priority: "Normal"
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      setReports(res.data.data);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportDetails = async (id) => {
    try {
      const res = await api.get(`/reports/${id}`);
      setActiveReport(res.data.data.report);
      setMessages(res.data.data.messages);
    } catch (err) {
      toast.error('Failed to load report details');
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reports', formData);
      toast.success('Report submitted successfully!');
      setShowCreateModal(false);
      setFormData({ title: "", category: "General Question", description: "", priority: "Normal" });
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting report');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await api.post(`/reports/${activeReport._id}/messages`, {
        message: newMessage,
        isInternalNote
      });
      setNewMessage("");
      fetchReportDetails(activeReport._id);
    } catch (err) {
      toast.error('Error sending message');
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      await api.put(`/reports/${activeReport._id}`, { status: newStatus });
      toast.success('Status updated');
      fetchReportDetails(activeReport._id);
      fetchReports();
    } catch (err) {
      toast.error('Error updating status');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-soft">
          <div className="w-full text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-800">Help Center / Reports</h1>
            <p className="text-gray-500 text-sm">Manage inquiries, complaints, and requests.</p>
          </div>
          {(role === 'student' || role === 'parent' || role === 'teacher') && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition"
            >
              + New Report
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List Section */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-soft flex flex-col h-[600px]">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-700">All Reports</div>
            <div className="overflow-y-auto flex-1 p-2">
              {loading ? (
                <p className="p-4 text-center text-gray-500">Loading...</p>
              ) : reports.length > 0 ? (
                reports.map(r => (
                  <div 
                    key={r._id} 
                    onClick={() => fetchReportDetails(r._id)}
                    className={`p-4 mb-2 rounded-xl border cursor-pointer transition ${activeReport?._id === r._id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}
                  >
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-bold text-gray-500">{r.reportId}</span>
                      <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${r.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {r.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{r.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{r.category}</p>
                  </div>
                ))
              ) : (
                <p className="p-4 text-center text-gray-500 text-sm">No reports found.</p>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-soft h-[600px] flex flex-col">
            {activeReport ? (
              <>
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-gray-800">{activeReport.title}</h2>
                    {(role === 'principal' || role === 'teacher') && activeReport.status !== 'CLOSED' && (
                      <div className="flex gap-2">
                        {activeReport.status !== 'RESOLVED' && (
                          <button onClick={() => handleUpdateStatus('RESOLVED')} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-bold hover:bg-green-200">Mark Resolved</button>
                        )}
                        <button onClick={() => handleUpdateStatus('CLOSED')} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-200">Close</button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <p><strong>By:</strong> {activeReport.reporterId?.name} ({activeReport.reporterRole})</p>
                    <p><strong>Category:</strong> {activeReport.category}</p>
                    <p><strong>Priority:</strong> {activeReport.priority}</p>
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl text-gray-700 text-sm">
                    {activeReport.description}
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                  {messages.map(m => (
                    <div key={m._id} className={`flex flex-col ${m.senderId?._id === currentUser.id ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.isInternalNote ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : (m.senderId?._id === currentUser.id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800')}`}>
                        {m.isInternalNote && <div className="text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><AlertCircle size={12}/> Internal Note</div>}
                        <div className="font-bold text-xs mb-1 opacity-75">{m.senderId?.name} ({m.senderRole})</div>
                        <p>{m.message}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1">{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {activeReport.status !== 'CLOSED' && (
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white rounded-b-2xl">
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 bg-gray-50"
                      />
                      <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition">
                        Send
                      </button>
                    </div>
                    {(role === 'principal' || role === 'teacher') && (
                      <label className="flex items-center gap-2 mt-2 text-sm text-gray-600 cursor-pointer">
                        <input type="checkbox" checked={isInternalNote} onChange={e => setIsInternalNote(e.target.checked)} className="rounded" />
                        Save as Internal Note (hidden from students/parents)
                      </label>
                    )}
                  </form>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4">
                <MessageSquare size={48} className="opacity-20" />
                <p>Select a report to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Submit a Report</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateReport} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50 focus:outline-none focus:border-blue-500" placeholder="Brief summary" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50 focus:outline-none focus:border-blue-500">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Priority</label>
                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50 focus:outline-none focus:border-blue-500">
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea required rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50 focus:outline-none focus:border-blue-500" placeholder="Provide detailed information..."></textarea>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">
                Submit Report
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ReportsDashboard;
