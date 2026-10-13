import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Calendar, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

const StudentTimetable = () => {
  const { currentUser } = useContext(AuthContext);
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [childrenData, setChildrenData] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const init = async () => {
      if (currentUser?.role === 'parent') {
        try {
          const res = await api.get('/dashboard/parent');
          const children = res.data.data.children || [];
          setChildrenData(children);
          if (children.length > 0) {
            fetchData(children[0]._id);
          } else {
            setLoading(false);
          }
        } catch (err) {
          console.error(err);
          setLoading(false);
        }
      } else {
        fetchData();
      }
    };
    if (currentUser) {
       init();
    }
  }, [currentUser]);

  const fetchData = async (studentId = null) => {
    try {
      setLoading(true);
      setTimetable(null);
      // Student gets their class info
      const url = studentId ? `/classes/my-class?studentId=${studentId}` : '/classes/my-class';
      const classRes = await api.get(url);
      const classId = classRes.data.data?._id;

      if (classId) {
        const timeRes = await api.get(`/timetable/class/${classId}`);
        setTimetable(timeRes.data.data);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error('Failed to load timetable');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPeriodsGrid = (periodsArray) => {
    if (!periodsArray || periodsArray.length === 0) return [];
    const pNums = [...new Set(periodsArray.map(p => p.periodNumber))].sort((a,b) => a-b);
    
    return pNums.map(num => {
      const row = { periodNumber: num };
      let startTime = '';
      let endTime = '';
      let type = 'regular';
      
      const workingDays = timetable.workingDays || [];
      workingDays.forEach(day => {
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
      row.type = type;
      return row;
    });
  };

  const formatTo12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const workingDays = timetable?.workingDays || [];
  const gridData = getPeriodsGrid(timetable?.periods);

  return (
    <Layout>
      <div className="space-y-6">
        {currentUser?.role === 'parent' && childrenData.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {childrenData.map((child, index) => (
              <button
                key={child._id}
                onClick={() => {
                  setActiveTab(index);
                  fetchData(child._id);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition whitespace-nowrap ${
                  activeTab === index 
                    ? 'bg-primary text-white shadow-md shadow-primary/20' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  activeTab === index ? 'bg-white/20' : 'bg-primary/10 text-primary'
                }`}>
                  {child.name.charAt(0)}
                </div>
                {child.name}
              </button>
            ))}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Class Timetable</h2>
          
          {timetable && (
            <button 
              onClick={() => window.print()}
              className="hidden sm:flex bg-gray-100 text-gray-700 font-semibold px-4 py-2 rounded-xl items-center gap-2 hover:bg-gray-200 transition"
            >
              <Printer size={18} /> Print
            </button>
          )}
        </div>

        {!loading && !timetable && (
          <div className="bg-white p-12 rounded-2xl shadow-soft flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-500">
              <Calendar size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Timetable Available</h3>
            <p className="text-gray-500 max-w-md">
              Your class teacher has not uploaded the timetable yet.
            </p>
          </div>
        )}

        {timetable && (
          <div className="bg-white rounded-2xl shadow-soft p-6 overflow-x-auto">
            <div className="mb-4 text-sm font-semibold text-gray-500">
              Academic Year: {timetable.academicYearId?.year} | Class: {timetable.classId?.className}
            </div>
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th className="p-4 bg-gray-50 border border-gray-200 text-center font-bold text-gray-700 w-32">
                    Time
                  </th>
                  {workingDays.map(day => (
                    <th key={day} className="p-4 bg-gray-50 border border-gray-200 text-center font-bold text-gray-700">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="p-3 border border-gray-200 text-center bg-gray-50 font-medium text-gray-600 text-sm">
                      <div>{formatTo12Hour(row.startTime)} - {formatTo12Hour(row.endTime)}</div>
                    </td>
                    
                    {row.type === 'break' || row.type === 'lunch' ? (
                       <td colSpan={workingDays.length} className="p-3 border border-gray-200 text-center bg-yellow-50 text-yellow-700 font-bold uppercase tracking-wider">
                         {row.type}
                       </td>
                    ) : (
                      workingDays.map(day => {
                        const p = row[day];
                        if (!p) return <td key={day} className="border border-gray-200 p-2"></td>;
                        
                        return (
                          <td key={day} className="p-2 border border-gray-200 align-top">
                            <div className="flex flex-col items-center justify-center h-full p-2 rounded-lg bg-blue-50/50 min-h-[60px]">
                              <span className="font-bold text-blue-800 text-center">{p.subject || '-'}</span>
                            </div>
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

export default StudentTimetable;
