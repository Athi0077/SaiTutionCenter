import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Clock, Calendar as CalendarIcon, MapPin, BookOpen, Users } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TeacherTuitionTimetable = () => {
  const { currentUser } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        // Assuming currentUser._id is the teacher's ID
        const res = await api.get(`/tuition-sessions?teacherId=${currentUser._id}`);
        setSessions(res.data);
      } catch (err) {
        toast.error('Failed to load timetable');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser?._id) {
      fetchSessions();
    }
  }, [currentUser]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Get today's day name
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  // Separate recurring vs one-time for display
  const recurringSessions = sessions.filter(s => s.sessionType === 'recurring');
  const oneTimeSessions = sessions.filter(s => s.sessionType === 'one-time');

  // Today's sessions
  const todaysSessions = [
    ...recurringSessions.filter(s => s.dayOfWeek === today),
    ...oneTimeSessions.filter(s => {
      if (!s.sessionDate) return false;
      return new Date(s.sessionDate).toDateString() === new Date().toDateString();
    })
  ].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">My Tuition Timetable</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage and view your assigned tuition sessions.</p>
        </div>

        {/* Today's Schedule */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <CalendarIcon size={20} /> Today's Sessions ({today})
          </h3>
          
          {loading ? (
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-white/20 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-white/20 rounded"></div>
                  <div className="h-4 bg-white/20 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ) : todaysSessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todaysSessions.map(session => (
                <div key={session._id} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-lg">{session.startTime}</span>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded text-white/90">
                      {session.endTime}
                    </span>
                  </div>
                  <div className="font-medium mb-1 truncate">{session.subjectId?.name || 'Unknown Subject'}</div>
                  <div className="flex items-center gap-2 text-sm text-white/80 mt-2">
                    <Users size={14} /> {session.batchId?.batchName || 'Unknown Batch'}
                  </div>
                  {session.room && (
                    <div className="flex items-center gap-2 text-sm text-white/80 mt-1 mb-3">
                      <MapPin size={14} /> Room: {session.room}
                    </div>
                  )}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-white/20">
                    <button 
                      onClick={() => window.location.href = `/teacher/tuition-attendance?sessionId=${session._id}&batchId=${session.batchId?._id}`}
                      className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold py-1.5 rounded transition text-center"
                    >
                      Attendance
                    </button>
                    <button 
                      onClick={() => window.location.href = `/teacher/tuition-homework?batchId=${session.batchId?._id}&subjectId=${session.subjectId?._id}`}
                      className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold py-1.5 rounded transition text-center"
                    >
                      Homework
                    </button>
                    <button 
                      onClick={() => window.location.href = `/teacher/tuition-tests?batchId=${session.batchId?._id}&subjectId=${session.subjectId?._id}`}
                      className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold py-1.5 rounded transition text-center"
                    >
                      Tests
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
              <p className="text-white/90">You have no tuition sessions scheduled for today.</p>
            </div>
          )}
        </div>

        {/* Weekly Recurring Schedule */}
        <div className="bg-white dark:bg-[#0B1120] rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-[#1E293B]">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Weekly Schedule</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {daysOfWeek.map(day => {
              const daySessions = recurringSessions
                .filter(s => s.dayOfWeek === day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
                
              if (daySessions.length === 0) return null;

              return (
                <div key={day} className="bg-gray-50 dark:bg-[#172235] rounded-xl p-4 border border-gray-100 dark:border-[#1E293B]">
                  <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-[#334155] pb-2">
                    {day}
                  </h4>
                  <div className="space-y-3">
                    {daySessions.map(session => (
                      <div key={session._id} className="bg-white dark:bg-[#0B1120] rounded-lg p-3 shadow-sm border border-gray-100 dark:border-[#1E293B]">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-1">
                          <Clock size={14} /> {session.startTime} - {session.endTime}
                        </div>
                        <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                          {session.subjectId?.name || 'Unknown Subject'}
                        </div>
                        <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1"><Users size={12}/> {session.batchId?.batchName || 'N/A'}</span>
                          {session.room && <span className="flex items-center gap-1"><MapPin size={12}/> {session.room}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          {recurringSessions.length === 0 && !loading && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recurring weekly sessions assigned.</p>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default TeacherTuitionTimetable;
