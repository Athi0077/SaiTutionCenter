import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { ChevronLeft, CheckCircle2, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSocket } from '../services/socket';

const StudentSyllabus = () => {
  const { subjectId } = useParams();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSyllabus = async () => {
      try {
        const res = await api.get(`/syllabus/student/subject/${encodeURIComponent(subjectId)}`);
        setChapters(res.data.data);
      } catch (err) {
        toast.error('Failed to load syllabus');
      } finally {
        setLoading(false);
      }
    };
    fetchSyllabus();

    const socket = getSocket();
    if (socket) {
      const handleSyllabusUpdate = (data) => {
        // If data matches, refresh
        if (data.subject === subjectId) {
          fetchSyllabus();
        }
      };
      socket.on('syllabus_updated', handleSyllabusUpdate);
      return () => {
        socket.off('syllabus_updated', handleSyllabusUpdate);
      };
    }
  }, [subjectId]);

  if (loading) return <Layout><div className="p-6">Loading syllabus...</div></Layout>;

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <Link to="/student/class" className="inline-flex items-center text-blue-600 hover:underline mb-6 font-semibold">
          <ChevronLeft size={16} className="mr-1" /> Back to Subject
        </Link>
        
        <div className="bg-white rounded-3xl p-8 shadow-soft">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{subjectId} Syllabus</h2>
          <p className="text-gray-500 mb-8 font-medium">Track your progress and stay on top of your learning.</p>

          <div className="space-y-4">
            {chapters.length > 0 ? chapters.map(chapter => {
              const isCompleted = chapter.status === 'Completed';
              return (
                <div key={chapter._id} className={`p-5 rounded-2xl border flex items-start gap-4 transition ${isCompleted ? 'bg-green-50/50 border-green-200' : 'bg-gray-50/50 border-gray-200'}`}>
                  <div className={`mt-0.5 ${isCompleted ? 'text-green-500' : 'text-gray-300'}`}>
                    {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-bold text-lg ${isCompleted ? 'text-green-900' : 'text-gray-800'}`}>
                      Chapter {chapter.chapterNumber}: {chapter.chapterTitle}
                    </h4>
                    {chapter.description && (
                      <p className="text-sm text-gray-600 mt-1">{chapter.description}</p>
                    )}
                    {isCompleted && chapter.completedAt && (
                      <p className="text-xs font-bold text-green-600 mt-2 uppercase tracking-wider">
                        Completed on {new Date(chapter.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <span className="text-4xl mb-4 block">📚</span>
                <p>No chapters have been added for this subject yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentSyllabus;
