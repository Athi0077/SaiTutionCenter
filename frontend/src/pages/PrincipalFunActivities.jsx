import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  Sparkles, 
  BookOpen, 
  Filter, 
  Eye, 
  X,
  Layers
} from 'lucide-react';

const CATEGORY_NAMES = {
  quiz: '🧠 Quiz',
  maths_challenge: '🔢 Maths Challenge',
  word_scramble: '🔤 Word Scramble',
  image_challenge: '🖼️ Image Challenge',
  puzzle: '🧩 Puzzle',
  true_false: '✓ True / False',
  fill_blank: '📝 Fill in Blanks',
  match_pair: '🔗 Match Pair',
};

const PrincipalFunActivities = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalActivities: 0,
    activeQuizzes: 0,
    completedQuizzes: 0,
    totalParticipation: 0,
    categoryCounts: {
      quiz: 0,
      maths_challenge: 0,
      word_scramble: 0,
      image_challenge: 0,
      puzzle: 0,
      true_false: 0,
      fill_blank: 0,
      match_pair: 0,
    }
  });
  const [quizzes, setQuizzes] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [standards, setStandards] = useState([]);

  // Filter State
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterStandard, setFilterStandard] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterActivityType, setFilterActivityType] = useState('');

  // Results Modal State
  const [selectedQuizResults, setSelectedQuizResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [filterTeacher, filterStandard, filterSubject, filterActivityType]);

  const fetchInitialData = async () => {
    try {
      const [teachersRes, standardsRes] = await Promise.all([
        api.get('/users/active-teachers'),
        api.get('/standards')
      ]);
      setTeachers(teachersRes.data.data || []);
      setStandards(standardsRes.data.data || []);
    } catch (err) {
      console.error("Failed to load filter options", err);
    }
  };

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterTeacher) params.teacherId = filterTeacher;
      if (filterStandard) params.standardId = filterStandard;
      if (filterSubject) params.subject = filterSubject;
      if (filterActivityType) params.activityType = filterActivityType;

      const res = await api.get('/fun-activities/principal/overview', { params });
      if (res.data.success) {
        setMetrics(res.data.data.metrics);
        setQuizzes(res.data.data.quizzes);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch overview data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResults = async (quizId) => {
    try {
      setLoadingResults(true);
      setShowResultsModal(true);
      const res = await api.get(`/fun-activities/quizzes/${quizId}/results`);
      setSelectedQuizResults(res.data.data);
    } catch (err) {
      toast.error("Failed to load activity results");
      setShowResultsModal(false);
    } finally {
      setLoadingResults(false);
    }
  };

  const counts = metrics.categoryCounts || {};

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 pb-10">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-md border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Principal Monitoring
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Fun Activities & Category Analytics</h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Monitor teacher activity assignments across 8 categories, student participation rates, and performance analytics across all standards and subjects.
            </p>
          </div>

          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl shrink-0 z-10">
            🏫
          </div>

          <div className="absolute right-0 top-0 bottom-0 opacity-10 w-1/3 bg-gradient-to-l from-emerald-400 to-transparent pointer-events-none"></div>
        </div>

        {/* Category Metrics Overview Grid */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2 px-1">
            <Layers className="w-4 h-4 text-emerald-600" /> Category Breakdown Metrics
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="bg-white dark:bg-[#0b1120] p-4 rounded-2xl border border-gray-100 dark:border-[#1E293B] shadow-xs text-center space-y-1">
              <p className="text-xl">🧠</p>
              <p className="text-[11px] font-bold text-gray-500">Quiz</p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-slate-100">{counts.quiz || 0}</p>
            </div>

            <div className="bg-white dark:bg-[#0b1120] p-4 rounded-2xl border border-gray-100 dark:border-[#1E293B] shadow-xs text-center space-y-1">
              <p className="text-xl">🔢</p>
              <p className="text-[11px] font-bold text-blue-600">Maths</p>
              <p className="text-xl font-extrabold text-blue-600">{counts.maths_challenge || 0}</p>
            </div>

            <div className="bg-white dark:bg-[#0b1120] p-4 rounded-2xl border border-gray-100 dark:border-[#1E293B] shadow-xs text-center space-y-1">
              <p className="text-xl">🔤</p>
              <p className="text-[11px] font-bold text-amber-600">Word</p>
              <p className="text-xl font-extrabold text-amber-600">{counts.word_scramble || 0}</p>
            </div>

            <div className="bg-white dark:bg-[#0b1120] p-4 rounded-2xl border border-gray-100 dark:border-[#1E293B] shadow-xs text-center space-y-1">
              <p className="text-xl">🖼️</p>
              <p className="text-[11px] font-bold text-emerald-600">Image</p>
              <p className="text-xl font-extrabold text-emerald-600">{counts.image_challenge || 0}</p>
            </div>

            <div className="bg-white dark:bg-[#0b1120] p-4 rounded-2xl border border-gray-100 dark:border-[#1E293B] shadow-xs text-center space-y-1">
              <p className="text-xl">🧩</p>
              <p className="text-[11px] font-bold text-purple-600">Puzzle</p>
              <p className="text-xl font-extrabold text-purple-600">{counts.puzzle || 0}</p>
            </div>

            <div className="bg-white dark:bg-[#0b1120] p-4 rounded-2xl border border-gray-100 dark:border-[#1E293B] shadow-xs text-center space-y-1">
              <p className="text-xl">✓</p>
              <p className="text-[11px] font-bold text-cyan-600">True/False</p>
              <p className="text-xl font-extrabold text-cyan-600">{counts.true_false || 0}</p>
            </div>

            <div className="bg-white dark:bg-[#0b1120] p-4 rounded-2xl border border-gray-100 dark:border-[#1E293B] shadow-xs text-center space-y-1">
              <p className="text-xl">📝</p>
              <p className="text-[11px] font-bold text-fuchsia-600">Fill Blank</p>
              <p className="text-xl font-extrabold text-fuchsia-600">{counts.fill_blank || 0}</p>
            </div>

            <div className="bg-white dark:bg-[#0b1120] p-4 rounded-2xl border border-gray-100 dark:border-[#1E293B] shadow-xs text-center space-y-1">
              <p className="text-xl">🔗</p>
              <p className="text-[11px] font-bold text-lime-600">Match Pair</p>
              <p className="text-xl font-extrabold text-lime-600">{counts.match_pair || 0}</p>
            </div>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0b1120] p-5 rounded-3xl border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Activities</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-slate-100">{metrics.totalActivities || 0}</p>
          </div>

          <div className="bg-white dark:bg-[#0b1120] p-5 rounded-3xl border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-1">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Active Activities</p>
            <p className="text-3xl font-extrabold text-emerald-600">{metrics.activeQuizzes || 0}</p>
          </div>

          <div className="bg-white dark:bg-[#0b1120] p-5 rounded-3xl border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-1">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Completed</p>
            <p className="text-3xl font-extrabold text-purple-600">{metrics.completedQuizzes || 0}</p>
          </div>

          <div className="bg-white dark:bg-[#0b1120] p-5 rounded-3xl border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-1">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Total Participation</p>
            <p className="text-3xl font-extrabold text-indigo-600">{metrics.totalParticipation || 0}</p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-5 border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-600" /> Filter Overview
            </h3>
            {(filterTeacher || filterStandard || filterSubject || filterActivityType) && (
              <button
                onClick={() => {
                  setFilterTeacher('');
                  setFilterStandard('');
                  setFilterSubject('');
                  setFilterActivityType('');
                }}
                className="text-xs font-semibold text-emerald-600 hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <select
                className="w-full p-2.5 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-100"
                value={filterActivityType}
                onChange={(e) => setFilterActivityType(e.target.value)}
              >
                <option value="">All Activity Types</option>
                <option value="quiz">🧠 Quiz</option>
                <option value="maths_challenge">🔢 Maths Challenge</option>
                <option value="word_scramble">🔤 Word Scramble</option>
                <option value="image_challenge">🖼️ Image Challenge</option>
                <option value="puzzle">🧩 Puzzle</option>
                <option value="true_false">✓ True / False</option>
                <option value="fill_blank">📝 Fill in the Blanks</option>
                <option value="match_pair">🔗 Match the Pair</option>
              </select>
            </div>

            <div>
              <select
                className="w-full p-2.5 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-100"
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
              >
                <option value="">All Teachers</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                className="w-full p-2.5 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-100"
                value={filterStandard}
                onChange={(e) => setFilterStandard(e.target.value)}
              >
                <option value="">All Standards</option>
                {standards.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <input 
                type="text" 
                placeholder="Filter by Subject"
                className="w-full p-2.5 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Quizzes Table / List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              Teacher Activity Assignments Overview
            </h2>
            <span className="text-xs text-gray-500 font-medium">Showing {quizzes.length} Activities</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-12 text-center border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-2xl">
                📊
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">No Activities Found</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                No activities match the selected filter criteria.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#0b1120] rounded-3xl border border-gray-100 dark:border-[#1E293B] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-[#172235] text-gray-600 dark:text-slate-300 font-bold uppercase text-[11px] tracking-wider border-b border-gray-100 dark:border-[#1E293B]">
                    <tr>
                      <th className="p-4">Teacher</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Class & Subject</th>
                      <th className="p-4">Activity Title</th>
                      <th className="p-4 text-center">Participation</th>
                      <th className="p-4 text-center">Avg. Score</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#1E293B] font-medium text-gray-800 dark:text-slate-200">
                    {quizzes.map((quiz) => (
                      <tr key={quiz.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition">
                        <td className="p-4">
                          <span className="font-bold text-gray-900 dark:text-slate-100 block">{quiz.teacherName}</span>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 text-xs font-bold rounded-full border">
                            {CATEGORY_NAMES[quiz.activityType] || '🧠 Quiz'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full">
                            {quiz.standard} - {quiz.section} • {quiz.subject}
                          </span>
                        </td>
                        <td className="p-4 font-semibold">{quiz.title}</td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-blue-600">{quiz.participatedCount}</span> / {quiz.totalEnrolled}
                        </td>
                        <td className="p-4 text-center font-bold text-purple-600">
                          {quiz.averageScore}%
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                            quiz.status === 'closed'
                              ? 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400'
                              : quiz.status === 'coming_soon'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                          }`}>
                            {quiz.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleOpenResults(quiz.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
                          >
                            <Eye className="w-3.5 h-3.5" /> Class Breakdown
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* QUIZ RESULTS BREAKDOWN MODAL */}
      {showResultsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-[#1E293B] space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1E293B] pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-100">
                  {selectedQuizResults?.quiz?.title || 'Activity Class Breakdown'}
                </h3>
                <p className="text-xs text-gray-500">
                  Assigned by {selectedQuizResults?.quiz?.creatorName} • {selectedQuizResults?.quiz?.standard} - Section {selectedQuizResults?.quiz?.section} ({selectedQuizResults?.quiz?.subject})
                </p>
              </div>

              <button onClick={() => setShowResultsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingResults ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
              </div>
            ) : selectedQuizResults ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl text-center">
                    <p className="text-xs font-semibold text-blue-600">Total Enrolled</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{selectedQuizResults.stats.totalStudents}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-center">
                    <p className="text-xs font-semibold text-emerald-600">Participated</p>
                    <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">{selectedQuizResults.stats.participated}</p>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl text-center">
                    <p className="text-xs font-semibold text-amber-600">Not Attempted</p>
                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">{selectedQuizResults.stats.notParticipated}</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl text-center">
                    <p className="text-xs font-semibold text-purple-600">Average Score</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">{selectedQuizResults.stats.averageScore}%</p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-gray-100 dark:border-[#1E293B] rounded-2xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-[#172235] text-gray-600 dark:text-slate-300 font-bold uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="p-3">Student Name</th>
                        <th className="p-3 text-center">Score</th>
                        <th className="p-3 text-center">Percentage</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-[#1E293B] font-medium text-gray-800 dark:text-slate-200">
                      {selectedQuizResults.studentResults.map((st, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-semibold">{st.name}</td>
                          <td className="p-3 text-center">
                            {st.status === 'Completed' ? `${st.score} / ${st.totalMarks}` : '-'}
                          </td>
                          <td className="p-3 text-center font-bold">
                            {st.status === 'Completed' ? `${st.percentage}%` : '-'}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                              st.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {st.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            ) : null}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PrincipalFunActivities;
