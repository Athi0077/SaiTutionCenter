import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

const TeacherSubmissionReview = () => {
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const res = await api.get(`/submissions/${submissionId}`);
        setSubmission(res.data.data);
        if (res.data.data.status === 'approved' || res.data.data.status === 'revision_required') {
          setReviewStatus(res.data.data.status);
        }
        if (res.data.data.feedback) setFeedback(res.data.data.feedback);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load submission');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
  }, [submissionId]);

  const handleReview = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      await api.patch(`/submissions/${submissionId}/review`, {
        status: reviewStatus,
        feedback
      });
      setSuccess('Review submitted successfully');
      setTimeout(() => navigate(-1), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600 font-bold">{error}</div>;
  if (!submission) return null;

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">&larr; Back</button>
      </div>

      <div className="bg-white p-6 rounded shadow border-t-4 border-blue-600 mb-6">
        <h2 className="text-2xl font-bold mb-4">Submission Review</h2>
        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <p className="text-gray-500">Student</p>
            <p className="font-bold text-lg">{submission.studentId?.name}</p>
          </div>
          <div>
            <p className="text-gray-500">Submitted At</p>
            <p className="font-bold">{new Date(submission.submittedAt).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded border mb-6">
          <p className="font-semibold mb-2">Student's Request:</p>
          <p className="whitespace-pre-wrap text-gray-700 mb-4">{submission.answerText || 'Student has requested completion approval without an additional message.'}</p>
          
          {submission.attachments && submission.attachments.length > 0 && (
            <div>
              <p className="font-semibold text-sm mb-2 text-gray-600">Attachments:</p>
              <div className="flex flex-col gap-2">
                {submission.attachments.map((file, i) => (
                  <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline bg-white p-2 rounded border border-gray-200">
                    📄 {file.fileName}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleReview} className="border-t pt-6">
          <div className="mb-4">
            <label className="block mb-2 font-semibold text-gray-700">Approval Decision</label>
            <select className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" value={reviewStatus} onChange={e => setReviewStatus(e.target.value)} required>
              <option value="">-- Select Decision --</option>
              <option value="approved">Approve (Mark as Completed)</option>
              <option value="revision_required">Request Revision</option>
            </select>
          </div>
          
          {reviewStatus === 'revision_required' && (
            <div className="mb-6">
              <label className="block mb-2 font-semibold text-gray-700">Revision Feedback</label>
              <textarea className="w-full p-2 border rounded h-24 focus:ring-2 focus:ring-red-500" value={feedback} onChange={(e) => setFeedback(e.target.value)} required></textarea>
            </div>
          )}
          
          {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}
          
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700">
            Submit Review
          </button>
        </form>
      </div>
    </div>
    </Layout>
  );
};

export default TeacherSubmissionReview;
