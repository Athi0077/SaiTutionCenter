import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import { getSocket } from '../services/socket';
import AnnouncementPopup from '../components/common/AnnouncementPopup';
import { Sparkles } from 'lucide-react';
import { initSocket } from '../services/socket';
import DashboardCalendarPreview from '../components/common/DashboardCalendarPreview';

const StudentDashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [quote, setQuote] = useState(null);
  const [feeStatus, setFeeStatus] = useState(null);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, syllabusRes, quoteRes, feeRes, hrRes, galleryRes] = await Promise.all([
          api.get('/dashboard/student'),
          api.get('/syllabus/student/progress').catch(() => ({ data: { data: null } })),
          api.get('/quotes/current').catch(() => ({ data: { data: null } })),
          api.get('/fee-status/my-status').catch(() => ({ data: { data: null } })),
          api.get('/hand-raises/stats').catch(() => ({ data: { data: null } })),
          api.get('/events/gallery').catch(() => ({ data: { data: [] } }))
        ]);
        
        const dashboard = dashRes.data.data;
        if (syllabusRes.data.data) {
          dashboard.syllabusProgress = syllabusRes.data.data;
        }
        if (hrRes.data?.data) {
          dashboard.handRaises = hrRes.data.data;
        }
        
        setDashboardData(dashboard);
        setQuote(quoteRes.data.data);
        if (feeRes.data.data) {
          setFeeStatus(feeRes.data.data.feeStatus);
        }
        if (galleryRes.data?.data) {
          setGalleryPhotos(galleryRes.data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDashboard();

    const token = localStorage.getItem('token');
    if (token) {
      const socket = initSocket(token);
      
      const handleSyllabusUpdate = () => {
        fetchDashboard();
      };
      const handleQuoteUpdate = (newQuote) => {
        setQuote(newQuote);
      };
      
      socket.on('syllabus_updated', handleSyllabusUpdate);
      socket.on('quote:published', handleQuoteUpdate);
      
      return () => {
        socket.off('syllabus_updated', handleSyllabusUpdate);
        socket.off('quote:published', handleQuoteUpdate);
      };
    }
  }, []);

  // Auto-scrolling logic for gallery
  useEffect(() => {
    if (galleryPhotos.length > 1) {
      const interval = setInterval(() => {
        setCurrentPhotoIndex((prev) => (prev + 1) % galleryPhotos.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [galleryPhotos]);

  return (
    <Layout>
      <AnnouncementPopup />
      <div className="space-y-6">
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-950/40 dark:to-indigo-950/30 rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-sm border border-blue-100/50 dark:border-blue-900/40">
          <div className="z-10 w-full md:w-1/2 relative">
            <div className="flex items-center gap-6 mb-4">
              {currentUser?.profilePic ? (
                <img src={currentUser.profilePic} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-md" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-3xl font-bold text-blue-600 dark:text-blue-400 shadow-md border-4 border-blue-50 dark:border-blue-900/50">
                  {currentUser?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-3xl text-gray-700 dark:text-blue-200 font-medium mb-1">Good Morning,</h1>
                <h2 className="text-4xl lg:text-5xl font-bold text-blue-900 dark:text-blue-100">{currentUser?.name}! 👋</h2>
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              {dashboardData?.className && (
                <span className="inline-block bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-4 py-1.5 rounded-lg font-bold shadow-sm border border-blue-200 dark:border-blue-700">
                  {dashboardData.className}
                </span>
              )}
              {dashboardData?.isClassLeader && (
                <span className="inline-flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-4 py-1.5 rounded-lg font-bold shadow-sm border border-yellow-300 dark:border-yellow-700">
                  <span className="text-yellow-600 dark:text-yellow-400">👑</span> Class Leader
                </span>
              )}
            </div>
            <div className="flex gap-3 mb-6">
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm border border-white/50 dark:border-slate-700/50">
                <span className="text-xl">🔥</span>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Current Streak</p>
                  <p className="font-black text-orange-600 dark:text-orange-400 leading-tight">{dashboardData?.streak || 0} Days</p>
                </div>
              </div>
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm border border-white/50 dark:border-slate-700/50">
                <span className="text-xl">🏆</span>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Rank</p>
                  <p className="font-black text-yellow-600 dark:text-yellow-400 leading-tight">{dashboardData?.rank || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Link to="/student/homework" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center gap-2">
                View Today's Homework <span className="text-xl">→</span>
              </Link>
              <Link to="/student/class" className="bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                Explore Subjects
              </Link>
            </div>
          </div>
          <div className={`w-full md:w-1/2 md:relative md:h-64 ${quote ? 'mt-6 md:mt-0 flex justify-end' : 'hidden md:block'}`}>
            {quote ? (
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl p-4 shadow-lg max-w-[500px] z-20 w-full md:absolute md:right-10 md:top-10">
                <p className="font-bold text-blue-900 dark:text-blue-200 text-sm italic leading-tight">"{quote.quote}"</p>
                {quote.author && (
                  <p className="text-indigo-600 dark:text-indigo-400 text-[10px] font-bold mt-2 text-right">— {quote.author}</p>
                )}
              </div>
            ) : (
              <div className="absolute right-10 top-10 bg-white/70 dark:bg-slate-800/70 backdrop-blur rounded-2xl p-4 shadow-lg transform rotate-3 z-20 hidden md:block">
                <p className="font-bold text-blue-900 dark:text-blue-200 leading-tight">Better<br/><span className="text-indigo-600 dark:text-indigo-400">Students</span><br/>Brighter<br/>Tomorrows<br/>!! ✨</p>
              </div>
            )}
          </div>
        </div>

        {/* Fee Pending Notification */}
        {feeStatus === 'pending' && (
          <div id="fee-pending-notification" className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 md:p-5 shadow-sm flex items-center gap-4 animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
              💰
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-amber-800 text-sm md:text-base">Term Fees Pending</h4>
              <p className="text-xs text-amber-600 mt-0.5">Your term fees have not been marked as completed yet. Please contact the school administration for details.</p>
            </div>
            <div className="flex-shrink-0">
              <span className="inline-block bg-amber-100 text-amber-700 text-[10px] font-bold px-3 py-1.5 rounded-full border border-amber-200 whitespace-nowrap">
                ⏳ Pending
              </span>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">📚</div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{dashboardData?.hwStats?.total || 0}</p>
                <p className="text-xs font-semibold text-gray-500">Total Homework</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center text-2xl">📋</div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{dashboardData?.hwStats?.pending || 0}</p>
                <p className="text-xs font-semibold text-gray-500">Pending / Incomplete</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-2xl">⌛</div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{dashboardData?.hwStats?.approvalPending || 0}</p>
                <p className="text-xs font-semibold text-gray-500">Approval Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-500 flex items-center justify-center text-2xl">✅</div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{dashboardData?.hwStats?.completed || 0}</p>
                <p className="text-xs font-semibold text-gray-500">Completed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center text-2xl">🔄</div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{dashboardData?.hwStats?.revisionRequired || 0}</p>
                <p className="text-xs font-semibold text-gray-500">Revision Required</p>
              </div>
            </div>
          </div>
        </div>

        {/* Event Photos Carousel */}
        {galleryPhotos && galleryPhotos.length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-soft">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-primary">📸</span> School Events Gallery
              </h3>
            </div>
            <div className="relative w-full h-[250px] md:h-[350px] rounded-2xl overflow-hidden group bg-gray-100">
              {galleryPhotos.map((photo, index) => (
                <div 
                  key={photo._id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${index === currentPhotoIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                  <img 
                    src={photo.imageUrl} 
                    alt={`Event Photo ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                  {photo.description && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                      <p className="text-white font-medium">{photo.description}</p>
                    </div>
                  )}
                </div>
              ))}
              
              {galleryPhotos.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
                  {galleryPhotos.map((_, index) => (
                    <button 
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentPhotoIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1 */}
          <div className="space-y-6">
            
            {/* Today's Homework */}
            <div className="bg-white p-6 rounded-3xl shadow-soft">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Today's Homework</h3>
                <Link to="/student/homework" className="text-sm font-semibold text-blue-600 hover:underline">See All →</Link>
              </div>
              <div className="space-y-4">
                {(dashboardData?.todaysHomework || []).map((hw, i) => {
                  // Fallback icons/colors if not defined in data
                  const icon = hw.icon || '📚';
                  const bg = hw.bg || 'bg-blue-100';
                  const color = hw.color || 'text-blue-600';
                  return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl border border-gray-50 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${hw.bg} ${hw.color}`}>{hw.icon}</div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">{hw.title}</h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{hw.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-red-50 text-red-500 text-xs font-bold rounded-lg whitespace-nowrap">{hw.due}</span>
                      <span className="text-gray-400 font-bold">›</span>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Smart Study Planner */}
            <div className="bg-white p-6 rounded-3xl shadow-soft">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>📅</span> Smart Study Planner
                </h3>
                <Link to="/student/homework" className="text-sm font-semibold text-blue-600 hover:underline">View All →</Link>
              </div>
              <div className="relative border-l-2 border-gray-100 ml-4 space-y-6">
                {dashboardData?.upcomingDeadlines && dashboardData.upcomingDeadlines.length > 0 ? (
                  dashboardData.upcomingDeadlines.map((hw, i) => {
                    const dDate = new Date(hw.dueDate);
                    const diffDays = Math.ceil((dDate - new Date()) / (1000 * 60 * 60 * 24));
                    let dotColor = 'bg-gray-300';
                    let tagColor = 'bg-gray-100 text-gray-600';
                    let tagText = 'Upcoming';

                    if (diffDays <= 1) {
                      dotColor = 'bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.2)]';
                      tagColor = 'bg-red-100 text-red-600';
                      tagText = 'Due Soon';
                    } else if (diffDays <= 3) {
                      dotColor = 'bg-orange-500 shadow-[0_0_0_4px_rgba(249,115,22,0.2)]';
                      tagColor = 'bg-orange-100 text-orange-600';
                      tagText = 'This Week';
                    } else {
                      dotColor = 'bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.2)]';
                      tagColor = 'bg-blue-100 text-blue-600';
                      tagText = 'Next Week';
                    }

                    return (
                      <div key={i} className="relative pl-6">
                        <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ${dotColor}`}></div>
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:shadow-sm transition">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-800 text-sm">{hw.title}</h4>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md whitespace-nowrap ${tagColor}`}>{tagText}</span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1 mb-3">{hw.desc}</p>
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400">
                            <span className="bg-white px-2 py-1 rounded-md border border-gray-200">
                              🗓️ {dDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6">
                    <span className="text-4xl">🎉</span>
                    <p className="text-gray-500 text-sm mt-2 font-semibold">No upcoming deadlines! Take a break.</p>
                  </div>
                )}
              </div>
            </div>



            {/* Hand Raises Widget */}
            <div className="bg-white p-6 rounded-3xl shadow-soft border-t-4 border-t-purple-500">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-xl text-purple-600">🙋</span> My Hand Raises
                </h3>
                <Link to="/student/hand-raises" className="text-sm font-semibold text-purple-600 hover:underline">View All →</Link>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-purple-50 p-4 rounded-2xl flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-purple-600 uppercase mb-1">Scheduled</span>
                  <span className="text-2xl font-black text-purple-700">{dashboardData?.handRaises?.SCHEDULED || 0}</span>
                </div>
                <div className="bg-yellow-50 p-4 rounded-2xl flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-yellow-600 uppercase mb-1">Pending</span>
                  <span className="text-2xl font-black text-yellow-700">{dashboardData?.handRaises?.PENDING || 0}</span>
                </div>
              </div>
              
              <Link to="/student/hand-raises" className="w-full block text-center py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition shadow-sm">
                Raise Hand to Teacher
              </Link>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-6">
            {/* Subjects Overview */}
            <div className="bg-white p-6 rounded-3xl shadow-soft">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Syllabus Overview</h3>
                <Link to="/student/class" className="text-sm font-semibold text-blue-600 hover:underline">View All →</Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(dashboardData?.syllabusProgress?.subjects?.length > 0 ? dashboardData.syllabusProgress.subjects : dashboardData?.subjectsOverview || []).map((sub, i) => {
                  const icon = sub.icon || '📚';
                  const bg = sub.bg || 'bg-blue-100';
                  const text = sub.text || 'text-blue-600';
                  const fill = sub.fill || 'bg-blue-500';
                  const name = sub.subject || sub.name;
                  const total = sub.total || sub.topics || 0;
                  const completed = sub.completed || 0;
                  const pending = sub.pending || 0;
                  const progress = sub.percentage !== undefined ? sub.percentage : (sub.progress || 0);

                  return (
                  <Link to={`/student/syllabus/${encodeURIComponent(name)}`} key={i} className="bg-gray-50 rounded-2xl p-4 border border-gray-100/50 hover:border-blue-200 transition block">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${bg} ${text}`}>{icon}</div>
                    <h4 className="font-bold text-gray-800 text-sm mb-1">{name}</h4>
                    <div className="text-xs text-gray-500 mb-4 flex justify-between">
                      <span>{total} chapters</span>
                      <span className="text-green-600 font-semibold">{completed} done</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full ${fill} rounded-full`} style={{ width: `${progress}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-gray-700">{progress}%</span>
                    </div>
                  </Link>
                  );
                })}
              </div>
            </div>

            {/* Recent Submissions */}
            <div className="bg-white p-6 rounded-3xl shadow-soft">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Recent Submissions</h3>
                <Link to="/student/homework" className="text-sm font-semibold text-blue-600 hover:underline">View All →</Link>
              </div>
              <div className="space-y-4">
                {(dashboardData?.recentSubmissions || []).map((sub, i) => {
                  const bg = sub.status === 'Graded' ? 'bg-green-100' : (sub.status === 'Revision' ? 'bg-orange-100' : 'bg-blue-100');
                  const color = sub.status === 'Graded' ? 'text-green-600' : (sub.status === 'Revision' ? 'text-orange-600' : 'text-blue-600');
                  return (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${bg} ${color}`}>
                        {sub.status === 'Graded' ? '✓' : '◷'}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">{sub.title}</h4>
                        <p className="text-[10px] text-gray-500">Submitted on {new Date(sub.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-lg ${bg} ${color}`}>{sub.status}</span>
                      <span className="font-bold text-gray-800 text-sm w-8 text-right">{sub.score}</span>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 3 */}
          <div className="space-y-6">
            {/* Your Progress */}
            <div className="bg-white p-6 rounded-3xl shadow-soft">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Syllabus Progress</h3>
                <div className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 font-semibold text-gray-600">
                  {dashboardData?.className || 'Loading...'}
                </div>
              </div>
              
              {(() => {
                const totalCount = dashboardData?.syllabusProgress?.overall?.total || 0;
                const completedCount = dashboardData?.syllabusProgress?.overall?.completed || 0;
                const pendingCount = dashboardData?.syllabusProgress?.overall?.pending || 0;
                const completedPercent = dashboardData?.syllabusProgress?.overall?.percentage || 0;
                const pendingPercent = totalCount > 0 ? 100 - completedPercent : 0;

                return (
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative w-40 h-40">
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#F3F4F6" strokeWidth="4" />
                        {totalCount > 0 && (
                          <>
                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#F59E0B" strokeWidth="4" strokeDasharray={`${pendingPercent}, ${100 - pendingPercent}`} strokeDashoffset="0" />
                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray={`${completedPercent}, ${100 - completedPercent}`} strokeDashoffset={`-${pendingPercent}`} />
                          </>
                        )}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-gray-800">{completedPercent}%</span>
                        <span className="text-[10px] text-gray-500 font-semibold w-16 text-center leading-tight">Overall Completion</span>
                      </div>
                    </div>
                    
                    <div className="ml-6 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-xs font-semibold text-gray-600">Completed Chapters</span>
                        </div>
                        <span className="text-sm font-bold text-gray-800">{completedCount}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <span className="text-xs font-semibold text-gray-600">Pending Chapters</span>
                        </div>
                        <span className="text-sm font-bold text-gray-800">{pendingCount}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-t pt-2 mt-2">
                        <span className="text-xs font-semibold text-gray-600">Total Chapters</span>
                        <span className="text-sm font-bold text-gray-800">{totalCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
              <div className="bg-yellow-50/50 p-4 rounded-2xl flex gap-4 items-start">
                <div className="text-2xl">🏆</div>
                <div>
                  <p className="text-sm font-bold text-yellow-800">"Keep going! You're doing great!"</p>
                  <p className="text-xs text-yellow-700/80 mt-1">Consistency today, success tomorrow.</p>
                </div>
              </div>
            </div>

            {/* School Calendar */}
            <DashboardCalendarPreview role="student" />

            {/* Announcements */}
            <div className="bg-white p-6 rounded-3xl shadow-soft">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Announcements</h3>
                <Link to="/notifications" className="text-sm font-semibold text-blue-600 hover:underline">View All →</Link>
              </div>
              <div className="space-y-4">
                {(dashboardData?.announcements || []).length > 0 ? (
                  (dashboardData?.announcements || []).map((ann, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm">📢</div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-sm">{ann.title}</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">{ann.message}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 font-semibold whitespace-nowrap">{new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No recent announcements</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
