import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Plus, Edit2, CheckCircle, XCircle, Eye, Calendar, MapPin, Users, Award, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ["Sports", "Arts", "Literary", "Science & Technology", "Cultural", "Other"];
const STATUSES = ["draft", "published", "completed", "cancelled"];

const PrincipalEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Gallery States
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Modal States
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventResults, setEventResults] = useState(null);
  const [reviewNote, setReviewNote] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Sports',
    topic: '',
    subtopic: '',
    description: '',
    posterUrl: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    venue: '',
    registrationDeadline: '',
    participantLimit: 0
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events/all', {
        params: { search, category: filterCategory, status: filterStatus }
      });
      setEvents(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [search, filterCategory, filterStatus]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      title: '', category: 'Sports', topic: '', subtopic: '', description: '',
      posterUrl: '', eventDate: '', startTime: '', endTime: '', venue: '',
      registrationDeadline: '', participantLimit: 0
    });
    setIsEventModalOpen(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      category: event.category,
      topic: event.topic,
      subtopic: event.subtopic || '',
      description: event.description || '',
      posterUrl: event.posterUrl || '',
      eventDate: event.eventDate.split('T')[0],
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      venue: event.venue,
      registrationDeadline: event.registrationDeadline.split('T')[0],
      participantLimit: event.participantLimit || 0
    });
    setIsEventModalOpen(true);
  };

  const saveEvent = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await api.put(`/events/${editingEvent._id}`, formData);
        toast.success('Event updated successfully');
      } else {
        await api.post('/events', formData);
        toast.success('Event created as draft');
      }
      setIsEventModalOpen(false);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event');
    }
  };

  const changeStatus = async (eventId, newStatus) => {
    if (newStatus === 'cancelled' && !window.confirm('Are you sure you want to cancel this event? This action cannot be undone.')) return;
    if (newStatus === 'completed' && !window.confirm('Mark this event as completed? This will stop new registrations.')) return;

    try {
      await api.put(`/events/${eventId}/status`, { status: newStatus });
      toast.success(`Event status changed to ${newStatus}`);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const openReviewModal = async (eventId) => {
    try {
      const res = await api.get(`/events/${eventId}/results`);
      if (res.data.data) {
        setEventResults(res.data.data);
        setReviewNote('');
        setIsReviewModalOpen(true);
      } else {
        toast.error('No results submitted yet');
      }
    } catch (err) {
      toast.error('Failed to fetch results');
    }
  };

  const handleReviewAction = async (action) => {
    try {
      await api.put(`/events/${eventResults.eventId}/results/review`, {
        action,
        returnNote: reviewNote
      });
      toast.success(`Results ${action === 'publish' ? 'published' : action === 'approve' ? 'approved' : 'returned'}`);
      setIsReviewModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const fetchGalleryPhotos = async () => {
    try {
      const res = await api.get('/events/gallery');
      setGalleryPhotos(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch gallery photos');
    }
  };

  const handleOpenGallery = () => {
    fetchGalleryPhotos();
    setIsGalleryModalOpen(true);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be 10MB or less");
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    try {
      setIsUploadingPhoto(true);
      await api.post('/events/gallery', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Photo added to gallery');
      fetchGalleryPhotos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;
    
    try {
      await api.delete(`/events/gallery/${photoId}`);
      toast.success('Photo deleted');
      fetchGalleryPhotos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete photo');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Event Management</h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleOpenGallery}
              className="flex items-center gap-2 px-4 py-2 bg-white text-primary border border-primary rounded-lg hover:bg-primary/5 transition font-semibold shadow-sm"
            >
              <ImageIcon size={18} /> Manage Event Photos
            </button>
            <button 
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold shadow-sm"
            >
              <Plus size={18} /> Create Event
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-soft flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] flex items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 focus-within:border-primary transition">
            <span className="text-gray-400 mr-2">🔍</span>
            <input 
              type="text" 
              placeholder="Search events..." 
              className="w-full bg-transparent focus:outline-none text-sm text-gray-700"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <select 
            className="bg-gray-50 border border-gray-100 text-gray-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2 outline-none"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          
          <select 
            className="bg-gray-50 border border-gray-100 text-gray-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2 outline-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        {/* Event List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full p-8 text-center text-gray-500">Loading events...</div>
          ) : events.length > 0 ? (
            events.map(event => (
              <div key={event._id} className="bg-white rounded-2xl shadow-soft p-5 border border-gray-50 flex flex-col hover:shadow-md transition group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-2 h-full ${event.status === 'published' ? 'bg-green-500' : event.status === 'draft' ? 'bg-gray-400' : event.status === 'completed' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md mb-2">{event.category}</span>
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{event.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{event.topic} {event.subtopic && `> ${event.subtopic}`}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide border
                    ${event.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : 
                      event.status === 'draft' ? 'bg-gray-100 text-gray-600 border-gray-200' : 
                      event.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      'bg-red-50 text-red-700 border-red-200'}`}>
                    {event.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} className="text-gray-400" />
                    {new Date(event.eventDate).toLocaleDateString()} {event.startTime && `• ${event.startTime}`}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={14} className="text-gray-400" />
                    {event.participantCount} Participants {event.participantLimit > 0 && `/ ${event.participantLimit}`}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-2 items-center">
                  {(event.status === 'draft' || event.status === 'published') && (
                    <button onClick={() => openEditModal(event)} className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition" title="Edit Event">
                      <Edit2 size={16} />
                    </button>
                  )}
                  
                  {event.status === 'draft' && (
                    <button onClick={() => changeStatus(event._id, 'published')} className="text-xs font-semibold px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition border border-green-200">
                      Publish
                    </button>
                  )}
                  
                  {event.status === 'published' && (
                    <>
                      <button onClick={() => changeStatus(event._id, 'completed')} className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition border border-blue-200">
                        Mark Completed
                      </button>
                      <button onClick={() => changeStatus(event._id, 'draft')} className="text-xs font-semibold px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg transition border border-gray-200">
                        Unpublish
                      </button>
                    </>
                  )}

                  {event.status === 'completed' && (
                    <button onClick={() => openReviewModal(event._id)} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition border border-purple-200">
                      <Award size={14} /> Review Results
                    </button>
                  )}

                  {(event.status === 'draft' || event.status === 'published') && (
                    <button onClick={() => changeStatus(event._id, 'cancelled')} className="ml-auto p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Cancel Event">
                      <XCircle size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-12 text-center bg-white rounded-2xl shadow-soft">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-700 mb-1">No events found</h3>
              <p className="text-gray-500">Create a new event or adjust your search filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Event Modal */}
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-800">{editingEvent ? 'Edit Event' : 'Create New Event'}</h3>
              <button onClick={() => setIsEventModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="event-form" onSubmit={saveEvent} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-full">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Event Title *</label>
                  <input type="text" name="title" required value={formData.title} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" placeholder="e.g. Annual Sports Day 2026" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
                  <select name="category" required value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition">
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Topic *</label>
                  <input type="text" name="topic" required value={formData.topic} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" placeholder="e.g. Running Race" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Subtopic (Optional)</label>
                  <input type="text" name="subtopic" value={formData.subtopic} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" placeholder="e.g. 100 Metre Race" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Venue *</label>
                  <input type="text" name="venue" required value={formData.venue} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" placeholder="e.g. Main Ground" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Event Date *</label>
                  <input type="date" name="eventDate" required value={formData.eventDate} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Registration Deadline *</label>
                  <input type="date" name="registrationDeadline" required value={formData.registrationDeadline} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time (Optional)</label>
                  <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">End Time (Optional)</label>
                  <input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Participant Limit</label>
                  <input type="number" min="0" name="participantLimit" value={formData.participantLimit} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" placeholder="0 for unlimited" />
                  <p className="text-xs text-gray-500 mt-1">Leave as 0 for unlimited participants</p>
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea name="description" rows="4" value={formData.description} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition custom-scrollbar" placeholder="Detailed event description, rules, and instructions..."></textarea>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 mt-auto">
              <button type="button" onClick={() => setIsEventModalOpen(false)} className="px-5 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition">Cancel</button>
              <button type="submit" form="event-form" className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark shadow-sm transition">
                {editingEvent ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Results Modal */}
      {isReviewModalOpen && eventResults && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-100 bg-purple-50/50">
              <h3 className="text-xl font-bold text-purple-900 flex items-center gap-2">
                <Award className="text-purple-600" /> Review Event Results
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-gray-500">Submitted by: <span className="font-semibold text-gray-800">{eventResults.submittedBy?.name}</span></span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide border
                  ${eventResults.resultStatus === 'published' ? 'bg-green-50 text-green-700 border-green-200' : 
                    eventResults.resultStatus === 'approved' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                    'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {eventResults.resultStatus}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                  <span className="text-2xl">🥇</span>
                  <div>
                    <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">1st Place</p>
                    <p className="font-semibold text-gray-800">{eventResults.firstPlace?.name || 'Not awarded'}</p>
                    {eventResults.firstPlace && <p className="text-xs text-gray-500">{eventResults.firstPlace.studentId}</p>}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-2xl">🥈</span>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">2nd Place</p>
                    <p className="font-semibold text-gray-800">{eventResults.secondPlace?.name || 'Not awarded'}</p>
                    {eventResults.secondPlace && <p className="text-xs text-gray-500">{eventResults.secondPlace.studentId}</p>}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-orange-50/50 border border-orange-100 rounded-xl">
                  <span className="text-2xl">🥉</span>
                  <div>
                    <p className="text-xs text-orange-700 font-bold uppercase tracking-wider">3rd Place</p>
                    <p className="font-semibold text-gray-800">{eventResults.thirdPlace?.name || 'Not awarded'}</p>
                    {eventResults.thirdPlace && <p className="text-xs text-gray-500">{eventResults.thirdPlace.studentId}</p>}
                  </div>
                </div>
              </div>

              {eventResults.resultStatus === 'submitted' && (
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Return Note (if returning to teacher)</label>
                  <textarea 
                    value={reviewNote} 
                    onChange={(e) => setReviewNote(e.target.value)} 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" 
                    placeholder="Reason for returning..."
                    rows="2"
                  ></textarea>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button onClick={() => setIsReviewModalOpen(false)} className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition">Close</button>
              
              {eventResults.resultStatus === 'submitted' && (
                <>
                  <button onClick={() => handleReviewAction('return')} className="px-4 py-2 bg-red-50 text-red-700 font-semibold rounded-xl hover:bg-red-100 transition border border-red-200">
                    Return to Teacher
                  </button>
                  <button onClick={() => handleReviewAction('approve')} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-sm transition">
                    Approve
                  </button>
                </>
              )}
              
              {(eventResults.resultStatus === 'approved' || eventResults.resultStatus === 'submitted') && (
                <button onClick={() => handleReviewAction('publish')} className="px-6 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-sm transition">
                  Publish Results
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event Gallery Modal */}
      {isGalleryModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ImageIcon className="text-primary" /> Event Gallery Photos
              </h3>
              <button onClick={() => setIsGalleryModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/30">
              <div className="mb-6 bg-white p-6 rounded-2xl border border-dashed border-gray-300 text-center hover:bg-gray-50 transition cursor-pointer relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handlePhotoUpload}
                  disabled={isUploadingPhoto}
                />
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  {isUploadingPhoto ? (
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                  ) : (
                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  )}
                  <p className="font-semibold text-gray-700">{isUploadingPhoto ? 'Uploading...' : 'Click or drag to upload a new event photo'}</p>
                  <p className="text-sm text-gray-500 mt-1">Recommended size: 1080x720px. Max 10MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {galleryPhotos.length > 0 ? (
                  galleryPhotos.map(photo => (
                    <div key={photo._id} className="relative group rounded-xl overflow-hidden shadow-sm aspect-video bg-gray-100">
                      <img 
                        src={photo.imageUrl} 
                        alt="Event" 
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => handleDeletePhoto(photo._id)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition transform hover:scale-110 shadow-lg"
                          title="Delete Photo"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center">
                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No photos in the gallery yet.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white">
              <button onClick={() => setIsGalleryModalOpen(false)} className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default PrincipalEvents;
