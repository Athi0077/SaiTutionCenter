import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const PrincipalClasses = () => {
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/classes');
      setClasses(res.data.data);
    } catch (err) {
      console.error("Failed to fetch classes");
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleDelete = async (classId) => {
    if (!window.confirm("Are you sure you want to delete this class?")) return;
    
    try {
      await api.delete(`/classes/${classId}`);
      toast.success('Class deleted successfully');
      fetchClasses();
    } catch (err) {
      console.error("Failed to delete class:", err);
      toast.error(err.response?.data?.message || 'Failed to delete class');
    }
  };

  const filteredClasses = classes.filter(c => 
    c.className.toLowerCase().includes(search.toLowerCase()) || 
    c.teacherId?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">All Classes</h2>
        
        <div className="bg-white p-4 rounded-2xl shadow-soft flex gap-4 items-center">
          <span className="text-gray-400 pl-2">🔍</span>
          <input 
            type="text" 
            placeholder="Search classes or teachers..." 
            className="w-full md:w-1/3 bg-transparent focus:outline-none text-sm text-gray-700"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="bg-white shadow-soft rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading classes...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500">
                    <th className="p-4 font-medium">Class</th>
                    <th className="p-4 font-medium">Teacher</th>
                    <th className="p-4 font-medium">Class Leader</th>
                    <th className="p-4 font-medium">Students</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredClasses.length > 0 ? (
                    filteredClasses.map(cls => (
                      <tr key={cls._id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-bold text-gray-800">{cls.className}</td>
                        <td className="p-4 text-gray-600">{cls.teacherId?.name || 'Unknown'}</td>
                        <td className="p-4 text-gray-600">
                          {cls.classLeader ? (
                            <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded border border-yellow-200">👑 {cls.classLeader.name}</span>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Not assigned</span>
                          )}
                        </td>
                        <td className="p-4 text-gray-600">{cls.students?.length || 0}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 text-xs rounded-lg font-semibold ${cls.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {cls.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleDelete(cls._id)}
                            className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition"
                            title="Delete Class"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">No classes found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PrincipalClasses;
