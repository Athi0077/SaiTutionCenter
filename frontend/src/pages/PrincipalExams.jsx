import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Send, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PrincipalExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/exams');
      setExams(res.data.data);
    } catch (error) {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const publishExam = async (id) => {
    if (!window.confirm("Publishing will notify teachers and students. Proceed?")) return;
    try {
      await api.patch(`/exams/${id}/publish`);
      toast.success('Exam published successfully');
      fetchExams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to publish');
    }
  };

  const cancelExam = async (id) => {
    if (!window.confirm("Cancel this exam?")) return;
    try {
      await api.patch(`/exams/${id}/cancel`);
      toast.success('Exam cancelled');
      fetchExams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel');
    }
  };

  const deleteDraft = async (id) => {
    if (!window.confirm("Delete this draft exam?")) return;
    try {
      await api.delete(`/exams/${id}`);
      toast.success('Draft deleted');
      fetchExams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      published: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${colors[status] || colors.draft}`}>{status}</span>;
  };

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Exam Management</h2>
          <Link to="/principal/exams/create" className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-primary-dark transition">
            <Plus className="w-4 h-4" /> Create Exam
          </Link>
        </div>

        {loading ? (
          <div className="text-center p-8 text-gray-500">Loading exams...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm min-w-max">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Exam Name</th>
                    <th className="p-4 font-semibold text-gray-600">Class & Section</th>
                    <th className="p-4 font-semibold text-gray-600">Subjects</th>
                    <th className="p-4 font-semibold text-gray-600">Status</th>
                    <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence>
                    {exams.map((exam, index) => (
                      <motion.tr 
                        key={exam._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="p-4 font-bold text-gray-800">
                          {exam.examName} <br />
                          <span className="text-xs text-gray-500 font-normal">{exam.academicYearId?.name}</span>
                        </td>
                        <td className="p-4 text-gray-600">
                          {exam.classId?.className}
                        </td>
                        <td className="p-4 text-gray-600">
                          {exam.schedule?.length || 0}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(exam.status)}
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          {exam.status === 'draft' && (
                            <>
                              <button onClick={() => publishExam(exam._id)} className="text-green-600 hover:text-green-800 p-2" title="Publish">
                                <Send className="w-4 h-4" />
                              </button>
                              <Link to={`/principal/exams/edit/${exam._id}`} className="text-blue-600 hover:text-blue-800 p-2" title="Edit">
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button onClick={() => deleteDraft(exam._id)} className="text-red-600 hover:text-red-800 p-2" title="Delete Draft">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {exam.status === 'published' && (
                            <button onClick={() => cancelExam(exam._id)} className="text-red-600 hover:text-red-800 p-2" title="Cancel Exam">
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                    {exams.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-500">No exams found.</td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PrincipalExams;
