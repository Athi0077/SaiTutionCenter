import Layout from '../components/layout/Layout';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const StudentHomeworkHistory = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/submissions/history');
        setSubmissions(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <Layout>
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <Link to="/student/homework" className="text-blue-600 hover:underline">&larr; Back to Today's Homework</Link>
      </div>

      <h2 className="text-2xl font-bold mb-6">Homework History</h2>

      <div className="bg-white shadow rounded overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="p-4 font-semibold text-sm uppercase">Subject</th>
                <th className="p-4 font-semibold text-sm uppercase">Homework</th>
                <th className="p-4 font-semibold text-sm uppercase">Submitted</th>
                <th className="p-4 font-semibold text-sm uppercase">Marks</th>
                <th className="p-4 font-semibold text-sm uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submissions.length > 0 ? (
                submissions.map(sub => (
                  <tr key={sub._id} className="hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-800">{sub.homeworkId?.subjectId?.name}</td>
                    <td className="p-4 text-gray-700">{sub.homeworkId?.title}</td>
                    <td className="p-4 text-gray-700">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                    <td className="p-4 text-gray-700">
                      {sub.status === 'reviewed' ? `${sub.marks} / ${sub.maxMarks}` : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize font-semibold
                        ${sub.status === 'reviewed' ? 'bg-green-100 text-green-800' : 
                          sub.status === 'late' ? 'bg-orange-100 text-orange-800' : 
                          'bg-blue-100 text-blue-800'}`}>
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-gray-500">No submission history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </Layout>
  );
};

export default StudentHomeworkHistory;
