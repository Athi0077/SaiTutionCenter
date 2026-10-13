import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import toast from 'react-hot-toast';
import {
  TrendingUp, GraduationCap, RefreshCw, ArrowRightLeft,
  MinusCircle, AlertTriangle, CheckCircle2, Users, ChevronDown,
  Search, Filter, ArrowLeft, Loader2, Star, XCircle, Info,
  UserCheck, BarChart3, Eye, Award
} from 'lucide-react';

const ACTION_CONFIG = {
  promote: {
    label: 'Promote',
    icon: TrendingUp,
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
    dot: 'bg-green-500'
  },
  graduate: {
    label: 'Graduate',
    icon: GraduationCap,
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    dot: 'bg-purple-500'
  },
  repeat: {
    label: 'Repeat Year',
    icon: RefreshCw,
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    dot: 'bg-orange-500'
  },
  transfer: {
    label: 'Transfer Out',
    icon: ArrowRightLeft,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500'
  },
  exclude: {
    label: 'Exclude',
    icon: MinusCircle,
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-500'
  }
};

const StatCard = ({ icon: Icon, label, count, color, bg }) => (
  <div className={`${bg} rounded-2xl p-4 flex items-center gap-3 border border-opacity-30`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
      <Icon size={20} className={color} />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800">{count}</p>
      <p className={`text-xs font-medium ${color}`}>{label}</p>
    </div>
  </div>
);

const PrincipalPromotionPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeYear, setActiveYear] = useState(null);
  const [destYear, setDestYear] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [confirmedResult, setConfirmedResult] = useState(null);
  const [step, setStep] = useState('preview'); // 'preview' | 'confirm' | 'done'

  useEffect(() => {
    const fetchSetup = async () => {
      try {
        setLoading(true);
        const yearsRes = await api.get('/academic-years');
        const years = yearsRes.data.data;

        const active = years.find(y => y.status === 'active');
        const dest = years.find(y => y._id === id);

        if (!active) {
          toast.error('No active academic year found to promote from.');
          navigate('/principal/academic-years');
          return;
        }
        if (!dest) {
          toast.error('Destination academic year not found.');
          navigate('/principal/academic-years');
          return;
        }

        setActiveYear(active);
        setDestYear(dest);

        const previewRes = await api.post('/promotions/preview', {
          sourceAcademicYearId: active._id,
          destinationAcademicYearId: id
        });

        setPreviewData(previewRes.data.data);
      } catch (err) {
        toast.error('Failed to load promotion preview. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSetup();
  }, [id]);

  const handleActionChange = (studentId, newAction) => {
    setPreviewData(prev =>
      prev.map(item =>
        item.studentId === studentId ? { ...item, action: newAction } : item
      )
    );
  };

  const handleBulkAction = (action) => {
    setPreviewData(prev =>
      prev.map(item =>
        item.errorDetails && item.action !== 'graduate'
          ? item // Don't override items with errors
          : { ...item, action }
      )
    );
    toast.success(`Set all eligible students to "${ACTION_CONFIG[action]?.label}"`);
  };

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      setStep('confirm');
      const res = await api.post('/promotions/confirm', {
        sourceAcademicYearId: activeYear._id,
        destinationAcademicYearId: id,
        previewData
      });
      setConfirmedResult(res.data.data);
      setStep('done');
      toast.success('🎉 Student promotion completed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process promotion. Please try again.');
      setStep('preview');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Computed values ---
  const stats = useMemo(() => {
    const counts = { promote: 0, graduate: 0, repeat: 0, transfer: 0, exclude: 0 };
    previewData.forEach(item => {
      if (counts[item.action] !== undefined) counts[item.action]++;
    });
    return counts;
  }, [previewData]);

  const uniqueClasses = useMemo(() => {
    const classes = [...new Set(previewData.map(item => item.fromClassName))].filter(Boolean);
    return classes.sort();
  }, [previewData]);

  const filteredData = useMemo(() => {
    return previewData.filter(item => {
      const matchesSearch =
        !searchQuery ||
        item.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAction = filterAction === 'all' || item.action === filterAction;
      const matchesClass = filterClass === 'all' || item.fromClassName === filterClass;
      return matchesSearch && matchesAction && matchesClass;
    });
  }, [previewData, searchQuery, filterAction, filterClass]);

  const hasBlockingErrors = previewData.some(
    p => p.errorDetails && p.action === 'promote' && !p.toClassId
  );

  // --- Done Screen ---
  if (step === 'done' && confirmedResult) {
    const summary = confirmedResult.summary;
    return (
      <Layout role="principal">
        <div className="max-w-2xl mx-auto space-y-6 py-8">
          <div className="bg-white rounded-3xl shadow-soft p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Promotion Complete!</h2>
              <p className="text-gray-500 mt-1">
                {activeYear?.name} → {destYear?.name}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 rounded-2xl p-4">
                <p className="text-3xl font-bold text-green-600">{summary.totalPromoted}</p>
                <p className="text-sm text-green-700 font-medium">Promoted</p>
              </div>
              <div className="bg-purple-50 rounded-2xl p-4">
                <p className="text-3xl font-bold text-purple-600">{summary.totalGraduated}</p>
                <p className="text-sm text-purple-700 font-medium">Graduated</p>
              </div>
              <div className="bg-orange-50 rounded-2xl p-4">
                <p className="text-3xl font-bold text-orange-600">{summary.totalRepeating}</p>
                <p className="text-sm text-orange-700 font-medium">Repeating</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 rounded-2xl p-3">
                <p className="text-2xl font-bold text-blue-600">{summary.totalTransferred}</p>
                <p className="text-xs text-blue-700 font-medium">Transferred</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-3">
                <p className="text-2xl font-bold text-gray-600">{summary.totalExcluded}</p>
                <p className="text-xs text-gray-700 font-medium">Excluded</p>
              </div>
              <div className="bg-red-50 rounded-2xl p-3">
                <p className="text-2xl font-bold text-red-600">{summary.totalErrors}</p>
                <p className="text-xs text-red-700 font-medium">Errors</p>
              </div>
            </div>

            {summary.totalErrors > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-left">
                <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {summary.totalErrors} student(s) had processing errors
                </p>
                <p className="text-xs text-red-600 mt-1">
                  These students were not promoted. Please review and process them manually.
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => navigate('/principal/academic-years')}
                className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition"
              >
                Back to Academic Years
              </button>
              <button
                onClick={() => navigate('/principal/students')}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
              >
                View Students
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="principal">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/principal/academic-years')}
              className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-500"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Student Promotion</h2>
              {activeYear && destYear && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                  <span className="font-medium text-primary">{activeYear.name}</span>
                  <span>→</span>
                  <span className="font-medium text-blue-600">{destYear.name}</span>
                </p>
              )}
            </div>
          </div>

          {!loading && previewData.length > 0 && step === 'preview' && (
            <div className="flex items-center gap-3">
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition text-sm">
                  <Users size={16} />
                  Bulk Action
                  <ChevronDown size={14} />
                </button>
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-10 hidden group-hover:block">
                  {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => handleBulkAction(key)}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 flex items-center gap-2 ${cfg.color} first:rounded-t-xl last:rounded-b-xl`}
                    >
                      <cfg.icon size={14} />
                      Set All to {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  if (!window.confirm(
                    `You are about to promote ${previewData.length} students from "${activeYear?.name}" to "${destYear?.name}". This action cannot be undone. Continue?`
                  )) return;
                  handleConfirm();
                }}
                disabled={submitting || hasBlockingErrors}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md"
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Processing...</>
                ) : (
                  <><Award size={16} /> Confirm Promotion</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Processing Spinner */}
        {step === 'confirm' && (
          <div className="bg-white rounded-2xl shadow-soft p-12 text-center">
            <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800">Processing Promotions...</h3>
            <p className="text-gray-500 text-sm mt-1">Please wait while students are being promoted.</p>
          </div>
        )}

        {step === 'preview' && (
          <>
            {/* Loading State */}
            {loading ? (
              <div className="bg-white rounded-2xl shadow-soft p-16 text-center">
                <Loader2 size={40} className="animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Generating promotion preview...</p>
                <p className="text-gray-400 text-sm mt-1">Analyzing enrollments and class mappings</p>
              </div>
            ) : previewData.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-soft p-16 text-center">
                <Users size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700">No Students to Promote</h3>
                <p className="text-gray-400 text-sm mt-2 max-w-sm mx-auto">
                  No active enrollments found in the current academic year. Make sure students are enrolled first.
                </p>
                <button
                  onClick={() => navigate('/principal/academic-years')}
                  className="mt-6 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition"
                >
                  Back to Academic Years
                </button>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <StatCard icon={TrendingUp} label="To Promote" count={stats.promote} color="text-green-700" bg="bg-green-50" />
                  <StatCard icon={GraduationCap} label="Graduate" count={stats.graduate} color="text-purple-700" bg="bg-purple-50" />
                  <StatCard icon={RefreshCw} label="Repeat Year" count={stats.repeat} color="text-orange-700" bg="bg-orange-50" />
                  <StatCard icon={ArrowRightLeft} label="Transfer" count={stats.transfer} color="text-blue-700" bg="bg-blue-50" />
                  <StatCard icon={MinusCircle} label="Exclude" count={stats.exclude} color="text-red-700" bg="bg-red-50" />
                </div>

                {/* Warning for blocking errors */}
                {hasBlockingErrors && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
                    <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-800 text-sm">Action Required Before Confirming</p>
                      <p className="text-amber-700 text-sm mt-0.5">
                        Some students have promotion errors (destination class not found). 
                        Please change their action to <strong>Exclude</strong>, <strong>Repeat</strong>, or <strong>Transfer</strong>, or create the missing classes first.
                      </p>
                    </div>
                  </div>
                )}

                {/* Table Card */}
                <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
                  {/* Table Header with filters */}
                  <div className="p-4 border-b border-gray-100 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Search */}
                      <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search students by name, email or roll no..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        />
                      </div>

                      {/* Action filter */}
                      <select
                        value={filterAction}
                        onChange={e => setFilterAction(e.target.value)}
                        className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none min-w-[140px]"
                      >
                        <option value="all">All Actions ({previewData.length})</option>
                        {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
                          <option key={key} value={key}>
                            {cfg.label} ({stats[key]})
                          </option>
                        ))}
                      </select>

                      {/* Class filter */}
                      <select
                        value={filterClass}
                        onChange={e => setFilterClass(e.target.value)}
                        className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none min-w-[160px]"
                      >
                        <option value="all">All Classes</option>
                        {uniqueClasses.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>

                    {filteredData.length !== previewData.length && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Filter size={12} />
                        Showing {filteredData.length} of {previewData.length} students
                      </p>
                    )}
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 font-medium">#</th>
                          <th className="px-4 py-3 font-medium">Student</th>
                          <th className="px-4 py-3 font-medium">Current Class</th>
                          <th className="px-4 py-3 font-medium">Next Class</th>
                          <th className="px-4 py-3 font-medium">Action</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredData.map((item, idx) => {
                          const cfg = ACTION_CONFIG[item.action] || ACTION_CONFIG.exclude;
                          return (
                            <tr
                              key={item.studentId}
                              className={`hover:bg-gray-50/60 transition group ${item.errorDetails ? 'bg-red-50/30' : ''}`}
                            >
                              <td className="px-4 py-3 text-gray-400 text-xs font-mono">{idx + 1}</td>

                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-green-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {item.studentName?.charAt(0)?.toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-800 text-sm">{item.studentName}</p>
                                    <p className="text-xs text-gray-400">{item.email}</p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-3">
                                <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                                  {item.fromClassName}
                                </span>
                              </td>

                              <td className="px-4 py-3">
                                {item.toClassName ? (
                                  <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                                    {item.toClassName}
                                  </span>
                                ) : item.action === 'graduate' ? (
                                  <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 w-fit">
                                    <GraduationCap size={12} /> Graduated
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs italic">—</span>
                                )}
                              </td>

                              <td className="px-4 py-3">
                                <select
                                  value={item.action}
                                  onChange={e => handleActionChange(item.studentId, e.target.value)}
                                  className={`border rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-2 focus:ring-primary outline-none ${cfg.badge} ${cfg.border} cursor-pointer`}
                                >
                                  <option value="promote">⬆ Promote</option>
                                  <option value="graduate">🎓 Graduate</option>
                                  <option value="repeat">🔄 Repeat Year</option>
                                  <option value="transfer">↔ Transfer Out</option>
                                  <option value="exclude">✕ Exclude</option>
                                </select>
                              </td>

                              <td className="px-4 py-3">
                                {item.errorDetails ? (
                                  <div className="flex items-start gap-1.5 max-w-[220px]">
                                    <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-xs text-amber-700 leading-tight">{item.errorDetails}</span>
                                  </div>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                                    <CheckCircle2 size={14} />
                                    Ready
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}

                        {filteredData.length === 0 && (
                          <tr>
                            <td colSpan="6" className="py-12 text-center text-gray-400">
                              <Search size={32} className="mx-auto mb-3 opacity-40" />
                              <p className="font-medium">No students match your filters</p>
                              <button
                                onClick={() => { setSearchQuery(''); setFilterAction('all'); setFilterClass('all'); }}
                                className="text-primary text-sm mt-2 hover:underline"
                              >
                                Clear filters
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
                        Promote: {stats.promote}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
                        Graduate: {stats.graduate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
                        Repeat: {stats.repeat}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (!window.confirm(
                          `You are about to promote ${previewData.length} students from "${activeYear?.name}" to "${destYear?.name}". This action cannot be undone. Continue?`
                        )) return;
                        handleConfirm();
                      }}
                      disabled={submitting || hasBlockingErrors}
                      className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md"
                    >
                      {submitting ? (
                        <><Loader2 size={16} className="animate-spin" /> Processing...</>
                      ) : (
                        <><Award size={16} /> Confirm Promotion ({previewData.filter(p => p.action !== 'exclude').length} students)</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-start">
                  <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700 space-y-1">
                    <p className="font-semibold">How Promotion Works</p>
                    <ul className="space-y-0.5 text-blue-600 text-xs">
                      <li>• <strong>Promote</strong> — Student moves to the next class in {destYear?.name}</li>
                      <li>• <strong>Graduate</strong> — Student completes school (final standard). No new enrollment created.</li>
                      <li>• <strong>Repeat Year</strong> — Student stays in the same class next year</li>
                      <li>• <strong>Transfer Out</strong> — Student leaves the school. Not enrolled next year.</li>
                      <li>• <strong>Exclude</strong> — Skip this student. No enrollment created.</li>
                    </ul>
                    <p className="text-xs text-blue-500 pt-1">
                      After confirming, activate the new academic year from Academic Years page to update class rosters.
                    </p>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default PrincipalPromotionPreview;
