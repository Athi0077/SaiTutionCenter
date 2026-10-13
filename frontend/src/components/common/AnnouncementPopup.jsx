import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Megaphone, X } from 'lucide-react';

const AnnouncementPopup = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/announcements/unread');
        if (res.data.success && res.data.data.length > 0) {
          setAnnouncements(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch announcements', err);
      }
    };
    fetchAnnouncements();
  }, []);

  const handleDismiss = async () => {
    const current = announcements[currentIndex];
    try {
      await api.patch(`/announcements/${current._id}/read`);
      if (currentIndex < announcements.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      console.error('Failed to dismiss announcement', err);
      // Still move to next so user isn't stuck
      if (currentIndex < announcements.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setAnnouncements([]);
      }
    }
  };

  if (announcements.length === 0) return null;

  const current = announcements[currentIndex];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300 relative border-t-8 border-primary">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-full ${current.isImportant ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              <Megaphone size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{current.isImportant ? 'Important Announcement' : 'New Announcement'}</h2>
              <p className="text-sm text-gray-500">From {current.role === 'principal' ? 'Principal' : 'Class Teacher'} • {new Date(current.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <h3 className="font-bold text-lg mb-2 text-gray-800">{current.title}</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{current.message}</p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-400">
              {currentIndex + 1} of {announcements.length}
            </p>
            <button 
              onClick={handleDismiss}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-xl font-bold transition flex items-center gap-2"
            >
              {currentIndex < announcements.length - 1 ? 'Next' : 'Got it'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementPopup;
