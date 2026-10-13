import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import ChatRoom from '../components/common/ChatRoom';

const StudentProjectDetails = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [projRes, subRes] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get('/projects/student/history')
        ]);
        setProject(projRes.data.data);
        const currentSubmission = subRes.data.data.find(sub => sub.projectId === id);
        if (currentSubmission) {
          setSubmissionStatus(currentSubmission.status);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load project');
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
    
    if (file && file.size > 3 * 1024 * 1024) {
      setError("Homework file must be 3 MB or less.");
      setSubmitting(false);
      return;
    }
    
    try {
      const formData = new FormData();
      if (answerText) formData.append('answerText', answerText);
      if (file) formData.append('file', file);

      await api.post(`/projects/${id}/submit`, formData, {
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

  if (loading) return <Layout><div className="p-8 text-center text-gray-500">Loading details...</div></Layout>;
  if (error && !project) return <Layout><div className="p-8 text-center text-red-500">{error}</div></Layout>;

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800 font-bold">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Project Details</h1>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-4">
            {submissionStatus === 'pending_approval' && <span className="bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full font-semibold text-sm">Approval Pending</span>}
            {submissionStatus === 'approved' && <span className="bg-green-100 text-green-800 px-4 py-1.5 rounded-full font-semibold text-sm">Completed</span>}
            {submissionStatus === 'revision_required' && <span className="bg-red-100 text-red-800 px-4 py-1.5 rounded-full font-semibold text-sm">Revision Required</span>}
            {!submissionStatus && <span className="bg-gray-100 text-gray-800 px-4 py-1.5 rounded-full font-semibold text-sm">Assigned</span>}
          </div>

          <h2 className="text-3xl font-bold mb-2 text-gray-900">{project.title}</h2>
          <h3 className="text-lg text-primary font-semibold mb-6">{project.subjectId?.name}</h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-6 pb-6 border-b">
            <div>
              <p className="mb-2">Class: <span className="font-semibold text-gray-800">{project.classId?.className}</span></p>
              <p>Teacher: <span className="font-semibold text-gray-800">{project.teacherId?.name}</span></p>
            </div>
            <div className="text-right">
              <p className="mb-2">Due Date: <span className="font-semibold text-red-600">{new Date(project.dueDate).toLocaleDateString()}</span></p>
              <p>Max Marks: <span className="font-semibold text-gray-800">{project.maxMarks || '-'}</span></p>
            </div>
          </div>
          
          <div className="mb-8 space-y-6">
            <div>
              <h4 className="font-bold mb-2 text-gray-800 text-lg">Description</h4>
              <p className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-xl">{project.description}</p>
            </div>
            {project.instructions && (
              <div>
                <h4 className="font-bold mb-2 text-gray-800 text-lg">Instructions</h4>
                <p className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-xl">{project.instructions}</p>
              </div>
            )}
          </div>

          <div className="mb-8">
            <ChatRoom entityType="project" entityId={project._id} />
          </div>
          
          <div className="border-t border-gray-100 pt-8">
            {success && <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6">{success}</div>}
            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">{error}</div>}
            
            {submissionStatus === 'pending_approval' ? (
              <div className="bg-amber-50 p-6 rounded-xl text-center border border-amber-200">
                <h3 className="text-amber-800 font-bold text-lg mb-2">Waiting for Teacher Approval</h3>
                <p className="text-amber-700">Your completion request has been sent.</p>
              </div>
            ) : submissionStatus === 'approved' ? (
              <div className="bg-green-50 p-6 rounded-xl text-center border border-green-200">
                <h3 className="text-green-800 font-bold text-lg mb-2">Project Approved!</h3>
                <p className="text-green-700">Your teacher has marked this project as completed.</p>
              </div>
            ) : (
              <div>
                {submissionStatus === 'revision_required' && (
                  <div className="bg-red-50 p-6 rounded-xl text-center border border-red-200 mb-6">
                    <h3 className="text-red-800 font-bold text-lg mb-2">Revision Required</h3>
                    <p className="text-red-700">Your teacher has asked you to correct or finish your work. Once done, you can submit a new completion request.</p>
                  </div>
                )}
                
                {!showConfirm ? (
                  <button 
                    onClick={handleFinishClick} 
                    className="bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-primary-dark transition text-lg w-full md:w-auto shadow-md hover:shadow-lg"
                  >
                    I'm Finished
                  </button>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-lg text-gray-800 mb-4">Submit Project</h4>
                    
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
                    
                    <div className="mb-6">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Upload Photo / Document <span className="text-gray-500 font-normal ml-2">(Max 3 MB)</span>
                      </label>
                      <input 
                        type="file" 
                        accept="image/*,application/pdf,.doc,.docx"
                        capture="environment"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary hover:file:bg-red-200"
                      />
                    </div>

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

export default StudentProjectDetails;
