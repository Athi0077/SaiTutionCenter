import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { getSocket } from '../services/socket';
import { Link } from 'react-router-dom';

const ParentDashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [childrenData, setChildrenData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [childFeeStatuses, setChildFeeStatuses] = useState({});
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard/parent');
        const children = res.data.data.children || [];
        
        const childrenWithData = await Promise.all(children.map(async (child) => {
          try {
            const syllabusRes = await api.get(`/syllabus/parent/children/${child._id}/progress`);
            const examRes = await api.get(`/exams/parent/children/${child._id}/report-card`);
            return { 
              ...child, 
              syllabusProgress: syllabusRes.data.data,
              reportCard: examRes.data.data
            };
          } catch (e) {
            return child;
          }
        }));

        setChildrenData(childrenWithData);

        // Fetch fee statuses for all children
        try {
          const feeRes = await api.get('/fee-status/my-children');
          if (feeRes.data.success && feeRes.data.data) {
            const statusMap = {};
            feeRes.data.data.forEach((item) => {
              statusMap[item.childId] = item.feeStatus;
            });
            setChildFeeStatuses(statusMap);
          }
        } catch (feeErr) {
          console.error('Failed to fetch fee statuses:', feeErr);
        }

        try {
          const galleryRes = await api.get('/events/gallery');
          if (galleryRes.data?.data) {
            setGalleryPhotos(galleryRes.data.data);
          }
        } catch (err) {
          console.error('Failed to fetch gallery:', err);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();

    const socket = getSocket();
    if (socket) {
      const handleSyllabusUpdate = () => {
        fetchDashboard();
      };
      socket.on('syllabus_updated', handleSyllabusUpdate);
      return () => {
        socket.off('syllabus_updated', handleSyllabusUpdate);
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
      <div className="space-y-6">
        <div className="bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/40 rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-orange-100 mb-2">Welcome, {currentUser?.name}! 👋</h1>
            <p className="text-gray-600 dark:text-orange-200/80">Here is a quick overview of your children's progress.</p>
          </div>
        </div>

        {/* Event Photos Carousel */}
        {galleryPhotos && galleryPhotos.length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-soft mb-6">
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

        {loading ? (
          <p className="text-gray-500">Loading children data...</p>
        ) : childrenData.length > 0 ? (
          <div className="space-y-6">
            {/* Tabs for Multiple Children */}
            {childrenData.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {childrenData.map((child, index) => (
                  <button
                    key={child._id}
                    onClick={() => setActiveTab(index)}
                    className={`px-5 py-2.5 rounded-full font-bold text-sm transition whitespace-nowrap flex items-center gap-2 border ${
                      activeTab === index 
                        ? 'bg-primary text-white border-primary shadow-md' 
                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${activeTab === index ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'}`}>
                      {child.name.charAt(0)}
                    </div>
                    {child.name}
                  </button>
                ))}
              </div>
            )}

            {(() => {
              const child = childrenData[activeTab] || childrenData[0];
              const activities = [];
              if (child.homework) {
                child.homework.forEach(hw => activities.push({ id: hw._id, type: 'Homework', title: hw.title, subject: hw.subjectId?.name, date: hw.dueDate ? new Date(hw.dueDate) : null, icon: '📚', bg: 'bg-blue-100 text-blue-600', status: hw.studentStatus }));
              }
              if (child.tests) {
                child.tests.forEach(test => activities.push({ id: test._id, type: 'Test', title: test.title, subject: test.subjectId?.name, date: test.testDate ? new Date(test.testDate) : null, icon: '📝', bg: 'bg-red-100 text-red-600', status: test.studentStatus }));
              }
              if (child.projects) {
                child.projects.forEach(proj => activities.push({ id: proj._id, type: 'Project', title: proj.title, subject: proj.subjectId?.name, date: proj.dueDate ? new Date(proj.dueDate) : null, icon: '🎨', bg: 'bg-purple-100 text-purple-600', status: proj.studentStatus }));
              }
              if (child.todos) {
                child.todos.forEach(todo => activities.push({ id: todo._id, type: 'Task', title: todo.title, date: todo.dueDate ? new Date(todo.dueDate) : null, icon: '✅', bg: 'bg-green-100 text-green-600', status: todo.studentStatus }));
              }
              activities.sort((a, b) => {
                if (!a.date) return 1;
                if (!b.date) return -1;
                return a.date - b.date;
              });

              return (
              <div key={child._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft p-6">
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-slate-700">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-xl">
                    {child.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{child.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Class: {child.className}</p>
                  </div>
                  {/* Fee Status Badge */}
                  <div id={`fee-status-badge-${child._id}`} className="flex-shrink-0">
                    {(childFeeStatuses[child._id] || 'pending') === 'completed' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Term Fees Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        Term Fees Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Fee Status Detail Card */}
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${
                  (childFeeStatuses[child._id] || 'pending') === 'completed'
                    ? 'bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-800/30'
                    : 'bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/30'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                    (childFeeStatuses[child._id] || 'pending') === 'completed'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}>
                    {(childFeeStatuses[child._id] || 'pending') === 'completed' ? '✅' : '💰'}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${
                      (childFeeStatuses[child._id] || 'pending') === 'completed'
                        ? 'text-green-800 dark:text-green-300'
                        : 'text-amber-800 dark:text-amber-300'
                    }`}>
                      {(childFeeStatuses[child._id] || 'pending') === 'completed'
                        ? 'Term Fees Completed'
                        : 'Term Fees Pending'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {(childFeeStatuses[child._id] || 'pending') === 'completed'
                        ? 'Fee payment has been confirmed by the class teacher.'
                        : 'Please contact the school administration regarding fee payment.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Upcoming Activities Section */}
                  <div className="md:row-span-2">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2">
                      <span>⭐</span> Upcoming Activities
                    </h3>
                    <div className="flex flex-col h-full">
                      {activities.length > 0 ? (
                        <>
                          <div className="space-y-3">
                            {activities.slice(0, 4).map((act, index) => (
                              <div key={`${act.type}-${act.id}-${index}`} className="p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl flex items-center justify-between border border-gray-100 hover:border-primary/30 hover:bg-white dark:hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-md transition cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${act.bg}`}>
                              {act.icon}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{act.title}</p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{act.type}</span>
                                {act.subject && (
                                  <>
                                    <span className="text-gray-300 dark:text-gray-600">•</span>
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{act.subject}</span>
                                  </>
                                )}
                                {act.date && (
                                  <>
                                    <span className="text-gray-300 dark:text-gray-600">•</span>
                                    <span className="text-[11px] font-medium text-gray-400">Due: {act.date.toLocaleDateString()}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {act.status && (
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${act.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                              {act.status}
                            </span>
                          )}
                        </div>
                            ))}
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 text-center">
                            <Link to="/parent/activities" className="text-sm font-semibold text-primary hover:text-primary-dark transition hover:underline">
                              View All Activities →
                            </Link>
                          </div>
                        </>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center mt-2">
                          <p className="text-sm text-gray-500">No upcoming activities.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attendance Section */}
                  <div>
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <span>📅</span> Attendance ({new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})
                      </h3>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                      <div className="grid grid-cols-7 gap-1 text-center mb-3">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                          <div key={d} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1.5 text-center">
                        {(() => {
                          const now = new Date();
                          const year = now.getFullYear();
                          const month = now.getMonth();
                          const firstDay = new Date(year, month, 1).getDay();
                          const daysInMonth = new Date(year, month + 1, 0).getDate();
                          
                          const cells = [];
                          for (let i = 0; i < firstDay; i++) {
                            cells.push(<div key={`empty-${i}`} className="p-2"></div>);
                          }
                          
                          for (let d = 1; d <= daysInMonth; d++) {
                            const currentDateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                            const attRecord = child.attendance?.find(att => {
                              const ad = new Date(att.date);
                              return `${ad.getFullYear()}-${String(ad.getMonth()+1).padStart(2, '0')}-${String(ad.getDate()).padStart(2, '0')}` === currentDateStr;
                            });
                            
                            let bgClass = "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 shadow-sm";
                            if (attRecord) {
                              if (attRecord.status === 'present') bgClass = "bg-green-100 text-green-800 font-bold border-green-200 shadow-sm";
                              else if (attRecord.status === 'absent') bgClass = "bg-red-100 text-red-800 font-bold border-red-200 shadow-sm";
                              else bgClass = "bg-amber-100 text-amber-800 font-bold border-amber-200 shadow-sm";
                            }
                            
                            const isToday = new Date().getDate() === d;
                            if (isToday && !attRecord) bgClass = "bg-primary/10 text-primary font-bold border-primary/30 shadow-sm ring-1 ring-primary/50";
                            
                            cells.push(
                              <div key={d} className={`flex items-center justify-center h-8 text-xs rounded-lg cursor-default transition-colors ${bgClass}`} title={attRecord ? attRecord.status : 'No record'}>
                                {d}
                              </div>
                            );
                          }
                          return cells;
                        })()}
                      </div>
                      <div className="flex items-center justify-center gap-5 mt-5 pt-4 border-t border-gray-200/60 dark:border-slate-700/60 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                         <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-sm"></span> Present</div>
                         <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-sm"></span> Absent</div>
                      </div>
                    </div>
                  </div>



                  {/* Syllabus Section */}
                  <div className="md:col-span-2 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <span>📖</span> Syllabus Progress
                    </h3>
                    {child.syllabusProgress?.overall ? (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Overall Progress</p>
                          <span className="font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md text-xs">{child.syllabusProgress.overall.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${child.syllabusProgress.overall.percentage}%` }}></div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {child.syllabusProgress.subjects.map((sub, i) => (
                            <div key={i} className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-purple-200 transition">
                              <p className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate">{sub.subject}</p>
                              <div className="flex justify-between text-[10px] text-gray-500 mt-1 mb-2">
                                <span>{sub.completed}/{sub.total} done</span>
                                <span className="font-bold text-gray-700">{sub.percentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1">
                                <div className="bg-purple-400 h-1 rounded-full" style={{ width: `${sub.percentage}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                        <p className="text-sm text-gray-500">No syllabus data available for the current term.</p>
                      </div>
                    )}
                  </div>

                  {/* Report Card Section */}
                  <div className="md:col-span-2 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <span>📝</span> Exam Report Cards
                    </h3>
                    {child.reportCard && child.reportCard.length > 0 ? (
                      <div className="grid grid-cols-1 gap-6">
                        {child.reportCard.map(exam => {
                          let obtained = 0, max = 0;
                          exam.subjects.forEach(s => {
                            if (s.marksObtained !== null) {
                              obtained += Number(s.marksObtained);
                              max += Number(s.maxMarks);
                            }
                          });
                          const percentage = max > 0 ? ((obtained / max) * 100).toFixed(1) : 0;
                          
                          return (
                            <div key={exam._id} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                              <div className="bg-purple-50 p-3 border-b flex justify-between items-center">
                                <div>
                                  <h4 className="font-bold text-purple-900">{exam.examName}</h4>
                                  <p className="text-xs text-purple-700">{exam.examType}</p>
                                </div>
                                {max > 0 && (
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-purple-700">{percentage}%</p>
                                    <p className="text-xs text-purple-600">{obtained} / {max}</p>
                                  </div>
                                )}
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="bg-gray-50 border-b">
                                      <th className="p-2 font-semibold">Subject</th>
                                      <th className="p-2 font-semibold text-center">Max / Pass</th>
                                      <th className="p-2 font-semibold text-center">Marks</th>
                                      <th className="p-2 font-semibold">Status</th>
                                      <th className="p-2 font-semibold">Remarks</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {exam.subjects.map((s, idx) => {
                                      let status = '-';
                                      let color = 'text-gray-500';
                                      if (s.isAbsent) {
                                        status = 'ABSENT'; color = 'text-red-500 font-bold';
                                      } else if (s.marksObtained !== null) {
                                        if (Number(s.marksObtained) >= Number(s.passingMarks)) {
                                          status = 'PASS'; color = 'text-green-600 font-bold';
                                        } else {
                                          status = 'FAIL'; color = 'text-red-600 font-bold';
                                        }
                                      } else {
                                        status = 'Pending...';
                                      }
                                      return (
                                        <tr key={idx} className="hover:bg-gray-50">
                                          <td className="p-2 font-medium">{s.subject}</td>
                                          <td className="p-2 text-center text-gray-500">{s.maxMarks} / {s.passingMarks}</td>
                                          <td className="p-2 text-center font-bold">{s.isAbsent ? '0' : (s.marksObtained ?? '-')}</td>
                                          <td className={`p-2 ${color}`}>{status}</td>
                                          <td className="p-2 text-xs text-gray-600 italic">{s.remarks || '-'}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                        <p className="text-sm text-gray-500">No report cards available yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
            })()}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft p-12 text-center">
            <span className="text-4xl block mb-4">👨‍👩‍👧‍👦</span>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">No Children Linked</h2>
            <p className="text-gray-500 mt-2">Please contact the school administration to link your children's profiles to this account.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ParentDashboard;
