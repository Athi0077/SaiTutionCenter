import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Plus, TrendingUp, TrendingDown, Minus, Clock, Eye, CheckCircle, ArrowLeft, Loader2, PlayCircle, StopCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, bgClass, textClass, value, label, subtext }) => (
  <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-5 rounded-2xl shadow-soft flex flex-col hover:-translate-y-1 transition duration-300">
    <div className="flex items-center gap-3 mb-2">
      <div className={`p-2 rounded-xl ${bgClass} ${textClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wide">{label}</h3>
    </div>
    <div className="flex items-end gap-2">
      <p className="text-3xl font-black text-gray-800">{value}</p>
      {subtext && <p className={`text-sm font-semibold mb-1 ${textClass}`}>{subtext}</p>}
    </div>
  </div>
);

const PrincipalAIProgress = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [showCreate, setShowCreate] = useState(false);
  const [students, setStudents] = useState([]);
  const [newPlan, setNewPlan] = useState({ studentId: '', concern: '', improvementTarget: '', actionItems: '', subjects: '', reviewDate: '' });

  // Detail Modal
  const [selectedInvId, setSelectedInvId] = useState(null);
  const [invDetail, setInvDetail] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [principalNotes, setPrincipalNotes] = useState('');

  useEffect(() => {
    fetchDashboard();
    fetchStudents();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/principal/ai-progress/dashboard');
      setStats(res.data.data.stats);
      setInterventions(res.data.data.interventions);
    } catch (err) {
      toast.error('Failed to load progress dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/principal/ai-reports/students'); // reuse from phase 4
      setStudents(res.data.data);
    } catch (err) {}
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newPlan,
        subjects: newPlan.subjects.split(',').map(s => s.trim()),
        actionItems: newPlan.actionItems.split('\n').filter(s => s.trim())
      };
      await api.post('/principal/ai-progress/interventions', payload);
      toast.success('Intervention Plan created');
      setShowCreate(false);
      fetchDashboard();
    } catch (err) {
      toast.error('Failed to create plan');
    }
  };

  const viewDetails = async (id) => {
    setSelectedInvId(id);
    try {
      const res = await api.get(`/principal/ai-progress/interventions/${id}`);
      setInvDetail(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch details');
    }
  };

  const closeDetails = () => {
    setSelectedInvId(null);
    setInvDetail(null);
    setPrincipalNotes('');
  };

  const handleGenerateReview = async () => {
    if (!invDetail) return;
    setReviewing(true);
    try {
      await api.post(`/principal/ai-progress/interventions/${selectedInvId}/review`, { principalNotes });
      toast.success('AI Progress Review Logged');
      setPrincipalNotes('');
      viewDetails(selectedInvId); // refresh
      fetchDashboard();
    } catch (err) {
      toast.error('Failed to generate AI review');
    } finally {
      setReviewing(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      await api.patch(`/principal/ai-progress/interventions/${selectedInvId}`, { status });
      toast.success(`Status updated to ${status}`);
      viewDetails(selectedInvId);
      fetchDashboard();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
          <div className="text-white">
            <button onClick={() => navigate('/principal/ai-dashboard')} className="flex items-center gap-2 text-emerald-100 hover:text-white mb-4 transition font-semibold text-sm">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Activity className="w-8 h-8 text-emerald-200" /> AI Progress & Interventions
            </h1>
            <p className="text-emerald-50 max-w-lg text-sm">Track student interventions, visualize academic progress, and log AI-assisted reviews.</p>
          </div>
          <button 
            onClick={() => setShowCreate(true)}
            className="bg-white text-teal-800 hover:bg-emerald-50 px-6 py-3 rounded-xl font-bold shadow-md transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> New Intervention Plan
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-10 h-10 animate-spin text-teal-600" /></div>
        ) : (
          <>
            {/* Dashboard Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Activity} bgClass="bg-blue-100" textClass="text-blue-600" value={stats.total} label="Total Interventions" />
                <StatCard icon={TrendingUp} bgClass="bg-green-100" textClass="text-green-600" value={stats.improving} label="Improving" subtext="Students" />
                <StatCard icon={TrendingDown} bgClass="bg-red-100" textClass="text-red-600" value={stats.declining} label="Declining" subtext="Requires change" />
                <StatCard icon={Clock} bgClass="bg-orange-100" textClass="text-orange-600" value={stats.requiresFollowUp} label="Overdue Reviews" />
              </div>
            )}

            {/* List */}
            <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-2xl p-6 shadow-soft">
              <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                Active Intervention Plans
              </h2>
              {interventions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-500 text-sm">
                        <th className="p-3 font-semibold">Student</th>
                        <th className="p-3 font-semibold">Subjects</th>
                        <th className="p-3 font-semibold">Trend</th>
                        <th className="p-3 font-semibold">Status</th>
                        <th className="p-3 font-semibold">Next Review</th>
                        <th className="p-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interventions.map(inv => (
                        <tr key={inv._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                          <td className="p-3">
                            <p className="font-bold text-gray-800">{inv.student?.name}</p>
                            <p className="text-xs text-gray-400">{inv.student?.studentId} • {inv.student?.classSection}</p>
                          </td>
                          <td className="p-3 text-sm text-gray-600">{inv.subjects?.join(', ')}</td>
                          <td className="p-3">
                            {inv.trend === 'improving' ? <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-md w-max"><TrendingUp className="w-3 h-3"/> Improving</span> :
                             inv.trend === 'declining' ? <span className="flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-md w-max"><TrendingDown className="w-3 h-3"/> Declining</span> :
                             <span className="flex items-center gap-1 text-gray-500 text-xs font-bold bg-gray-100 px-2 py-1 rounded-md w-max"><Minus className="w-3 h-3"/> Stable</span>}
                          </td>
                          <td className="p-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${inv.status === 'Completed' ? 'bg-indigo-50 text-indigo-700' : inv.status === 'In Progress' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-gray-500">
                            {inv.reviewDate ? new Date(inv.reviewDate).toLocaleDateString() : 'Not Set'}
                          </td>
                          <td className="p-3 text-right">
                            <button onClick={() => viewDetails(inv._id)} className="text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 p-2 rounded-lg transition">
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">No active interventions found.</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Detail Modal overlay (simple absolute full screen for this phase) */}
      {selectedInvId && invDetail && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-3xl bg-white h-full overflow-y-auto shadow-2xl p-6 md:p-8 animate-in slide-in-from-right">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{invDetail.intervention.studentId?.name}</h2>
                <p className="text-gray-500">Intervention Plan • {invDetail.intervention.status}</p>
              </div>
              <button onClick={closeDetails} className="p-2 hover:bg-gray-100 rounded-full transition">
                ✕
              </button>
            </div>

            {/* Content Tabs / Sections */}
            <div className="space-y-8">
              
              {/* Baseline vs Current */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Academic Snapshot</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Baseline Average</p>
                    <p className="text-2xl font-black text-gray-800">{invDetail.intervention.baselineMetrics?.overallAverage}%</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Current Average</p>
                    <p className="text-2xl font-black text-teal-600">{invDetail.currentMetrics?.overallAverage}%</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p><strong>Concern:</strong> {invDetail.intervention.concern}</p>
                  <p><strong>Target:</strong> {invDetail.intervention.improvementTarget}</p>
                </div>
              </div>

              {/* Action Items */}
              <div>
                <h3 className="font-bold text-gray-700 mb-3 border-b pb-2">Action Items</h3>
                <ul className="space-y-2">
                  {invDetail.intervention.actionItems.map((a, i) => (
                    <li key={i} className="flex gap-2 items-start text-sm">
                      {a.completed ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5"/> : <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0 mt-0.5"></div>}
                      <span className={a.completed ? 'text-gray-400 line-through' : 'text-gray-700'}>{a.item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Review History */}
              <div>
                <h3 className="font-bold text-gray-700 mb-3 border-b pb-2">Review History</h3>
                {invDetail.intervention.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {invDetail.intervention.reviews.map((r, i) => (
                      <div key={i} className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-indigo-900 flex items-center gap-1"><Sparkles className="w-4 h-4"/> AI Review</span>
                          <span className="text-xs text-indigo-400">{new Date(r.date).toLocaleDateString()}</span>
                        </div>
                        <div className="whitespace-pre-wrap text-gray-700 mb-3">{r.aiSummary}</div>
                        {r.principalNotes && (
                          <div className="bg-white p-3 rounded-lg border border-indigo-50 text-indigo-800">
                            <strong>Principal Note:</strong> {r.principalNotes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No reviews recorded yet.</p>
                )}
              </div>

              {/* Add New Review */}
              {invDetail.intervention.status !== 'Completed' && (
                <div className="bg-white border-2 border-dashed border-teal-100 rounded-xl p-5">
                  <h3 className="font-bold text-teal-800 mb-2">Record AI Progress Review</h3>
                  <p className="text-xs text-teal-600/70 mb-4">The AI will analyze the baseline vs current metrics and draft a progress summary.</p>
                  
                  <textarea
                    value={principalNotes}
                    onChange={(e) => setPrincipalNotes(e.target.value)}
                    placeholder="Add optional principal notes to attach to this review..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none mb-3 resize-none h-20"
                  ></textarea>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={handleGenerateReview}
                      disabled={reviewing}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-bold text-sm flex justify-center items-center gap-2 transition disabled:opacity-50"
                    >
                      {reviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Record AI Review
                    </button>
                    {invDetail.intervention.status === 'Planned' && (
                      <button onClick={() => handleUpdateStatus('In Progress')} className="px-4 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-bold text-sm transition">
                        Start Progress
                      </button>
                    )}
                    {invDetail.intervention.status === 'In Progress' && (
                      <button onClick={() => handleUpdateStatus('Completed')} className="px-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg font-bold text-sm transition">
                        Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Create Intervention Plan</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Student</label>
                <select required value={newPlan.studentId} onChange={e => setNewPlan({...newPlan, studentId: e.target.value})} className="w-full border rounded-lg p-2 bg-gray-50">
                  <option value="">Select Student</option>
                  {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Concern (Why?)</label>
                <input required type="text" value={newPlan.concern} onChange={e => setNewPlan({...newPlan, concern: e.target.value})} className="w-full border rounded-lg p-2 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Target Subjects (Comma separated)</label>
                <input required type="text" placeholder="Math, Science" value={newPlan.subjects} onChange={e => setNewPlan({...newPlan, subjects: e.target.value})} className="w-full border rounded-lg p-2 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Improvement Target</label>
                <input required type="text" placeholder="e.g. Achieve 60% in Math" value={newPlan.improvementTarget} onChange={e => setNewPlan({...newPlan, improvementTarget: e.target.value})} className="w-full border rounded-lg p-2 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Action Items (One per line)</label>
                <textarea required rows="3" placeholder="- Attend remedial class\n- Submit pending homework" value={newPlan.actionItems} onChange={e => setNewPlan({...newPlan, actionItems: e.target.value})} className="w-full border rounded-lg p-2 bg-gray-50 resize-none"></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Review Date</label>
                <input required type="date" value={newPlan.reviewDate} onChange={e => setNewPlan({...newPlan, reviewDate: e.target.value})} className="w-full border rounded-lg p-2 bg-gray-50" />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 shadow-md">Create Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default PrincipalAIProgress;
