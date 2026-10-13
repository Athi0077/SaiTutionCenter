import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';

const PrincipalAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [standards, setStandards] = useState([]);
  
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedStandard, setSelectedStandard] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [editingId, setEditingId] = useState(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedClass, setExpandedClass] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsRes, standardsRes, subjectsRes] = await Promise.all([
        api.get('/teacher-assignments'),
        api.get('/standards'),
        api.get('/subjects')
      ]);
      setAssignments(assignmentsRes.data.data);
      setStandards(standardsRes.data.data);

      let fetchedSubjects = subjectsRes.data.data;

      // Auto-seed default subjects (English, Tamil, Maths, Science, Social) if none in DB
      if (fetchedSubjects.length === 0) {
        try {
          const seedRes = await api.post('/subjects/seed-defaults');
          fetchedSubjects = seedRes.data.data;
        } catch (seedErr) {
          console.error('Failed to seed default subjects:', seedErr);
        }
      }

      setSubjects(fetchedSubjects);

      try {
        const usersRes = await api.get('/users/active-teachers');
        setTeachers(usersRes.data.data);
      } catch (err) {
        // Fallback if endpoint missing
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      if (editingId) {
        await api.put(`/teacher-assignments/${editingId}`, {
          teacherId: selectedTeacher,
          standardId: selectedStandard,
          sectionId: selectedSection,
          subjectId
        });
        setSuccess('Teacher assignment updated successfully');
      } else {
        await api.post('/teacher-assignments', {
          teacherId: selectedTeacher,
          standardId: selectedStandard,
          sectionId: selectedSection,
          subjectId
        });
        setSuccess('Teacher assigned successfully');
      }
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving assignment');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedTeacher('');
    setSelectedStandard('');
    setSelectedSection('');
    setSubjectId('');
    setError('');
  };

  const handleEdit = (assignment) => {
    setEditingId(assignment._id);
    setSelectedTeacher(assignment.teacherId ? (assignment.teacherId._id || assignment.teacherId) : '');
    setSelectedStandard(assignment.standardId ? (assignment.standardId._id || assignment.standardId) : '');
    setSelectedSection(assignment.sectionId ? (assignment.sectionId._id || assignment.sectionId) : '');
    setSubjectId(assignment.subjectId ? (assignment.subjectId._id || assignment.subjectId) : '');
    window.scrollTo(0, 0);
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Are you sure you want to remove this assignment?")) return;
    setError(''); setSuccess('');
    try {
      await api.delete(`/teacher-assignments/${id}`);
      setSuccess('Assignment removed');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error removing assignment');
    }
  };

  const activeSections = standards.find(s => s._id === selectedStandard)?.sections || [];

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">{editingId ? 'Edit Teacher Assignment' : 'Assign Teacher to Class'}</h2>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-xl">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-4 rounded-xl">{success}</div>}

        <div className="bg-white p-6 rounded-2xl shadow-soft">
          <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-semibold text-gray-700 text-sm">Teacher</label>
              <select 
                className="w-full p-3 border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm" 
                value={selectedTeacher} 
                onChange={e => setSelectedTeacher(e.target.value)}
                required
              >
                <option value="">Select Approved Teacher</option>
                {teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-700 text-sm">Standard</label>
              <select 
                className="w-full p-3 border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm" 
                value={selectedStandard} 
                onChange={e => { setSelectedStandard(e.target.value); setSelectedSection(''); }}
                required
              >
                <option value="">Select Standard</option>
                {standards.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-700 text-sm">Section</label>
              <select 
                className="w-full p-3 border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm" 
                value={selectedSection} 
                onChange={e => setSelectedSection(e.target.value)}
                required
                disabled={!selectedStandard}
              >
                <option value="">Select Section</option>
                {activeSections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-700 text-sm">
                Subject <span className="text-red-500">*</span>
              </label>
              <select 
                className="w-full p-3 border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm" 
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                required
              >
                <option value="">-- Select Subject --</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              {subjects.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">⚠ No subjects found. Default subjects are being loaded...</p>
              )}
            </div>
            
            <div className="md:col-span-2 pt-2 flex gap-4">
              <button type="submit" className="flex-1 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary-dark font-bold transition">
                {editingId ? 'Update Assignment' : 'Assign Teacher'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 font-bold transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 pt-4">Current Assignments</h2>
        
        {loading ? <p className="text-gray-500">Loading assignments...</p> : assignments.length === 0 ? (
          <p className="text-gray-500 bg-white p-8 rounded-2xl shadow-soft text-center">No teachers assigned to any classes yet.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(
              assignments.reduce((acc, curr) => {
                const className = `${curr.standardId?.name || 'Unknown'} - ${curr.sectionId?.name || 'Unknown'}`;
                if (!acc[className]) acc[className] = [];
                acc[className].push(curr);
                return acc;
              }, {})
            ).map(([className, classAssignments]) => (
              <div key={className} className="bg-white rounded-2xl shadow-soft overflow-hidden">
                <div 
                  className="p-6 cursor-pointer flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition"
                  onClick={() => setExpandedClass(expandedClass === className ? null : className)}
                >
                  <h3 className="text-xl font-bold text-gray-800">{className}</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                      {classAssignments.length} Teachers
                    </span>
                    <svg className={`w-6 h-6 text-gray-400 transform transition-transform ${expandedClass === className ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {expandedClass === className && (
                  <div className="p-6 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {classAssignments.map(a => (
                        <div key={a._id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="text-lg font-bold text-gray-800">{a.teacherId?.name}</h4>
                              <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-100">
                                {a.subjectId?.name || a.subject || 'Assigned Teacher'}
                              </span>
                            </div>
                            <p className="text-gray-500 text-sm mb-6"><strong>Subject:</strong> {a.subjectId?.name || a.subject || 'All Subjects'}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleEdit(a)}
                              className="flex-1 bg-blue-50 text-blue-600 font-semibold px-4 py-2 rounded-lg hover:bg-blue-100 text-sm transition"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleRemove(a._id)}
                              className="flex-1 bg-red-50 text-red-600 font-semibold px-4 py-2 rounded-lg hover:bg-red-100 text-sm transition"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PrincipalAssignments;
