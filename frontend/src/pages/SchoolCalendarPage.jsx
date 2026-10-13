import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, X, Edit, Trash2 } from 'lucide-react';

const HOLIDAY_TYPES = {
  GENERAL_HOLIDAY: { label: 'General Holiday', color: 'bg-red-100 text-red-700 border-red-200' },
  GOVERNMENT_HOLIDAY: { label: 'Government Holiday', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  SCHOOL_HOLIDAY: { label: 'School Holiday', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  SPECIAL_HOLIDAY: { label: 'Special Holiday', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  EMERGENCY_HOLIDAY: { label: 'Emergency Holiday', color: 'bg-orange-100 text-orange-700 border-orange-200' }
};

const SchoolCalendarPage = () => {
  const { currentUser } = useContext(AuthContext);
  const isPrincipal = currentUser?.role === 'principal' || currentUser?.role === 'main_principal';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    type: 'SCHOOL_HOLIDAY',
    description: '',
    announcementMessage: '',
    sendAnnouncement: false
  });

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const res = await api.get(`/calendar?month=${month}&year=${year}`);
      setEvents(res.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch calendar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const openDateModal = (dateStr) => {
    const d = new Date(dateStr);
    setSelectedDate(d);
    
    // Check if it's Sunday (Sunday logic is dynamic)
    const isSunday = d.getDay() === 0;
    
    // Check if there's an event
    const event = events.find(e => {
      const ed = new Date(e.date);
      return ed.getFullYear() === d.getFullYear() && 
             ed.getMonth() === d.getMonth() && 
             ed.getDate() === d.getDate();
    });

    if (event) {
      setFormData({
        id: event._id,
        title: event.title,
        type: event.type,
        description: event.description || '',
        announcementMessage: event.announcementMessage || '',
        sendAnnouncement: false
      });
    } else {
      setFormData({
        id: null,
        title: isSunday ? 'Sunday' : '',
        type: isSunday ? 'GENERAL_HOLIDAY' : 'SCHOOL_HOLIDAY',
        description: '',
        announcementMessage: '',
        sendAnnouncement: false
      });
    }

    setIsModalOpen(true);
  };

  const handleSaveHoliday = async (e) => {
    e.preventDefault();
    if (!isPrincipal) return;

    try {
      const payload = {
        date: selectedDate.toISOString(),
        title: formData.title,
        type: formData.type,
        description: formData.description,
        announcementMessage: formData.announcementMessage,
        sendAnnouncement: formData.sendAnnouncement
      };

      if (formData.id) {
        await api.put(`/calendar/${formData.id}`, payload);
        toast.success('Holiday updated successfully');
      } else {
        await api.post('/calendar', payload);
        toast.success('Holiday added successfully');
      }
      setIsModalOpen(false);
      fetchCalendar();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save holiday');
    }
  };

  const handleDeleteHoliday = async () => {
    if (!isPrincipal || !formData.id) return;
    if (!window.confirm('Are you sure you want to remove this holiday?')) return;
    
    try {
      await api.delete(`/calendar/${formData.id}`);
      toast.success('Holiday removed');
      setIsModalOpen(false);
      fetchCalendar();
    } catch (err) {
      toast.error('Failed to remove holiday');
    }
  };

  // Render calendar grid
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Header
    const headers = dayNames.map(day => (
      <div key={day} className="text-center font-bold text-gray-500 py-2 text-sm uppercase tracking-wider border-b">
        {day}
      </div>
    ));

    // Blanks before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 border-b border-r bg-gray-50/50 min-h-[100px]"></div>);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const iterDate = new Date(year, month, d);
      const isSunday = iterDate.getDay() === 0;
      
      const event = events.find(e => {
        const ed = new Date(e.date);
        return ed.getFullYear() === year && ed.getMonth() === month && ed.getDate() === d;
      });

      const today = new Date();
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

      let cellClass = "p-2 border-b border-r min-h-[100px] cursor-pointer transition hover:bg-gray-50 flex flex-col gap-1 relative";
      let content = null;
      let isHoliday = false;

      if (event) {
        isHoliday = true;
        const config = HOLIDAY_TYPES[event.type] || HOLIDAY_TYPES.GENERAL_HOLIDAY;
        cellClass += ` bg-${config.color.split(' ')[0].split('-')[1]}-50/50`;
        content = (
          <div className={`text-xs p-1.5 rounded border ${config.color} shadow-sm font-semibold truncate`}>
            {event.title}
          </div>
        );
      } else if (isSunday) {
        isHoliday = true;
        cellClass += " bg-red-50/30";
        content = (
          <div className="text-xs p-1.5 rounded border bg-red-50 text-red-600 border-red-200 shadow-sm font-semibold truncate">
            Sunday
          </div>
        );
      } else {
        content = (
          <div className="text-[10px] text-green-600 font-bold uppercase tracking-wider flex items-center gap-1 mt-1 opacity-50">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Working Day
          </div>
        );
      }

      if (isToday) {
        cellClass += " ring-2 ring-primary ring-inset";
      }

      days.push(
        <div key={d} className={cellClass} onClick={() => openDateModal(dateStr)}>
          <div className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white shadow-md' : (isHoliday ? 'text-red-500' : 'text-gray-700')}`}>
            {d}
          </div>
          {content}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-7 border-t border-l border-gray-100">
          {headers}
          {days}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <CalendarIcon className="text-primary" /> School Calendar
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage holidays and working days</p>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-lg transition text-gray-600 hover:shadow-sm">
              <ChevronLeft size={20} />
            </button>
            <button onClick={handleToday} className="px-4 py-2 font-bold text-sm text-primary hover:bg-primary/10 rounded-lg transition">
              Today
            </button>
            <div className="px-4 py-2 font-bold text-gray-800 min-w-[140px] text-center">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
            <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-lg transition text-gray-600 hover:shadow-sm">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-[600px] flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500 font-medium">Loading calendar...</p>
          </div>
        ) : (
          renderCalendar()
        )}
      </div>

      {/* Date Details Modal */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <CalendarIcon size={18} className="text-primary" /> 
                {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {/* If Not Principal, show details only */}
              {!isPrincipal ? (
                <div className="space-y-4">
                  {formData.id || selectedDate.getDay() === 0 ? (
                    <div className="text-center p-6 bg-red-50 rounded-xl border border-red-100">
                      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                        🏖️
                      </div>
                      <h4 className="text-xl font-bold text-red-800 mb-1">{formData.title || 'Holiday'}</h4>
                      <span className={`inline-block px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider mb-4 ${HOLIDAY_TYPES[formData.type]?.color || 'bg-gray-100 text-gray-600'}`}>
                        {HOLIDAY_TYPES[formData.type]?.label || 'Holiday'}
                      </span>
                      {formData.description && (
                        <p className="text-sm text-red-700/80 mb-4">{formData.description}</p>
                      )}
                      <div className="bg-white/60 p-3 rounded-lg text-sm font-semibold text-red-800 border border-red-200/50">
                        Attendance is not required today.
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-green-50 rounded-xl border border-green-100">
                      <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                        🏫
                      </div>
                      <h4 className="text-xl font-bold text-green-800 mb-2">Working Day</h4>
                      <p className="text-sm text-green-700/80">Regular classes and attendance apply.</p>
                    </div>
                  )}
                  {formData.announcementMessage && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                      <div className="text-xl">📢</div>
                      <div>
                        <h5 className="font-bold text-blue-900 text-sm mb-1">Announcement</h5>
                        <p className="text-xs text-blue-800">{formData.announcementMessage}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Principal Edit Form */
                <form onSubmit={handleSaveHoliday} className="space-y-4">
                  {selectedDate.getDay() === 0 && !formData.id ? (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-4 text-sm text-amber-800">
                      <strong>Note:</strong> Sunday is automatically treated as a holiday. You only need to save this if you want to override the title or add an announcement.
                    </div>
                  ) : null}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Holiday Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                      placeholder="e.g., Diwali, Summer Break"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Holiday Type</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none"
                    >
                      {Object.keys(HOLIDAY_TYPES).map(key => (
                        <option key={key} value={key}>{HOLIDAY_TYPES[key].label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition resize-none h-20"
                      placeholder="Add any internal notes..."
                    ></textarea>
                  </div>

                  {!formData.id && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.sendAnnouncement}
                          onChange={e => setFormData({...formData, sendAnnouncement: e.target.checked})}
                          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                        />
                        <span className="text-sm font-semibold text-gray-700">Send Announcement</span>
                      </label>
                      
                      {formData.sendAnnouncement && (
                        <div>
                          <textarea 
                            required={formData.sendAnnouncement}
                            value={formData.announcementMessage}
                            onChange={e => setFormData({...formData, announcementMessage: e.target.value})}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary outline-none text-sm h-16 resize-none"
                            placeholder="Message to be sent as announcement..."
                          ></textarea>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button type="submit" className="flex-1 bg-primary text-white font-bold py-2.5 rounded-xl hover:bg-primary-dark transition flex justify-center items-center gap-2">
                      {formData.id ? <><Edit size={18}/> Update Holiday</> : <><Plus size={18}/> Add Holiday</>}
                    </button>
                    {formData.id && (
                      <button 
                        type="button" 
                        onClick={handleDeleteHoliday}
                        className="px-4 bg-red-100 text-red-600 hover:bg-red-200 font-bold py-2.5 rounded-xl transition flex justify-center items-center"
                        title="Remove Holiday"
                      >
                        <Trash2 size={18}/>
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default SchoolCalendarPage;
