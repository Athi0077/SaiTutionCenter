import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TeacherTestApprovals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Grading Modal State
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/tests/submissions/approvals');
      setApprovals(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch test approvals');
    } finally {
      setLoading(false);
    }
  };

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
      setApprovals(approvals.map(a => {
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

  const filteredApprovals = approvals.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const searchString = `${item.studentId?.name} ${item.testId?.title} ${item.testId?.classId?.className}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    const matchesDate = !dateFilter || new Date(item.submittedAt).toISOString().split('T')[0] === dateFilter;
    return matchesStatus && matchesSearch && matchesDate;
  });

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

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Test Submissions & Grading</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-gray-500">
            <p className="text-gray-500 text-sm font-semibold">Total Students</p>
            <p className="text-2xl font-bold">{approvals.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm font-semibold">Ready to Grade</p>
            <p className="text-2xl font-bold">{approvals.filter(a => a.status === 'submitted').length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
            <p className="text-gray-500 text-sm font-semibold">Graded</p>
            <p className="text-2xl font-bold">{approvals.filter(a => a.status === 'graded').length}</p>
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
              <option value="submitted">Ready</option>
              <option value="graded">Graded</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading submissions...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : filteredApprovals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No submissions found matching your filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr>
                    <th className="p-4 font-semibold">Student</th>
                    <th className="p-4 font-semibold">Class</th>
                    <th className="p-4 font-semibold">Subject</th>
                    <th className="p-4 font-semibold">Test</th>
                    <th className="p-4 font-semibold">Submitted At</th>
                    <th className="p-4 font-semibold">Marks</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredApprovals.map(approval => (
                    <tr key={approval._id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-medium text-gray-800">{approval.studentId?.name}</td>
                      <td className="p-4 text-gray-600">{approval.testId?.classId?.className}</td>
                      <td className="p-4 text-gray-600">{approval.testId?.subjectId?.name}</td>
                      <td className="p-4 text-gray-800 font-semibold">{approval.testId?.title}</td>
                      <td className="p-4 text-gray-500 text-sm">{new Date(approval.submittedAt).toLocaleString()}</td>
                      <td className="p-4 font-bold text-gray-800">{approval.marks !== undefined && approval.marks !== null ? `${approval.marks} / ${approval.testId?.maxMarks || '-'}` : '-'}</td>
                      <td className="p-4">{getStatusBadge(approval.status)}</td>
                      <td className="p-4">
                        <button
                          onClick={() => {
                            setSelectedSubmission(approval);
                            setMarks(approval.marks !== undefined ? approval.marks : '');
                            setFeedback(approval.feedback || '');
                          }}
                          className="text-primary hover:bg-blue-50 px-3 py-1 rounded transition border border-primary font-semibold"
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Grade Test</h3>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  &times;
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl mb-6">
                <p className="text-sm text-gray-500">Student</p>
                <p className="font-semibold mb-2">{selectedSubmission.studentId?.name}</p>
                
                <p className="text-sm text-gray-500">Test</p>
                <p className="font-semibold mb-2">{selectedSubmission.testId?.title}</p>
                
                <p className="text-sm text-gray-500">Max Marks</p>
                <p className="font-semibold">{selectedSubmission.testId?.maxMarks || 'N/A'}</p>
              </div>

              <form onSubmit={handleReview}>
                <div className="mb-4">
                  <label className="block font-semibold mb-2 text-gray-700">Marks Earned</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    max={selectedSubmission.testId?.maxMarks || 100}
                    value={marks} 
                    onChange={(e) => setMarks(e.target.value)} 
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder={`Enter marks (out of ${selectedSubmission.testId?.maxMarks || '...'})`}
                  />
                </div>

                <div className="mb-6">
                  <label className="block font-semibold mb-2 text-gray-700">Feedback (Optional)</label>
                  <textarea 
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                    rows="3"
                    placeholder="Enter any feedback for the student..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  ></textarea>
                </div>

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200">
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={marks === '' || submitting}
                    className={`flex-1 px-4 py-3 font-bold text-white rounded-xl ${marks === '' || submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'}`}
                  >
                    {submitting ? 'Saving...' : 'Save Marks'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
};

export default TeacherTestApprovals;
