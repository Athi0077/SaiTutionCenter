import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Sparkles, Users, BookOpen, AlertTriangle, Loader2, ArrowLeft, BarChart2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const StatCard = ({ icon: Icon, bgClass, textClass, value, label }) => (
  <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-5 rounded-2xl shadow-soft flex flex-col items-center justify-center text-center gap-2 hover:-translate-y-1 transition duration-300">
    <div className={`w-12 h-12 ${bgClass} ${textClass} rounded-full flex items-center justify-center font-bold text-xl`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">{label}</p>
    </div>
  </div>
);

const PrincipalAIClassAnalytics = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [generatingAi, setGeneratingAi] = useState(false);

  // Comparison states
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCompareClassIds, setSelectedCompareClassIds] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchClassData(selectedClassId);
    }
  }, [selectedClassId]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data.data);
      if (res.data.data.length > 0) {
        setSelectedClassId(res.data.data[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load classes');
    }
  };

  const fetchClassData = async (classId) => {
    setLoading(true);
    setAiAnalysis(null);
    try {
      const [overviewRes, subjectsRes, warningsRes] = await Promise.all([
        api.get(`/principal/ai/class-analytics/${classId}`),
        api.get(`/principal/ai/class-analytics/${classId}/subjects`),
        api.get(`/principal/ai/class-analytics/${classId}/early-warnings`)
      ]);
      setOverview(overviewRes.data.data);
      setSubjects(subjectsRes.data.data);
      setWarnings(warningsRes.data.data);
    } catch (err) {
      toast.error('Failed to load class analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!selectedClassId) return;
    setGeneratingAi(true);
    try {
      const res = await api.post(`/principal/ai/class-analytics/${selectedClassId}/summary`);
      setAiAnalysis(res.data.data);
      toast.success('AI Class Summary generated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate AI summary');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleCompare = async () => {
    if (selectedCompareClassIds.length < 2) {
      return toast.error("Please select at least 2 classes to compare");
    }
    setComparing(true);
    try {
      const res = await api.get(`/principal/ai/class-analytics/compare?classIds=${selectedCompareClassIds.join(',')}`);
      setComparisonData(res.data.data);
    } catch (err) {
      toast.error('Failed to load comparison data');
    } finally {
      setComparing(false);
    }
  };

  const toggleCompareClass = (id) => {
    if (selectedCompareClassIds.includes(id)) {
      setSelectedCompareClassIds(prev => prev.filter(cId => cId !== id));
    } else {
      setSelectedCompareClassIds(prev => [...prev, id]);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header & Filters */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden shadow-lg">
          <div className="z-10 relative text-white">
            <button onClick={() => navigate('/principal/ai-dashboard')} className="flex items-center gap-2 text-blue-100 hover:text-white mb-4 transition font-semibold text-sm">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <BarChart2 className="w-8 h-8 text-yellow-300" />
              Class Analytics & Warnings
            </h1>
            <p className="text-blue-100 max-w-lg text-sm">Monitor class-level aggregated performance, evaluate subject trends, and identify students requiring early academic attention.</p>
          </div>
          <div className="z-10 relative bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
            <label className="block text-blue-100 text-xs font-bold uppercase mb-1">Select Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-white text-gray-800 rounded-lg px-4 py-2 font-semibold outline-none focus:ring-2 focus:ring-blue-300 transition"
            >
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.className} - {c.section}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
        ) : overview ? (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} bgClass="bg-blue-100" textClass="text-blue-600" value={overview.totalEnrolled} label="Enrolled Students" />
              <StatCard icon={BookOpen} bgClass="bg-purple-100" textClass="text-purple-600" value={`${overview.classAveragePercentage}%`} label="Class Avg. Score" />
              <StatCard icon={Calendar} bgClass="bg-emerald-100" textClass="text-emerald-600" value={`${overview.averageAttendance}%`} label="Avg. Attendance" />
              <StatCard icon={AlertTriangle} bgClass="bg-orange-100" textClass="text-orange-600" value={`${overview.homeworkSubmissionPercentage}%`} label="Homework Submissions" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Subject Analytics Chart */}
              <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-soft">
                <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-500" /> Subject Averages
                </h2>
                {subjects.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjects} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                        <Bar dataKey="average" fill="#6366f1" radius={[4, 4, 0, 0]} name="Average %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-12 text-sm">No subject data available.</p>
                )}
              </div>

              {/* AI Class Summary Trigger */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 shadow-soft flex flex-col justify-center items-center text-center">
                <Sparkles className="w-12 h-12 text-indigo-500 mb-4" />
                <h3 className="text-xl font-bold text-indigo-900 mb-2">AI Class Summary</h3>
                <p className="text-indigo-700/80 text-sm mb-6">Generate an AI-powered summary of the current class's academic health, strengths, and areas of improvement.</p>
                <button
                  onClick={handleGenerateAI}
                  disabled={generatingAi}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generatingAi ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {generatingAi ? 'Analyzing...' : 'Generate Summary'}
                </button>
              </div>
            </div>

            {/* AI Summary Render */}
            {aiAnalysis && (
              <div className="bg-white/80 backdrop-blur-xl border border-indigo-200 rounded-2xl p-6 md:p-8 shadow-soft">
                <h2 className="text-xl font-bold text-indigo-900 mb-6 flex items-center gap-2 border-b border-indigo-100 pb-4">
                  <Sparkles className="w-6 h-6 text-indigo-500" /> AI Class Intelligence Report
                </h2>
                <div className="whitespace-pre-wrap font-medium text-gray-700 leading-relaxed">
                  {aiAnalysis}
                </div>
                <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-xl text-orange-800 text-sm flex gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p><strong>Disclaimer:</strong> This AI-generated summary uses aggregated class data. It should guide general strategy and not replace human judgment regarding school-wide policies.</p>
                </div>
              </div>
            )}

            {/* Early Warning System */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-soft">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Early Warning System
                </h2>
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">
                  {warnings.length} Students Flagged
                </span>
              </div>
              
              {warnings.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {warnings.map((w, idx) => (
                    <div key={idx} className="border border-gray-100 bg-gray-50/50 p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-gray-800">{w.student.name}</h4>
                        <span className="text-xs text-gray-500 font-mono">{w.student.identifier}</span>
                      </div>
                      <div className="space-y-2">
                        {w.flags.map((flag, i) => (
                          <div key={i} className="text-sm bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                            <p className="font-semibold text-red-600 mb-1">{flag.type} Warning</p>
                            <p className="text-gray-600 text-xs mb-2">{flag.description}</p>
                            <p className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                              <ArrowLeft className="w-3 h-3 rotate-180" /> {flag.recommendation}
                            </p>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => navigate(`/principal/ai-student/${w.student.id}`)}
                        className="mt-4 w-full py-2 bg-white border border-gray-200 text-sm font-semibold text-gray-700 rounded-lg hover:bg-gray-50 transition"
                      >
                        View Full Profile
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-green-50 rounded-xl border border-green-100">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">🎉</div>
                  <h3 className="font-bold text-green-800">No At-Risk Students</h3>
                  <p className="text-green-600 text-sm mt-1">Based on current thresholds, no students require urgent academic intervention.</p>
                </div>
              )}
            </div>

            {/* Class Comparison Section */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-soft mt-8">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                   <Users className="w-5 h-5 text-blue-500" /> Compare Classes
                 </h2>
                 <button onClick={() => setCompareMode(!compareMode)} className="text-sm font-semibold text-blue-600 hover:underline">
                   {compareMode ? 'Hide Comparison' : 'Select Classes to Compare'}
                 </button>
               </div>
               
               {compareMode && (
                 <div className="space-y-6">
                   <div className="flex flex-wrap gap-3 mb-4">
                     {classes.map(c => (
                       <label key={c._id} className={`cursor-pointer px-4 py-2 rounded-full border text-sm font-medium transition ${selectedCompareClassIds.includes(c._id) ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                         <input type="checkbox" className="hidden" checked={selectedCompareClassIds.includes(c._id)} onChange={() => toggleCompareClass(c._id)} />
                         {c.className} - {c.section}
                       </label>
                     ))}
                   </div>
                   
                   <button onClick={handleCompare} disabled={comparing || selectedCompareClassIds.length < 2} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition">
                     {comparing ? 'Comparing...' : 'Run Comparison'}
                   </button>
                   
                   {comparisonData.length > 0 && (
                     <div className="overflow-x-auto mt-6">
                       <table className="w-full text-left text-sm border-collapse">
                         <thead>
                           <tr className="bg-gray-50 text-gray-600">
                             <th className="p-4 rounded-tl-xl font-semibold">Class Name</th>
                             <th className="p-4 font-semibold">Enrolled</th>
                             <th className="p-4 font-semibold">Avg Marks</th>
                             <th className="p-4 font-semibold">Attendance</th>
                             <th className="p-4 rounded-tr-xl font-semibold">Homework Submissions</th>
                           </tr>
                         </thead>
                         <tbody>
                           {comparisonData.map(d => (
                             <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                               <td className="p-4 font-bold text-gray-800">{d.name}</td>
                               <td className="p-4 text-gray-600">{d.enrolled}</td>
                               <td className="p-4 text-gray-600">{d.averageMarks}%</td>
                               <td className="p-4 text-gray-600">{d.averageAttendance}%</td>
                               <td className="p-4 text-gray-600">{d.homeworkSubmission}%</td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                       <p className="text-xs text-gray-400 mt-4 italic">Note: Ensure classes share similar assessment criteria for accurate comparison. Raw averages do not directly reflect teacher effectiveness.</p>
                     </div>
                   )}
                 </div>
               )}
            </div>

          </>
        ) : (
          <div className="text-center py-12 text-gray-500">Please select a class to view analytics.</div>
        )}
      </div>
    </Layout>
  );
};

export default PrincipalAIClassAnalytics;
