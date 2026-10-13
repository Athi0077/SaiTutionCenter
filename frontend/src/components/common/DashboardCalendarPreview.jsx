import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DashboardCalendarPreview = ({ role }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        setLoading(true);
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const res = await api.get(`/calendar?month=${month}&year=${year}`);
        setEvents(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch calendar preview', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCalendar();
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Adjust to make Monday first day? No, standard is Sunday first
    // Let's stick to standard JS getDay() where 0 is Sunday
    
    const days = [];
    
    // blanks
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="text-gray-300"></div>);
    }
    
    const today = new Date();
    
    for (let d = 1; d <= daysInMonth; d++) {
      const iterDate = new Date(year, month, d);
      const isSunday = iterDate.getDay() === 0;
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
      
      const event = events.find(e => {
        const ed = new Date(e.date);
        return ed.getFullYear() === year && ed.getMonth() === month && ed.getDate() === d;
      });
      
      let cellClass = "w-7 h-7 flex items-center justify-center rounded-full mx-auto relative text-sm ";
      
      if (isToday) {
        cellClass += "bg-primary text-white font-bold ";
      } else if (event || isSunday) {
        cellClass += "text-red-500 font-bold ";
      } else {
        cellClass += "text-gray-700 font-medium ";
      }
      
      let indicator = null;
      if (event && !isToday) {
        indicator = <div className="absolute bottom-0 w-1 h-1 bg-red-500 rounded-full"></div>;
      }
      
      days.push(
        <div key={`day-${d}`} className="relative mx-auto flex items-center justify-center">
          <div className={cellClass}>
            {d}
            {indicator}
          </div>
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-soft">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">School Calendar</h3>
        <Link to={`/${role}/calendar`} className="text-sm font-semibold text-primary hover:underline">
          View Full Calendar →
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-6 bg-gray-50 p-2 rounded-xl border border-gray-100">
        <button onClick={handlePrevMonth} className="text-gray-500 hover:text-primary transition p-1">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold text-gray-800">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={handleNextMonth} className="text-gray-500 hover:text-primary transition p-1">
          <ChevronRight size={18} />
        </button>
      </div>
      
      {loading ? (
        <div className="h-[200px] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-3 gap-x-2 text-center">
            {renderCalendar()}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardCalendarPreview;
