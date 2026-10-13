import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import TimetableView from '../components/timetable/TimetableView';
import { Search, ArrowLeft, Download, User, Sparkles, ChevronRight, GraduationCap, CalendarCheck, Award, FileSpreadsheet } from 'lucide-react';

const PrincipalClassStudents = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClass = async () => {
      try {
        setLoading(true);
        const classRes = await api.get(`/classes/${classId}`);
        setClassData(classRes.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load class');
      } finally {
        setLoading(false);
      }
    };
    fetchClass();
  }, [classId]);

  const exportPDF = () => {
    if (!classData || classData.students.length === 0) return;
    const doc = new jsPDF();
    doc.text(`Student List - ${classData.className}`, 14, 15);
    doc.text(`Teacher: ${classData.teacherId?.name || 'Unassigned'}`, 14, 22);
    
    const tableColumn = ["#", "Student Name", "Roll / ID", "Attendance %", "Academic %", "Parent Phone"];
    const tableRows = classData.students.map((student, index) => [
      index + 1,
      student.name,
      student.studentId || 'N/A',
      `${student.attendancePercentage ?? 0}%`,
      `${student.academicScore ?? 0}%`,
      student.parentPhone || 'N/A'
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });
    doc.save(`Students_${classData.className}.pdf`);
  };

  const exportCSV = () => {
    if (!classData || classData.students.length === 0) return;
    const headers = ["S.No", "Student Name", "Student ID", "Attendance %", "Academic %", "Phone", "Address", "Parent Name", "Parent Phone"];
    const rows = classData.students.map((student, index) => [
      index + 1,
      `"${student.name}"`,
      `"${student.studentId || 'N/A'}"`,
      `"${student.attendancePercentage ?? 0}%"`,
      `"${student.academicScore ?? 0}%"`,
      `"${student.phone || 'N/A'}"`,
      `"${(student.address || 'N/A').replace(/"/g, '""')}"`,
      `"${student.parentName || 'N/A'}"`,
      `"${student.parentPhone || 'N/A'}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Students_${classData.className}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-pulse">
          <div className="h-32 bg-gray-200 dark:bg-slate-800 rounded-3xl"></div>
          <div className="h-12 bg-gray-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-44 bg-gray-200 dark:bg-slate-800 rounded-2xl"></div>
            <div className="h-44 bg-gray-200 dark:bg-slate-800 rounded-2xl"></div>
            <div className="h-44 bg-gray-200 dark:bg-slate-800 rounded-2xl"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !classData) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-16 space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            !
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">{error || 'Class not found'}</h2>
          <Link to="/principal/students" className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Class List
          </Link>
        </div>
      </Layout>
    );
  }

  const filteredStudents = (classData.students || []).filter((student) => {
    // Search filter
    let matchesSearch = true;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      matchesSearch = (
        student.name?.toLowerCase().includes(q) ||
        student.studentId?.toLowerCase().includes(q) ||
        student.grNumber?.toLowerCase().includes(q) ||
        student.rollNo?.toString().includes(q)
      );
    }
    
    return matchesSearch;
  });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        
        {/* Navigation & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link to="/principal/students" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
            <ArrowLeft className="w-4 h-4" /> Back to Class List
          </Link>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={exportCSV}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 rounded-xl hover:bg-emerald-200 text-xs font-bold transition"
              disabled={classData.students.length === 0}
            >
              <FileSpreadsheet className="w-4 h-4" /> Export CSV
            </button>
            <button 
              onClick={exportPDF}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 rounded-xl hover:bg-rose-200 text-xs font-bold transition"
              disabled={classData.students.length === 0}
            >
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>

        {/* Class Banner Card */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-bold border border-white/10">
              <GraduationCap className="w-4 h-4 text-emerald-300" /> Standard & Section
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">{classData.className}</h1>
            <p className="text-xs text-slate-300 flex items-center gap-3">
              <span>Class Teacher: <strong className="text-emerald-200">{classData.teacherId?.name || 'Not Assigned'}</strong></span>
              <span>•</span>
              <span>Total Enrolled: <strong className="text-emerald-200">{classData.students.length} Students</strong></span>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 px-5 py-4 rounded-2xl text-center z-10 shrink-0">
            <p className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Class Size</p>
            <p className="text-3xl font-black text-white">{classData.students.length}</p>
          </div>

          <div className="absolute right-0 top-0 bottom-0 opacity-10 w-1/2 bg-gradient-to-l from-emerald-400 to-transparent pointer-events-none"></div>
        </div>

        {/* Search & Student List Section */}
        <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-6">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 dark:border-[#1E293B] pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" /> Student Roster ({filteredStudents.length})
              </h2>
              <p className="text-xs text-gray-500">Click any student card to view their complete academic and intelligence report.</p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-400 mx-auto text-xl">
                🔍
              </div>
              <p className="text-sm font-bold text-gray-600 dark:text-slate-300">No students matched your search</p>
              <p className="text-xs text-gray-400">Try clearing your search query or searching by Roll No / Admission ID.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => {
                const attPct = student.attendancePercentage ?? 0;
                const acadPct = student.academicScore ?? 0;

                return (
                  <div
                    key={student._id}
                    onClick={() => navigate(`/principal/students/details/${student._id}`)}
                    className="group bg-gray-50 dark:bg-[#172235] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border border-gray-200 dark:border-[#334155] hover:border-emerald-300 dark:hover:border-emerald-700/60 p-5 rounded-2xl transition cursor-pointer flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-lg overflow-hidden shrink-0 shadow-sm">
                          {student.profilePic ? (
                            <img src={student.profilePic} alt={student.name} className="w-full h-full object-cover" />
                          ) : (
                            student.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-gray-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">
                            {student.name}
                          </h3>
                          <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                            Roll / ID: <strong className="text-gray-700 dark:text-slate-300">{student.studentId || 'N/A'}</strong>
                          </p>
                          <div className="flex gap-2 items-center mt-1">
                            {student.grNumber && student.grNumber !== 'N/A' && (
                              <p className="text-[10px] text-gray-400 font-medium">GR: {student.grNumber}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
                    </div>

                    {/* Stats Badges */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200/60 dark:border-gray-800">
                      
                      <div className="bg-white dark:bg-[#0b1120] p-2.5 rounded-xl text-center border border-gray-100 dark:border-[#1E293B]">
                        <span className="text-[10px] font-bold text-gray-400 block uppercase">Attendance</span>
                        <span className={`text-sm font-black ${
                          attPct >= 75 ? 'text-emerald-600' : attPct >= 50 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {attPct}%
                        </span>
                      </div>

                      <div className="bg-white dark:bg-[#0b1120] p-2.5 rounded-xl text-center border border-gray-100 dark:border-[#1E293B]">
                        <span className="text-[10px] font-bold text-gray-400 block uppercase">Academic</span>
                        <span className={`text-sm font-black ${
                          acadPct >= 60 ? 'text-purple-600' : acadPct >= 40 ? 'text-indigo-600' : 'text-amber-600'
                        }`}>
                          {acadPct}%
                        </span>
                      </div>

                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400 pt-1">
                      <span>View Intelligence Profile</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Timetable View Component */}
        <TimetableView classId={classId} />

      </div>
    </Layout>
  );
};

export default PrincipalClassStudents;
