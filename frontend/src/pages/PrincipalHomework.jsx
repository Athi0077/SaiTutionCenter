import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import toast from 'react-hot-toast';
import { Trash2, Calendar, BookOpen, Users } from 'lucide-react';

const PrincipalHomework = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchHomeworks();
    } else {
      setHomeworks([]);
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      if (res.data.success) {
        setClasses(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load classes');
    }
  };

  const fetchHomeworks = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/homework/admin-overview?classId=${selectedClass}&date=${selectedDate}`);
      setHomeworks(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch homework');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this homework?")) return;
    try {
      await api.delete(`/homework/${id}`);
      toast.success("Homework deleted successfully");
      setHomeworks(prev => prev.filter(hw => hw._id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete homework");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        
        {/* Header & Filters */}
        <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Homework Overview</h2>
            <p className="text-gray-500 font-semibold">Select a class and date to view assigned homework</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            {/* Class Selector */}
            <div className="relative">
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full md:w-56 appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold text-gray-700"
              >
                <option value="">-- Select Class --</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>{c.className}</option>
                ))}
              </select>
              <Users className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {/* Date Selector */}
            <div className="relative">
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full md:w-48 appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold text-gray-700"
              />
              <Calendar className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Homework List */}
        {!selectedClass ? (
          <div className="bg-white p-16 rounded-3xl shadow-soft text-center border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Select a Class</h3>
            <p className="text-gray-500">Please choose a class from the dropdown above to view its homework.</p>
          </div>
        ) : (
          <div className="bg-white shadow-soft rounded-3xl overflow-hidden border border-gray-50">
            {loading ? (
              <div className="p-12 text-center text-gray-500 font-bold animate-pulse">Loading homeworks...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500 bg-gray-50/50">
                      <th className="p-5 font-bold uppercase tracking-wider text-xs">Subject</th>
                      <th className="p-5 font-bold uppercase tracking-wider text-xs">Homework Title</th>
                      <th className="p-5 font-bold uppercase tracking-wider text-xs">Teacher</th>
                      <th className="p-5 font-bold uppercase tracking-wider text-xs">Due Date</th>
                      <th className="p-5 font-bold uppercase tracking-wider text-xs">Status</th>
                      <th className="p-5 font-bold uppercase tracking-wider text-xs text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {homeworks.length > 0 ? (
                      homeworks.map(hw => (
                        <tr key={hw._id} className="hover:bg-gray-50 transition group">
                          <td className="p-5">
                            <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                              {hw.subjectId?.name || 'Unknown'}
                            </span>
                          </td>
                          <td className="p-5 font-bold text-gray-800">{hw.title}</td>
                          <td className="p-5 text-gray-600 font-medium flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                              {hw.teacherId?.name?.charAt(0) || 'T'}
                            </div>
                            {hw.teacherId?.name}
                          </td>
                          <td className="p-5 text-gray-600 font-medium">
                            {new Date(hw.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="p-5">
                            <span className={`px-3 py-1 text-xs rounded-lg font-bold capitalize ${
                              hw.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {hw.status}
                            </span>
                          </td>
                          <td className="p-5 text-center">
                            <button 
                              onClick={() => handleDelete(hw._id)} 
                              className="text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 p-2 rounded-xl transition shadow-sm border border-gray-100 group-hover:border-red-100" 
                              title="Delete Homework"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-16 text-center">
                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Calendar className="w-8 h-8 text-gray-300" />
                          </div>
                          <p className="text-gray-500 font-bold">No homework assigned for this date.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PrincipalHomework;
