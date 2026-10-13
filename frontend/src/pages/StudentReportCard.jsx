import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';

const StudentReportCard = () => {
  const [reportCard, setReportCard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportCard();
  }, []);

  const fetchReportCard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/exams/student/report-card');
      setReportCard(res.data.data);
    } catch (error) {
      toast.error('Failed to load report card');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (subjects) => {
    let obtained = 0;
    let max = 0;
    subjects.forEach(s => {
      if (s.marksObtained !== null) {
        obtained += Number(s.marksObtained);
        max += Number(s.maxMarks);
      }
    });
    return { obtained, max, percentage: max > 0 ? ((obtained / max) * 100).toFixed(1) : 0 };
  };

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">My Report Card</h2>
        
        {loading ? (
          <div className="text-center p-8 text-gray-500">Loading your marks...</div>
        ) : reportCard.length === 0 ? (
          <div className="bg-white rounded-xl shadow-soft p-12 text-center text-gray-500">
            No exams published yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {reportCard.map(exam => {
              const totals = calculateTotal(exam.subjects);
              return (
                <div key={exam._id} className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-100">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-blue-900">{exam.examName}</h3>
                      <p className="text-sm text-blue-700 font-medium">{exam.examType}</p>
                    </div>
                    {totals.max > 0 && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{totals.percentage}%</p>
                        <p className="text-xs text-blue-500 font-medium">{totals.obtained} / {totals.max}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="p-3 font-semibold text-gray-600">Subject</th>
                          <th className="p-3 font-semibold text-gray-600 text-center">Max Marks</th>
                          <th className="p-3 font-semibold text-gray-600 text-center">Passing Marks</th>
                          <th className="p-3 font-semibold text-gray-600 text-center">Marks Obtained</th>
                          <th className="p-3 font-semibold text-gray-600">Grade / Status</th>
                          <th className="p-3 font-semibold text-gray-600">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {exam.subjects.map((s, idx) => {
                          let status = '-';
                          let statusColor = 'text-gray-500';
                          
                          if (s.isAbsent) {
                            status = 'ABSENT';
                            statusColor = 'text-red-500 font-bold';
                          } else if (s.marksObtained !== null) {
                            if (Number(s.marksObtained) >= Number(s.passingMarks)) {
                              status = 'PASS';
                              statusColor = 'text-green-600 font-bold';
                            } else {
                              status = 'FAIL';
                              statusColor = 'text-red-600 font-bold';
                            }
                          } else {
                            status = 'Pending...';
                          }

                          return (
                            <tr key={idx} className="hover:bg-gray-50 transition">
                              <td className="p-3 font-medium text-gray-800">{s.subject}</td>
                              <td className="p-3 text-center text-gray-600">{s.maxMarks}</td>
                              <td className="p-3 text-center text-gray-600">{s.passingMarks}</td>
                              <td className="p-3 text-center font-bold text-gray-800">
                                {s.isAbsent ? '0' : s.marksObtained !== null ? s.marksObtained : '-'}
                              </td>
                              <td className={`p-3 ${statusColor}`}>{status}</td>
                              <td className="p-3 text-gray-500 text-xs italic">{s.remarks || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentReportCard;
