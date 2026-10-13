import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const TeacherTestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Grading Modal State
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [testRes, subRes] = await Promise.all([
          api.get(`/tests/${id}`),
          api.get('/tests/submissions/approvals')
        ]);
        setTest(testRes.data.data);
        // Filter submissions for this specific test
        const filteredSubmissions = subRes.data.data.filter(sub => sub.testId?._id === id);
        setSubmissions(filteredSubmissions);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load test details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleReview = async (e) => {
    e.preventDefault();
    if (marks === '') return;
    
    setSubmitting(true);
    try {
      await api.patch(`/tests/submissions/${selectedSubmission._id}/review`, {
        marks: Number(marks),
        feedback
      });
      
      toast.success('Marks saved successfully');
      
      // Update local state
      setSubmissions(submissions.map(a => {
        if (a._id === selectedSubmission._id) {
          return { ...a, status: 'graded', marks: Number(marks), feedback };
        }
        return a;
      }));
      
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit marks');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setSelectedSubmission(null);
    setMarks('');
    setFeedback('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'submitted':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Ready</span>;
      case 'graded':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Graded</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  if (loading) return <Layout><div className="p-8 text-center text-gray-500">Loading details...</div></Layout>;
  if (error && !test) return <Layout><div className="p-8 text-center text-red-500">{error}</div></Layout>;

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/teacher/tests')} className="text-gray-500 hover:text-gray-800 font-bold">
            ← Back to Tests
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Test Grading</h1>
        </div>

        {/* Test Info Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-3xl font-bold mb-2 text-gray-900">{test.title}</h2>
          <h3 className="text-lg text-primary font-semibold mb-6">{test.subjectId?.name}</h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <p className="mb-2">Class: <span className="font-semibold text-gray-800">{test.classId?.className}</span></p>
              <p className="mb-2">Total Students: <span className="font-semibold text-gray-800">{test.classId?.students?.length || 0}</span></p>
              <p>Ready to Grade: <span className="font-semibold text-blue-600">{submissions.filter(s => s.status === 'submitted').length}</span></p>
            </div>
            <div className="text-right">
              <p className="mb-2">Test Date: <span className="font-semibold text-red-600">{new Date(test.testDate).toLocaleString()}</span></p>
              <p className="mb-2">Duration: <span className="font-semibold text-gray-800">{test.durationMinutes ? `${test.durationMinutes} mins` : '-'}</span></p>
              <p>Max Marks: <span className="font-semibold text-gray-800">{test.maxMarks || '-'}</span></p>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <h3 className="text-xl font-bold text-gray-800 mb-4">Student Submissions</h3>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {submissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No students are ready for grading yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr>
                    <th className="p-4 font-semibold">Student Name</th>
                    <th className="p-4 font-semibold">Submitted At</th>
                    <th className="p-4 font-semibold">Marks</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.map(sub => (
                    <tr key={sub._id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-medium text-gray-800">{sub.studentId?.name}</td>
                      <td className="p-4 text-gray-500 text-sm">{new Date(sub.submittedAt).toLocaleString()}</td>
                      <td className="p-4 font-bold text-gray-800">{sub.marks !== undefined && sub.marks !== null ? `${sub.marks} / ${test.maxMarks || '-'}` : '-'}</td>
                      <td className="p-4">{getStatusBadge(sub.status)}</td>
                      <td className="p-4">
                        <button
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setMarks(sub.marks !== undefined ? sub.marks : '');
                            setFeedback(sub.feedback || '');
                          }}
                          className="text-primary hover:bg-blue-50 px-4 py-1.5 rounded transition border border-primary font-semibold"
                        >
                          Grade
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Grading Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Grade Student</h3>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-2xl">
                  &times;
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl mb-6">
                <p className="text-sm text-gray-500">Student Name</p>
                <p className="font-bold text-lg mb-2 text-gray-800">{selectedSubmission.studentId?.name}</p>
                <p className="text-sm text-gray-500">Max Marks Allowed</p>
                <p className="font-semibold text-gray-800">{test.maxMarks || 'N/A'}</p>
              </div>

              <form onSubmit={handleReview}>
                <div className="mb-4">
                  <label className="block font-semibold mb-2 text-gray-700">Marks Earned</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    max={test.maxMarks || 100}
                    value={marks} 
                    onChange={(e) => setMarks(e.target.value)} 
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-primary focus:ring-0 focus:outline-none transition text-lg font-semibold text-gray-800"
                    placeholder={`Enter marks...`}
                  />
                </div>

                <div className="mb-6">
                  <label className="block font-semibold mb-2 text-gray-700">Feedback (Optional)</label>
                  <textarea 
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-primary focus:ring-0 focus:outline-none transition"
                    rows="3"
                    placeholder="Enter any feedback for the student..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  ></textarea>
                </div>

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition">
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={marks === '' || submitting}
                    className={`flex-1 px-4 py-3 font-bold text-white rounded-xl transition ${marks === '' || submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark shadow-md'}`}
                  >
                    {submitting ? 'Saving...' : 'Save Marks'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherTestDetails;
