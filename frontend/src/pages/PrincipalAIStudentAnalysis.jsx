import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Sparkles, ArrowLeft, Loader2, BookOpen, Calendar, FileText, Activity, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const InfoCard = ({ title, icon: Icon, children }) => (
  <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-5 rounded-2xl shadow-soft h-full flex flex-col hover:-translate-y-1 transition duration-300">
    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
      <Icon className="w-5 h-5 text-primary" />
      {title}
    </h3>
    <div className="flex-1 flex flex-col justify-center">
      {children}
    </div>
  </div>
);

const PrincipalAIStudentAnalysis = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/principal/ai/student/${studentId}`);
      setStudentData(res.data.data);
    } catch (err) {
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      const res = await api.post(`/principal/ai/student/${studentId}/analyze`);
      setAiAnalysis(res.data.data);
      toast.success('AI Analysis generated successfully');
    } catch (err) {
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Failed to generate AI analysis');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full min-h-[500px]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!studentData) {
    return (
      <Layout>
        <div className="p-12 text-center text-gray-500">
          <p>Student not found.</p>
          <button onClick={() => navigate('/principal/ai-dashboard')} className="mt-4 text-primary font-semibold hover:underline">
            Return to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <button 
            onClick={() => navigate('/principal/ai-dashboard')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-semibold transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Directory
          </button>
          
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-1 transition disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {analyzing ? 'Generating Insights...' : 'Generate AI Analysis'}
          </button>
        </div>

        {/* Student Profile & Quick Stats */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-soft p-6 flex flex-col md:flex-row items-center gap-6">
          <img 
            src={studentData.profile.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.profile.name)}&background=random&size=128`} 
            alt={studentData.profile.name} 
            className="w-24 h-24 rounded-full border-4 border-indigo-50 shadow-md"
          />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-800">{studentData.profile.name}</h1>
            <p className="text-gray-500 font-medium mt-1">Admission: {studentData.profile.admissionNumber} • {studentData.profile.classSection}</p>
          </div>
        </div>

        {/* Data Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoCard title="Academic Performance" icon={BookOpen}>
            {studentData.academic.subjectAverages.length > 0 ? (
              <div className="space-y-3">
                {studentData.academic.subjectAverages.map((sub, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">{sub.subject}</span>
                    <span className={`font-bold ${sub.average >= 75 ? 'text-green-600' : sub.average < 40 ? 'text-red-600' : 'text-orange-500'}`}>
                      {sub.average}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center">No exam data available</p>
            )}
          </InfoCard>

          <InfoCard title="Attendance Summary" icon={Calendar}>
            <div className="text-center space-y-4">
              <div className="text-4xl font-black text-gray-800">
                {studentData.attendance.percentage}%
              </div>
              <div className="flex justify-around text-sm border-t border-gray-100 pt-4">
                <div>
                  <p className="text-gray-400 font-semibold mb-1">Total Days</p>
                  <p className="font-bold text-gray-700">{studentData.attendance.totalWorkingDays}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold mb-1">Present</p>
                  <p className="font-bold text-green-600">{studentData.attendance.daysPresent}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold mb-1">Absent</p>
                  <p className="font-bold text-red-600">{studentData.attendance.daysAbsent}</p>
                </div>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Homework Completion" icon={FileText}>
            <div className="text-center space-y-4">
              <div className="text-4xl font-black text-gray-800">
                {studentData.homework.percentage}%
              </div>
              <div className="flex justify-around text-sm border-t border-gray-100 pt-4">
                <div>
                  <p className="text-gray-400 font-semibold mb-1">Assigned</p>
                  <p className="font-bold text-gray-700">{studentData.homework.assigned}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold mb-1">Submitted</p>
                  <p className="font-bold text-blue-600">{studentData.homework.submitted}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold mb-1">Pending</p>
                  <p className="font-bold text-orange-500">{studentData.homework.pending}</p>
                </div>
              </div>
            </div>
          </InfoCard>
        </div>

        {/* AI Analysis Result */}
        {aiAnalysis && (
          <div className="bg-gradient-to-b from-indigo-50 to-white border border-indigo-100 rounded-2xl p-8 shadow-soft">
            <h2 className="text-2xl font-bold text-indigo-900 mb-6 flex items-center gap-2 border-b border-indigo-100 pb-4">
              <Sparkles className="w-6 h-6 text-indigo-500" />
              AI Student Intelligence Report
            </h2>
            <div className="prose prose-indigo max-w-none text-gray-700">
              {/* Safely render markdown-like text */}
              <div className="whitespace-pre-wrap font-medium leading-relaxed">
                {aiAnalysis}
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-orange-50 border border-orange-100 rounded-xl flex gap-3 text-orange-800 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 text-orange-500" />
              <p>
                <strong>Disclaimer:</strong> This analysis is generated by AI based on recorded academic data. 
                It is intended as a supplementary tool for principals and educators, not as a definitive judgment 
                of a student's potential.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PrincipalAIStudentAnalysis;
