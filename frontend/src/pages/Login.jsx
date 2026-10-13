import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Eye, EyeOff, GraduationCap, Lock, User, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated, currentUser, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated && currentUser) {
      if (currentUser.role === 'superadmin') navigate('/super-admin/dashboard', { replace: true });
      else if (currentUser.role === 'principal') navigate('/principal/dashboard', { replace: true });
      else if (currentUser.role === 'teacher') navigate('/teacher/dashboard', { replace: true });
      else if (currentUser.role === 'parent' || currentUser.role === 'parents') navigate('/parent/dashboard', { replace: true });
      else if (currentUser.role === 'driver') navigate('/driver/dashboard', { replace: true });
      else if (currentUser.role === 'attendant') navigate('/attendant/dashboard', { replace: true });
      else navigate('/student/dashboard', { replace: true });
    }
  }, [isAuthenticated, currentUser, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white">
        <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold tracking-wider uppercase text-indigo-200">Loading StudyMate...</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const data = await login(email, password);
      if (data && data.user) {
        if (data.user.role === 'superadmin') navigate('/super-admin/dashboard');
        else if (data.user.role === 'principal') navigate('/principal/dashboard');
        else if (data.user.role === 'teacher') navigate('/teacher/dashboard');
        else if (data.user.role === 'parent' || data.user.role === 'parents') navigate('/parent/dashboard');
        else if (data.user.role === 'driver') navigate('/driver/dashboard');
        else if (data.user.role === 'attendant') navigate('/attendant/dashboard');
        else navigate('/student/dashboard');
      }
    } catch (err) {
      if (!err.response) {
        setError('Network Error: The server might be waking up or is currently unreachable. Please try again in a minute.');
      } else if (err.response.status === 504 || err.response.status === 502) {
        setError('Server is waking up or busy. Please try again in a few moments.');
      } else {
        setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      
      {/* Vibrant Colorful Background Ambient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-600/40 via-purple-600/30 to-pink-500/20 blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-gradient-to-tl from-emerald-500/30 via-teal-600/30 to-blue-600/40 blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-rose-500/10 to-amber-500/10 blur-3xl pointer-events-none"></div>

      {/* Main Glassmorphic Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="backdrop-blur-2xl bg-white/95 dark:bg-slate-900/90 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 p-8 sm:p-10 space-y-6 relative overflow-hidden">
          
          {/* Top Decorative Gradient Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 via-rose-500 to-amber-500"></div>

          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-rose-500 text-white shadow-lg shadow-indigo-500/30 mb-2 transform hover:scale-105 transition">
              <GraduationCap className="w-8 h-8" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
              StudyMate <Sparkles className="w-5 h-5 text-amber-500 inline" />
            </h1>
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">
              School Management & Learning Intelligence Platform
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-2xl text-xs font-semibold flex items-start gap-2 shadow-xs"
            >
              <span className="text-base leading-none">⚠️</span>
              <span className="flex-1">{error}</span>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email / Mobile Number / Student ID Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                Email, Mobile Number, or Student ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Email, Mobile Number, or Student ID"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:from-indigo-500 hover:via-purple-500 hover:to-rose-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98] transition duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Badge */}
          <div className="pt-2 border-t border-gray-100 dark:border-slate-800 text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 dark:text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Authorized Institutional Access Only
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default Login;
