import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { NotificationContext } from '../context/NotificationContext';

const NotificationBell = () => {
  const { unreadCount } = useContext(NotificationContext);

  return (
    <Link to="/notifications" className="relative p-2 hover:bg-gray-100/20 rounded-full transition">
      <span className="text-xl">🔔</span>
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
          {unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;
