import React, { useState, useEffect, useContext } from 'react';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const ParentActivities = () => {
  const { currentUser } = useContext(AuthContext);
  const [childrenData, setChildrenData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('homework');
  const [activeChildIndex, setActiveChildIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/dashboard/parent');
        setChildrenData(res.data.data.children || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const tabs = [
    { id: 'homework', label: 'Homework', icon: '📚' },
    { id: 'tests', label: 'Tests', icon: '📝' },
    { id: 'projects', label: 'Projects', icon: '🎨' },
    { id: 'todos', label: 'Tasks & Todos', icon: '✅' },
    { id: 'fun', label: 'Fun Activities', icon: '🎯' },
  ];

  const CATEGORY_NAMES = {
    quiz: 'Quiz 🧠',
    maths_challenge: 'Maths Challenge 🔢',
    word_scramble: 'Word Scramble 🔤',
    image_challenge: 'Image Challenge 🖼️',
    puzzle: 'Puzzle 🧩',
    true_false: 'True/False ✓',
    fill_blank: 'Fill Blanks 📝',
    match_pair: 'Match Pair 🔗',
  };

  if (loading) return <Layout><div className="p-6">Loading activities...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-3xl p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Student Activities</h1>
          <p className="text-gray-600 dark:text-gray-400">View all homework, tests, projects, tasks, and fun activities assigned to your children.</p>
        </div>

        <div className="space-y-6">
          {/* Tabs for Multiple Children */}
          {childrenData.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {childrenData.map((child, index) => (
                <button
                  key={child._id}
                  onClick={() => setActiveChildIndex(index)}
                  className={`px-5 py-2.5 rounded-full font-bold text-sm transition whitespace-nowrap flex items-center gap-2 border ${
                    activeChildIndex === index 
                      ? 'bg-primary text-white border-primary shadow-md' 
                      : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${activeChildIndex === index ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'}`}>
                    {child.name.charAt(0)}
                  </div>
                  {child.name}
                </button>
              ))}
            </div>
          )}

          {/* Custom Tabs */}
          <div className="flex overflow-x-auto gap-2 border-b border-gray-100 pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                }`}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          {(() => {
            const child = childrenData[activeChildIndex];
            if (!child) return null;
            return (
              <div key={child._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft p-6">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-slate-700">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-xl">
                  {child.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{child.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Class: {child.className}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTab === 'homework' && (
                  child.homework && child.homework.length > 0 ? child.homework.map(hw => (
                    <div key={hw._id} className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                      <h4 className="font-bold text-gray-800">{hw.title} {hw.subjectId?.name && <span className="ml-2 text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider align-middle">{hw.subjectId.name}</span>}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{hw.description || 'No description provided.'}</p>
                      <div className="mt-3 flex justify-between items-center text-xs">
                        <span className="font-semibold text-blue-600">Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                        <span className={`px-2 py-1 rounded font-bold shadow-sm ${hw.studentStatus === 'Completed' ? 'bg-green-100 text-green-700' : hw.studentStatus === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{hw.studentStatus || 'Pending'}</span>
                      </div>
                    </div>
                  )) : <p className="col-span-full text-gray-500 text-center py-4">No homework records found.</p>
                )}

                {activeTab === 'tests' && (
                  child.tests && child.tests.length > 0 ? child.tests.map(test => (
                    <div key={test._id} className="p-4 bg-green-50/50 rounded-xl border border-green-100">
                      <h4 className="font-bold text-gray-800">{test.title} {test.subjectId?.name && <span className="ml-2 text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full uppercase tracking-wider align-middle">{test.subjectId.name}</span>}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{test.description || 'No description provided.'}</p>
                      <div className="mt-3 flex justify-between items-center text-xs">
                        <span className="font-semibold text-green-600">Date: {new Date(test.testDate).toLocaleDateString()}</span>
                        <div className="flex gap-2">
                          <span className="bg-white px-2 py-1 rounded text-gray-500 font-bold shadow-sm">Max: {test.maxMarks || '-'}</span>
                          <span className={`px-2 py-1 rounded font-bold shadow-sm ${test.studentStatus === 'Completed' ? 'bg-green-100 text-green-700' : test.studentStatus === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{test.studentStatus || 'Pending'}</span>
                        </div>
                      </div>
                    </div>
                  )) : <p className="col-span-full text-gray-500 text-center py-4">No test records found.</p>
                )}

                {activeTab === 'projects' && (
                  child.projects && child.projects.length > 0 ? child.projects.map(proj => (
                    <div key={proj._id} className="p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                      <h4 className="font-bold text-gray-800">{proj.title} {proj.subjectId?.name && <span className="ml-2 text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full uppercase tracking-wider align-middle">{proj.subjectId.name}</span>}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{proj.description || 'No description provided.'}</p>
                      <div className="mt-3 flex justify-between items-center text-xs">
                        <span className="font-semibold text-orange-600">Due: {new Date(proj.dueDate).toLocaleDateString()}</span>
                        <span className={`px-2 py-1 rounded font-bold shadow-sm ${proj.studentStatus === 'Completed' ? 'bg-green-100 text-green-700' : proj.studentStatus === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{proj.studentStatus || 'Pending'}</span>
                      </div>
                    </div>
                  )) : <p className="col-span-full text-gray-500 text-center py-4">No project records found.</p>
                )}

                {activeTab === 'todos' && (
                  child.todos && child.todos.length > 0 ? child.todos.map(todo => (
                    <div key={todo._id} className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-gray-800">{todo.title}</h4>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded shadow-sm ${todo.studentStatus === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {todo.studentStatus || 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{todo.description || 'No description provided.'}</p>
                      <div className="mt-3 flex justify-between items-center text-xs">
                        <span className="font-semibold text-purple-600">Priority: {todo.priority}</span>
                        {todo.dueDate && <span className="bg-white px-2 py-1 rounded text-gray-500 font-bold shadow-sm">Due: {new Date(todo.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  )) : <p className="col-span-full text-gray-500 text-center py-4">No task records found.</p>
                )}

                {activeTab === 'fun' && (
                  child.funActivities && child.funActivities.length > 0 ? child.funActivities.map(act => (
                    <div key={act._id} className="p-4 bg-rose-50/40 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/50 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                            {CATEGORY_NAMES[act.activityType] || act.activityType}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            act.studentStatus === 'Completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : act.studentStatus === 'Closed'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {act.studentStatus === 'Completed' ? '✓ Completed' : act.studentStatus}
                          </span>
                        </div>

                        <h4 className="font-bold text-gray-800 dark:text-slate-100 text-sm mt-1">{act.title}</h4>
                        {act.subject && (
                          <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 block mt-0.5">Subject: {act.subject}</span>
                        )}

                        {act.submission && (
                          <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-800 dark:text-emerald-300">Score:</span>
                            <span className="font-extrabold text-emerald-900 dark:text-emerald-100">
                              {act.submission.score} / {act.submission.totalMarks} ({act.submission.percentage}%)
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-rose-100 dark:border-rose-900/30 flex justify-between items-center text-[11px] text-gray-500 font-medium">
                        <span>Items: {act.questions ? act.questions.length : act.questionCount || '-'}</span>
                        <span>End: {new Date(act.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )) : <p className="col-span-full text-gray-500 text-center py-4">No fun activity records found.</p>
                )}
              </div>
            </div>
            );
          })()}
          {childrenData.length === 0 && (
            <div className="bg-white p-8 rounded-2xl text-center shadow-sm">
              <p className="text-gray-500">No children data available.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ParentActivities;
