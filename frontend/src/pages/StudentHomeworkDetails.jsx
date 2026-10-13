import Layout from '../components/layout/Layout';
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ChatRoom from '../components/common/ChatRoom';

const StudentHomeworkDetails = () => {
  const { id } = useParams();
  const [homework, setHomework] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answerText, setAnswerText] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [hwRes, subRes] = await Promise.all([
          api.get(`/homework/${id}`),
          api.get('/submissions/history') // fetch all submissions to see if submitted
        ]);
        setHomework(hwRes.data.data);
        const currentSubmission = subRes.data.data.find(sub => sub.homeworkId._id === id);
        if (currentSubmission) {
          setSubmissionStatus(currentSubmission.status);
          setFeedback(currentSubmission.feedback);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load homework');
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
      const formData = new FormData();
      if (answerText) formData.append('answerText', answerText);
      
      const res = await api.post(`/homework/${id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmissionStatus('pending_approval');
      setSuccess('Your completion request has been sent to your teacher.');
      setShowConfirm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600 font-bold">{error}</div>;
  if (!homework) return null;

  return (
    <Layout>
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link to="/student/homework" className="text-blue-600 hover:underline">&larr; Back to Homework</Link>
      </div>

      <div className="bg-white p-8 rounded shadow border-t-4 border-blue-600 mb-6">
        {/* Status Badge at the Top */}
        <div className="mb-4">
          {submissionStatus === 'pending_approval' && <span className="bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full font-semibold text-sm">Approval Pending</span>}
          {submissionStatus === 'approved' && <span className="bg-green-100 text-green-800 px-4 py-1.5 rounded-full font-semibold text-sm">Completed</span>}
          {submissionStatus === 'revision_required' && <span className="bg-red-100 text-red-800 px-4 py-1.5 rounded-full font-semibold text-sm">Revision Required</span>}
          {!submissionStatus && <span className="bg-gray-100 text-gray-800 px-4 py-1.5 rounded-full font-semibold text-sm">Assigned</span>}
        </div>

        <h2 className="text-3xl font-bold mb-2">{homework.subjectId?.name}</h2>
        <h3 className="text-xl text-gray-700 font-semibold mb-6">{homework.title}</h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-6 pb-6 border-b">
          <div>
            <p>Class: <span className="font-semibold">{homework.classId?.className}</span></p>
            <p>Teacher: <span className="font-semibold">{homework.teacherId?.name}</span></p>
          </div>
          <div className="text-right">
            <p>Due: <span className="font-semibold">{new Date(homework.dueDate).toLocaleString()}</span></p>
            <p>Priority: <span className="font-semibold capitalize">{homework.priority}</span></p>
          </div>
        </div>
        
        <div className="mb-8">
          <h4 className="font-bold mb-2 text-gray-800">Description</h4>
          <p className="whitespace-pre-wrap text-gray-700">{homework.description}</p>
        </div>
        
        {/* Chat Room */}
        <div className="mb-8">
          <ChatRoom entityType="homework" entityId={homework._id} />
        </div>
        
        <div className="border-t pt-6">
          {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
          
          {submissionStatus === 'pending_approval' ? (
            <div className="bg-amber-50 p-6 rounded-xl text-center border border-amber-200">
              <h3 className="text-amber-800 font-bold text-lg">Waiting for Teacher Approval</h3>
              <p className="text-amber-700 mt-2">Your completion request has been sent.</p>
            </div>
          ) : submissionStatus === 'approved' ? (
            <div className="bg-green-50 p-6 rounded-xl text-center border border-green-200">
              <h3 className="text-green-800 font-bold text-lg">Homework Approved!</h3>
              <p className="text-green-700 mt-2">Your teacher has marked this homework as completed.</p>
            </div>
          ) : (
            <div>
              {submissionStatus === 'revision_required' && (
                <div className="bg-red-50 p-4 rounded-xl text-center border border-red-200 mb-4">
                  <h3 className="text-red-800 font-bold">Revision Required</h3>
                  <p className="text-red-700 mt-1">Your teacher has asked you to correct or finish your work. Once done, you can submit a new completion request.</p>
                  {feedback && (
                    <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-lg text-left inline-block w-full text-red-900 border border-red-100">
                      <strong>Teacher's Feedback:</strong>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{feedback}</p>
                    </div>
                  )}
                </div>
              )}
              
              {!showConfirm ? (
                <button 
                  onClick={handleFinishClick} 
                  className="bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-primary-dark transition text-lg w-full md:w-auto"
                >
                  I'm Finished
                </button>
              ) : (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="font-bold text-lg text-gray-800 mb-4">Submit Homework</h4>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Message / Answer (Optional)</label>
                    <textarea 
                      className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                      rows="3"
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Type your answer or a note to the teacher..."
                    />
                  </div>
                  

                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowConfirm(false)}
                      disabled={submitting}
                      className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={confirmFinish}
                      disabled={submitting}
                      className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
                    >
                      {submitting ? 'Sending...' : "Yes, I'm Finished"}
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

export default StudentHomeworkDetails;
