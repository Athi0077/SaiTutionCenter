import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Sparkles, FileText, Download, Loader2, ArrowLeft, CheckCircle, Save, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const PrincipalAIReports = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [reportType, setReportType] = useState('Individual Academic');
  
  const [reportData, setReportData] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [improvementPlan, setImprovementPlan] = useState(null);
  
  const [loadingData, setLoadingData] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [approving, setApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  
  const reportRef = useRef(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/principal/ai-reports/students');
      setStudents(res.data.data);
    } catch (err) {
      toast.error('Failed to load students for reports');
    }
  };

  const handleFetchData = async () => {
    if (!selectedStudentId) return toast.error("Please select a student");
    setLoadingData(true);
    setAiSummary(null);
    setImprovementPlan(null);
    setIsApproved(false);
    try {
      const res = await api.get(`/principal/ai-reports/student/${selectedStudentId}/data`);
      setReportData(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch student data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!reportData) return;
    setGeneratingSummary(true);
    try {
      const res = await api.post(`/principal/ai-reports/student/${selectedStudentId}/generate`, { reportData });
      setAiSummary(res.data.data);
      toast.success('AI Summary Generated');
    } catch (err) {
      toast.error('Failed to generate AI Summary');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!reportData) return;
    setGeneratingPlan(true);
    try {
      const res = await api.post(`/principal/ai-reports/student/${selectedStudentId}/improvement-plan`, { reportData });
      setImprovementPlan(res.data.data);
      toast.success('Personalized Improvement Plan Generated');
    } catch (err) {
      toast.error('Failed to generate Improvement Plan');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      await api.post('/principal/ai-reports/approve', {
        studentId: selectedStudentId,
        reportType,
        academicPeriod: 'Current Term',
        verifiedMetrics: reportData,
        aiInsights: `SUMMARY:\n${aiSummary || 'N/A'}\n\nPLAN:\n${improvementPlan || 'N/A'}`
      });
      setIsApproved(true);
      toast.success('Report Approved and Saved');
    } catch (err) {
      toast.error('Failed to approve report');
    } finally {
      setApproving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      toast.loading('Generating PDF...', { id: 'pdf' });
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Student_Report_${reportData?.profile?.name || 'Academic'}.pdf`);
      toast.success('PDF Downloaded successfully!', { id: 'pdf' });
    } catch (err) {
      toast.error('Failed to generate PDF', { id: 'pdf' });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden shadow-lg">
          <div className="z-10 relative text-white">
            <button onClick={() => navigate('/principal/ai-dashboard')} className="flex items-center gap-2 text-blue-100 hover:text-white mb-4 transition font-semibold text-sm">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <FileText className="w-8 h-8 text-yellow-300" />
              AI Student Reports
            </h1>
            <p className="text-blue-100 max-w-lg text-sm">Generate comprehensive, data-backed academic reports and personalized AI improvement plans.</p>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-soft flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-gray-700 text-sm font-bold mb-2">Select Student</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="">-- Select a Student --</option>
              {students.map(s => (
                <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>
              ))}
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-gray-700 text-sm font-bold mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="Individual Academic">Individual Academic Report</option>
              <option value="Personalized Improvement Plan">Personalized Improvement Plan</option>
            </select>
          </div>
          <button 
            onClick={handleFetchData}
            disabled={!selectedStudentId || loadingData}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingData ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            Fetch Data
          </button>
        </div>

        {/* Report Preview */}
        {reportData && (
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* AI Generation Sidebar */}
            <div className="w-full lg:w-1/3 space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" /> AI Insights
                </h3>
                <p className="text-sm text-indigo-700/80 mb-4">Generate an evidence-based summary based on the fetched metrics.</p>
                <button
                  onClick={handleGenerateSummary}
                  disabled={generatingSummary}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm mb-3"
                >
                  {generatingSummary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate AI Summary
                </button>
                <button
                  onClick={handleGeneratePlan}
                  disabled={generatingPlan}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {generatingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                  Generate Improvement Plan
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4">Report Actions</h3>
                <button
                  onClick={handleApprove}
                  disabled={approving || isApproved}
                  className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 mb-3 ${isApproved ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-green-600 hover:bg-green-700 text-white shadow-md'}`}
                >
                  {approving ? <Loader2 className="w-5 h-5 animate-spin" /> : isApproved ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                  {isApproved ? 'Approved & Saved' : 'Approve Report'}
                </button>
                
                <button
                  onClick={handleDownloadPDF}
                  disabled={!isApproved}
                  className="w-full py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                  title={!isApproved ? "You must approve the report first" : ""}
                >
                  <Download className="w-5 h-5" /> Download PDF
                </button>
              </div>
            </div>

            {/* Document Preview (To be captured by html2canvas) */}
            <div className="w-full lg:w-2/3 bg-white border border-gray-200 rounded-sm shadow-xl p-8 md:p-12" ref={reportRef}>
              
              {/* Report Header */}
              <div className="text-center border-b-2 border-gray-800 pb-6 mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">StudyMate Academy</h1>
                <h2 className="text-xl font-bold text-gray-600 mt-1">{reportType}</h2>
                <p className="text-sm text-gray-500 mt-2 font-medium">Academic Year: {new Date().getFullYear()} • Term: Current</p>
                <p className="text-xs text-gray-400 mt-1">Generated: {new Date().toLocaleDateString()}</p>
              </div>

              {/* Student Info */}
              <div className="flex items-center gap-6 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                {reportData.profile.profilePhoto ? (
                  <img src={reportData.profile.profilePhoto} alt="Student" className="w-20 h-20 rounded-full border-2 border-gray-300" />
                ) : (
                  <div className="w-20 h-20 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-indigo-200">
                    {reportData.profile.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{reportData.profile.name}</h3>
                  <div className="text-sm font-semibold text-gray-600 mt-1 grid grid-cols-2 gap-x-8 gap-y-1">
                    <p>Admission No: <span className="text-gray-900">{reportData.profile.studentId}</span></p>
                    <p>Class: <span className="text-gray-900">{reportData.profile.classSection || 'N/A'}</span></p>
                  </div>
                </div>
              </div>

              {/* Academic Performance */}
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Verified Academic Performance</h4>
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="p-3 border border-gray-200 font-bold">Subject</th>
                      <th className="p-3 border border-gray-200 font-bold text-center">Marks Obtained</th>
                      <th className="p-3 border border-gray-200 font-bold text-center">Maximum Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.academic.subjectMarks.length > 0 ? (
                      reportData.academic.subjectMarks.map((sm, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="p-3 border border-gray-200 font-medium text-gray-800">{sm.subject}</td>
                          <td className="p-3 border border-gray-200 text-center font-bold">{sm.marks}</td>
                          <td className="p-3 border border-gray-200 text-center text-gray-600">{sm.maxMarks}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="p-4 text-center text-gray-500 italic border border-gray-200">No exam records found.</td>
                      </tr>
                    )}
                  </tbody>
                  {reportData.academic.subjectMarks.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50 font-bold text-gray-800">
                        <td className="p-3 border border-gray-200 text-right">OVERALL PERCENTAGE:</td>
                        <td colSpan="2" className="p-3 border border-gray-200 text-center text-lg text-indigo-700">
                          {reportData.academic.overallPercentage}%
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Attendance & Homework */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-3">Attendance Summary</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-600 mb-1">Total Days: <strong className="text-gray-900">{reportData.attendance.totalDays}</strong></p>
                    <p className="text-sm text-gray-600 mb-1">Days Present: <strong className="text-green-600">{reportData.attendance.present}</strong></p>
                    <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">
                      Attendance Rate: <strong className="text-lg text-gray-900">{reportData.attendance.percentage}%</strong>
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-3">Homework Completion</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-600 mb-1">Total Submissions: <strong className="text-indigo-600">{reportData.homework.submitted}</strong></p>
                    <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200 italic">Based on recorded digital submissions</p>
                  </div>
                </div>
              </div>

              {/* AI Sections */}
              {(aiSummary || improvementPlan) && (
                <div className="mb-8 p-6 bg-indigo-50/50 border border-indigo-100 rounded-xl relative">
                  <div className="absolute top-0 right-0 bg-indigo-200 text-indigo-800 text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-xl uppercase">AI Assisted</div>
                  
                  {aiSummary && (
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-indigo-900 mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" /> Academic Summary
                      </h4>
                      <div className="prose prose-sm text-gray-700 whitespace-pre-wrap">{aiSummary}</div>
                    </div>
                  )}

                  {improvementPlan && (
                    <div>
                      <h4 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2 pt-4 border-t border-indigo-100">
                        <Target className="w-5 h-5 text-purple-500" /> Personalized Improvement Plan
                      </h4>
                      <div className="prose prose-sm text-gray-700 whitespace-pre-wrap">{improvementPlan}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="mt-16 pt-8 border-t border-gray-200 flex justify-between items-end text-sm text-gray-500">
                <div>
                  <p>_______________________</p>
                  <p className="mt-2 font-medium">Principal Signature</p>
                </div>
                {isApproved && (
                  <div className="text-right">
                    <p className="text-green-600 font-bold flex items-center justify-end gap-1"><CheckCircle className="w-4 h-4" /> Officially Approved</p>
                    <p className="text-xs mt-1">Ref: {selectedStudentId.substring(0,8).toUpperCase()}</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PrincipalAIReports;
