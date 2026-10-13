import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Calendar, Clock, BookOpen, MapPin, ChevronRight, AlertCircle, Coffee, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const TeacherPersonalTimetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('today'); // 'today' or 'week'

  const workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    fetchTeacherTimetable();
  }, []);

  const fetchTeacherTimetable = async () => {
    try {
      setLoading(true);
      const res = await api.get('/timetable/teacher');
      setTimetable(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load teacher timetable');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format time strings (e.g. "09:45" to "9:45 AM")
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  // Get current day string
  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  // Check if current time is within a period
  const isCurrentPeriod = (startTime, endTime) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTotalMins = currentHour * 60 + currentMin;

    const [startH, startM] = startTime.split(':').map(Number);
    const startTotalMins = startH * 60 + startM;

    const [endH, endM] = endTime.split(':').map(Number);
    const endTotalMins = endH * 60 + endM;

    return currentTotalMins >= startTotalMins && currentTotalMins < endTotalMins;
  };

  // Check if a period is in the future today
  const isUpcomingPeriod = (startTime) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTotalMins = currentHour * 60 + currentMin;

    const [startH, startM] = startTime.split(':').map(Number);
    const startTotalMins = startH * 60 + startM;

    return startTotalMins > currentTotalMins;
  };

  const today = getCurrentDay();
  const todayPeriods = timetable
    .filter(p => p.day === today)
    .sort((a, b) => {
      const aStart = a.startTime.split(':').map(Number);
      const bStart = b.startTime.split(':').map(Number);
      return (aStart[0] * 60 + aStart[1]) - (bStart[0] * 60 + bStart[1]);
    });

  const currentPeriod = todayPeriods.find(p => isCurrentPeriod(p.startTime, p.endTime));
  const upcomingPeriods = todayPeriods.filter(p => isUpcomingPeriod(p.startTime));
  const nextPeriod = upcomingPeriods.length > 0 ? upcomingPeriods[0] : null;

  // Process grid for week view
  const periodsByNumber = {};
  timetable.forEach(p => {
    if (!periodsByNumber[p.periodNumber]) {
      periodsByNumber[p.periodNumber] = {
        periodNumber: p.periodNumber,
        startTime: p.startTime,
        endTime: p.endTime,
        days: {}
      };
    }
    // Handle multiple classes in same period/break properly
    if (!periodsByNumber[p.periodNumber].days[p.day]) {
      periodsByNumber[p.periodNumber].days[p.day] = p;
    }
  });

  const gridRows = Object.values(periodsByNumber).sort((a, b) => a.periodNumber - b.periodNumber);

  const renderPeriodCard = (p, label, isCurrent = false) => {
    if (!p) return null;
    const isBreak = p.type === 'break' || p.type === 'lunch';
    const isFree = p.type === 'free'; // In case we synthesize free periods
    
    return (
      <div className={`p-4 rounded-xl shadow-sm border ${isCurrent ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'} flex flex-col`}>
        <div className="flex justify-between items-center mb-2">
          <span className={`text-xs font-bold px-2 py-1 rounded-md ${isCurrent ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            {label}
          </span>
          <div className="flex items-center text-xs font-medium text-gray-500">
            <Clock size={12} className="mr-1" />
            {formatTime(p.startTime)} - {formatTime(p.endTime)}
          </div>
        </div>
        
        {isBreak ? (
          <div className="flex items-center gap-2 text-yellow-600 font-semibold mt-2">
            <Coffee size={18} />
            <span>{p.type === 'break' ? 'Break Time' : 'Lunch Break'}</span>
          </div>
        ) : isFree ? (
          <div className="flex items-center gap-2 text-green-600 font-semibold mt-2">
            <span>Free Period</span>
          </div>
        ) : (
          <>
            <h4 className="text-lg font-bold text-gray-800">{p.subject || '-'}</h4>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <BookOpen size={14} className="text-gray-400" />
                {p.classInfo ? `${p.classInfo.className}` : '-'}
              </div>
              <div className="flex items-center gap-1">
                <MapPin size={14} className="text-gray-400" />
                Room {p.classInfo ? p.classInfo.className : '-'}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">My Timetable</h2>
            <p className="text-sm text-gray-500">Manage your daily schedule and classes</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setView('today')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${view === 'today' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Today
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${view === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Weekly
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : view === 'today' ? (
          <div className="space-y-6">
            {/* Today's Schedule Section */}
            <div className="bg-white p-6 rounded-2xl shadow-soft">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="text-blue-500" />
                <h3 className="text-xl font-bold text-gray-800">Today's Schedule ({today})</h3>
              </div>

              {workingDays.includes(today) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {currentPeriod ? (
                      renderPeriodCard(currentPeriod, 'Current Period', true)
                    ) : (
                      <div className="p-6 rounded-xl shadow-sm border border-gray-100 bg-gray-50 flex flex-col items-center justify-center text-gray-500 h-full min-h-[120px]">
                        <AlertCircle size={24} className="mb-2 text-gray-400" />
                        <p className="font-medium">No active class right now</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    {nextPeriod ? (
                      renderPeriodCard(nextPeriod, 'Next Period')
                    ) : (
                      <div className="p-6 rounded-xl shadow-sm border border-gray-100 bg-gray-50 flex flex-col items-center justify-center text-gray-500 h-full min-h-[120px]">
                        <Check size={24} className="mb-2 text-green-400" />
                        <p className="font-medium">No more classes today!</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p>It's the weekend! Relax and enjoy your day off.</p>
                </div>
              )}
            </div>

            {/* Upcoming today list */}
            {workingDays.includes(today) && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" /> Full Day Schedule
                </h3>
                
                {todayPeriods.length > 0 ? (
                  <div className="space-y-3">
                    {gridRows.map(row => {
                      const p = row.days[today];
                      if (!p) {
                        return (
                          <div key={`free-${row.periodNumber}`} className="flex items-center p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                            <div className="w-24 shrink-0">
                              <span className="text-sm font-bold text-gray-600">{formatTime(row.startTime)}</span>
                            </div>
                            <div className="text-sm font-medium text-gray-400 flex-1">Free Period</div>
                          </div>
                        );
                      }
                      
                      const isCurrent = isCurrentPeriod(p.startTime, p.endTime);
                      const isPast = !isCurrent && !isUpcomingPeriod(p.startTime);
                      const isBreak = p.type === 'break' || p.type === 'lunch';
                      
                      return (
                        <div key={p._id} className={`flex items-center p-4 rounded-xl border ${isCurrent ? 'border-blue-200 bg-blue-50/30' : isPast ? 'border-gray-100 bg-gray-50 opacity-70' : 'border-gray-100 bg-white shadow-sm'}`}>
                          <div className="w-24 shrink-0 flex flex-col">
                            <span className={`text-sm font-bold ${isCurrent ? 'text-blue-700' : 'text-gray-800'}`}>{formatTime(p.startTime)}</span>
                            <span className="text-xs text-gray-500">{formatTime(p.endTime)}</span>
                          </div>
                          
                          <div className="flex-1 ml-4 border-l-2 pl-4 border-gray-200">
                            {isBreak ? (
                              <div className="text-yellow-600 font-bold flex items-center gap-2">
                                <Coffee size={16} /> {p.type === 'break' ? 'Break Time' : 'Lunch Break'}
                              </div>
                            ) : (
                              <div>
                                <h4 className={`font-bold ${isCurrent ? 'text-blue-800' : 'text-gray-800'}`}>{p.subject || '-'}</h4>
                                <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                                  <span>{p.classInfo ? p.classInfo.className : '-'}</span>
                                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                  <span>Room {p.classInfo ? p.classInfo.className : '-'}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {isCurrent && <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">Now</div>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    No periods assigned for today.
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-soft p-6 overflow-x-auto">
            {/* Desktop Weekly Grid View */}
            <div className="hidden md:block">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr>
                    <th className="p-4 bg-gray-50 border border-gray-200 text-center font-bold text-gray-700 w-28">
                      Time
                    </th>
                    {workingDays.map(day => (
                      <th key={day} className={`p-4 bg-gray-50 border border-gray-200 text-center font-bold ${day === today ? 'text-blue-600 border-b-2 border-b-blue-600' : 'text-gray-700'}`}>
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gridRows.map((row) => (
                    <tr key={row.periodNumber}>
                      <td className="p-3 border border-gray-200 text-center bg-gray-50 font-medium text-gray-600 text-xs align-middle">
                        <div className="flex flex-col">
                          <span>{formatTime(row.startTime)}</span>
                          <span className="text-gray-400">to</span>
                          <span>{formatTime(row.endTime)}</span>
                        </div>
                      </td>
                      
                      {workingDays.map(day => {
                        const p = row.days[day];
                        
                        if (!p) {
                          return <td key={day} className={`border border-gray-200 p-2 text-center text-xs font-medium text-gray-300 bg-gray-50/30 ${day === today ? 'bg-blue-50/10' : ''}`}>Free Period</td>;
                        }
                        
                        if (p.type === 'break' || p.type === 'lunch') {
                          return (
                            <td key={day} className={`p-2 border border-gray-200 text-center align-middle bg-yellow-50/50`}>
                               <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider">{p.type}</span>
                            </td>
                          );
                        }
                        
                        return (
                          <td key={day} className={`p-2 border border-gray-200 align-top ${day === today ? 'bg-blue-50/20' : ''}`}>
                            <div className="flex flex-col h-full p-2 rounded-lg bg-blue-50/60 min-h-[70px] justify-center text-center">
                              <span className="font-bold text-blue-800 text-sm mb-1">{p.subject || '-'}</span>
                              <span className="text-xs font-semibold text-gray-700">
                                {p.classInfo ? p.classInfo.className : '-'}
                              </span>
                              <span className="text-[10px] text-gray-500 mt-1">
                                Room {p.classInfo ? p.classInfo.className : '-'}
                              </span>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  {gridRows.length === 0 && (
                     <tr>
                       <td colSpan={6} className="p-8 text-center text-gray-500">
                         No timetable data available.
                       </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Weekly View (Cards) */}
            <div className="md:hidden space-y-8">
              {workingDays.map(day => {
                const dayPeriods = gridRows.filter(row => row.days[day]);
                return (
                  <div key={day} className="space-y-3">
                    <h3 className={`text-lg font-bold border-b pb-2 ${day === today ? 'text-blue-600 border-blue-200' : 'text-gray-700 border-gray-200'}`}>
                      {day} {day === today && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2 align-middle">Today</span>}
                    </h3>
                    
                    {dayPeriods.length > 0 ? dayPeriods.map(row => {
                      const p = row.days[day];
                      if (!p) return null;
                      
                      const isBreak = p.type === 'break' || p.type === 'lunch';
                      return (
                        <div key={row.periodNumber} className={`flex items-center p-3 rounded-lg border ${isBreak ? 'bg-yellow-50/50 border-yellow-100' : 'bg-white border-gray-100 shadow-sm'}`}>
                           <div className="w-20 shrink-0 text-xs font-bold text-gray-600">
                             {formatTime(p.startTime)}
                           </div>
                           <div className="flex-1 ml-3 border-l pl-3 border-gray-200">
                             {isBreak ? (
                               <span className="text-sm font-bold text-yellow-600 uppercase">{p.type}</span>
                             ) : (
                               <div>
                                 <h4 className="text-sm font-bold text-gray-800">{p.subject}</h4>
                                 <p className="text-xs text-gray-500">{p.classInfo?.className || '-'}</p>
                               </div>
                             )}
                           </div>
                        </div>
                      )
                    }) : (
                      <div className="text-sm text-gray-400 italic py-2">No classes assigned</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherPersonalTimetable;
