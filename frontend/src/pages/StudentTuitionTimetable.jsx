import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Clock, Calendar as CalendarIcon, MapPin, Users, User } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const StudentTuitionTimetable = () => {
  const { currentUser } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        // Fetch all sessions and batches to filter on client side for now.
        // In a real production app, the backend should do this join.
        const [sessionsRes, classesRes, stdsRes] = await Promise.all([
          api.get('/tuition-sessions'),
          api.get('/classes'),
          api.get('/standards')
        ]);
        
        // Find classes where student belongs
        const myClasses = classesRes.data.data.filter(c => 
          c.students?.some(s => (s._id || s) === currentUser._id)
        );
        
        // Map classes to section IDs (which act as batchIds)
        const myBatchIds = [];
        myClasses.forEach(cls => {
          const std = stdsRes.data.data?.find(s => s.name === cls.standard);
          if (std && std.sections) {
            const sec = std.sections.find(s => s.name === cls.section);
            if (sec) myBatchIds.push(sec._id);
          }
        });
        
        // Filter sessions by my batches
        const mySessions = sessionsRes.data.filter(s => 
          myBatchIds.includes(s.batchId?._id || s.batchId)
        );

        setSessions(mySessions);
      } catch (err) {
        toast.error('Failed to load timetable');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser?._id) {
      fetchTimetable();
    }
  }, [currentUser]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const recurringSessions = sessions.filter(s => s.sessionType === 'recurring');
  const oneTimeSessions = sessions.filter(s => s.sessionType === 'one-time');

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
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">View your classes for your enrolled batches.</p>
        </div>

        {/* Today's Schedule */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <CalendarIcon size={20} /> Today's Classes ({today})
          </h3>
          
          {loading ? (
            <div className="animate-pulse text-white/70">Loading your schedule...</div>
          ) : todaysSessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todaysSessions.map(session => (
                <div key={session._id} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition cursor-default">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-lg">{session.startTime}</span>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded text-white/90">
                      {session.endTime}
                    </span>
                  </div>
                  <div className="font-medium mb-1 truncate text-lg">{session.subjectId?.name || 'Unknown Subject'}</div>
                  <div className="flex items-center gap-2 text-sm text-white/80 mt-3">
                    <User size={14} /> Teacher: {session.teacherId?.name || 'Unknown'}
                  </div>
                  {session.room && (
                    <div className="flex items-center gap-2 text-sm text-white/80 mt-1">
                      <MapPin size={14} /> Room: {session.room}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
              <p className="text-white/90 font-medium">You have no tuition classes scheduled for today.</p>
              <p className="text-white/70 text-sm mt-1">Enjoy your free time!</p>
            </div>
          )}
        </div>

        {/* Weekly Recurring Schedule */}
        <div className="bg-white dark:bg-[#0B1120] rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-[#1E293B]">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Weekly Overview</h3>
          
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
                      <div key={session._id} className="bg-white dark:bg-[#0B1120] rounded-lg p-3 shadow-sm border border-gray-100 dark:border-[#1E293B] hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-sm">
                            <Clock size={14} /> {session.startTime} - {session.endTime}
                          </div>
                        </div>
                        <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1">
                          {session.subjectId?.name || 'Unknown Subject'}
                        </div>
                        <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1"><User size={12}/> {session.teacherId?.name || 'N/A'}</span>
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
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">You are not enrolled in any weekly sessions yet.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentTuitionTimetable;
