import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import api from '../utils/api';

const StudentTestDetails = () => {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [submissionData, setSubmissionData] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [testRes, subRes] = await Promise.all([
          api.get(`/tests/${id}`),
          api.get('/tests/student/history')
        ]);
        setTest(testRes.data.data);
        const currentSubmission = subRes.data.data.find(sub => sub.testId === id);
        if (currentSubmission) {
          setSubmissionStatus(currentSubmission.status);
          setSubmissionData(currentSubmission);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load test');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleFinishClick = () => {
    setShowConfirm(true);
  };

  const confirmFinish = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      await api.post(`/tests/${id}/submit`);
      setSubmissionStatus('submitted');
      setSuccess('Your teacher has been notified that you are ready.');
      setShowConfirm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Layout><div className="p-8 text-center text-gray-500">Loading details...</div></Layout>;
  if (error && !test) return <Layout><div className="p-8 text-center text-red-500">{error}</div></Layout>;

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800 font-bold">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Test Details</h1>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-4">
            {submissionStatus === 'submitted' && <span className="bg-blue-100 text-blue-800 px-4 py-1.5 rounded-full font-semibold text-sm">Ready for Test</span>}
            {submissionStatus === 'graded' && <span className="bg-green-100 text-green-800 px-4 py-1.5 rounded-full font-semibold text-sm">Graded</span>}
            {!submissionStatus && <span className="bg-gray-100 text-gray-800 px-4 py-1.5 rounded-full font-semibold text-sm">Assigned</span>}
          </div>

          <h2 className="text-3xl font-bold mb-2 text-gray-900">{test.title}</h2>
          <h3 className="text-lg text-primary font-semibold mb-6">{test.subjectId?.name}</h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-6 pb-6 border-b">
            <div>
              <p className="mb-2">Class: <span className="font-semibold text-gray-800">{test.classId?.className}</span></p>
              <p>Teacher: <span className="font-semibold text-gray-800">{test.teacherId?.name}</span></p>
            </div>
            <div className="text-right">
              <p className="mb-2">Test Date: <span className="font-semibold text-red-600">{new Date(test.testDate).toLocaleString()}</span></p>
              <p className="mb-2">Duration: <span className="font-semibold text-gray-800">{test.durationMinutes ? `${test.durationMinutes} mins` : '-'}</span></p>
              <p>Max Marks: <span className="font-semibold text-gray-800">{test.maxMarks || '-'}</span></p>
            </div>
          </div>
          
          <div className="mb-8 space-y-6">
            {test.description && (
              <div>
                <h4 className="font-bold mb-2 text-gray-800 text-lg">Description / Instructions</h4>
                <p className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-xl">{test.description}</p>
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-100 pt-8">
            {success && <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6">{success}</div>}
            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">{error}</div>}
            
            {submissionStatus === 'submitted' ? (
              <div className="bg-blue-50 p-6 rounded-xl text-center border border-blue-200">
                <h3 className="text-blue-800 font-bold text-lg mb-2">You are ready!</h3>
                <p className="text-blue-700">Your teacher has been notified and will enter your marks after the test.</p>
              </div>
            ) : submissionStatus === 'graded' ? (
              <div className="bg-green-50 p-6 rounded-xl text-center border border-green-200">
                <h3 className="text-green-800 font-bold text-lg mb-2">Test Graded!</h3>
                <div className="flex flex-col items-center justify-center mb-4 mt-4">
                  <div className="w-24 h-24 rounded-full bg-white border-4 border-green-400 flex flex-col items-center justify-center shadow-sm">
                    <span className="text-3xl font-extrabold text-green-600">{submissionData?.marks !== undefined ? submissionData.marks : '-'}</span>
                  </div>
                  <span className="text-gray-500 font-semibold mt-2">out of {test.maxMarks || '-'}</span>
                </div>
                {submissionData?.feedback && (
                  <div className="mt-4 p-4 bg-white rounded-lg text-left shadow-sm inline-block max-w-lg w-full">
                    <p className="text-sm font-semibold text-gray-500 mb-1">Teacher Feedback:</p>
                    <p className="text-gray-800">{submissionData.feedback}</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {!showConfirm ? (
                  <button 
                    onClick={handleFinishClick} 
                    className="bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-primary-dark transition text-lg w-full md:w-auto shadow-md hover:shadow-lg"
                  >
                    I'm Ready
                  </button>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-lg text-gray-800 mb-4">Are you ready to take this test?</h4>
                    <p className="text-gray-600 mb-6">By clicking Yes, your teacher will be notified that you are ready.</p>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setShowConfirm(false)}
                        disabled={submitting}
                        className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={confirmFinish}
                        disabled={submitting}
                        className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2 shadow-md transition"
                      >
                        {submitting ? 'Sending...' : "Yes, I'm Ready"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentTestDetails;
