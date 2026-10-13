import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import ChatRoom from '../components/common/ChatRoom';

const TeacherHomeworkDetails = () => {
  const { id } = useParams();
  const [homework, setHomework] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [hwRes, subRes] = await Promise.all([
          api.get(`/homework/${id}`),
          api.get(`/homework/${id}/submissions`)
        ]);
        setHomework(hwRes.data.data);
        setSubmissions(subRes.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load homework details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600 font-bold">{error}</div>;
  if (!homework) return null;

  const totalStudents = homework.classId?.students?.length || 0;
  const submittedCount = submissions.length;
  const completionRate = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <Link to="/teacher/homework" className="text-blue-600 hover:underline">&larr; Back to My Homework</Link>
      </div>
      
      <div className="bg-white p-6 rounded shadow border-t-4 border-blue-600 mb-6">
        <div className="flex flex-col md:flex-row justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold mb-1">{homework.title}</h2>
            <p className="text-gray-600 font-semibold">{homework.subjectId?.name} | {homework.classId?.className}</p>
          </div>
          <div className="text-right mt-4 md:mt-0">
            <p className="text-sm text-gray-500">Due Date</p>
            <p className="font-bold">{new Date(homework.dueDate).toLocaleString()}</p>
          </div>
        </div>
        <p className="text-gray-700 whitespace-pre-wrap">{homework.description}</p>
      </div>

      <div className="mb-6">
        <ChatRoom entityType="homework" entityId={homework._id} />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white p-4 shadow-soft rounded-2xl border border-gray-100 text-center">
          <p className="text-xs sm:text-sm font-semibold text-gray-500">Total Students</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{totalStudents}</p>
        </div>
        <div className="bg-white p-4 shadow-soft rounded-2xl border border-gray-100 text-center">
          <p className="text-xs sm:text-sm font-semibold text-gray-500">Submitted</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">{submittedCount}</p>
        </div>
        <div className="bg-white p-4 shadow-soft rounded-2xl border border-gray-100 text-center">
          <p className="text-xs sm:text-sm font-semibold text-gray-500">Pending</p>
          <p className="text-xl sm:text-2xl font-bold text-orange-500 mt-1">{totalStudents - submittedCount}</p>
        </div>
        <div className="bg-white p-4 shadow-soft rounded-2xl border border-gray-100 text-center">
          <p className="text-xs sm:text-sm font-semibold text-gray-500">Completion</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">{completionRate}%</p>
        </div>
      </div>
      
      <div className="bg-white shadow rounded p-6 mb-6">
        <h3 className="text-xl font-bold mb-4 border-b pb-2">Submissions</h3>
        {submissions.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {submissions.map(sub => (
              <li key={sub._id} className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg">{sub.studentId?.name}</p>
                  <p className="text-sm text-gray-500">Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</p>
                  <p className="text-sm font-semibold capitalize text-gray-700">Status: {sub.status}</p>
                </div>
                <div>
                  <Link to={`/teacher/submissions/${sub._id}`} className="bg-blue-100 text-blue-700 px-4 py-2 rounded font-semibold hover:bg-blue-200">
                    Review
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No submissions yet.</p>
        )}
      </div>
    </div>
    </Layout>
  );
};

export default TeacherHomeworkDetails;
