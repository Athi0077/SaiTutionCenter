import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { BookOpen } from 'lucide-react';

const StudentTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await api.get('/tests/student');
        setTests(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending_approval':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">Approval Pending</span>;
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Completed</span>;
      case 'revision_required':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Revision Required</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">Assigned</span>;
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">My Tests</h1>

        {loading ? (
          <p>Loading tests...</p>
        ) : tests.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No tests scheduled yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div key={test._id} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden hover:shadow-md transition">
                <div className="p-5 border-b border-gray-50 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 line-clamp-1 mb-1">{test.title}</h3>
                    <p className="text-sm text-gray-500 font-semibold">{test.subjectId?.name}</p>
                  </div>
                  {getStatusBadge(test.submissionStatus)}
                </div>
                
                <div className="p-5 bg-gray-50">
                  <div className="flex justify-between items-center text-sm mb-4">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">Teacher</p>
                      <p className="font-semibold text-gray-700">{test.teacherId?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-semibold">Test Date</p>
                      <p className="font-semibold text-red-500">{new Date(test.testDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <Link 
                    to={`/student/tests/${test._id}`}
                    className="block text-center w-full bg-white border-2 border-primary text-primary font-bold py-2 rounded-lg hover:bg-primary hover:text-white transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentTests;
