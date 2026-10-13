import React, { useState, useEffect, useContext } from 'react';
import Layout from '../components/layout/Layout';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Gift, Cake, Heart, Send, Trash2, Sparkles, Calendar, UserCheck } from 'lucide-react';

const BirthdayCelebration = () => {
  const { currentUser } = useContext(AuthContext);
  const [birthdays, setBirthdays] = useState([]);
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishInput, setWishInput] = useState({}); // { [targetUserId]: "message" }
  const [submitting, setSubmitting] = useState({});

  const isTeacherOrPrincipal = currentUser?.role === 'principal' || currentUser?.role === 'teacher';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cardsRes, wishesRes] = await Promise.all([
        api.get('/birthdays/today'),
        api.get('/birthdays/today/wishes')
      ]);

      if (cardsRes.data?.success) {
        setBirthdays(cardsRes.data.data || []);
      }
      if (wishesRes.data?.success) {
        setWishes(wishesRes.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load birthday data:", err);
      toast.error("Failed to load today's birthdays.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Refresh automatically at midnight or periodically (every 5 minutes)
    const interval = setInterval(() => {
      fetchData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleWishChange = (targetUserId, value) => {
    setWishInput(prev => ({ ...prev, [targetUserId]: value }));
  };

  const handleSendWish = async (targetUserId) => {
    const msg = (wishInput[targetUserId] || '').trim();
    if (!msg) {
      return toast.error("Please enter a wish message");
    }

    try {
      setSubmitting(prev => ({ ...prev, [targetUserId]: true }));
      const res = await api.post(`/birthdays/${targetUserId}/wishes`, { message: msg });
      
      if (res.data?.success) {
        toast.success("Birthday wish posted! 🎂");
        setWishInput(prev => ({ ...prev, [targetUserId]: '' }));
        // Add new wish to list
        setWishes(prev => [...prev, res.data.data]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post birthday wish");
    } finally {
      setSubmitting(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  const handleDeleteWish = async (wishId) => {
    try {
      await api.delete(`/birthdays/wishes/${wishId}`);
      toast.success("Wish removed.");
      setWishes(prev => prev.filter(w => w._id !== wishId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete wish");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(timeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Banner Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 p-8 text-white shadow-xl">
          <div className="absolute right-0 top-0 opacity-10 translate-x-1/4 -translate-y-1/4">
            <Cake size={320} />
          </div>
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-pink-100">
              <Sparkles size={14} /> Celebration Corner
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Today's Birthday Babies 🎂🎉
            </h1>
            <p className="text-pink-100 text-sm md:text-base max-w-xl">
              Celebrate special moments with our students, teachers, and principal today!
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-12 h-12 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Checking today's birthday list...</p>
          </div>
        ) : birthdays.length === 0 ? (
          /* Empty State */
          <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-3xl p-12 text-center shadow-soft max-w-md mx-auto space-y-4">
            <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto text-pink-500 shadow-inner">
              <Gift size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">No Birthdays Today!</h3>
            <p className="text-gray-500 text-sm">
              No birthdays today. Check back tomorrow to celebrate with your schoolmates! 🎈
            </p>
          </div>
        ) : (
          /* Birthday Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {birthdays.map((person) => {
              const personWishes = wishes.filter(w => w.targetUserId === person._id);

              return (
                <div 
                  key={person._id} 
                  className="bg-white rounded-3xl border border-pink-100 shadow-soft overflow-hidden flex flex-col hover:shadow-md transition duration-300"
                >
                  {/* Card Header Decoration */}
                  <div className="h-24 bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 p-4 relative">
                    <div className="absolute top-3 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1">
                      <Cake size={14} /> Turns {person.age} Today!
                    </div>
                  </div>

                  {/* Profile & Info Content */}
                  <div className="px-6 pb-6 pt-0 flex-1 flex flex-col space-y-4 -mt-12">
                    <div className="flex items-end justify-between">
                      <div className="relative">
                        {person.profilePic ? (
                          <img 
                            src={person.profilePic} 
                            alt={person.name} 
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-white" 
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 text-white flex items-center justify-center text-3xl font-bold border-4 border-white shadow-md">
                            {person.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 bg-yellow-400 text-white p-1 rounded-full text-xs shadow" title="Birthday Star">
                          ⭐
                        </span>
                      </div>

                      {/* Role Badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        person.role === 'principal' 
                          ? 'bg-amber-100 text-amber-700' 
                          : person.role === 'teacher' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {person.role === 'student' 
                          ? `Student (${person.classInfo?.name || 'Class N/A'})` 
                          : person.role === 'teacher' 
                          ? `Teacher (${person.designation || 'Faculty'})` 
                          : 'Principal'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{person.name}</h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Calendar size={13} /> Born: {formatDate(person.dateOfBirth)}
                      </p>
                    </div>

                    {/* Celebration Message */}
                    <div className="bg-pink-50/70 border border-pink-100 rounded-2xl p-4 text-center space-y-1">
                      <p className="text-pink-600 font-extrabold text-sm flex items-center justify-center gap-2">
                        <Sparkles size={16} /> Happy Birthday to You! <Sparkles size={16} />
                      </p>
                      <p className="text-xs text-pink-700/80">
                        Wishing you a fantastic year filled with learning, success, and happiness! 🎁
                      </p>
                    </div>

                    {/* Wishes Section */}
                    <div className="space-y-3 pt-2 flex-1">
                      <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center justify-between">
                        <span>Birthday Wishes ({personWishes.length})</span>
                        <Heart size={14} className="text-pink-500 fill-pink-500" />
                      </h4>

                      {personWishes.length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-2 text-center bg-gray-50 rounded-xl">
                          No wishes posted yet. Be the first to wish!
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {personWishes.map((w) => (
                            <div key={w._id} className="bg-gray-50 rounded-xl p-3 text-xs space-y-1 relative group border border-gray-100">
                              <div className="flex items-center justify-between font-semibold text-gray-700">
                                <span className="flex items-center gap-1">
                                  <UserCheck size={12} className="text-primary" />
                                  {w.senderName} 
                                  <span className="text-[10px] text-gray-400 font-normal">({w.senderRole})</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-gray-400">{formatTime(w.createdAt)}</span>
                                  {(currentUser?.role === 'principal' || currentUser?.id === w.senderId) && (
                                    <button 
                                      onClick={() => handleDeleteWish(w._id)} 
                                      className="text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                      title="Delete Wish"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-gray-600 leading-relaxed font-medium">"{w.message}"</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Wish Composer for Principal / Teachers */}
                    {isTeacherOrPrincipal ? (
                      <div className="pt-2 border-t border-gray-100 space-y-2">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder={`Write a warm wish for ${person.name.split(' ')[0]}...`}
                            value={wishInput[person._id] || ''}
                            onChange={(e) => handleWishChange(person._id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSendWish(person._id);
                            }}
                            maxLength={500}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-pink-400"
                          />
                          <button 
                            onClick={() => handleSendWish(person._id)}
                            disabled={submitting[person._id]}
                            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1 shadow"
                          >
                            <Send size={12} /> Send
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-gray-100 text-center">
                        <p className="text-[11px] text-gray-400 italic">
                          (Students have read-only access to birthday wishes)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BirthdayCelebration;
