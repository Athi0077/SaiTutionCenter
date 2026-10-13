import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Clock, MapPin, User as UserIcon, Calendar, Info, CheckCircle, Clock3 } from 'lucide-react';
import Layout from '../components/layout/Layout';

const StudentSpecialClasses = () => {
  const [availableClasses, setAvailableClasses] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');

  const fetchData = async () => {
    try {
      const [availableRes, myRes] = await Promise.all([
        api.get('/special-classes/available'),
        api.get('/special-classes/my')
      ]);
      setAvailableClasses(availableRes.data.data);
      setMyClasses(myRes.data.data);
    } catch (err) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInterest = async (id) => {
    try {
      const res = await api.post(`/special-classes/${id}/interested`);
      toast.success(res.data.message);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit interest');
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading...</div>;

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Special Classes</h1>
          <p className="text-gray-500 text-sm">Enrichment and extra-curricular programs</p>
        </div>
      </div>

      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        <button 
          onClick={() => setActiveTab('available')}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'available' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Explore Classes
        </button>
        <button 
          onClick={() => setActiveTab('my')}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'my' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          My Special Classes
        </button>
      </div>

      {activeTab === 'available' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableClasses.map(cls => (
            <div key={cls._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded-full">{cls.category}</span>
                  {cls.myStatus && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${cls.myStatus === 'Enrolled' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {cls.myStatus === 'Pending' ? 'Pending Approval' : cls.myStatus}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{cls.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">{cls.description}</p>
                
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2"><UserIcon size={16} className="text-gray-400"/> {cls.instructorId?.name}</div>
                  <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400"/> {cls.daysOfWeek?.join(', ')}</div>
                  <div className="flex items-center gap-2"><Clock size={16} className="text-gray-400"/> {cls.startTime} - {cls.endTime}</div>
                  <div className="flex items-center gap-2"><MapPin size={16} className="text-gray-400"/> {cls.venue}</div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500">
                  <span>
                    {cls.maxStudents ? `${cls.enrolledCount} / ${cls.maxStudents} Students` : `${cls.enrolledCount} Enrolled`}
                  </span>
                </div>
              </div>
              <div className="p-5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                {!cls.myStatus ? (
                  cls.status === 'Registration Open' ? (
                    <button 
                      onClick={() => handleInterest(cls._id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition shadow-sm flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} /> I'm Interested
                    </button>
                  ) : (
                    <div className="w-full text-center py-2 text-gray-500 font-medium bg-gray-200 rounded-xl dark:bg-gray-700">Registration Closed</div>
                  )
                ) : (
                  <div className={`w-full text-center py-2 font-medium rounded-xl border ${cls.myStatus === 'Enrolled' ? 'border-green-200 bg-green-50 text-green-700' : 'border-orange-200 bg-orange-50 text-orange-700'}`}>
                    {cls.myStatus === 'Pending' ? (
                      <span className="flex items-center justify-center gap-2"><Clock3 size={18} /> Pending Approval</span>
                    ) : (
                      <span className="flex items-center justify-center gap-2"><CheckCircle size={18} /> {cls.myStatus}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {availableClasses.length === 0 && (
            <div className="col-span-full p-10 text-center bg-gray-50 rounded-2xl border border-gray-200 text-gray-500">
              No special classes available at the moment.
            </div>
          )}
        </div>
      )}

      {activeTab === 'my' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myClasses.map(enr => {
            const cls = enr.specialClass;
            return (
              <div key={enr._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-5">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full">{enr.status}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{cls.title}</h3>
                  {enr.studentName && (
                    <div className="mb-4">
                      <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                        Student: {enr.studentName}
                      </span>
                    </div>
                  )}
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p><UserIcon size={14} className="inline mr-2"/>Instructor: {cls.instructorId?.name}</p>
                    <p><Calendar size={14} className="inline mr-2"/>{cls.daysOfWeek?.join(', ')} at {cls.startTime}</p>
                    <p><MapPin size={14} className="inline mr-2"/>Venue: {cls.venue}</p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">Attendance</span>
                      <span className="text-gray-500">{enr.attendance.present} / {enr.attendance.total} ({enr.attendance.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${enr.attendance.percentage}%` }}></div>
                    </div>
                  </div>

                  {enr.progress && enr.progress.skillsProgress && enr.progress.skillsProgress.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="text-sm font-semibold mb-3">Skills Progress</h4>
                      <div className="space-y-3">
                        {enr.progress.skillsProgress.map((skill, idx) => {
                          const levelColors = {
                            'Not Started': 'bg-gray-200 text-gray-600',
                            'Beginner': 'bg-blue-100 text-blue-700',
                            'Developing': 'bg-indigo-100 text-indigo-700',
                            'Good': 'bg-purple-100 text-purple-700',
                            'Excellent': 'bg-green-100 text-green-700'
                          };
                          return (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">{skill.skillName}</span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${levelColors[skill.level] || 'bg-gray-100'}`}>
                                {skill.level}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {enr.progress.feedback && (
                        <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-sm rounded-lg italic">
                          "{enr.progress.feedback}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {myClasses.length === 0 && (
            <div className="col-span-full p-10 text-center bg-gray-50 rounded-2xl border border-gray-200 text-gray-500">
              You are not enrolled in any special classes yet.
            </div>
          )}
        </div>
      )}
    </div>
    </Layout>
  );
};

export default StudentSpecialClasses;
