import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { AuthContext } from '../context/AuthContext';
import { Trophy, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentTuitionTests = () => {
  const { currentUser } = useContext(AuthContext);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarks = async () => {
      try {
        setLoading(true);
        const res = await api.get('/tuition-tests/my-marks');
        setMarks(res.data.data || res.data);
      } catch (err) {
        toast.error('Failed to load marks');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser?._id) {
      fetchMarks();
    }
  }, [currentUser]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Tuition Tests & Marks</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">View your recent test results.</p>
        </div>

        <div className="bg-white dark:bg-[#0B1120] rounded-2xl shadow-soft border border-gray-100 dark:border-[#1E293B] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading results...</div>
          ) : marks.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center text-gray-500">
              <Trophy size={48} className="text-gray-300 mb-4" />
              <p>You have no test results yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#172235] text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-[#1E293B]">
                    <th className="p-4 font-medium">Test Name</th>
                    <th className="p-4 font-medium">Subject</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Score</th>
                    <th className="p-4 font-medium">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[#1E293B]">
                  {marks.map(mark => {
                    const maxMarks = mark.testId?.maxMarks || 100;
                    const percentage = (mark.marksObtained / maxMarks) * 100;
                    let colorClass = 'text-green-600';
                    if (percentage < 40) colorClass = 'text-red-600';
                    else if (percentage < 75) colorClass = 'text-yellow-600';

                    return (
                      <tr key={mark._id} className="hover:bg-gray-50 dark:hover:bg-[#172235] transition text-gray-700 dark:text-gray-200">
                        <td className="p-4 font-bold">{mark.testId?.title || 'Unknown Test'}</td>
                        <td className="p-4">{mark.testId?.subjectId?.name || 'Unknown'}</td>
                        <td className="p-4">{new Date(mark.testId?.testDate).toLocaleDateString()}</td>
                        <td className="p-4">
                          <div className={`font-bold text-lg flex items-center gap-1 ${colorClass}`}>
                            {mark.marksObtained} <span className="text-xs font-normal text-gray-400">/ {maxMarks}</span>
                          </div>
                        </td>
                        <td className="p-4 text-xs">{mark.remarks || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentTuitionTests;
