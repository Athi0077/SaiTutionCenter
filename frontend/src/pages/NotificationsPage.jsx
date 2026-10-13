import React, { useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';
import Layout from '../components/layout/Layout';

const NotificationsPage = () => {
  const { notifications, markAsRead, markAllAsRead } = useContext(NotificationContext);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
          <button 
            onClick={markAllAsRead} 
            className="text-primary font-semibold hover:underline"
          >
            Mark all as read
          </button>
        </div>

        <div className="bg-white shadow-soft rounded-2xl overflow-hidden">
          {notifications.length > 0 ? (
            <ul className="divide-y divide-gray-50">
              {notifications.map(notif => (
                <li 
                  key={notif._id} 
                  className={`p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-gray-50 transition ${notif.isRead ? 'bg-white' : 'bg-primary-light/30'}`}
                  onClick={() => !notif.isRead && markAsRead(notif._id)}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {!notif.isRead && <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>}
                      <h4 className={`font-bold ${notif.isRead ? 'text-gray-700' : 'text-gray-900'}`}>{notif.title}</h4>
                    </div>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap mt-1">{notif.message}</p>
                  </div>
                  <div className="mt-4 md:mt-0 text-sm text-gray-400 whitespace-nowrap font-medium">
                    {new Date(notif.createdAt).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <span className="text-4xl mb-4 block">🔔</span>
              No notifications available.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NotificationsPage;
