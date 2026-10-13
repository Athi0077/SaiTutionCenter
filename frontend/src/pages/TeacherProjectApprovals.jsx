import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TeacherProjectApprovals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Approval Modal State
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/projects/submissions/approvals');
      setApprovals(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch project approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!reviewStatus) return;
    
    setSubmitting(true);
    try {
      await api.patch(`/projects/submissions/${selectedApproval._id}/review`, {
        status: reviewStatus,
        feedback
      });
      
      toast.success(reviewStatus === 'approved' ? 'Project Approved' : 'Revision Requested');
      
      // Update local state
      setApprovals(approvals.map(a => {
        if (a._id === selectedApproval._id) {
          return { ...a, status: reviewStatus, feedback };
        }
        return a;
      }));
      
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setSelectedApproval(null);
    setReviewStatus('');
    setFeedback('');
  };

  const filteredApprovals = approvals.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const searchString = `${item.studentId?.name} ${item.projectId?.title} ${item.projectId?.classId?.className}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    const matchesDate = !dateFilter || new Date(item.submittedAt).toISOString().split('T')[0] === dateFilter;
    return matchesStatus && matchesSearch && matchesDate;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending_approval':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">Pending Approval</span>;
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Approved</span>;
      case 'revision_required':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Revision Required</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Project Approvals</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm font-semibold">Total Requests</p>
            <p className="text-2xl font-bold">{approvals.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-amber-500">
            <p className="text-gray-500 text-sm font-semibold">Pending Approval</p>
            <p className="text-2xl font-bold">{approvals.filter(a => a.status === 'pending_approval').length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
            <p className="text-gray-500 text-sm font-semibold">Approved</p>
            <p className="text-2xl font-bold">{approvals.filter(a => a.status === 'approved').length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-red-500">
            <p className="text-gray-500 text-sm font-semibold">Revision Required</p>
            <p className="text-2xl font-bold">{approvals.filter(a => a.status === 'revision_required').length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow mb-6 flex flex-col md:flex-row gap-4 w-full">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by student, class, or title..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full md:w-auto border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-gray-600"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto relative">
            <Filter className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="revision_required">Revision Required</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading approvals...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : filteredApprovals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No approvals found matching your filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr>
                    <th className="p-4 font-semibold">Student</th>
                    <th className="p-4 font-semibold">Class</th>
                    <th className="p-4 font-semibold">Subject</th>
                    <th className="p-4 font-semibold">Project</th>
                    <th className="p-4 font-semibold">Requested At</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredApprovals.map(approval => (
                    <tr key={approval._id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-medium text-gray-800">{approval.studentId?.name}</td>
                      <td className="p-4 text-gray-600">{approval.projectId?.classId?.className}</td>
                      <td className="p-4 text-gray-600">{approval.projectId?.subjectId?.name}</td>
                      <td className="p-4 text-gray-800 font-semibold">{approval.projectId?.title}</td>
                      <td className="p-4 text-gray-500 text-sm">{new Date(approval.submittedAt).toLocaleString()}</td>
                      <td className="p-4">{getStatusBadge(approval.status)}</td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedApproval(approval)}
                          className="text-primary hover:bg-blue-50 px-3 py-1 rounded transition"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Review Modal */}
        {selectedApproval && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Review Completion Request</h3>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  &times;
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl mb-6">
                <p className="text-sm text-gray-500">Student</p>
                <p className="font-semibold mb-2">{selectedApproval.studentId?.name}</p>
                
                <p className="text-sm text-gray-500">Project</p>
                <p className="font-semibold mb-2">{selectedApproval.projectId?.title}</p>
                
                <p className="text-sm text-gray-500">Requested At</p>
                <p className="font-semibold">{new Date(selectedApproval.submittedAt).toLocaleString()}</p>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Student's Message</p>
                  <p className="text-sm text-gray-800 bg-white p-3 rounded border whitespace-pre-wrap">{selectedApproval.answerText || 'No message provided.'}</p>
                  
                  {selectedApproval.attachments && selectedApproval.attachments.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 mb-1">Attachments</p>
                      <div className="flex flex-col gap-2">
                        {selectedApproval.attachments.map((file, i) => (
                          <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline bg-white p-2 rounded border flex items-center gap-2">
                            📄 {file.fileName}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleReview}>
                <div className="mb-4">
                  <label className="block font-semibold mb-2 text-gray-700">Approval Decision</label>
                  <div className="flex gap-4">
                    <label className={`flex-1 border p-4 rounded-xl cursor-pointer flex flex-col items-center gap-2 transition ${reviewStatus === 'approved' ? 'border-green-500 bg-green-50 text-green-700' : 'hover:bg-gray-50 text-gray-600'}`}>
                      <input type="radio" name="status" value="approved" className="hidden" onChange={() => setReviewStatus('approved')} checked={reviewStatus === 'approved'} />
                      <CheckCircle className="w-8 h-8" />
                      <span className="font-semibold">Approve</span>
                    </label>
                    <label className={`flex-1 border p-4 rounded-xl cursor-pointer flex flex-col items-center gap-2 transition ${reviewStatus === 'revision_required' ? 'border-red-500 bg-red-50 text-red-700' : 'hover:bg-gray-50 text-gray-600'}`}>
                      <input type="radio" name="status" value="revision_required" className="hidden" onChange={() => setReviewStatus('revision_required')} checked={reviewStatus === 'revision_required'} />
                      <XCircle className="w-8 h-8" />
                      <span className="font-semibold">Request Revision</span>
                    </label>
                  </div>
                </div>

                {reviewStatus === 'revision_required' && (
                  <div className="mb-6">
                    <label className="block font-semibold mb-2 text-gray-700">Revision Feedback</label>
                    <textarea 
                      required
                      className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                      rows="3"
                      placeholder="Explain what the student needs to correct or finish..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    ></textarea>
                  </div>
                )}

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200">
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={!reviewStatus || submitting}
                    className={`flex-1 px-4 py-2 font-bold text-white rounded-xl ${!reviewStatus || submitting ? 'bg-gray-400 cursor-not-allowed' : reviewStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    {submitting ? 'Saving...' : 'Confirm'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
};

export default TeacherProjectApprovals;
