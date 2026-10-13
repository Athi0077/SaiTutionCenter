import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';

const PrincipalParents = () => {
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editParentId, setEditParentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    email: '',
    password: '',
    childrenIds: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [parentsRes, studentsRes] = await Promise.all([
        api.get('/parents'),
        api.get('/users/students')
      ]);
      setParents(parentsRes.data.data || []);
      setStudents(studentsRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStudentToggle = (studentId) => {
    setFormData(prev => {
      const isSelected = prev.childrenIds.includes(studentId);
      if (isSelected) {
        return { ...prev, childrenIds: prev.childrenIds.filter(id => id !== studentId) };
      } else {
        return { ...prev, childrenIds: [...prev.childrenIds, studentId] };
      }
    });
  };

  const handleEdit = (parent) => {
    setFormData({
      name: parent.name,
      mobileNumber: parent.mobileNumber || parent.phone || '',
      email: parent.email || '',
      password: '', // Leave empty for edit
      childrenIds: parent.children ? parent.children.map(c => c._id) : []
    });
    setEditParentId(parent._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this parent account?")) return;
    try {
      await api.delete(`/parents/${id}`);
      toast.success('Parent account deleted successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete parent');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Parent Name is required');
      return;
    }
    if (!formData.mobileNumber.trim()) {
      toast.error('Mobile Number is required');
      return;
    }
    if (!editParentId && !formData.password.trim()) {
      toast.error('Password is required');
      return;
    }
    if (!formData.childrenIds || formData.childrenIds.length === 0) {
      toast.error('Please link at least one student to this parent account');
      return;
    }

    try {
      let response;
      if (editParentId) {
        response = await api.put(`/parents/${editParentId}`, formData);
        toast.success(response.data?.message || 'Parent account updated successfully');
      } else {
        response = await api.post('/parents', formData);
        toast.success(response.data?.message || 'Parent account created successfully');
      }
      setShowModal(false);
      setFormData({ name: '', mobileNumber: '', email: '', password: '', childrenIds: [] });
      setEditParentId(null);
      setSearchQuery('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${editParentId ? 'update' : 'create'} parent account`);
    }
  };

  const openNewModal = () => {
    setFormData({ name: '', mobileNumber: '', email: '', password: '', childrenIds: [] });
    setEditParentId(null);
    setShowModal(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manage Parents</h1>
            <p className="text-sm text-gray-500">Create parent accounts and link them to students</p>
          </div>
          <button 
            onClick={openNewModal}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm font-medium"
          >
            + New Parent
          </button>
        </div>

        {/* Parents List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto border border-gray-100 custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Mobile No.</th>
                <th className="p-4">Email</th>
                <th className="p-4">Linked Students</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {parents.map((parent) => (
                <tr key={parent._id} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-bold text-gray-800">{parent.name}</td>
                  <td className="p-4 font-medium text-gray-700">{parent.mobileNumber || parent.phone || 'N/A'}</td>
                  <td className="p-4 text-gray-600">{parent.email || <span className="text-gray-400 italic text-xs">Optional</span>}</td>
                  <td className="p-4">
                    {parent.children && parent.children.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {parent.children.map(child => (
                          <span key={child._id} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                            {child.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-xs">No students linked</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold">Active</span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleEdit(parent)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition mr-2 font-medium text-sm">Edit</button>
                    <button onClick={() => handleDelete(parent._id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition font-medium text-sm">Delete</button>
                  </td>
                </tr>
              ))}
              {parents.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">No parent accounts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b bg-gray-50/50 flex justify-between items-center shrink-0">
                <h3 className="text-lg font-bold">{editParentId ? 'Edit Parent Account' : 'Create Parent Account'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <form id="parentForm" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Parent Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" name="name" required value={formData.name} onChange={handleInputChange}
                      placeholder="Enter Parent Full Name"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="tel" name="mobileNumber" required value={formData.mobileNumber} onChange={handleInputChange}
                      placeholder="e.g. 9876543210"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email Address <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input 
                      type="email" name="email" value={formData.email} onChange={handleInputChange}
                      placeholder="e.g. parent@example.com (Optional)"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Temporary Password {!editParentId && <span className="text-red-500">*</span>} {editParentId && <span className="text-xs text-gray-400 font-normal">(Leave blank to keep current)</span>}
                    </label>
                    <input 
                      type="text" name="password" required={!editParentId} value={formData.password} onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                      placeholder="e.g. Parent@123"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="block text-sm font-bold mb-2 text-gray-700">
                      Link Students <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="Search students by name or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full p-2 mb-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm bg-gray-50"
                    />
                    <div className="bg-gray-50 border rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
                      {/* Always show selected students */}
                      {students.filter(s => formData.childrenIds.includes(s._id)).map(student => (
                        <label key={student._id} className="flex items-center gap-3 p-2 bg-green-50 rounded cursor-pointer border border-green-200 transition">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                            checked={true}
                            onChange={() => handleStudentToggle(student._id)}
                          />
                          <div>
                            <p className="font-semibold text-sm text-green-800">{student.name}</p>
                            <p className="text-xs text-green-600 font-mono">ID: {student.studentId || 'N/A'}</p>
                          </div>
                        </label>
                      ))}

                      {/* Show search results (max 5), excluding already selected */}
                      {searchQuery.trim() !== '' ? (
                        students
                          .filter(s => !formData.childrenIds.includes(s._id))
                          .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.studentId?.toLowerCase().includes(searchQuery.toLowerCase()))
                          .slice(0, 5)
                          .map(student => (
                            <label key={student._id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer border border-transparent hover:border-gray-200 transition">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                checked={false}
                                onChange={() => handleStudentToggle(student._id)}
                              />
                              <div>
                                <p className="font-semibold text-sm">{student.name}</p>
                                <p className="text-xs text-gray-500 font-mono">ID: {student.studentId || 'N/A'}</p>
                              </div>
                            </label>
                          ))
                      ) : (
                        formData.childrenIds.length === 0 && (
                          <p className="text-sm text-gray-500 p-2 italic text-center">Type in the search box to find students.</p>
                        )
                      )}
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" form="parentForm" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">{editParentId ? 'Update Account' : 'Create Account'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PrincipalParents;
