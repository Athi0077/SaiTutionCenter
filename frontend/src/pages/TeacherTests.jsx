import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { PlusCircle, Edit, Trash2, BookOpen } from 'lucide-react';

const TeacherTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await api.get('/tests/teacher');
        setTests(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  const handleDelete = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test?')) return;
    try {
      await api.delete(`/tests/${testId}`);
      setTests(tests.filter(t => t._id !== testId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete test');
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">My Tests</h1>
              <Link 
                to="/teacher/tests/create" 
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
              >
                <PlusCircle size={20} /> Create Test
              </Link>
            </div>

            {loading ? (
              <p>Loading tests...</p>
            ) : tests.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow text-center">
                <p className="text-gray-500 mb-4">You haven't created any tests yet.</p>
                <Link to="/teacher/tests/create" className="text-primary font-semibold hover:underline">
                  Create your first test
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tests.map(test => (
                  <div key={test._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition hover:-translate-y-1">
                    <div className="p-5 border-b border-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{test.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          test.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {test.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 font-medium">{test.subjectId?.name} • {test.classId?.className}</p>
                    </div>
                    
                    <div className="p-5 bg-gray-50">
                      <div className="flex justify-between text-sm text-gray-600 mb-4">
                        <div>
                          <p className="text-xs text-gray-400">Test Date</p>
                          <p className="font-semibold text-red-500">{new Date(test.testDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Link to={`/teacher/tests/${test._id}`} className="text-sm text-primary font-semibold hover:underline">
                          View Details
                        </Link>
                        <div className="flex gap-2 text-gray-400">
                          <Link to={`/teacher/tests/${test._id}/edit`} className="hover:text-primary transition" title="Edit">
                            <Edit size={16} />
                          </Link>
                          <button onClick={() => handleDelete(test._id)} className="hover:text-red-500 transition" title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>
    </Layout>
  );
};

export default TeacherTests;
