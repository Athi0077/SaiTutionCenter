import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Clock, Plus, Trash2, Edit2, Check, X, Calendar, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

const TeacherTimetable = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [activeYear, setActiveYear] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    periods: []
  });

  const defaultPeriods = [
    { periodNumber: 1, startTime: '09:00', endTime: '09:45', type: 'regular', subject: '' },
    { periodNumber: 2, startTime: '09:45', endTime: '10:30', type: 'regular', subject: '' },
    { periodNumber: 3, startTime: '10:30', endTime: '10:45', type: 'break', subject: 'Break' },
    { periodNumber: 4, startTime: '10:45', endTime: '11:30', type: 'regular', subject: '' },
    { periodNumber: 5, startTime: '11:30', endTime: '12:15', type: 'regular', subject: '' },
    { periodNumber: 6, startTime: '12:15', endTime: '13:00', type: 'lunch', subject: 'Lunch' },
    { periodNumber: 7, startTime: '13:00', endTime: '13:45', type: 'regular', subject: '' },
    { periodNumber: 8, startTime: '13:45', endTime: '14:30', type: 'regular', subject: '' },
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchTimetable();
    }
  }, [selectedClass]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch academic year
      const yearRes = await api.get('/academic-years');
      const active = yearRes.data.data?.find(y => y.status === 'active');
      setActiveYear(active);

      // Fetch teacher's classes (filter for ones they are class teacher of)
      // Since the getMyClasses might not cleanly indicate class teacher vs subject teacher,
      // we could rely on checking if the backend /api/timetable creation allows it, 
      // but let's fetch my classes
      const classRes = await api.get('/classes/my-classes');
      
      // Let's assume the teacher can select any of their assigned classes, but backend will reject if not class teacher
      // Ideally we filter classes where cls.teacherId === currentUser._id
      const userRes = await api.get('/auth/me'); // Just to get current user ID
      const myId = userRes.data.user?.id || userRes.data.user?._id;
      
      const classTeacherOf = classRes.data.data?.filter(c => {
        const tId = c.teacherId?._id || c.teacherId;
        return String(tId) === String(myId);
      }) || [];
      setClasses(classTeacherOf);
      
      
      if (classTeacherOf.length > 0) {
        setSelectedClass(classTeacherOf[0]._id);
        fetchClassSubjects(classTeacherOf[0]._id);
        fetchClassAssignments(classTeacherOf[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassSubjects = async (classId) => {
    try {
      const res = await api.get(`/subjects`);
      setSubjects(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClassAssignments = async (classId) => {
    try {
      // Find the class details to get standard and section
      const classRes = await api.get(`/classes/${classId}`);
      if (classRes.data.success) {
         const cls = classRes.data.data;
         const standardId = cls.standardId || cls.standard; // standard might be string, need to handle this
         const allAssignments = await api.get(`/teacher-assignments`);
         // Filter assignments for this class
         const filtered = allAssignments.data.data.filter(a => 
           `${a.standardId?.name} - ${a.sectionId?.name}` === cls.className
         );
         setAssignments(filtered);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      fetchTimetable();
      fetchClassSubjects(selectedClass);
      fetchClassAssignments(selectedClass);
    }
  }, [selectedClass]);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/timetable/class/${selectedClass}`);
      setTimetable(res.data.data);
      setFormData({
        workingDays: res.data.data.workingDays || [],
        periods: res.data.data.periods || []
      });
      setIsEditing(false);
    } catch (err) {
      // 404 means no timetable yet
      setTimetable(null);
      setFormData({
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        periods: []
      });
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!activeYear) {
        toast.error("No active academic year found. Cannot save timetable.");
        return;
      }
      
      if (timetable) {
        // Update existing
        await api.put(`/timetable/${timetable._id}`, formData);
        toast.success("Timetable updated successfully");
      } else {
        // Create new
        await api.post('/timetable', {
          classId: selectedClass,
          academicYearId: activeYear._id,
          workingDays: formData.workingDays,
          periods: formData.periods
        });
        toast.success("Timetable created successfully");
      }
      setIsEditing(false);
      fetchTimetable();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save timetable');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this timetable?")) return;
    try {
      await api.delete(`/timetable/${timetable._id}`);
      toast.success("Timetable deleted successfully");
      fetchTimetable();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete timetable');
    }
  };

  const initializeDefaultPeriods = () => {
    let newPeriods = [];
    formData.workingDays.forEach(day => {
      defaultPeriods.forEach(dp => {
        newPeriods.push({ ...dp, day });
      });
    });
    setFormData({ ...formData, periods: newPeriods });
    setIsEditing(true);
  };

  const handlePeriodChange = (day, periodNumber, field, value) => {
    const updatedPeriods = formData.periods.map(p => {
      if (p.day === day && p.periodNumber === periodNumber) {
        let updated = { ...p, [field]: value };
        if (field === 'subjectId') {
          const subDoc = subjects.find(s => s._id === value);
          updated.subject = subDoc ? subDoc.name : '';
          
          // Auto-assign teacher
          const possibleAssignments = assignments.filter(a => a.subjectId?._id === value || a.subject === updated.subject);
          if (possibleAssignments.length === 1) {
            updated.subjectTeacherId = possibleAssignments[0].teacherId?._id || possibleAssignments[0].teacherId;
          } else {
            updated.subjectTeacherId = '';
          }
        }
        return updated;
      }
      return p;
    });
    setFormData({ ...formData, periods: updatedPeriods });
  };

  const handleTimeChange = (periodNumber, field, value) => {
    const updatedPeriods = formData.periods.map(p => {
      if (p.periodNumber === periodNumber) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setFormData({ ...formData, periods: updatedPeriods });
  };

  const formatTo12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  // Group periods by periodNumber for the grid display
  const getPeriodsGrid = (periodsArray) => {
    if (!periodsArray || periodsArray.length === 0) return [];
    // Find unique period numbers
    const pNums = [...new Set(periodsArray.map(p => p.periodNumber))].sort((a,b) => a-b);
    
    return pNums.map(num => {
      const row = { periodNumber: num };
      let startTime = '';
      let endTime = '';
      let type = 'regular';
      
      formData.workingDays.forEach(day => {
        const p = periodsArray.find(x => x.day === day && x.periodNumber === num);
        if (p) {
          row[day] = p;
          if (!startTime) startTime = p.startTime;
          if (!endTime) endTime = p.endTime;
          if (p.type !== 'regular') type = p.type;
        }
      });
      row.startTime = startTime;
      row.endTime = endTime;
      row.type = type;
      return row;
    });
  };

  const gridData = getPeriodsGrid(formData.periods);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Manage Timetable</h2>
          
          <div className="flex items-center gap-3">
            {classes.length > 1 && (
              <select 
                value={selectedClass || ''} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
              >
                {classes.map(c => (
                  <option key={c._id} value={c._id}>{c.className}</option>
                ))}
              </select>
            )}
            
            {timetable && !isEditing && (
              <>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition"
                >
                  <Edit2 size={18} /> Edit
                </button>
                <button 
                  onClick={() => window.print()}
                  className="hidden sm:flex bg-gray-100 text-gray-700 font-semibold px-4 py-2 rounded-xl items-center gap-2 hover:bg-gray-200 transition"
                >
                  <Printer size={18} /> Print
                </button>
                <button 
                  onClick={handleDelete}
                  className="bg-red-50 text-red-600 font-semibold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-red-100 transition border border-red-200"
                >
                  <Trash2 size={18} /> Delete
                </button>
              </>
            )}
            {(!timetable && !isEditing) && classes.length > 0 && (
              <button 
                onClick={initializeDefaultPeriods}
                className="bg-green-600 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-green-700 transition"
              >
                <Plus size={18} /> Create Timetable
              </button>
            )}
            {isEditing && (
              <>
                <button 
                  onClick={() => fetchTimetable()}
                  className="bg-gray-100 text-gray-700 font-semibold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-200 transition"
                >
                  <X size={18} /> Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="bg-green-600 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-green-700 transition"
                >
                  <Check size={18} /> Save
                </button>
              </>
            )}
          </div>
        </div>

        {!loading && classes.length === 0 && (
          <div className="bg-white p-8 rounded-2xl shadow-soft text-center text-gray-500">
            You are not assigned as a Class Teacher for any class.
          </div>
        )}

        {!loading && classes.length > 0 && (!timetable && !isEditing) && (
          <div className="bg-white p-12 rounded-2xl shadow-soft flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-500">
              <Calendar size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Timetable Found</h3>
            <p className="text-gray-500 max-w-md mb-6">
              Create a new timetable for {classes.find(c => c._id === selectedClass)?.className}.
            </p>
            <button 
              onClick={initializeDefaultPeriods}
              className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition"
            >
              <Plus size={20} /> Create Now
            </button>
          </div>
        )}

        {(timetable || isEditing) && (
          <div className="bg-white rounded-2xl shadow-soft p-6 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th className="p-4 bg-gray-50 border border-gray-200 text-center font-bold text-gray-700 w-32">
                    Time
                  </th>
                  {formData.workingDays.map(day => (
                    <th key={day} className="p-4 bg-gray-50 border border-gray-200 text-center font-bold text-gray-700">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="p-3 border border-gray-200 text-center bg-gray-50 font-medium text-gray-600 text-sm align-middle">
                      {isEditing ? (
                        <div className="flex flex-col gap-1 items-center justify-center">
                          <input 
                            type="time" 
                            value={row.startTime || ''} 
                            onChange={(e) => handleTimeChange(row.periodNumber, 'startTime', e.target.value)}
                            className="w-24 p-1 text-center border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-500"
                          />
                          <span className="text-gray-400 text-[10px] uppercase font-bold">to</span>
                          <input 
                            type="time" 
                            value={row.endTime || ''} 
                            onChange={(e) => handleTimeChange(row.periodNumber, 'endTime', e.target.value)}
                            className="w-24 p-1 text-center border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      ) : (
                        <div>{formatTo12Hour(row.startTime)} - {formatTo12Hour(row.endTime)}</div>
                      )}
                    </td>
                    
                    {row.type === 'break' || row.type === 'lunch' ? (
                       <td colSpan={formData.workingDays.length} className="p-3 border border-gray-200 text-center bg-yellow-50 text-yellow-700 font-bold uppercase tracking-wider">
                         {row.type}
                       </td>
                    ) : (
                      formData.workingDays.map(day => {
                        const p = row[day];
                        if (!p) return <td key={day} className="border border-gray-200 p-2"></td>;
                        
                        return (
                          <td key={day} className="p-2 border border-gray-200 align-top">
                            {isEditing ? (
                              <div className="flex flex-col gap-2">
                                <select
                                  value={p.subjectId || ''}
                                  onChange={(e) => handlePeriodChange(day, p.periodNumber, 'subjectId', e.target.value)}
                                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium"
                                >
                                  <option value="">Select Subject</option>
                                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                                {p.subjectId && (
                                  <select
                                    value={p.subjectTeacherId || ''}
                                    onChange={(e) => handlePeriodChange(day, p.periodNumber, 'subjectTeacherId', e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs font-medium"
                                  >
                                    <option value="">Select Teacher</option>
                                    {assignments
                                      .filter(a => a.subjectId?._id === p.subjectId || a.subject === p.subject)
                                      .map(a => (
                                        <option key={a.teacherId?._id} value={a.teacherId?._id}>
                                          {a.teacherId?.name}
                                        </option>
                                      ))
                                    }
                                  </select>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full p-2 rounded-lg bg-blue-50/50 min-h-[60px]">
                                <span className="font-bold text-blue-800 text-center">{p.subject || '-'}</span>
                                {p.subjectTeacherId && (
                                  <span className="text-xs text-gray-500 mt-1">
                                    {p.subjectTeacherId?.name || (assignments.find(a => a.teacherId?._id === p.subjectTeacherId)?.teacherId?.name)}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        )
                      })
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherTimetable;
