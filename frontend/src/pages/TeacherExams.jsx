import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const TeacherExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [marks, setMarks] = useState([]);
  const [marksLoading, setMarksLoading] = useState(false);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/exams/teacher');
      setExams(res.data.data);
    } catch (error) {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterMarks = async (exam, subjectId) => {
    setSelectedExam(exam);
    setSelectedSubject(subjectId);
    try {
      setMarksLoading(true);
      // Fetch students for this class
      const classRes = await api.get(`/classes/${exam.classId._id}`);
      setStudents(classRes.data.data.students || []);

      // Fetch existing marks
      const marksRes = await api.get(`/exams/${exam._id}/marks?subjectId=${subjectId}`);
      setMarks(marksRes.data.data || []);
    } catch (error) {
      toast.error('Failed to prepare marks entry');
    } finally {
      setMarksLoading(false);
    }
  };

  const getMarkForStudent = (studentId) => {
    return marks.find(m => m.studentId?._id === studentId || m.studentId === studentId);
  };

  const updateMark = (studentId, field, value) => {
    const existingIndex = marks.findIndex(m => m.studentId?._id === studentId || m.studentId === studentId);
    let newMarks = [...marks];
    if (existingIndex >= 0) {
      newMarks[existingIndex] = { ...newMarks[existingIndex], [field]: value };
    } else {
      newMarks.push({ studentId, marksObtained: '', isAbsent: false, remarks: '', [field]: value });
    }
    setMarks(newMarks);
  };

  const saveMarks = async (status) => {
    try {
      await api.post(`/exams/${selectedExam._id}/marks`, {
        subjectId: selectedSubject,
        marks,
        status
      });
      toast.success(`Marks ${status === 'submitted' ? 'submitted' : 'saved as draft'}`);
      setSelectedExam(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save marks');
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
            No exams found for your assigned classes.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {exams.map(exam => (
              <div key={exam._id} className="bg-white rounded-xl shadow-soft p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{exam.examName}</h3>
                    <p className="text-sm text-gray-500">{exam.classId?.className}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${exam.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {exam.status}
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse mt-4">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="p-3 font-semibold text-gray-600">Subject</th>
                        <th className="p-3 font-semibold text-gray-600">Date</th>
                        <th className="p-3 font-semibold text-gray-600">Time</th>
                        <th className="p-3 font-semibold text-gray-600">Max Marks</th>
                        <th className="p-3 text-right font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {exam.schedule.map(s => (
                        <tr key={s._id} className="hover:bg-gray-50">
                          <td className="p-3 font-medium">{s.subjectId?.name}</td>
                          <td className="p-3">{new Date(s.examDate).toLocaleDateString()}</td>
                          <td className="p-3">{s.startTime} - {s.endTime}</td>
                          <td className="p-3">{s.maxMarks}</td>
                          <td className="p-3 text-right">
                            <button 
                              onClick={() => handleEnterMarks(exam, s.subjectId?._id)}
                              className="text-primary hover:text-primary-dark font-medium transition"
                            >
                              Enter Marks
                            </button>
                          </td>
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

      <AnimatePresence>
        {selectedExam && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-8 border border-gray-100"
            >
              <div className="p-6 border-b bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold">{selectedExam.examName} - Marks Entry</h3>
                  <p className="text-sm text-gray-500">
                    {selectedExam.classId?.className} | Subject: {selectedExam.schedule.find(s => s.subjectId?._id === selectedSubject)?.subjectId?.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedExam(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                  <button onClick={() => saveMarks('draft')} className="px-4 py-2 border border-primary text-primary hover:bg-primary-50 rounded-lg transition">Save Draft</button>
                  <button onClick={() => saveMarks('submitted')} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition">Submit</button>
                </div>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {marksLoading ? (
                  <div className="text-center p-4">Loading students...</div>
                ) : (
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="p-3 font-semibold text-gray-600">Student Name</th>
                        <th className="p-3 font-semibold text-gray-600 w-32">Marks Obtained</th>
                        <th className="p-3 font-semibold text-gray-600 w-24 text-center">Absent?</th>
                        <th className="p-3 font-semibold text-gray-600">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {students.map(student => {
                        const smark = getMarkForStudent(student._id);
                        return (
                          <tr key={student._id}>
                            <td className="p-3 font-medium">{student.name}</td>
                            <td className="p-3">
                              <input 
                                type="number" 
                                className="w-full border rounded p-1.5 px-3" 
                                min="0" 
                                value={smark?.marksObtained ?? ''} 
                                onChange={e => updateMark(student._id, 'marksObtained', e.target.value)}
                                disabled={smark?.isAbsent}
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 accent-primary" 
                                checked={smark?.isAbsent || false}
                                onChange={e => {
                                  updateMark(student._id, 'isAbsent', e.target.checked);
                                  if (e.target.checked) updateMark(student._id, 'marksObtained', 0);
                                }}
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="text" 
                                className="w-full border rounded p-1.5 px-3 text-sm" 
                                placeholder="Optional"
                                value={smark?.remarks || ''}
                                onChange={e => updateMark(student._id, 'remarks', e.target.value)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                      {students.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center p-4 text-gray-500">No students found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default TeacherExams;
