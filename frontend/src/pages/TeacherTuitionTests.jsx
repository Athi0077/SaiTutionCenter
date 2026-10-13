import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { ArrowLeft, Plus, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

const TeacherTuitionTests = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const batchId = queryParams.get('batchId');
  const subjectId = queryParams.get('subjectId');

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    testDate: '',
    maxMarks: '',
  });

  useEffect(() => {
    if (!batchId || !subjectId) {
      toast.error('Batch or Subject information missing');
      navigate('/teacher/tuition-timetable');
      return;
    }

    fetchTests();
  }, [batchId, subjectId, navigate]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tuition-tests?batchId=${batchId}&subjectId=${subjectId}`);
      setTests(res.data.data || res.data);
    } catch (err) {
      toast.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tuition-tests', {
        ...formData,
        batchId,
        subjectId,
      });
      toast.success('Test created successfully');
      setShowModal(false);
      fetchTests();
    } catch (err) {
      toast.error('Failed to create test');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/teacher/tuition-timetable')}
              className="p-2 bg-gray-100 dark:bg-[#1E293B] rounded-full hover:bg-gray-200 dark:hover:bg-[#334155] transition text-gray-700 dark:text-gray-300"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Tuition Tests</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage tests and marks</p>
            </div>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition shadow-sm"
          >
            <Plus size={18} /> New Test
          </button>
        </div>

        <div className="bg-white dark:bg-[#0B1120] rounded-2xl shadow-soft border border-gray-100 dark:border-[#1E293B] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading tests...</div>
          ) : tests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No tests assigned yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#172235] text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-[#1E293B]">
                    <th className="p-4 font-medium">Title</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Max Marks</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[#1E293B]">
                  {tests.map(test => (
                    <tr key={test._id} className="hover:bg-gray-50 dark:hover:bg-[#172235] transition text-gray-700 dark:text-gray-200">
                      <td className="p-4 font-bold">{test.title}</td>
                      <td className="p-4">{new Date(test.testDate).toLocaleDateString()}</td>
                      <td className="p-4">{test.maxMarks}</td>
                      <td className="p-4 text-right">
                        {/* Future enhancement: Enter Marks */}
                        <button className="text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 p-2 rounded transition ml-2">
                          <Edit3 size={16} /> Marks
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-gray-100 dark:border-[#1E293B]">
              <div className="p-6 border-b border-gray-100 dark:border-[#1E293B]">
                <h3 className="font-bold text-lg dark:text-white">Create Test</h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Test Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.testDate}
                    onChange={(e) => setFormData({...formData, testDate: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Marks *</label>
                  <input
                    type="number"
                    required
                    value={formData.maxMarks}
                    onChange={(e) => setFormData({...formData, maxMarks: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 border border-gray-200 dark:border-[#334155] rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E293B] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-semibold text-white transition shadow-sm"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherTuitionTests;
