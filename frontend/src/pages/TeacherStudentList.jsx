import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import { getStudents } from '../utils/generalRegisterApi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const TeacherStudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useContext(AuthContext);
  const [classes, setClasses] = useState([]);

  const currentUserId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, classesRes] = await Promise.all([
        getStudents(),
        api.get('/classes/my-classes')
      ]);
      setStudents(studentsRes.data);
      setClasses(classesRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center sm:text-left w-full sm:w-auto">
            {(() => {
              if (classes && classes.length > 0) {
                return `My Students - ${classes.map(c => c.className).join(', ')}`;
              }
              return 'Students List';
            })()}
          </h2>
        </div>

        {loading ? (
          <div className="text-center p-8 text-gray-500">Loading...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Student ID</th>
                    <th className="p-4 font-semibold text-gray-600">Name</th>
                    <th className="p-4 font-semibold text-gray-600">Class</th>
                    <th className="p-4 font-semibold text-gray-600">Gender</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence>
                  {students.map((student, index) => (
                    <motion.tr 
                      key={student._id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="p-4 font-mono font-bold text-blue-700">{student.studentId}</td>
                      <td className="p-4 font-bold">{student.name}</td>
                      <td className="p-4">
                        {classes.find(c => c.students && c.students.some(s => {
                          const sId = (s && s._id ? s._id : s)?.toString();
                          const targetId = (student && student._id ? student._id : student)?.toString();
                          return sId === targetId;
                        }))?.className || 'Unassigned'}
                      </td>
                      <td className="p-4">{student.gender}</td>
                    </motion.tr>
                  ))}
                  </AnimatePresence>
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-500">No students found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherStudentList;
