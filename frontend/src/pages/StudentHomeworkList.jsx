import Layout from '../components/layout/Layout';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const StudentHomeworkList = () => {
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchHomeworks = async () => {
      try {
        const res = await api.get('/homework/student');
        setHomeworks(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeworks();
  }, []);

  const filteredHomeworks = homeworks.filter(hw => {
    if (filter === 'All') return true;
    
    const isOverdue = new Date() > new Date(hw.dueDate);
    const isDueToday = new Date().toDateString() === new Date(hw.dueDate).toDateString();
    // Assuming status might be attached from submission, or just using basic dates if not
    const isCompleted = ['pending_approval', 'approved', 'submitted', 'graded'].includes(hw.submissionStatus);

    if (filter === 'Due Today') return isDueToday && !isCompleted;
    if (filter === 'Overdue') return isOverdue && !isCompleted;
    if (filter === 'Completed') return isCompleted;
    
    return true;
  });

  return (
    <Layout>
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h2 className="text-3xl font-bold text-gray-800">My Homework</h2>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          {['All', 'Due Today', 'Overdue', 'Completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${filter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {f}
            </button>
          ))}
        </div>
        <Link to="/student/homework/history" className="text-blue-600 font-bold hover:underline">
          View History &rarr;
        </Link>
      </div>

      {loading ? (
        <div className="p-6 text-center text-gray-500 font-semibold animate-pulse">Loading homework...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHomeworks.length > 0 ? (
            filteredHomeworks.map(hw => {
              const isOverdue = new Date() > new Date(hw.dueDate);
              
              return (
                <div key={hw._id} className="bg-white border rounded shadow p-6 border-t-4 border-blue-500 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📚</span>
                    <h3 className="text-xl font-bold">{hw.subjectId?.name}</h3>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">{hw.title}</h4>
                  
                  <div className="text-sm text-gray-600 mb-4 flex-grow">
                    <p className="line-clamp-2 mb-2">{hw.description}</p>
                    <p className={isOverdue ? "text-red-600 font-semibold" : "text-gray-500"}>
                      Due: {new Date(hw.dueDate).toLocaleString()}
                    </p>
                  </div>
                  
                  <Link to={`/student/homework/${hw._id}`} className="block text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold">
                    Open
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 bg-blue-50/50 rounded-3xl border border-blue-100">
              <div className="text-6xl mb-6">🎮</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">All caught up!</h3>
              <p className="text-gray-500 text-lg">Great job, take a break. You have no pending tasks here.</p>
            </div>
          )}
        </div>
      )}
    </div>
    </Layout>
  );
};

export default StudentHomeworkList;
