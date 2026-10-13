import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';

const PrincipalStudents = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const classesRes = await api.get('/classes');
        setClasses(classesRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const groupedClasses = classes.reduce((acc, cls) => {
    if (!acc[cls.standard]) {
      acc[cls.standard] = [];
    }
    acc[cls.standard].push(cls);
    return acc;
  }, {});

  // Sort sections alphabetically within each standard
  Object.keys(groupedClasses).forEach(standard => {
    groupedClasses[standard].sort((a, b) => a.section.localeCompare(b.section));
  });

  if (loading) return <Layout><div className="p-12 text-center text-gray-500 font-medium">Loading classes...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Students Directory</h2>
        
        <div className="bg-white p-8 rounded-2xl shadow-soft mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Select Class to View Students</h3>
          {classes.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No classes found.</p>
          ) : (
            <div className="space-y-6">
              {Object.keys(groupedClasses).map(standard => (
                <div key={standard} className="border rounded-xl p-4">
                  <h4 className="text-lg font-bold mb-4 text-green-700 bg-green-50 inline-block px-4 py-1 rounded-full">{standard}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {groupedClasses[standard].map(cls => (
                      <Link 
                        key={cls._id} 
                        to={`/principal/students/${cls._id}`}
                        className="bg-white border-2 border-gray-100 hover:border-blue-500 hover:shadow-md p-4 rounded-xl text-center transition cursor-pointer"
                      >
                        <p className="font-bold text-gray-800 text-lg">{cls.section}</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Section</p>
                      </Link>
                    ))}
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

export default PrincipalStudents;
