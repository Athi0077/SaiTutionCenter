import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import toast from 'react-hot-toast';
import { CalendarDays, Plus, Activity, BookOpen, Clock, CheckCircle, Edit, Trash2, X } from 'lucide-react';

const PrincipalAcademicYears = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Modal State
  const [editingYear, setEditingYear] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', startDate: '', endDate: '', status: '' });

  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      const res = await api.get('/academic-years');
      setAcademicYears(res.data.data);
    } catch (err) {
      toast.error('Failed to load academic years');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const handleActivate = async (id) => {
    if (!window.confirm("Are you sure you want to activate this academic year? This will update all class rosters.")) return;
    try {
      await api.put(`/academic-years/${id}/activate`);
      toast.success('Academic Year Activated!');
      fetchAcademicYears();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate academic year');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this academic year? This action cannot be undone.")) return;
    try {
      await api.delete(`/academic-years/${id}`);
      toast.success('Academic year deleted successfully');
      fetchAcademicYears();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete academic year');
    }
  };

  const openEditModal = (year) => {
    setEditingYear(year);
    setEditForm({
      name: year.name,
      startDate: year.startDate.split('T')[0],
      endDate: year.endDate.split('T')[0],
      status: year.status
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/academic-years/${editingYear._id}`, editForm);
      toast.success('Academic year updated successfully');
      setEditingYear(null);
      fetchAcademicYears();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update academic year');
    }
  };

  const activeYear = academicYears.find(y => y.status === 'active');
  const upcomingYears = academicYears.filter(y => y.status === 'upcoming');
  const pastYears = academicYears.filter(y => y.status === 'completed' || y.status === 'archived');

  return (
    <Layout role="principal">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Academic Year Management</h2>
          <Link 
            to="/principal/academic-years/create" 
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-medium hover:bg-primary-dark transition"
          >
            <Plus size={18} /> Create Next Year
          </Link>
        </div>

        {/* Current Year Card */}
        <div className="bg-white p-6 rounded-2xl shadow-soft border-l-4 border-green-500">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2"><Activity className="text-green-500" /> Current Academic Year</span>
            {activeYear && (
              <div className="flex gap-2">
                <button onClick={() => openEditModal(activeYear)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                  <Edit size={18} />
                </button>
                <button onClick={() => handleDelete(activeYear._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </h3>
          {activeYear ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-semibold text-gray-900">{activeYear.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-semibold text-gray-900">{new Date(activeYear.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="font-semibold text-gray-900">{new Date(activeYear.endDate).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-bold">Active</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">No active academic year found.</p>
          )}
        </div>

        {/* Upcoming Years Card */}
        {upcomingYears.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-soft border-l-4 border-blue-500">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="text-blue-500" /> Upcoming Academic Years
            </h3>
            <div className="space-y-4">
              {upcomingYears.map(year => (
                <div key={year._id} className="flex flex-col md:flex-row justify-between items-center bg-gray-50 p-4 rounded-xl">
                  <div className="flex gap-8 items-center">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-semibold text-gray-900">{year.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-semibold text-gray-900">{new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 md:mt-0 items-center">
                    <Link 
                      to={`/principal/academic-years/${year._id}/admissions`}
                      className="text-sm bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-semibold hover:bg-indigo-200 transition"
                    >
                      New Admissions
                    </Link>
                    <Link 
                      to={`/principal/academic-years/${year._id}/promotion/preview`}
                      className="text-sm bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-200 transition"
                    >
                      Promote
                    </Link>
                    <button 
                      onClick={() => handleActivate(year._id)}
                      className="text-sm bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold hover:bg-green-200 transition"
                    >
                      Activate
                    </button>
                    <div className="h-6 w-px bg-gray-300 mx-1"></div>
                    <button onClick={() => openEditModal(year)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(year._id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History Table */}
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2">
            <BookOpen className="text-gray-500" />
            <h3 className="text-lg font-bold text-gray-800">Academic Year History</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="p-4 font-medium">Academic Year</th>
                    <th className="p-4 font-medium">Start Date</th>
                    <th className="p-4 font-medium">End Date</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pastYears.length > 0 ? (
                    pastYears.map(year => (
                      <tr key={year._id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-semibold text-gray-800">{year.name}</td>
                        <td className="p-4 text-gray-600">{new Date(year.startDate).toLocaleDateString()}</td>
                        <td className="p-4 text-gray-600">{new Date(year.endDate).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-semibold uppercase">{year.status}</span>
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button onClick={() => openEditModal(year)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(year._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">No past academic years found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingYear && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Edit Academic Year</h3>
              <button onClick={() => setEditingYear(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (e.g., 2026-2027)</label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={editForm.startDate}
                    onChange={e => setEditForm({...editForm, startDate: e.target.value})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input 
                    type="date" 
                    value={editForm.endDate}
                    onChange={e => setEditForm({...editForm, endDate: e.target.value})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  value={editForm.status}
                  onChange={e => setEditForm({...editForm, status: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingYear(null)}
                  className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PrincipalAcademicYears;
