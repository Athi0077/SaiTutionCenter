import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Search, Users, ExternalLink, Layers, FolderOpen } from 'lucide-react';

const TeacherClasses = () => {
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const clsRes = await api.get('/classes/my-classes');
      setClasses(clsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredClasses = classes.filter(cls => 
    cls.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-soft border border-gray-50">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">My Classes</h2>
              <p className="text-gray-500 text-sm">Manage and view all your assigned classes</p>
            </div>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search classes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="bg-gray-200 h-48 rounded-3xl"></div>)}
          </div>
        ) : filteredClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((cls) => (
              <div key={cls._id} className="bg-white rounded-3xl shadow-soft border border-gray-50 p-6 flex flex-col hover:-translate-y-1 transition duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 text-red-600 flex items-center justify-center font-bold text-xl shadow-sm border border-red-100">
                    {cls.className.substring(0, 2).toUpperCase()}
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${cls.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {cls.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-1">{cls.className}</h3>
                
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-6 mt-2">
                  <Users className="w-4 h-4" />
                  <span>{cls.students.length} Students Enrolled</span>
                </div>
                
                <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
                  <Link 
                    to={`/teacher/classes/${cls._id}`} 
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-600 py-2.5 rounded-xl text-xs font-bold transition group"
                  >
                    Open Class 
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link 
                    to={`/teacher/attendance/${cls._id}`} 
                    className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white py-2.5 rounded-xl text-xs font-bold transition shadow-2xs"
                  >
                    Take Attendance
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl shadow-soft flex flex-col items-center justify-center text-center border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <FolderOpen className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Classes Found</h3>
            <p className="text-gray-500 max-w-sm">
              {searchTerm ? `No classes matched your search "${searchTerm}".` : "You haven't been assigned to any classes yet."}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherClasses;
