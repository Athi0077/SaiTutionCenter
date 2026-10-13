import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Sparkles, Send, Loader2, Trash2, Plus, MessageSquare, ArrowLeft, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const PrincipalAIAssistant = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    "How many students are enrolled in each standard?",
    "Which subjects have the lowest average marks in 10th A?",
    "Summarize attendance trends for the school.",
    "Show students with pending homework in 9th B."
  ];

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    setFetching(true);
    try {
      const res = await api.get('/principal/ai-assistant/conversations');
      setConversations(res.data.data);
      if (res.data.data.length > 0 && !activeConversationId) {
        setActiveConversationId(res.data.data[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load conversations');
    } finally {
      setFetching(false);
    }
  };

  const fetchMessages = async (id) => {
    setFetching(true);
    try {
      const res = await api.get(`/principal/ai-assistant/conversations/${id}`);
      setMessages(res.data.data.messages);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setFetching(false);
    }
  };

  const createConversation = async () => {
    try {
      const res = await api.post('/principal/ai-assistant/conversations');
      setConversations([res.data.data, ...conversations]);
      setActiveConversationId(res.data.data._id);
    } catch (err) {
      toast.error('Failed to start new conversation');
    }
  };

  const deleteConversation = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/principal/ai-assistant/conversations/${id}`);
      const updated = conversations.filter(c => c._id !== id);
      setConversations(updated);
      if (activeConversationId === id) {
        setActiveConversationId(updated.length > 0 ? updated[0]._id : null);
      }
      toast.success('Conversation deleted');
    } catch (err) {
      toast.error('Failed to delete conversation');
    }
  };

  const clearMessages = async () => {
    if (!activeConversationId) return;
    try {
      await api.patch(`/principal/ai-assistant/conversations/${activeConversationId}/clear`);
      setMessages([]);
      toast.success('Conversation cleared');
    } catch (err) {
      toast.error('Failed to clear conversation');
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMessage = text.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await api.post('/principal/ai-assistant/chat', {
        conversationId: activeConversationId,
        message: userMessage
      });
      
      const { conversationId, message } = res.data.data;
      if (!activeConversationId) {
        setActiveConversationId(conversationId);
        fetchConversations();
      }
      setMessages(prev => [...prev, { role: 'assistant', content: message }]);
    } catch (err) {
      toast.error('AI Assistant failed to reply.');
      setMessages(prev => [...prev, { role: 'assistant', content: "Error: Could not retrieve response from server. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-6rem)] min-h-[600px] flex flex-col md:flex-row gap-6">
        
        {/* Sidebar History */}
        <div className="w-full md:w-80 bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-soft flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500" /> History
            </h2>
            <button onClick={createConversation} className="p-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-lg transition" title="New Chat">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {fetching && conversations.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-sm">No recent conversations</div>
            ) : (
              conversations.map(c => (
                <div 
                  key={c._id} 
                  onClick={() => setActiveConversationId(c._id)}
                  className={`p-3 rounded-xl cursor-pointer flex justify-between items-center group transition ${activeConversationId === c._id ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50 border border-transparent'}`}
                >
                  <div className="truncate text-sm font-medium text-gray-700">{c.title || "New Conversation"}</div>
                  <button onClick={(e) => deleteConversation(c._id, e)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="flex-1 bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-soft flex flex-col overflow-hidden">
          
          {/* Chat Header */}
          <div className="p-4 md:p-6 border-b border-gray-100 bg-gradient-to-r from-blue-700 to-indigo-700 flex justify-between items-center text-white">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/principal/ai-dashboard')} className="text-blue-200 hover:text-white transition">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-300" /> Principal AI Assistant
                </h1>
                <p className="text-xs text-blue-200">Natural Language School Analytics</p>
              </div>
            </div>
            {messages.length > 0 && (
              <button onClick={clearMessages} className="text-blue-200 hover:text-white transition flex items-center gap-1 text-sm font-medium bg-white/10 px-3 py-1 rounded-lg">
                <RotateCcw className="w-4 h-4" /> Clear
              </button>
            )}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/30">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                <Sparkles className="w-16 h-16 text-indigo-200 mb-4" />
                <h2 className="text-2xl font-bold text-gray-700 mb-2">How can I help you?</h2>
                <p className="text-gray-500 text-sm mb-8">Ask any question about your school's enrollment, academic performance, or student health.</p>
                
                <div className="w-full space-y-3">
                  {suggestedQuestions.map((q, idx) => (
                    <button 
                      key={idx}
                      onClick={() => sendMessage(q)}
                      className="w-full text-left p-3 md:p-4 rounded-xl bg-white border border-indigo-100 shadow-sm hover:shadow-md hover:border-indigo-300 transition text-sm text-gray-700 font-medium flex items-center gap-3"
                    >
                      <MessageSquare className="w-4 h-4 text-indigo-400" /> {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl shadow-sm text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'}`}>
                      {msg.role === 'assistant' ? (
                        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Processing school records...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="relative flex items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about students, classes, or attendance..."
                className="w-full max-h-32 min-h-[50px] bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
                rows="1"
              />
              <button 
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="absolute right-2 bottom-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-[10px] text-gray-400 font-medium">AI can make mistakes. Verify critical actions with raw school records.</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrincipalAIAssistant;
