import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, XCircle, AlertTriangle, Loader } from 'lucide-react';
import StudyMateLoader from '../components/common/StudyMateLoader';

const VerifyID = () => {
  const { verificationId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/id-card/verify/${verificationId}`);
        setData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Verification Failed');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [verificationId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-center text-white">
          <h1 className="text-xl font-bold uppercase tracking-widest mb-1">StudyMate School</h1>
          <p className="text-sm opacity-90 uppercase">ID Verification System</p>
        </div>
        
        <div className="p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <StudyMateLoader size="lg" text="Verifying Identity..." />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center text-center">
              <XCircle className="w-20 h-20 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid ID</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link to="/" className="text-blue-600 font-semibold hover:underline">Return Home</Link>
            </div>
          ) : data.status !== 'active' ? (
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="w-20 h-20 text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Card {data.status.toUpperCase()}</h2>
              <p className="text-gray-600 mb-6">This ID card is no longer valid.</p>
              <Link to="/" className="text-blue-600 font-semibold hover:underline">Return Home</Link>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <ShieldCheck className="w-16 h-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Verified Active</h2>
              
              <div className="w-24 h-24 rounded-full border-4 border-gray-100 bg-gray-100 overflow-hidden shadow-sm mb-4">
                {data.profilePic ? (
                  <img src={data.profilePic} alt={data.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl font-bold">
                    {data.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-800">{data.name}</h3>
              <p className="text-blue-600 font-bold uppercase tracking-wider text-sm mb-6 mt-1">
                {data.role === 'student' ? 'Student' : data.designation || data.role}
              </p>

              <div className="w-full bg-gray-50 rounded-xl p-4 text-left border border-gray-100">
                {data.role === 'student' ? (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500 text-sm font-medium">Admission No</span>
                    <span className="text-gray-900 font-bold">{data.studentId || '-'}</span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500 text-sm font-medium">Employee ID</span>
                    <span className="text-gray-900 font-bold">{data.employeeId || '-'}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1 mt-2 border-t border-gray-200 pt-3">
                  <span className="text-gray-500 text-sm font-medium">School</span>
                  <span className="text-gray-900 font-bold text-sm text-right">{data.schoolName}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyID;
