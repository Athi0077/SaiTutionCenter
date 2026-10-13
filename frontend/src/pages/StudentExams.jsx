import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';

const StudentExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/exams/student');
      setExams(res.data.data);
    } catch (error) {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">My Exams</h2>
        
        {loading ? (
          <div className="text-center p-8 text-gray-500">Loading exams...</div>
        ) : exams.length === 0 ? (
          <div className="bg-white rounded-xl shadow-soft p-12 text-center text-gray-500">
            No exams scheduled.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {exams.map(exam => (
              <div key={exam._id} className="bg-white rounded-xl shadow-soft p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{exam.examName}</h3>
                    <p className="text-sm text-gray-500">{exam.examType}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${exam.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {exam.status}
                  </span>
                </div>
                {exam.instructions && (
                  <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                    <span className="font-semibold">Instructions:</span> {exam.instructions}
                  </div>
                )}
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse mt-4">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="p-3 font-semibold text-gray-600">Subject</th>
                        <th className="p-3 font-semibold text-gray-600">Date</th>
                        <th className="p-3 font-semibold text-gray-600">Time</th>
                        <th className="p-3 font-semibold text-gray-600">Max Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {exam.schedule.map(s => (
                        <tr key={s._id} className="hover:bg-gray-50 transition">
                          <td className="p-3 font-medium text-gray-800">{s.subjectId?.name}</td>
                          <td className="p-3 text-gray-600">{new Date(s.examDate).toLocaleDateString()}</td>
                          <td className="p-3 text-gray-600">{s.startTime} - {s.endTime}</td>
                          <td className="p-3 text-gray-600">{s.maxMarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentExams;
