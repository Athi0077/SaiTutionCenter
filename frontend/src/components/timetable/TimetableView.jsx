import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Calendar } from 'lucide-react';

const TimetableView = ({ classId }) => {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classId) {
      fetchData();
    }
  }, [classId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const timeRes = await api.get(`/timetable/class/${classId}`);
      setTimetable(timeRes.data.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Failed to load timetable', err);
      }
      setTimetable(null);
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

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading timetable...</div>;
  }

  if (!timetable) {
    return (
      <div className="bg-gray-50 p-8 rounded-2xl flex flex-col items-center text-center mt-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 text-blue-500">
          <Calendar size={24} />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">No Timetable Available</h3>
        <p className="text-gray-500 text-sm">
          The class teacher has not uploaded the timetable yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">Class Timetable</h3>
      <div className="bg-white rounded-2xl shadow-soft p-4 sm:p-6 overflow-x-auto border border-gray-100">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="p-3 bg-gray-50 border border-gray-200 text-center font-bold text-gray-700 w-32">
                Time
              </th>
              {workingDays.map(day => (
                <th key={day} className="p-3 bg-gray-50 border border-gray-200 text-center font-bold text-gray-700">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gridData.map((row, idx) => (
              <tr key={idx}>
                <td className="p-2 border border-gray-200 text-center bg-gray-50 font-medium text-gray-600 text-sm">
                  <div>{formatTo12Hour(row.startTime)} - {formatTo12Hour(row.endTime)}</div>
                </td>
                
                {row.type === 'break' || row.type === 'lunch' ? (
                   <td colSpan={workingDays.length} className="p-2 border border-gray-200 text-center bg-yellow-50 text-yellow-700 font-bold uppercase tracking-wider text-xs">
                     {row.type}
                   </td>
                ) : (
                  workingDays.map(day => {
                    const p = row[day];
                    if (!p) return <td key={day} className="border border-gray-200 p-2"></td>;
                    
                    return (
                      <td key={day} className="p-2 border border-gray-200 align-top">
                        <div className="flex flex-col items-center justify-center h-full p-2 rounded-lg bg-blue-50/50 min-h-[50px]">
                          <span className="font-bold text-blue-800 text-center text-sm">{p.subject || '-'}</span>
                          {p.subjectTeacherId && (
                            <span className="text-[10px] text-gray-500 mt-1">{p.subjectTeacherId.name}</span>
                          )}
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
    </div>
  );
};

export default TimetableView;
