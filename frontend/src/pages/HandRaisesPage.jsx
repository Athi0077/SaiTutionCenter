import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { 
  Hand, Plus, Search, Calendar as CalendarIcon, 
  CheckCircle, Clock, XCircle, ChevronRight, X, User as UserIcon, MessageSquare, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const HandRaisesPage = () => {
  const { currentUser } = useContext(AuthContext);
  const role = currentUser?.role?.toLowerCase();
  
  const [activeTab, setActiveTab] = useState(role === 'student' || role === 'parent' ? 'my' : 'received');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Form State
  const [targetUsers, setTargetUsers] = useState([]);
  const [children, setChildren] = useState([]);
  
  const [formData, setFormData] = useState({
    targetUserId: '',
    studentId: '',
    topic: '',
    category: 'Doubt',
    message: '',
    priority: 'Normal'
  });

  const fetchHandRaises = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/hand-raises/${activeTab}`);
      setRequests(res.data.data);
      
      const statsRes = await api.get('/hand-raises/stats');
      setStats(statsRes.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load hand raises');
    } finally {
      setLoading(false);
    }
  };

  const fetchTargets = async () => {
    try {
      const res = await api.get('/hand-raises/targets');
      setTargetUsers(res.data.data);
      if (res.data.data.length > 0) {
        setFormData(prev => ({ ...prev, targetUserId: res.data.data[0]._id }));
      }
      
      if (role === 'parent') {
        const childRes = await api.get('/dashboard/parent');
        const childrenList = childRes.data.data.children || [];
        setChildren(childrenList);
        if (childrenList.length > 0) {
          setFormData(prev => ({ ...prev, studentId: childrenList[0]._id }));
        }
      } else if (role === 'student') {
        setFormData(prev => ({ ...prev, studentId: currentUser._id }));
      }
    } catch (err) {
      console.error('Failed to load targets', err);
    }
  };

  useEffect(() => {
    fetchHandRaises();
  }, [activeTab]);

  useEffect(() => {
    fetchTargets();
  }, [role]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/hand-raises', formData);
      if (res.data.success) {
        toast.success("Hand Raise request submitted successfully!");
        setShowCreateModal(false);
        setFormData({ ...formData, topic: '', message: '' });
        fetchHandRaises();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to submit request");
    }
  };

  const updateStatus = async (id, action, payload = {}) => {
    try {
      const res = await api.put(`/hand-raises/${id}/${action}`, payload);
      if (res.data.success) {
        toast.success(`Request ${action} successfully`);
        setSelectedRequest(null);
        setShowScheduleModal(false);
        fetchHandRaises();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} request`);
    }
  };

  const getStatusBadge = (status, priority) => {
    let color = "bg-gray-100 text-gray-700 border-gray-200";
    if (status === "PENDING") color = "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (status === "VIEWED") color = "bg-blue-100 text-blue-700 border-blue-200";
    if (status === "SCHEDULED") color = "bg-purple-100 text-purple-700 border-purple-200";
    if (status === "COMPLETED") color = "bg-green-100 text-green-700 border-green-200";
    if (status === "CANCELLED") color = "bg-red-100 text-red-700 border-red-200";

    const urgentBadge = (priority === 'High' || priority === 'Urgent') && (status === 'PENDING' || status === 'VIEWED') ? (
      <span className="flex items-center gap-1 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-200 uppercase ml-2 animate-pulse">
        <AlertCircle className="w-3 h-3" /> {priority}
      </span>
    ) : null;

    return (
      <div className="flex items-center">
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${color}`}>
          {status}
        </span>
        {urgentBadge}
      </div>
    );
  };

  const ScheduleModal = () => {
    const [scheduleData, setScheduleData] = useState({
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '14:00',
      duration: 30,
      meetingType: 'In Person',
      location: '',
      meetingLink: '',
      message: ''
    });

    const onSubmit = (e) => {
      e.preventDefault();
      updateStatus(selectedRequest._id, 'schedule', scheduleData);
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Schedule Meeting</h3>
            <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                <input type="date" required value={scheduleData.scheduledDate} onChange={e => setScheduleData({...scheduleData, scheduledDate: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Time</label>
                <input type="time" required value={scheduleData.scheduledTime} onChange={e => setScheduleData({...scheduleData, scheduledTime: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Duration (mins)</label>
                <input type="number" required min="15" value={scheduleData.duration} onChange={e => setScheduleData({...scheduleData, duration: parseInt(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Meeting Type</label>
                <select value={scheduleData.meetingType} onChange={e => setScheduleData({...scheduleData, meetingType: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
                  <option value="In Person">In Person</option>
                  <option value="Online">Online</option>
                </select>
              </div>
            </div>

            {scheduleData.meetingType === 'Online' ? (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Meeting Link</label>
                <input type="url" placeholder="https://zoom.us/..." value={scheduleData.meetingLink} onChange={e => setScheduleData({...scheduleData, meetingLink: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                <input type="text" placeholder="e.g. Principal's Office" value={scheduleData.location} onChange={e => setScheduleData({...scheduleData, location: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Message / Notes</label>
              <textarea placeholder="Any additional notes..." value={scheduleData.message} onChange={e => setScheduleData({...scheduleData, message: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 min-h-[80px]" />
            </div>

            <button type="submit" className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700">
              Confirm Schedule
            </button>
          </form>
        </div>
      </div>
    );
  };

  const RequestDetailsModal = () => {
    if (!selectedRequest) return null;
    const isTarget = selectedRequest.targetUser?._id === currentUser._id;

    const handleView = () => {
      if (isTarget && selectedRequest.status === 'PENDING') {
        updateStatus(selectedRequest._id, 'view');
      }
    };

    useEffect(() => {
      handleView();
    }, [selectedRequest]);

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h3 className="text-xl font-extrabold text-gray-900">{selectedRequest.topic}</h3>
              <p className="text-sm font-medium text-gray-500 flex items-center gap-2 mt-1">
                <span className="bg-gray-200 px-2 py-0.5 rounded text-gray-700">{selectedRequest.category}</span>
                {new Date(selectedRequest.createdAt).toLocaleString()}
              </p>
            </div>
            <button onClick={() => setSelectedRequest(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <div className="flex items-center justify-between">
              {getStatusBadge(selectedRequest.status, selectedRequest.priority)}
              <div className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                {activeTab === 'received' ? `From: ${selectedRequest.raisedBy?.name} (${selectedRequest.raisedBy?.role})` : `To: ${selectedRequest.targetUser?.name} (${selectedRequest.targetUser?.role})`}
              </div>
            </div>

            {selectedRequest.student && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-xl"><UserIcon className="w-5 h-5 text-blue-700" /></div>
                <div>
                  <p className="text-xs font-bold text-blue-700 uppercase">Related Student</p>
                  <p className="font-bold text-gray-900">{selectedRequest.student?.name}</p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <h4 className="text-sm font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Message</h4>
              <p className="text-gray-800 whitespace-pre-wrap font-medium leading-relaxed">{selectedRequest.message}</p>
            </div>

            {selectedRequest.status === 'SCHEDULED' && selectedRequest.scheduledDate && (
              <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100">
                <h4 className="text-sm font-bold text-purple-700 uppercase mb-3 flex items-center gap-2"><CalendarIcon className="w-4 h-4"/> Meeting Scheduled</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-purple-600/70 uppercase">Date & Time</p>
                    <p className="font-bold text-gray-900">{new Date(selectedRequest.scheduledDate).toLocaleDateString()} at {selectedRequest.scheduledTime}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-purple-600/70 uppercase">Duration & Type</p>
                    <p className="font-bold text-gray-900">{selectedRequest.duration} mins • {selectedRequest.meetingType}</p>
                  </div>
                  {selectedRequest.meetingType === 'Online' ? (
                     <div className="col-span-2">
                      <p className="text-xs font-bold text-purple-600/70 uppercase">Meeting Link</p>
                      <a href={selectedRequest.meetingLink} target="_blank" rel="noreferrer" className="font-bold text-blue-600 hover:underline break-all">{selectedRequest.meetingLink || 'N/A'}</a>
                    </div>
                  ) : (
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-purple-600/70 uppercase">Location</p>
                      <p className="font-bold text-gray-900">{selectedRequest.location || 'N/A'}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedRequest.responseMessage && (
              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                <h4 className="text-sm font-bold text-emerald-700 uppercase mb-2">Response / Notes</h4>
                <p className="text-gray-800 font-medium">{selectedRequest.responseMessage}</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
             {isTarget && selectedRequest.status !== 'CANCELLED' && selectedRequest.status !== 'COMPLETED' && (
               <>
                 <button onClick={() => updateStatus(selectedRequest._id, 'cancel')} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition">Decline / Cancel</button>
                 <button onClick={() => setShowScheduleModal(true)} className="px-5 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-sm transition">Schedule Meeting</button>
                 {selectedRequest.status === 'SCHEDULED' && (
                   <button onClick={() => updateStatus(selectedRequest._id, 'complete')} className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-sm transition flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Mark Completed</button>
                 )}
               </>
             )}
             
             {!isTarget && selectedRequest.status === 'SCHEDULED' && (
                <button onClick={() => updateStatus(selectedRequest._id, 'complete')} className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-sm transition flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Mark Resolved</button>
             )}
             
             {!isTarget && selectedRequest.status === 'PENDING' && (
                <button onClick={() => updateStatus(selectedRequest._id, 'cancel')} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition">Cancel Request</button>
             )}
          </div>
        </div>
      </div>
    );
  };

  const getRoleTheme = () => {
    if (role === 'student') return 'text-blue-600';
    if (role === 'teacher') return 'text-red-600';
    if (role === 'principal') return 'text-emerald-600';
    if (role === 'parent') return 'text-orange-500';
    return 'text-primary';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-soft border border-gray-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
              <Hand className={`w-8 h-8 ${getRoleTheme()}`} />
              Hand Raises & Meetings
            </h2>
            <p className="text-gray-500 font-semibold mt-1">Manage inquiries, doubts, and schedule meetings.</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full md:w-auto px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-md"
          >
            <Plus className="w-5 h-5" /> Raise Hand
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
               <span className="text-gray-500 font-bold text-xs uppercase">Pending</span>
               <span className="text-2xl font-black text-yellow-600">{stats.PENDING || 0}</span>
             </div>
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
               <span className="text-gray-500 font-bold text-xs uppercase">Scheduled</span>
               <span className="text-2xl font-black text-purple-600">{stats.SCHEDULED || 0}</span>
             </div>
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
               <span className="text-gray-500 font-bold text-xs uppercase">Completed</span>
               <span className="text-2xl font-black text-emerald-600">{stats.COMPLETED || 0}</span>
             </div>
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-red-100 bg-red-50/30 flex flex-col relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2"><AlertCircle className="w-8 h-8 text-red-200/50" /></div>
               <span className="text-red-700 font-bold text-xs uppercase">Urgent action needed</span>
               <span className="text-2xl font-black text-red-600">{stats.urgent || 0}</span>
             </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-soft border border-gray-50 overflow-hidden flex flex-col h-[600px]">
          <div className="flex border-b border-gray-100">
            <button 
              className={`flex-1 py-4 font-bold text-sm text-center transition ${activeTab === 'received' ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('received')}
            >
              Received Requests
            </button>
            <button 
              className={`flex-1 py-4 font-bold text-sm text-center transition ${activeTab === 'my' ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('my')}
            >
              My Hand Raises
            </button>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto bg-gray-50/30">
            {loading ? (
               <div className="h-full flex items-center justify-center text-gray-400 font-bold">Loading...</div>
            ) : requests.length > 0 ? (
               <div className="space-y-3">
                 {requests.map(req => (
                   <div 
                     key={req._id} 
                     onClick={() => setSelectedRequest(req)}
                     className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden group"
                   >
                     {/* Urgent Indicator line */}
                     {(req.priority === 'High' || req.priority === 'Urgent') && (req.status === 'PENDING' || req.status === 'VIEWED') && (
                       <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                     )}

                     <div className="flex-1 min-w-0 pl-1">
                       <div className="flex items-center gap-2 mb-1">
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{new Date(req.createdAt).toLocaleDateString()}</span>
                         <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                         <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{req.category}</span>
                       </div>
                       <h3 className="text-lg font-bold text-gray-900 truncate">{req.topic}</h3>
                       <p className="text-sm font-medium text-gray-500 truncate flex items-center gap-1.5 mt-1">
                         {activeTab === 'received' ? `From: ${req.raisedBy?.name}` : `To: ${req.targetUser?.name}`}
                       </p>
                     </div>
                     <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                       {getStatusBadge(req.status, req.priority)}
                       <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition">
                         <ChevronRight className="w-4 h-4 text-gray-400" />
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            ) : (
               <div className="h-full flex flex-col items-center justify-center text-center p-6">
                 <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                   <Hand className="w-10 h-10 text-gray-300" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-800">No requests found</h3>
                 <p className="text-gray-500 mt-2 max-w-sm">There are no hand raise requests in this tab yet.</p>
               </div>
            )}
          </div>
        </div>

      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><Hand className="w-5 h-5"/> Raise Hand</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">To (Recipient)</label>
                <select required value={formData.targetUserId} onChange={e => setFormData({...formData, targetUserId: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium">
                  {targetUsers.map(user => (
                    <option key={user._id} value={user._id}>{user.name} ({user.role})</option>
                  ))}
                </select>
              </div>

              {role === 'parent' && children.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Related Student</label>
                  <select value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium">
                    {children.map(child => (
                      <option key={child._id} value={child._id}>{child.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium">
                    <option>Doubt</option>
                    <option>Inquiry</option>
                    <option>Meeting Request</option>
                    <option>Academic</option>
                    <option>Behaviour</option>
                    <option>General</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-800">
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent 🔴</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Topic</label>
                <input required type="text" placeholder="e.g. Science Chapter 4 Doubt" value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Detailed Message</label>
                <textarea required placeholder="Please describe your inquiry or doubt in detail..." value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium min-h-[120px]" />
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition shadow-lg text-lg flex items-center justify-center gap-2">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedRequest && <RequestDetailsModal />}
      {showScheduleModal && <ScheduleModal />}
    </Layout>
  );
};

export default HandRaisesPage;
