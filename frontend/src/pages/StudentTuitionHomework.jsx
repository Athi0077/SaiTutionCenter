import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { AuthContext } from '../context/AuthContext';
import { BookOpen, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentTuitionHomework = () => {
  const { currentUser } = useContext(AuthContext);
  const [homeworks, setHomeworks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [studentNote, setStudentNote] = useState('');

  useEffect(() => {
    const fetchHomeworkAndSubmissions = async () => {
      try {
        setLoading(true);
        // First get the student's batches
        const [classesRes, stdsRes] = await Promise.all([
          api.get('/classes'),
          api.get('/standards')
        ]);
        
        // Find classes where student belongs
        const myClasses = classesRes.data.data.filter(c => 
          c.students?.some(s => (s._id || s) === currentUser._id)
        );
        
        // Map classes to section IDs (which act as batchIds)
        const myBatchIds = [];
        myClasses.forEach(cls => {
          const std = stdsRes.data.data?.find(s => s.name === cls.standard);
          if (std && std.sections) {
            const sec = std.sections.find(s => s.name === cls.section);
            if (sec) myBatchIds.push(sec._id);
          }
        });

        if (myBatchIds.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch all homework and filter by batches
        // Alternatively, an optimized API could just accept an array of batchIds
        const hwRes = await api.get('/tuition-homework');
        const myHw = hwRes.data.data.filter(hw => myBatchIds.includes(hw.batchId?._id || hw.batchId));
        setHomeworks(myHw);

        // Fetch my submissions
        const subRes = await api.get('/tuition-homework/my-submissions');
        setSubmissions(subRes.data.data);

      } catch (err) {
        toast.error('Failed to load homework');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser?._id) {
      fetchHomeworkAndSubmissions();
    }
  }, [currentUser]);

  const handleSubmit = async (hwId) => {
    try {
      await api.post(`/tuition-homework/${hwId}/submit`, { studentNote });
      toast.success('Homework submitted successfully');
      setSubmittingId(null);
      setStudentNote('');
      // Refetch submissions
      const subRes = await api.get('/tuition-homework/my-submissions');
      setSubmissions(subRes.data.data);
    } catch (err) {
      toast.error('Failed to submit homework');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Tuition Homework</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">View and submit your assignments.</p>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading homeworks...</div>
          ) : homeworks.length === 0 ? (
            <div className="bg-white dark:bg-[#0B1120] rounded-2xl p-8 text-center shadow-soft border border-gray-100 dark:border-[#1E293B] text-gray-500">
              No homework assigned to your batches.
            </div>
          ) : (
            homeworks.map(hw => {
              const submission = submissions.find(s => (s.homeworkId?._id || s.homeworkId) === hw._id);
              const isSubmitted = submission?.status === 'submitted' || submission?.status === 'graded';
              
              return (
                <div key={hw._id} className="bg-white dark:bg-[#0B1120] rounded-2xl shadow-soft border border-gray-100 dark:border-[#1E293B] p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">{hw.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{hw.batchId?.name ? `${hw.batchId.name}` : hw.batchId?.batchName} | {hw.subjectId?.name}</p>
                    </div>
                    {isSubmitted ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                        {submission.status.toUpperCase()}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                        PENDING
                      </span>
                    )}
                  </div>
                  
                  <div className="text-gray-700 dark:text-gray-300 text-sm mb-4 bg-gray-50 dark:bg-[#172235] p-4 rounded-xl border border-gray-100 dark:border-[#1E293B]">
                    {hw.description}
                  </div>
                  
                  <div className="flex items-center text-sm text-red-500 font-medium mb-4">
                    Due: {new Date(hw.dueDate).toLocaleDateString()}
                  </div>

                  {!isSubmitted && submittingId !== hw._id && (
                    <button 
                      onClick={() => setSubmittingId(hw._id)}
                      className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 px-4 py-2 rounded-xl transition font-semibold text-sm"
                    >
                      <UploadCloud size={16} /> Submit Assignment
                    </button>
                  )}

                  {submittingId === hw._id && !isSubmitted && (
                    <div className="mt-4 space-y-3 bg-gray-50 dark:bg-[#172235] p-4 rounded-xl border border-gray-200 dark:border-[#334155]">
                      <textarea
                        value={studentNote}
                        onChange={(e) => setStudentNote(e.target.value)}
                        placeholder="Add a note or link for your submission..."
                        className="w-full p-3 bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-[#334155] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white resize-none"
                        rows="3"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSubmittingId(null)}
                          className="px-4 py-2 border border-gray-200 dark:border-[#334155] rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-[#1E293B] transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSubmit(hw._id)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition"
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  )}

                  {isSubmitted && submission?.teacherRemarks && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        <span className="font-bold">Teacher Remarks:</span> {submission.teacherRemarks}
                      </p>
                      {submission.grade && (
                        <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mt-1">Grade: {submission.grade}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentTuitionHomework;
