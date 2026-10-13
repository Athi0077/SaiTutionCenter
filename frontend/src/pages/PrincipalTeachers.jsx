import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Search, Plus, Trash2, Edit2, CheckCircle, XCircle, Loader2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const PrincipalTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [teacherAttendance, setTeacherAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Loading states for actions
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null); // id of teacher being deleted
  const [isTogglingStatus, setIsTogglingStatus] = useState(null);
  const [isBulkActioning, setIsBulkActioning] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedTeacherHistory, setSelectedTeacherHistory] = useState([]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [formData, setFormData] = useState({ name: '', mobileNumber: '', email: '', password: '', confirmPassword: '' });
  const [editData, setEditData] = useState({ id: '', name: '', mobileNumber: '', email: '', password: '' });
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [filterClass, setFilterClass] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    fetchTeacherAttendance();
  }, [attendanceDate]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/principal/teachers');
      setTeachers(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherAttendance = async () => {
    try {
      const res = await api.get(`/attendance/teacher/all?date=${attendanceDate}`);
      setTeacherAttendance(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch teacher attendance');
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setIsCreating(true);
    try {
      await api.post('/principal/teachers', {
        name: formData.name,
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        password: formData.password
      });
      toast.success("Teacher created successfully");
      setShowModal(false);
      setFormData({ name: '', mobileNumber: '', email: '', password: '', confirmPassword: '' });
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create teacher');
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (teacher) => {
    setEditData({ id: teacher._id, name: teacher.name, mobileNumber: teacher.mobileNumber || teacher.phone || '', email: teacher.email || '', password: '' });
    setShowEditModal(true);
  };

  const fetchSelectedTeacherHistory = async (teacherId, date) => {
    try {
      const res = await api.get(`/attendance/teacher/${teacherId}/history?month=${date.getMonth()+1}&year=${date.getFullYear()}`);
      setSelectedTeacherHistory(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch teacher attendance history:", error);
    }
  };

  const openDetailsModal = (teacher) => {
    setSelectedTeacher(teacher);
    const now = new Date();
    setCurrentCalendarDate(now);
    fetchSelectedTeacherHistory(teacher._id, now);
    setShowDetailsModal(true);
  };

  const handleEditTeacher = async (e) => {
    e.preventDefault();
    setIsEditing(true);
    try {
      const payload = { name: editData.name, mobileNumber: editData.mobileNumber, email: editData.email };
      if (editData.password) {
        payload.password = editData.password;
      }
      await api.put(`/principal/teachers/${editData.id}`, payload);
      toast.success("Teacher updated successfully");
      setShowEditModal(false);
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update teacher');
    } finally {
      setIsEditing(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    setIsTogglingStatus(id);
    try {
      await api.patch(`/principal/teachers/${id}/status`, { status: newStatus });
      setTeachers(teachers.map(t => t._id === id ? { ...t, status: newStatus } : t));
      toast.success(`Teacher marked as ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setIsTogglingStatus(null);
    }
  };

  const deleteTeacher = async (id) => {
    if (!window.confirm("Are you sure you want to delete this teacher account?")) return;
    setIsDeleting(id);
    try {
      await api.delete(`/principal/teachers/${id}`);
      setTeachers(teachers.filter(t => t._id !== id));
      setSelectedIds(selectedIds.filter(selId => selId !== id));
      toast.success("Teacher deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete teacher');
    } finally {
      setIsDeleting(null);
    }
  };

  // Bulk Actions
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedTeachers.map(t => t._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} teachers?`)) return;
    setIsBulkActioning(true);
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/principal/teachers/${id}`)));
      setTeachers(teachers.filter(t => !selectedIds.includes(t._id)));
      setSelectedIds([]);
      toast.success(`${selectedIds.length} teachers deleted successfully`);
    } catch (err) {
      toast.error('Failed to delete some teachers');
      fetchTeachers(); // refresh in case of partial failure
    } finally {
      setIsBulkActioning(false);
    }
  };

  // Derived state for filters
  const uniqueClasses = useMemo(() => {
    const classes = new Set();
    teachers.forEach(t => t.classesAssigned?.forEach(c => classes.add(c)));
    return Array.from(classes).sort();
  }, [teachers]);

  const uniqueSubjects = useMemo(() => {
    const subjects = new Set();
    teachers.forEach(t => t.subjectsAssigned?.forEach(s => subjects.add(s)));
    return Array.from(subjects).sort();
  }, [teachers]);

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'active' && t.status === 'active') || 
                          (filterStatus === 'inactive' && t.status !== 'active');
    const matchesClass = filterClass === 'all' || (t.classesAssigned && t.classesAssigned.includes(filterClass));
    const matchesSubject = filterSubject === 'all' || (t.subjectsAssigned && t.subjectsAssigned.includes(filterSubject));
    
    return matchesSearch && matchesStatus && matchesClass && matchesSubject;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const paginatedTeachers = filteredTeachers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset to page 1 if filters change and current page is now empty
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredTeachers.length, totalPages]);

  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter(t => t.status === 'active').length;
  const inactiveTeachers = totalTeachers - activeTeachers;

  return (
    <Layout>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Manage Teachers</h2>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-green-600 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-green-700 transition"
          >
            <Plus size={20} /> Create Teacher
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-soft border-t-4 border-blue-500 flex flex-col justify-center items-center text-center">
            <p className="text-gray-500 text-[10px] md:text-sm font-bold uppercase tracking-wider">Total</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-800 mt-2">{totalTeachers}</p>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-soft border-t-4 border-green-500 flex flex-col justify-center items-center text-center">
            <p className="text-gray-500 text-[10px] md:text-sm font-bold uppercase tracking-wider">Active</p>
            <p className="text-2xl md:text-3xl font-bold text-green-600 mt-2">{activeTeachers}</p>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-soft border-t-4 border-red-500 flex flex-col justify-center items-center text-center">
            <p className="text-gray-500 text-[10px] md:text-sm font-bold uppercase tracking-wider">Inactive</p>
            <p className="text-2xl md:text-3xl font-bold text-red-600 mt-2">{inactiveTeachers}</p>
          </div>
        </div>

        {/* Filters and List */}
        <div className="bg-white rounded-2xl shadow-soft p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
              />
            </div>
            
            <select 
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 font-medium text-gray-700"
            >
              <option value="all">All Classes</option>
              {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select 
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 font-medium text-gray-700"
            >
              <option value="all">All Subjects</option>
              {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select 
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 font-medium text-gray-700"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-4">
                <input 
                  type="date"
                  title="Attendance Date"
                  value={attendanceDate}
                  onChange={e => setAttendanceDate(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 font-medium text-gray-700"
                />
                <span className="text-sm text-gray-500 font-medium">Attendance Date</span>
             </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-3 bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                <span className="text-sm font-bold text-red-600">{selectedIds.length} Selected</span>
                <button 
                  onClick={handleBulkDelete}
                  disabled={isBulkActioning}
                  className="flex items-center gap-1 text-sm bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isBulkActioning ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Delete
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                 <Loader2 size={32} className="animate-spin mb-4 text-green-500" />
                 <p className="font-medium">Loading teachers...</p>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <Search size={32} className="text-gray-400" />
                </div>
                <p className="font-medium">No teachers found matching your criteria.</p>
                <button 
                  onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterClass('all'); setFilterSubject('all'); }}
                  className="mt-4 text-green-600 font-semibold hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="p-4 w-12">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.length === paginatedTeachers.length && paginatedTeachers.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                        />
                      </th>
                      <th className="p-4 text-sm font-semibold text-gray-600 uppercase">Teacher</th>
                      <th className="p-4 text-sm font-semibold text-gray-600 uppercase">Class</th>
                      <th className="p-4 text-sm font-semibold text-gray-600 uppercase">Subject</th>
                      <th className="p-4 text-sm font-semibold text-gray-600 uppercase">Attendance</th>
                      <th className="p-4 text-sm font-semibold text-gray-600 uppercase">Status</th>
                      <th className="p-4 text-sm font-semibold text-gray-600 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedTeachers.map(teacher => {
                      const attendanceRecord = teacherAttendance.find(a => a._id.toString() === teacher._id.toString());
                      const isPresent = attendanceRecord && attendanceRecord.status === "present";
                      
                      return (
                      <tr key={teacher._id} className={`hover:bg-gray-50/50 transition ${selectedIds.includes(teacher._id) ? 'bg-blue-50/30' : ''}`}>
                        <td className="p-4">
                           <input 
                            type="checkbox" 
                            checked={selectedIds.includes(teacher._id)}
                            onChange={() => handleSelectOne(teacher._id)}
                            className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                              {teacher.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-gray-800">{teacher.name}</div>
                              <div className="text-xs font-semibold text-gray-700">{teacher.mobileNumber || teacher.phone || 'No Mobile'}</div>
                              {teacher.email && <div className="text-xs text-gray-400">{teacher.email}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {teacher.classesAssigned && teacher.classesAssigned.length > 0 
                            ? <div className="flex flex-wrap gap-1">
                                {teacher.classesAssigned.map(c => <span key={c} className="bg-gray-100 px-2 py-1 rounded-md text-xs font-medium">{c}</span>)}
                              </div>
                            : <span className="text-gray-400 italic">None</span>
                          }
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {teacher.subjectsAssigned && teacher.subjectsAssigned.length > 0 
                            ? <div className="flex flex-wrap gap-1">
                                {teacher.subjectsAssigned.map(s => <span key={s} className="bg-gray-100 px-2 py-1 rounded-md text-xs font-medium">{s}</span>)}
                              </div>
                            : <span className="text-gray-400 italic">None</span>
                          }
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {isPresent ? (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1"><CheckCircle size={14}/> Present</span>
                          ) : (
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1"><XCircle size={14}/> Absent</span>
                          )}
                        </td>
                        <td className="p-4">
                          <button 
                            onClick={() => toggleStatus(teacher._id, teacher.status)}
                            disabled={isTogglingStatus === teacher._id}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition disabled:opacity-50 ${
                              teacher.status === 'active' 
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {isTogglingStatus === teacher._id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : teacher.status === 'active' ? (
                              <CheckCircle size={14} /> 
                            ) : (
                              <XCircle size={14} />
                            )}
                            {teacher.status === 'active' ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => openDetailsModal(teacher)} 
                              title="View Details"
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => openEditModal(teacher)} 
                              title="Edit Teacher"
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => deleteTeacher(teacher._id)} 
                              title="Delete Teacher"
                              disabled={isDeleting === teacher._id}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            >
                              {isDeleting === teacher._id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-500 font-medium">
                      Showing <span className="font-bold text-gray-800">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-gray-800">{Math.min(currentPage * itemsPerPage, filteredTeachers.length)}</span> of <span className="font-bold text-gray-800">{filteredTeachers.length}</span> teachers
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent flex items-center gap-1 font-medium transition"
                      >
                        <ChevronLeft size={16} /> Prev
                      </button>
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent flex items-center gap-1 font-medium transition"
                      >
                        Next <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Create Teacher Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800">Create New Teacher</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 transition">
                  <XCircle size={24} />
                </button>
              </div>
              <form onSubmit={handleCreateTeacher} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" required
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition text-sm"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="tel" required
                    value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition text-sm"
                    placeholder="e.g. 9876543210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Email Address <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input 
                    type="email"
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition text-sm"
                    placeholder="john@school.com (Optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Temporary Password <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="password" required minLength={6}
                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="password" required minLength={6}
                    value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition text-sm"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={isCreating} className="flex-1 py-3 text-white bg-green-600 rounded-xl font-bold hover:bg-green-700 transition flex justify-center items-center gap-2 disabled:opacity-70">
                    {isCreating && <Loader2 size={18} className="animate-spin" />}
                    {isCreating ? 'Creating...' : 'Create Teacher'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Teacher Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800">Edit Teacher</h3>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-700 transition">
                  <XCircle size={24} />
                </button>
              </div>
              <form onSubmit={handleEditTeacher} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" required
                    value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="tel" required
                    value={editData.mobileNumber} onChange={e => setEditData({...editData, mobileNumber: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                    placeholder="e.g. 9876543210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Email Address <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input 
                    type="email"
                    value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                    placeholder="Optional email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">New Password (Optional)</label>
                  <input 
                    type="password" minLength={6}
                    value={editData.password} onChange={e => setEditData({...editData, password: e.target.value})}
                    placeholder="Leave blank to keep current password"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={isEditing} className="flex-1 py-3 text-white bg-blue-600 rounded-xl font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2 disabled:opacity-70">
                    {isEditing && <Loader2 size={18} className="animate-spin" />}
                    {isEditing ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Teacher Details Modal / Drawer */}
        {showDetailsModal && selectedTeacher && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-end z-50">
            <div className="bg-white h-full w-full max-w-md shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                <h3 className="text-xl font-bold text-gray-800">Teacher Profile</h3>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-700 transition">
                  <XCircle size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-gray-100">
                  <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-4xl shadow-inner">
                    {selectedTeacher.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedTeacher.name}</h2>
                    <p className="text-gray-500">{selectedTeacher.email}</p>
                    <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                      ID: {selectedTeacher._id}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Academic Info</h4>
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Classes Assigned</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedTeacher.classesAssigned?.length > 0 
                          ? selectedTeacher.classesAssigned.map(c => <span key={c} className="bg-white border border-gray-200 px-3 py-1 rounded-lg text-sm font-semibold text-gray-700">{c}</span>)
                          : <span className="text-gray-400 italic text-sm">No classes assigned</span>
                        }
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Subjects Assigned</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedTeacher.subjectsAssigned?.length > 0 
                          ? selectedTeacher.subjectsAssigned.map(s => <span key={s} className="bg-white border border-gray-200 px-3 py-1 rounded-lg text-sm font-semibold text-gray-700">{s}</span>)
                          : <span className="text-gray-400 italic text-sm">No subjects assigned</span>
                        }
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Account Status</h4>
                  <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800">Current Status</p>
                      <p className="text-sm text-gray-500">Can access teacher portal</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${selectedTeacher.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                       {selectedTeacher.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Attendance ({currentCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })})</h4>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        const newDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1);
                        setCurrentCalendarDate(newDate);
                        fetchSelectedTeacherHistory(selectedTeacher._id, newDate);
                      }} className="p-1 hover:bg-gray-200 bg-gray-100 rounded-md text-gray-600 transition"><ChevronLeft size={16}/></button>
                      <button onClick={() => {
                        const newDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1);
                        setCurrentCalendarDate(newDate);
                        fetchSelectedTeacherHistory(selectedTeacher._id, newDate);
                      }} className="p-1 hover:bg-gray-200 bg-gray-100 rounded-md text-gray-600 transition"><ChevronRight size={16}/></button>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="grid grid-cols-7 gap-1 text-center mb-3">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <div key={d} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {(() => {
                        const year = currentCalendarDate.getFullYear();
                        const month = currentCalendarDate.getMonth();
                        const firstDay = new Date(year, month, 1).getDay();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        
                        const cells = [];
                        for (let i = 0; i < firstDay; i++) {
                          cells.push(<div key={`empty-${i}`} className="p-2"></div>);
                        }
                        
                        for (let d = 1; d <= daysInMonth; d++) {
                          const currentDateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          const attRecord = selectedTeacherHistory.find(att => {
                            const ad = new Date(att.date);
                            return `${ad.getFullYear()}-${String(ad.getMonth()+1).padStart(2, '0')}-${String(ad.getDate()).padStart(2, '0')}` === currentDateStr;
                          });
                          
                          let bgClass = "bg-white text-gray-600 border border-gray-200 shadow-sm";
                          if (attRecord) {
                            if (attRecord.status === 'present') bgClass = "bg-green-100 text-green-800 font-bold border-green-200";
                            else if (attRecord.status === 'absent') bgClass = "bg-red-100 text-red-800 font-bold border-red-200";
                            else bgClass = "bg-amber-100 text-amber-800 font-bold border-amber-200";
                          }
                          
                          const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;
                          if (isToday && !attRecord) bgClass = "bg-blue-50 text-blue-700 font-bold border-blue-200 ring-1 ring-blue-500/50";
                          
                          cells.push(
                            <div key={d} className={`flex items-center justify-center h-8 text-xs rounded-lg cursor-default transition-colors ${bgClass}`} title={attRecord ? attRecord.status : 'No record'}>
                              {d}
                            </div>
                          );
                        }
                        return cells;
                      })()}
                    </div>
                    <div className="flex items-center justify-center gap-5 mt-4 pt-4 border-t border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                       <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400"></span> Present</div>
                       <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400"></span> Absent</div>
                       <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span> Today</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
                 <button 
                   onClick={() => {
                     setShowDetailsModal(false);
                     openEditModal(selectedTeacher);
                   }}
                   className="w-full py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition flex justify-center items-center gap-2"
                 >
                   <Edit2 size={18} /> Edit Profile
                 </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default PrincipalTeachers;
