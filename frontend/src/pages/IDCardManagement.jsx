import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import IDCard from '../components/common/IDCard';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Search, Filter, Edit, Printer, Loader, RefreshCw, Download, View } from 'lucide-react';
import Lanyard from '../components/common/Lanyard/Lanyard';
import { Suspense } from 'react';
import StudyMateLoader from '../components/common/StudyMateLoader';

const IDCardManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [cardData, setCardData] = useState(null);
  const [loadingCard, setLoadingCard] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [show3D, setShow3D] = useState(false);
  const [cardImage, setCardImage] = useState(null);
  
  // Edit Form State
  const [formData, setFormData] = useState({});

  const [schoolNameInput, setSchoolNameInput] = useState('');
  const [savingSchoolName, setSavingSchoolName] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchSchoolName();
  }, [roleFilter]);

  const fetchSchoolName = async () => {
    try {
      const res = await api.get('/id-card/school-name');
      if (res.data?.schoolName) {
        setSchoolNameInput(res.data.schoolName);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateSchoolName = async (e) => {
    e.preventDefault();
    if (!schoolNameInput.trim()) {
      return toast.error("Please enter a valid school name");
    }
    try {
      setSavingSchoolName(true);
      const res = await api.put('/id-card/school-name', { schoolName: schoolNameInput.trim() });
      if (res.data?.success) {
        toast.success("School Name updated on all ID Cards!");
        setSchoolNameInput(res.data.schoolName);
        if (selectedUser) {
          openCardPreview(selectedUser);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update School Name");
    } finally {
      setSavingSchoolName(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/id-card/users?role=${roleFilter}&search=${search}`);
      setUsers(res.data.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const openCardPreview = async (user) => {
    setSelectedUser(user);
    setLoadingCard(true);
    setShow3D(false);
    setCardImage(null);
    try {
      const res = await api.get(`/id-card/${user._id}`);
      setCardData(res.data.data);
    } catch (err) {
      toast.error('Failed to load ID card details');
    } finally {
      setLoadingCard(false);
    }
  };

  const openEditModal = () => {
    setFormData({
      name: cardData.name || '',
      employeeId: cardData.employeeId || '',
      designation: cardData.designation || '',
      studentId: cardData.studentId || '',
      grNumber: cardData.grNumber || '',
      idCardStatus: cardData.idCardStatus || 'active',
      dateOfBirth: cardData.dateOfBirth ? new Date(cardData.dateOfBirth).toISOString().split('T')[0] : '',
      bloodGroup: cardData.bloodGroup || 'A+',
      parentName: cardData.parentName || '',
      parentPhone: cardData.parentPhone || '',
      address: cardData.address || '',
      phone: cardData.phone || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/id-card/${selectedUser._id}`, formData);
      setCardData(res.data.data);
      setIsEditModalOpen(false);
      toast.success('ID Card updated successfully');
      fetchUsers(); // Refresh list to get updated status
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-id-card');
    if (!printContent) return;
    
    const windowPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    windowPrint.document.write(`
      <html>
        <head>
          <title>Print ID Card</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: white; }
            @media print {
              @page { size: 54mm 86mm; margin: 0; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 250);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-id-card');
    if (!element) return;
    
    try {
      toast.loading('Generating PDF...', { id: 'pdf-toast' });
      const imgData = await toPng(element, { pixelRatio: 3, style: { transform: 'scale(1)' } });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [54, 86]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, 54, 86);
      pdf.save(`ID_Card_${cardData.name.replace(/\s+/g, '_')}.pdf`);
      toast.success('Downloaded Successfully', { id: 'pdf-toast' });
    } catch (error) {
      toast.error('Failed to generate PDF', { id: 'pdf-toast' });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-soft">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ID Card Management</h1>
              <p className="text-gray-500 text-sm">Manage, update, and print identity cards for all staff and students.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
              <form onSubmit={handleUpdateSchoolName} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 shadow-xs">
                <span className="text-xs font-bold text-gray-500 whitespace-nowrap">School Name:</span>
                <input 
                  type="text" 
                  value={schoolNameInput}
                  onChange={(e) => setSchoolNameInput(e.target.value)}
                  placeholder="e.g. ABC School"
                  className="bg-transparent border-0 focus:outline-none text-xs font-bold text-gray-800 w-32 sm:w-40"
                />
                <button 
                  type="submit" 
                  disabled={savingSchoolName} 
                  className="bg-primary text-white text-xs font-extrabold px-3 py-1 rounded-lg hover:bg-primary-dark transition disabled:opacity-50 uppercase tracking-wider"
                >
                  {savingSchoolName ? 'Saving...' : 'SET'}
                </button>
              </form>

              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1 md:w-56">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search by name, ID..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
                <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                  <option value="principal">Principals</option>
                </select>
                <button type="submit" className="bg-primary text-white p-2 rounded-xl hover:bg-primary-dark transition hidden md:block">
                  <Search className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><StudyMateLoader size="lg" text="Loading users..." /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Users List */}
              <div className="lg:col-span-1 border border-gray-100 rounded-2xl overflow-hidden flex flex-col h-[600px]">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 font-bold text-gray-700 text-sm uppercase tracking-wide">
                  Select User ({users.length})
                </div>
                <div className="flex-1 overflow-y-auto">
                  {users.map(user => (
                    <div 
                      key={user._id} 
                      onClick={() => openCardPreview(user)}
                      className={`p-4 border-b border-gray-50 flex items-center gap-3 cursor-pointer transition ${selectedUser?._id === user._id ? 'bg-blue-50 border-blue-100' : 'hover:bg-gray-50'}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                        {user.profilePic ? <img src={user.profilePic} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">{user.name.charAt(0)}</div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{user.name}</h4>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500 capitalize">{user.role}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-gray-500">{user.studentId || user.employeeId || 'No ID'}</span>
                        </div>
                      </div>
                      <div>
                        <span className={`w-2 h-2 rounded-full inline-block ${user.idCardStatus === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && <div className="p-8 text-center text-gray-500">No users found.</div>}
                </div>
              </div>

              {/* Card Preview */}
              <div className="lg:col-span-2 bg-gray-50 rounded-2xl border border-gray-100 p-6 flex flex-col h-[600px]">
                {!selectedUser ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-gray-400">
                    <Filter className="w-12 h-12 mb-2 opacity-50" />
                    <p>Select a user to preview and manage their ID card.</p>
                  </div>
                ) : loadingCard ? (
                  <div className="flex-1 flex justify-center items-center"><StudyMateLoader size="md" /></div>
                ) : cardData ? (
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-gray-800">Card Preview</h3>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={async () => {
                          if (!show3D) {
                            toast.loading('Generating 3D View...', { id: '3d-toast' });
                            try {
                              const element = document.getElementById('printable-id-card');
                              const imgData = await toPng(element, { 
                                pixelRatio: 2, 
                                style: { transform: 'scale(1)' }
                              });
                              setCardImage(imgData);
                              setShow3D(true);
                              toast.success('Ready to interact!', { id: '3d-toast' });
                            } catch (e) {
                              console.error("3D View Generation Error:", e);
                              toast.error(e.message || 'Failed to load 3D view', { id: '3d-toast' });
                            }
                          } else {
                            setShow3D(false);
                          }
                        }} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${show3D ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100'}`}>
                          <View className="w-4 h-4" /> 3D
                        </button>
                        <button onClick={openEditModal} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button onClick={handlePrint} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
                          <Printer className="w-4 h-4" /> Print
                        </button>
                        <button onClick={handleDownloadPDF} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition">
                          <Download className="w-4 h-4" /> PDF
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center overflow-hidden relative">
                       {show3D && cardImage ? (
                         <div className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing">
                           <Suspense fallback={<div className="flex w-full h-full items-center justify-center"><StudyMateLoader size="sm" /></div>}>
                             <Lanyard frontImage={cardImage} backImage={cardImage} />
                           </Suspense>
                         </div>
                       ) : (
                         <div id="printable-id-card" className="bg-white rounded-2xl shadow-sm border border-gray-100">
                           <IDCard user={cardData} isPrint={true} />
                         </div>
                       )}
                    </div>
                  </div>
                ) : null}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Update ID Card Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                  <input type="date" value={formData.dateOfBirth || ''} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Blood Group</label>
                  <select value={formData.bloodGroup || 'A+'} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm">
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              {cardData.role === 'student' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Admission No.</label>
                      <input type="text" value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">GR Number</label>
                      <input type="text" value={formData.grNumber} onChange={e => setFormData({...formData, grNumber: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Parent Name</label>
                    <input type="text" value={formData.parentName || ''} onChange={e => setFormData({...formData, parentName: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" placeholder="Father / Mother name" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Parent Contact No.</label>
                    <input type="text" value={formData.parentPhone || ''} onChange={e => setFormData({...formData, parentPhone: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" placeholder="+91 98765 43210" />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Employee ID</label>
                      <input type="text" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Designation</label>
                      <input type="text" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                    <input type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" placeholder="+91 98765 43210" />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                <input type="text" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" placeholder="Street name, City, Country" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Card Status</label>
                <select value={formData.idCardStatus} onChange={e => setFormData({...formData, idCardStatus: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="revoked">Revoked</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Updating details will automatically regenerate the verification QR code.</p>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition shadow-sm">Save & Regenerate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default IDCardManagement;
