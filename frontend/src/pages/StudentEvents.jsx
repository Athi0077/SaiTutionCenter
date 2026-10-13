import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Calendar, MapPin, Users, Award, Info, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { initSocket } from '../services/socket';

const CATEGORIES = ["Sports", "Arts", "Literary", "Science & Technology", "Cultural", "Other"];

const StudentEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Modals
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [joining, setJoining] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events', { params: { search, category: filterCategory } });
      setEvents(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [search, filterCategory]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const socket = initSocket(token);
      
      const handleEventUpdate = (data) => {
        fetchEvents();
        if (data.title) {
          toast.success(`Event update: ${data.title}`);
        }
      };
      
      socket.on('event:published', handleEventUpdate);
      socket.on('event:updated', handleEventUpdate);
      socket.on('event:cancelled', handleEventUpdate);
      socket.on('event:completed', handleEventUpdate);
      socket.on('event:results_published', handleEventUpdate);
      
      return () => {
        socket.off('event:published', handleEventUpdate);
        socket.off('event:updated', handleEventUpdate);
        socket.off('event:cancelled', handleEventUpdate);
        socket.off('event:completed', handleEventUpdate);
        socket.off('event:results_published', handleEventUpdate);
      };
    }
  }, []);

  const viewDetails = (event) => {
    setSelectedEvent(event);
    setIsDetailsModalOpen(true);
  };

  const viewResults = (event) => {
    setSelectedEvent(event);
    setIsResultsModalOpen(true);
  };

  const handleJoinEvent = async () => {
    if (!selectedEvent) return;
    try {
      setJoining(true);
      await api.post(`/events/${selectedEvent._id}/join`);
      toast.success("Successfully registered for the event!");
      setIsDetailsModalOpen(false);
      fetchEvents(); // Refresh to update button states
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join event');
    } finally {
      setJoining(false);
    }
  };

  // Check if deadline passed
  const isDeadlinePassed = (deadline) => new Date() > new Date(deadline);

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">School Events</h2>
        
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
        </div>

        {/* Event List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full p-8 text-center text-gray-500">Loading events...</div>
          ) : events.length > 0 ? (
            events.map(event => (
              <div key={event._id} className="bg-white rounded-2xl shadow-soft p-5 border border-gray-50 flex flex-col hover:shadow-md transition relative overflow-hidden group">
                
                {event.isRegistered && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Registered
                  </div>
                )}

                <div className="flex justify-between items-start mb-3 mt-1">
                  <div>
                    <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md mb-2">{event.category}</span>
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-1 pr-16">{event.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{event.topic} {event.subtopic && `> ${event.subtopic}`}</p>
                  </div>
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
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Info size={14} className="text-gray-400" />
                    Deadline: <span className={isDeadlinePassed(event.registrationDeadline) ? "text-red-500 font-semibold" : ""}>{new Date(event.registrationDeadline).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex gap-2">
                  <button onClick={() => viewDetails(event)} className="flex-1 text-sm font-semibold px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-xl transition border border-gray-200">
                    View Details
                  </button>
                  
                  {event.publishedResult && (
                    <button onClick={() => viewResults(event)} className="flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl transition border border-purple-200">
                      <Award size={16} /> Results
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-12 text-center bg-white rounded-2xl shadow-soft">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-700 mb-1">No upcoming events</h3>
              <p className="text-gray-500">There are no school events available for you right now.</p>
            </div>
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      {isDetailsModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
              <div>
                <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md mb-2">{selectedEvent.category}</span>
                <h3 className="text-2xl font-bold text-gray-800">{selectedEvent.title}</h3>
                <p className="text-gray-500">{selectedEvent.topic} {selectedEvent.subtopic && `> ${selectedEvent.subtopic}`}</p>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full border border-gray-200">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Date & Time</p>
                  <p className="font-semibold text-gray-800">{new Date(selectedEvent.eventDate).toLocaleDateString()}</p>
                  {(selectedEvent.startTime || selectedEvent.endTime) && (
                    <p className="text-sm text-gray-600">{selectedEvent.startTime || '?'} - {selectedEvent.endTime || '?'}</p>
                  )}
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Venue</p>
                  <p className="font-semibold text-gray-800">{selectedEvent.venue}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Deadline</p>
                  <p className={`font-semibold ${isDeadlinePassed(selectedEvent.registrationDeadline) ? 'text-red-600' : 'text-gray-800'}`}>
                    {new Date(selectedEvent.registrationDeadline).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Participants</p>
                  <p className="font-semibold text-gray-800">
                    {selectedEvent.participantCount} {selectedEvent.participantLimit > 0 && `/ ${selectedEvent.participantLimit}`}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2">Description & Rules</h4>
                <div className="text-gray-600 text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {selectedEvent.description || 'No description provided.'}
                </div>
              </div>

            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50/50 mt-auto">
              <div>
                {selectedEvent.isRegistered && (
                  <span className="flex items-center gap-2 text-green-600 font-bold">
                    <CheckCircle2 size={20} /> You're Registered
                  </span>
                )}
                {!selectedEvent.isRegistered && isDeadlinePassed(selectedEvent.registrationDeadline) && (
                  <span className="text-red-500 font-bold">Registration Closed</span>
                )}
                {!selectedEvent.isRegistered && selectedEvent.status === 'completed' && (
                  <span className="text-gray-500 font-bold">Event Completed</span>
                )}
                {!selectedEvent.isRegistered && !isDeadlinePassed(selectedEvent.registrationDeadline) && selectedEvent.participantLimit > 0 && selectedEvent.participantCount >= selectedEvent.participantLimit && (
                  <span className="text-orange-500 font-bold">Event Full</span>
                )}
              </div>
              
              {!selectedEvent.isRegistered && selectedEvent.status === 'published' && !isDeadlinePassed(selectedEvent.registrationDeadline) && (selectedEvent.participantLimit === 0 || selectedEvent.participantCount < selectedEvent.participantLimit) && (
                <button 
                  onClick={handleJoinEvent}
                  disabled={joining}
                  className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark shadow-sm transition disabled:opacity-70 flex items-center gap-2"
                >
                  {joining ? 'Registering...' : "I'm Interested - Join Event"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {isResultsModalOpen && selectedEvent?.publishedResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-100 bg-purple-50/50">
              <h3 className="text-xl font-bold text-purple-900 flex items-center gap-2">
                <Award className="text-purple-600" /> Official Results
              </h3>
              <p className="text-sm text-purple-700/80 mt-1">{selectedEvent.title}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-amber-50/50 border border-amber-100 rounded-xl shadow-sm">
                <span className="text-3xl">🥇</span>
                <div>
                  <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">1st Place</p>
                  <p className="font-semibold text-gray-800 text-lg">{selectedEvent.publishedResult.firstPlace?.name || 'Not awarded'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm">
                <span className="text-3xl">🥈</span>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">2nd Place</p>
                  <p className="font-semibold text-gray-800 text-lg">{selectedEvent.publishedResult.secondPlace?.name || 'Not awarded'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-orange-50/50 border border-orange-100 rounded-xl shadow-sm">
                <span className="text-3xl">🥉</span>
                <div>
                  <p className="text-xs text-orange-700 font-bold uppercase tracking-wider">3rd Place</p>
                  <p className="font-semibold text-gray-800 text-lg">{selectedEvent.publishedResult.thirdPlace?.name || 'Not awarded'}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-center bg-gray-50/50">
              <button onClick={() => setIsResultsModalOpen(false)} className="px-8 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-sm transition">
                Close Results
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default StudentEvents;
