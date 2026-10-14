import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import { getStudents, updateStudent, deleteStudent } from '../utils/generalRegisterApi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil,
  Trash2,
  X,
  IndianRupee,
  Search,
  AlertTriangle,
  GraduationCap,
  Users,
  Check,
  Loader2,
  ChevronDown,
  ChevronsUpDown
} from 'lucide-react';

const PREDEFINED_STANDARDS = [
  '1st Standard',
  '2nd Standard',
  '3rd Standard',
  '4th Standard',
  '5th Standard',
  '6th Standard',
  '7th Standard',
  '8th Standard',
  '9th Standard',
  '10th Standard',
  '11th Standard',
  '12th Standard'
];

const TeacherStudentList = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useContext(AuthContext);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Accordion state: map of { [standardName]: boolean }
  const [expandedStandards, setExpandedStandards] = useState({});

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    studentId: '',
    name: '',
    password: '',
    gender: 'Male',
    standardId: '',
    feeAmount: '',
    feePeriod: 'Monthly',
    feeDetails: 'Monthly Tuition'
  });

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, classesRes, standardsRes] = await Promise.all([
        getStudents(),
        api.get('/classes/my-classes'),
        api.get('/standards')
      ]);

      const loadedStudents = studentsRes.data || [];
      const loadedClasses = classesRes.data?.data || [];
      const loadedStandards = standardsRes.data?.data || [];

      setStudents(loadedStudents);
      setClasses(loadedClasses);
      setStandards(loadedStandards);

      // Default expand the first standard that contains students
      if (loadedStudents.length > 0) {
        const firstStdWithStudents = loadedStandards.find(std => 
          loadedStudents.some(s => 
            s.standardId === std._id || 
            s.className === std.name || 
            s.standardName === std.name
          )
        );
        if (firstStdWithStudents) {
          setExpandedStandards({ [firstStdWithStudents.name]: true });
        } else {
          // If none matched standard explicitly, expand 6th Standard or first
          setExpandedStandards({ '6th Standard': true });
        }
      }
    } catch (error) {
      toast.error('Failed to load students data');
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine standard name for a student
  const getStudentStandardName = (student) => {
    if (student.className && student.className !== 'Unassigned') {
      return student.className;
    }
    if (student.standardName && student.standardName !== 'Unassigned') {
      return student.standardName;
    }
    if (student.standardId) {
      const foundStd = standards.find(s => s._id?.toString() === student.standardId?.toString());
      if (foundStd) return foundStd.name;
    }
    const foundClass = classes.find(c => c.students && c.students.some(s => {
      const sId = (s && s._id ? s._id : s)?.toString();
      const targetId = (student && student._id ? student._id : student)?.toString();
      return sId === targetId;
    }));
    if (foundClass?.className) return foundClass.className;

    return 'Unassigned';
  };

  // Sorted list of all active standards
  const sortedStandards = useMemo(() => {
    const list = [...standards];
    list.sort((a, b) => {
      const indexA = PREDEFINED_STANDARDS.indexOf(a.name);
      const indexB = PREDEFINED_STANDARDS.indexOf(b.name);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [standards]);

  // Group students by standard name
  const groupedData = useMemo(() => {
    const map = {};

    sortedStandards.forEach(std => {
      map[std.name] = [];
    });
    map['Unassigned'] = [];

    students.forEach(student => {
      const stdName = getStudentStandardName(student);
      if (!map[stdName]) {
        map[stdName] = [];
      }
      map[stdName].push(student);
    });

    return map;
  }, [students, sortedStandards, standards, classes]);

  // Toggle single standard expansion
  const toggleStandard = (standardName) => {
    setExpandedStandards(prev => ({
      ...prev,
      [standardName]: !prev[standardName]
    }));
  };

  // Toggle all standards
  const allExpanded = sortedStandards.length > 0 && sortedStandards.every(s => expandedStandards[s.name]);
  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedStandards({});
    } else {
      const all = {};
      sortedStandards.forEach(s => { all[s.name] = true; });
      all['Unassigned'] = true;
      setExpandedStandards(all);
    }
  };

  // Auto-expand cards that match search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const newExpanded = { ...expandedStandards };
      Object.entries(groupedData).forEach(([stdName, stdStudents]) => {
        const hasMatch = stdStudents.some(s =>
          (s.name && s.name.toLowerCase().includes(query)) ||
          (s.studentId && s.studentId.toLowerCase().includes(query))
        );
        if (hasMatch) {
          newExpanded[stdName] = true;
        }
      });
      setExpandedStandards(newExpanded);
    }
  }, [searchQuery, groupedData]);

  // Open Edit Modal
  const handleOpenEdit = (student) => {
    const currentClass = getStudentStandardName(student);
    let matchedStandardId = student.standardId;

    if (!matchedStandardId && standards.length > 0) {
      const foundStd = standards.find(s => s.name === currentClass);
      if (foundStd) {
        matchedStandardId = foundStd._id;
      } else {
        matchedStandardId = standards[0]._id;
      }
    }

    setEditForm({
      id: student._id,
      studentId: student.studentId || '',
      name: student.name || '',
      password: '',
      gender: student.gender || 'Male',
      standardId: matchedStandardId || (standards[0]?._id || ''),
      feeAmount: student.feeAmount !== undefined && student.feeAmount !== null ? student.feeAmount : '',
      feePeriod: student.feePeriod || 'Monthly',
      feeDetails: student.feePeriod === 'Yearly' ? 'Yearly Tuition Fee' : 'Monthly Tuition Fee'
    });
    setIsEditOpen(true);
  };

  // Save Edit Form
  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!editForm.studentId.trim()) {
      toast.error('Student ID is required');
      return;
    }
    if (!editForm.name.trim()) {
      toast.error('Student name is required');
      return;
    }
    if (editForm.feeAmount === '' || editForm.feeAmount === undefined || isNaN(Number(editForm.feeAmount))) {
      toast.error('Please enter a valid Fee Amount');
      return;
    }

    try {
      setIsSaving(true);
      await updateStudent(editForm.id, {
        studentId: editForm.studentId.trim(),
        name: editForm.name.trim(),
        password: editForm.password.trim(),
        gender: editForm.gender,
        standardId: editForm.standardId,
        feeAmount: Number(editForm.feeAmount),
        feePeriod: editForm.feePeriod,
        feeDetails: editForm.feePeriod === 'Yearly' ? 'Yearly Tuition Fee' : 'Monthly Tuition Fee'
      });

      toast.success('Student updated successfully');
      setIsEditOpen(false);
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update student');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (student) => {
    setDeletingStudent(student);
    setIsDeleteOpen(true);
  };

  // Confirm Student Delete
  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    try {
      setIsDeleting(true);
      const res = await deleteStudent(deletingStudent._id);
      toast.success(res.message || 'Student deleted successfully');
      setIsDeleteOpen(false);
      setDeletingStudent(null);
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete student');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to render students table for an expanded standard
  const renderStudentTable = (studentList, standardName) => {
    const filteredList = studentList.filter(student => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (student.name && student.name.toLowerCase().includes(q)) ||
        (student.studentId && student.studentId.toLowerCase().includes(q))
      );
    });

    if (filteredList.length === 0) {
      return (
        <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
          {searchQuery ? `No students matching "${searchQuery}" in ${standardName}.` : `No students enrolled in ${standardName}.`}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-sm min-w-[700px]">
          <thead className="bg-gray-50/70 dark:bg-[#172235]/60 border-b border-gray-100 dark:border-[#1E293B]">
            <tr>
              <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Student ID</th>
              <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Name</th>
              <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Gender</th>
              <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Tuition Fees</th>
              <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-center w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#1E293B]">
            {filteredList.map((student) => {
              const hasFee = student.feeAmount !== '' && student.feeAmount !== undefined && student.feeAmount !== null;

              return (
                <tr
                  key={student._id}
                  className="hover:bg-gray-50/80 dark:hover:bg-[#172235]/50 transition-colors"
                >
                  <td className="p-4 font-mono font-bold text-blue-700 dark:text-blue-400">
                    {student.studentId}
                  </td>
                  <td className="p-4 font-bold text-gray-800 dark:text-white">
                    {student.name}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">
                    {student.gender || '—'}
                  </td>
                  <td className="p-4">
                    {hasFee ? (
                      <div className="flex items-center gap-1.5 font-semibold text-gray-800 dark:text-gray-200">
                        <span className="text-green-600 dark:text-green-400">
                          ₹{Number(student.feeAmount).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                          / {student.feePeriod === 'Yearly' ? 'Yr' : 'Mo'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">No fee assigned</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(student);
                        }}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/60 transition active:scale-95 cursor-pointer"
                        title="Edit Student"
                        aria-label="Edit Student"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDelete(student);
                        }}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/60 transition active:scale-95 cursor-pointer"
                        title="Delete Student"
                        aria-label="Delete Student"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
              My Students
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Select a standard to view, edit, or manage enrolled students.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleExpandAll}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-[#172235] hover:bg-gray-200 dark:hover:bg-[#1E293B] text-gray-700 dark:text-gray-300 rounded-xl transition cursor-pointer border border-gray-200 dark:border-[#334155]"
            >
              <ChevronsUpDown size={14} />
              <span>{allExpanded ? 'Collapse All' : 'Expand All'}</span>
            </button>
            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 px-3.5 py-1.5 rounded-xl text-indigo-700 dark:text-indigo-300 text-sm font-semibold">
              <Users size={16} />
              <span>{students.length} Total Students</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-[#0B1120] rounded-xl shadow-soft border border-gray-100 dark:border-[#1E293B] p-4 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student by name or Student ID..."
              className="w-full pl-10 pr-9 py-2 text-sm border border-gray-200 dark:border-[#334155] rounded-xl bg-gray-50 dark:bg-[#172235] text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="hidden sm:block text-xs text-gray-400">
            Click any standard card below to expand its student list
          </div>
        </div>

        {/* Standard Accordion Cards (Matching User's Screenshot) */}
        {loading ? (
          <div className="text-center py-16 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-100 dark:border-[#1E293B]">
            <Loader2 className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading standards and student lists...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedStandards.map((std) => {
              const stdStudents = groupedData[std.name] || [];
              const isExpanded = !!expandedStandards[std.name];

              return (
                <div
                  key={std._id || std.name}
                  className="bg-white dark:bg-[#0B1120] rounded-2xl shadow-soft border border-gray-100 dark:border-[#1E293B] overflow-hidden transition-all duration-200"
                >
                  {/* Standard Header Row - Exact UI matching uploaded image */}
                  <button
                    type="button"
                    onClick={() => toggleStandard(std.name)}
                    className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-gray-50/60 dark:hover:bg-[#172235]/40 transition cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                        {std.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-3.5 py-1 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-[#172235] border border-gray-200 dark:border-gray-700 rounded-full shadow-2xs">
                        {stdStudents.length} Students
                      </span>
                      <div
                        className={`p-1 text-gray-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-gray-600 dark:text-gray-200' : ''
                        }`}
                      >
                        <ChevronDown size={20} />
                      </div>
                    </div>
                  </button>

                  {/* Expanded Student List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-100 dark:border-[#1E293B]"
                      >
                        {renderStudentTable(stdStudents, std.name)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Unassigned Students Card (Shown only if any students are unassigned) */}
            {groupedData['Unassigned'] && groupedData['Unassigned'].length > 0 && (
              <div className="bg-white dark:bg-[#0B1120] rounded-2xl shadow-soft border border-amber-200 dark:border-amber-900/40 overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => toggleStandard('Unassigned')}
                  className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-amber-800 dark:text-amber-300">
                      Unassigned Students
                    </h3>
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      (Needs Class Assignment)
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3.5 py-1 text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-full">
                      {groupedData['Unassigned'].length} Students
                    </span>
                    <div
                      className={`p-1 text-amber-500 transition-transform duration-200 ${
                        expandedStandards['Unassigned'] ? 'rotate-180' : ''
                      }`}
                    >
                      <ChevronDown size={20} />
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {expandedStandards['Unassigned'] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-amber-100 dark:border-amber-900/30"
                    >
                      {renderStudentTable(groupedData['Unassigned'], 'Unassigned')}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {sortedStandards.length === 0 && (
              <div className="p-12 text-center bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-100 dark:border-[#1E293B] text-gray-500">
                <GraduationCap size={44} className="mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-gray-700 dark:text-gray-300">No standards configured yet.</p>
                <p className="text-xs text-gray-400 mt-1">Please register standards in School Management.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* EDIT MODAL (Modeled after Registration Form) */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-center items-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-[#0B1120] rounded-2xl shadow-xl border border-gray-100 dark:border-[#1E293B] w-full max-w-2xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-[#1E293B]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                    <Pencil size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Edit Student Details</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Update student information, class assignment, and tuition fee setup.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form matching Image 2 */}
              <form onSubmit={handleSaveEdit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Student ID / Roll No */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Student ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full border border-gray-200 dark:border-[#334155] bg-gray-50 dark:bg-[#172235] text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      value={editForm.studentId}
                      onChange={(e) => setEditForm({ ...editForm, studentId: e.target.value })}
                      placeholder="e.g. STU001"
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full border border-gray-200 dark:border-[#334155] bg-gray-50 dark:bg-[#172235] text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Student Full Name"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password <span className="text-xs text-gray-400 font-normal">(leave blank to keep current)</span>
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 dark:border-[#334155] bg-gray-50 dark:bg-[#172235] text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder="New password or blank"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      className="w-full border border-gray-200 dark:border-[#334155] bg-gray-50 dark:bg-[#172235] text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition cursor-pointer"
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Standard */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Standard <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      className="w-full border border-gray-200 dark:border-[#334155] bg-gray-50 dark:bg-[#172235] text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition cursor-pointer"
                      value={editForm.standardId}
                      onChange={(e) => setEditForm({ ...editForm, standardId: e.target.value })}
                    >
                      {standards.length === 0 && <option value="">No standards available</option>}
                      {standards.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Initial Fee Setup */}
                <div className="border-t border-gray-200 dark:border-[#1E293B] pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <IndianRupee size={18} className="text-green-600" /> Initial Fee Setup
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#172235] px-3 py-1 rounded-full font-semibold border border-gray-200 dark:border-[#334155]">
                      Auto resets on cycle start
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fee Amount (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="number"
                        className="w-full border border-gray-200 dark:border-[#334155] bg-gray-50 dark:bg-[#172235] text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        value={editForm.feeAmount}
                        onChange={(e) => setEditForm({ ...editForm, feeAmount: e.target.value })}
                        placeholder="e.g. 2500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fee Frequency / Cycle <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        className="w-full border border-gray-200 dark:border-[#334155] bg-gray-50 dark:bg-[#172235] text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition cursor-pointer font-medium"
                        value={editForm.feePeriod}
                        onChange={(e) => {
                          const period = e.target.value;
                          setEditForm(prev => ({
                            ...prev,
                            feePeriod: period,
                            feeDetails: period === 'Monthly' ? 'Monthly Tuition Fee' : 'Yearly Tuition Fee'
                          }));
                        }}
                      >
                        <option value="Monthly">📅 Month (Auto 1st Pending)</option>
                        <option value="Yearly">📆 Year (Auto Yearly Incomplete)</option>
                      </select>
                    </div>
                  </div>

                  {/* Informational Banner */}
                  <div className="mt-4 p-3 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl text-xs text-blue-800 dark:text-blue-300">
                    {editForm.feePeriod === 'Monthly' ? (
                      <span>🔄 <strong>Monthly Cycle:</strong> Every 1st date of the month, fee status automatically changes to <strong>Pending</strong>. Teachers can manually mark it <strong>Completed</strong> when the student pays.</span>
                    ) : (
                      <span>🔄 <strong>Yearly Cycle:</strong> Once a year, fee status automatically changes to <strong>Incomplete (Pending)</strong>. Teachers can manually mark it <strong>Completed</strong> when the student pays.</span>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-[#1E293B]">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#172235] hover:bg-gray-200 dark:hover:bg-[#1E293B] rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {isDeleteOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-center items-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0B1120] rounded-2xl shadow-xl border border-gray-100 dark:border-[#1E293B] w-full max-w-md p-6 text-center space-y-4"
            >
              <div className="w-14 h-14 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={28} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Student?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Are you sure you want to delete <strong className="text-gray-800 dark:text-gray-200">{deletingStudent?.name}</strong> (ID: {deletingStudent?.studentId})?
                </p>
                <p className="text-xs text-red-500 dark:text-red-400 mt-1 font-medium">
                  This will remove the student account along with their class enrollment and tuition fee records.
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteOpen(false);
                    setDeletingStudent(null);
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#172235] hover:bg-gray-200 dark:hover:bg-[#1E293B] rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-6 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl shadow-md hover:bg-red-700 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Confirm Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </Layout>
  );
};

export default TeacherStudentList;
