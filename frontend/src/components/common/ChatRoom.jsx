import React, { useState, useEffect, useContext, useRef } from 'react';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';

const ChatRoom = ({ entityType, entityId }) => {
  const { currentUser, token } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  const roomId = `${entityType}_${entityId}`;

  useEffect(() => {
    // 1. Fetch Chat History
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/chat/${roomId}`);
        setMessages(res.data.data);
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    };
    fetchHistory();

    // 2. Use Global Socket Connection
    const currentSocket = getSocket();
    if (!currentSocket) return;

    setSocket(currentSocket);

    const handleConnect = () => {
      currentSocket.emit('join_room', roomId);
    };

    if (currentSocket.connected) {
      currentSocket.emit('join_room', roomId);
    }

    currentSocket.on('connect', handleConnect);

    const handleReceiveMessage = (message) => {
      setMessages((prev) => {
        if (prev.some(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };

    currentSocket.on('receive_message', handleReceiveMessage);

    // Cleanup on unmount
    return () => {
      currentSocket.off('connect', handleConnect);
      currentSocket.off('receive_message', handleReceiveMessage);
    };
  }, [roomId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    socket.emit('send_message', {
      roomId,
      text: newMessage
    });

    setNewMessage('');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'teacher': return 'bg-red-100 text-red-800 border-red-200';
      case 'principal': return 'bg-green-100 text-green-800 border-green-200';
      case 'parent': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
      <div className="p-4 border-b bg-gray-50 rounded-t-2xl flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="text-xl">💬</span> Discussion Room
          </h3>
          <p className="text-xs text-gray-500">Ask doubts, discuss homework, and collaborate.</p>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?._id;
          return (
            <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-bold text-gray-600">{isMe ? 'You' : msg.senderName}</span>
                {!isMe && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-bold ${getRoleBadgeColor(msg.senderRole)}`}>
                    {msg.senderRole}
                  </span>
                )}
                <span className="text-[10px] text-gray-400">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm shadow-sm ${
                isMe 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
            <span className="text-4xl">👋</span>
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t bg-white rounded-b-2xl overflow-hidden">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 min-w-0 p-2 sm:p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="flex-shrink-0 whitespace-nowrap px-4 py-2 sm:px-5 sm:py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm flex items-center gap-1 sm:gap-2"
          >
            <span className="hidden sm:inline">Send</span> <span className="text-lg sm:text-base">🚀</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
