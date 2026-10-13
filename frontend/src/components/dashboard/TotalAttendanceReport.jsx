import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Calendar, Filter, MoreHorizontal } from 'lucide-react';

const TotalAttendanceReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [dateRange, setDateRange] = useState('7days');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [dateRange, selectedClass]);

  const fetchClasses = async () => {
    try {
      // Assuming a generic endpoint to get all classes in the school
      // Could be /classes or /standards. In PrincipalDashboard it fetches /standards. 
      // Let's just fetch /classes
      const res = await api.get('/classes');
      setClasses(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch classes", err);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      let start = new Date();
      let end = new Date();
      
      if (dateRange === '7days') {
        start.setDate(now.getDate() - 6);
      } else if (dateRange === '30days') {
        start.setDate(now.getDate() - 29);
      } else if (dateRange === 'thisMonth') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        // default 7 days
        start.setDate(now.getDate() - 6);
      }

      let url = `/attendance/report/total?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
      if (selectedClass) {
        url += `&classId=${selectedClass}`;
      }

      const res = await api.get(url);
      
      // format dates for display
      const formattedData = res.data.data.map(item => {
        const d = new Date(item.date);
        return {
          ...item,
          displayDate: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`
        };
      });

      setData(formattedData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance report');
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg text-sm border border-gray-700">
          <p className="font-bold mb-2">{data.displayDate}</p>
          <div className="space-y-1">
             <div className="flex justify-between gap-4">
               <span className="text-gray-400">Present</span>
               <span className="font-semibold text-green-400">{data.presentCount}</span>
             </div>
             <div className="flex justify-between gap-4">
               <span className="text-gray-400">Absent/Leave</span>
               <span className="font-semibold text-red-400">{data.absentCount + data.leaveCount}</span>
             </div>
             <div className="flex justify-between gap-4 pt-2 mt-2 border-t border-gray-700">
               <span className="text-gray-300">Percentage</span>
               <span className="font-bold">{data.attendancePercentage}%</span>
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Total Attendance Report</h2>
          <p className="text-sm text-gray-500">School-wide attendance percentage</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <select 
              className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.className || `${c.standard} - ${c.section}`}</option>
              ))}
            </select>
            <Filter size={14} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select 
              className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
            </select>
            <Calendar size={14} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
          </div>

          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="h-72 w-full">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-3">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-40 w-full bg-gray-100 rounded-lg mt-4"></div>
            </div>
          </div>
        ) : error ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
            <p className="text-red-500 mb-2">{error}</p>
            <button onClick={fetchReportData} className="text-sm text-primary font-semibold hover:underline">Try Again</button>
          </div>
        ) : data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-500">No attendance data found for the selected period.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '5 5' }} />
              <Area 
                type="monotone" 
                dataKey="attendancePercentage" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorPercentage)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default TotalAttendanceReport;
