import React, { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Check, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Explicit Update States
const STATES = {
  COUNTDOWN: 'COUNTDOWN',
  UPDATING: 'UPDATING',
  UPDATE_COMPLETED: 'UPDATE_COMPLETED',
  UPDATE_FAILED: 'UPDATE_FAILED',
  CLOSED: 'CLOSED'
};

const ReloadPrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
      console.log('[PWA] service worker active');
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const [updateState, setUpdateState] = useState(STATES.COUNTDOWN);
  const [countdown, setCountdown] = useState(10);

  // When update is detected (needRefresh becomes true), start COUNTDOWN
  useEffect(() => {
    if (needRefresh) {
      setUpdateState(STATES.COUNTDOWN);
      setCountdown(10);
    }
  }, [needRefresh]);

  // Handle Countdown Interval (10 to 1)
  useEffect(() => {
    if (!needRefresh || updateState !== STATES.COUNTDOWN) return;

    if (countdown > 1) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 1) {
      const timer = setTimeout(() => {
        performUpdate();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [needRefresh, updateState, countdown]);

  // Perform Actual Service Worker Update
  const performUpdate = async () => {
    setUpdateState(STATES.UPDATING);
    try {
      // Pass false to avoid immediate forced browser reload so user sees completion screen
      await updateServiceWorker(false);
      
      // Short delay for SW activation to complete before showing success
      setTimeout(() => {
        setUpdateState(STATES.UPDATE_COMPLETED);
      }, 1500);
    } catch (error) {
      console.error('Failed to update service worker:', error);
      setUpdateState(STATES.UPDATE_FAILED);
    }
  };

  // Close modal and return to app
  const handleClose = () => {
    setNeedRefresh(false);
    setUpdateState(STATES.CLOSED);
  };

  if (!needRefresh || updateState === STATES.CLOSED) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-md transition-all"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
          className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 p-6 text-center overflow-hidden relative"
        >
          {/* Header Branding Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-3 border border-indigo-100 dark:border-indigo-900/50">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> StudyMate System Update
          </div>

          {/* STATE 1: COUNTDOWN */}
          {updateState === STATES.COUNTDOWN && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-xl">
                Update Available
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                StudyMate is preparing a new update.
              </p>

              {/* Animated Countdown Circle */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 text-indigo-600 dark:text-indigo-400 border-4 border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto shadow-inner relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={countdown}
                    initial={{ scale: 1.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-4xl font-black tracking-tight"
                  >
                    {countdown}
                  </motion.span>
                </AnimatePresence>
              </div>

              <p className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">
                Updating automatically in {countdown} {countdown === 1 ? 'second' : 'seconds'}...
              </p>
            </div>
          )}

          {/* STATE 2: UPDATING */}
          {updateState === STATES.UPDATING && (
            <div className="space-y-4 py-2">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-xl">
                Updating StudyMate
              </h3>

              <div className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-4 border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto shadow-md">
                <RefreshCw className="w-9 h-9 animate-spin text-indigo-600 dark:text-indigo-400" />
              </div>

              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                Please wait while StudyMate is updated...
              </p>
            </div>
          )}

          {/* STATE 3: UPDATE_COMPLETED */}
          {updateState === STATES.UPDATE_COMPLETED && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-xl">
                Update Completed
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                StudyMate has been successfully updated.
              </p>

              {/* Success Animated Checkmark */}
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-4 border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center mx-auto shadow-lg">
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <Check className="w-10 h-10 stroke-[3]" />
                </motion.div>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition shadow-md active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          )}

          {/* STATE 4: UPDATE_FAILED */}
          {updateState === STATES.UPDATE_FAILED && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-rose-600 dark:text-rose-400 text-xl">
                Update Failed
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Something went wrong while updating StudyMate.
              </p>

              <div className="w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-4 border-rose-200 dark:border-rose-800 flex items-center justify-center mx-auto">
                <AlertCircle className="w-10 h-10" />
              </div>

              <button
                onClick={performUpdate}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition shadow-md active:scale-[0.98]"
              >
                Try Again
              </button>
            </div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReloadPrompt;
