import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Calendar, MapPin, Users, Award, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { initSocket } from '../services/socket';

const CATEGORIES = ["Sports", "Arts", "Literary", "Science & Technology", "Cultural", "Other"];

const TeacherEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Modals
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);

  // Results Form
  const [resultsForm, setResultsForm] = useState({ firstPlace: '', secondPlace: '', thirdPlace: '' });
  const [submittingResults, setSubmittingResults] = useState(false);

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

  const viewParticipants = async (event) => {
    setSelectedEvent(event);
    setIsParticipantsModalOpen(true);
    setLoadingParticipants(true);
    try {
      const res = await api.get(`/events/${event._id}/participants`);
      setParticipants(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch participants');
    } finally {
      setLoadingParticipants(false);
    }
  };

  const openResultsModal = async (event) => {
    setSelectedEvent(event);
    // Fetch participants to populate dropdowns
    setLoadingParticipants(true);
    try {
      const pRes = await api.get(`/events/${event._id}/participants`);
      setParticipants(pRes.data.data);
      
      // Try to fetch existing results if any
      const rRes = await api.get(`/events/${event._id}/results`);
      if (rRes.data.data) {
        setResultsForm({
          firstPlace: rRes.data.data.firstPlace?._id || '',
          secondPlace: rRes.data.data.secondPlace?._id || '',
          thirdPlace: rRes.data.data.thirdPlace?._id || ''
        });
      } else {
        setResultsForm({ firstPlace: '', secondPlace: '', thirdPlace: '' });
      }
      setIsResultsModalOpen(true);
    } catch (err) {
      toast.error('Failed to prepare results form');
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleResultSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingResults(true);
      await api.post(`/events/${selectedEvent._id}/results`, resultsForm);
      toast.success('Results submitted to Principal for approval');
      setIsResultsModalOpen(false);
      fetchEvents(); // refresh to show updated state if needed
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit results');
    } finally {
      setSubmittingResults(false);
    }
  };

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
              placeholder="Search published events..." 
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
              <div key={event._id} className="bg-white rounded-2xl shadow-soft p-5 border border-gray-50 flex flex-col hover:shadow-md transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md mb-2">{event.category}</span>
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{event.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{event.topic} {event.subtopic && `> ${event.subtopic}`}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide border
                    ${event.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
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

                <div className="pt-4 border-t border-gray-100 flex gap-2">
                  <button onClick={() => viewParticipants(event)} className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-xl transition border border-gray-200">
                    <Users size={16} /> Participants
                  </button>
                  {event.status === 'completed' && (
                    <button onClick={() => openResultsModal(event)} className="flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl transition border border-purple-200">
                      <Award size={16} /> Results
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-12 text-center bg-white rounded-2xl shadow-soft">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-700 mb-1">No published events</h3>
              <p className="text-gray-500">There are no school events available at the moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Participants Modal */}
      {isParticipantsModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Participants</h3>
                <p className="text-sm text-gray-500">{selectedEvent.title}</p>
              </div>
              <button onClick={() => setIsParticipantsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <div className="p-0 overflow-y-auto custom-scrollbar flex-1">
              {loadingParticipants ? (
                <div className="p-8 text-center text-gray-500">Loading participants...</div>
              ) : participants.length > 0 ? (
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                    <tr>
                      <th className="p-4 font-semibold text-gray-600">#</th>
                      <th className="p-4 font-semibold text-gray-600">Student Name</th>
                      <th className="p-4 font-semibold text-gray-600">Class</th>
                      <th className="p-4 font-semibold text-gray-600">Registration Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {participants.map((p, index) => (
                      <tr key={p._id} className="hover:bg-gray-50 transition">
                        <td className="p-4 text-gray-500">{index + 1}</td>
                        <td className="p-4">
                          <p className="font-bold text-gray-800">{p.student.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{p.student.studentId}</p>
                        </td>
                        <td className="p-4 text-gray-600 font-medium">{p.className}</td>
                        <td className="p-4 text-gray-500">{new Date(p.registeredAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-gray-500">No participants registered for this event.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Results Modal */}
      {isResultsModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-100 bg-purple-50/50">
              <h3 className="text-xl font-bold text-purple-900 flex items-center gap-2">
                <Award className="text-purple-600" /> Submit Event Results
              </h3>
              <p className="text-sm text-purple-700/80 mt-1">{selectedEvent.title}</p>
            </div>
            
            <div className="p-6">
              {participants.length === 0 ? (
                <p className="text-red-500 text-center font-medium">Cannot submit results: No participants registered.</p>
              ) : (
                <form id="results-form" onSubmit={handleResultSubmit} className="space-y-5">
                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex items-center gap-4">
                    <span className="text-3xl">🥇</span>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">1st Place</label>
                      <select 
                        required
                        value={resultsForm.firstPlace} 
                        onChange={e => setResultsForm({...resultsForm, firstPlace: e.target.value})}
                        className="w-full p-2 bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 text-sm"
                      >
                        <option value="">Select Student...</option>
                        {participants.map(p => (
                          <option key={p.student._id} value={p.student._id} disabled={resultsForm.secondPlace === p.student._id || resultsForm.thirdPlace === p.student._id}>
                            {p.student.name} ({p.className})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center gap-4">
                    <span className="text-3xl">🥈</span>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">2nd Place (Optional)</label>
                      <select 
                        value={resultsForm.secondPlace} 
                        onChange={e => setResultsForm({...resultsForm, secondPlace: e.target.value})}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-500/20 text-sm"
                      >
                        <option value="">Select Student...</option>
                        {participants.map(p => (
                          <option key={p.student._id} value={p.student._id} disabled={resultsForm.firstPlace === p.student._id || resultsForm.thirdPlace === p.student._id}>
                            {p.student.name} ({p.className})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 flex items-center gap-4">
                    <span className="text-3xl">🥉</span>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-orange-700 uppercase tracking-wider mb-1">3rd Place (Optional)</label>
                      <select 
                        value={resultsForm.thirdPlace} 
                        onChange={e => setResultsForm({...resultsForm, thirdPlace: e.target.value})}
                        className="w-full p-2 bg-white border border-orange-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 text-sm"
                      >
                        <option value="">Select Student...</option>
                        {participants.map(p => (
                          <option key={p.student._id} value={p.student._id} disabled={resultsForm.firstPlace === p.student._id || resultsForm.secondPlace === p.student._id}>
                            {p.student.name} ({p.className})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </form>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 mt-auto">
              <button type="button" onClick={() => setIsResultsModalOpen(false)} className="px-5 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition">Cancel</button>
              <button 
                type="submit" 
                form="results-form" 
                disabled={submittingResults || participants.length === 0}
                className="px-6 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-sm transition disabled:opacity-50"
              >
                {submittingResults ? 'Submitting...' : 'Submit to Principal'}
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default TeacherEvents;
