import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Clock } from 'lucide-react';

const PomodoroTimer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('work'); // 'work' | 'break'

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (mode === 'work') {
        alert('Time for a break! Great job focusing.');
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        alert('Break is over! Time to get back to work.');
        setMode('work');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode]);

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:bg-indigo-700 transition flex items-center justify-center z-40 hover:scale-105"
        title="Focus Timer"
      >
        <Clock size={24} />
      </button>

      {/* Timer Modal */}
      {isOpen && (
        <div className="fixed bottom-44 right-4 md:bottom-24 md:right-6 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2"><Clock size={18}/> Focus Mode</h3>
            <button onClick={() => setIsOpen(false)} className="hover:text-indigo-200 transition"><X size={20}/></button>
          </div>
          
          <div className="p-6 text-center">
            <div className="flex justify-center gap-2 mb-6">
              <button 
                onClick={() => switchMode('work')}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${mode === 'work' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Focus
              </button>
              <button 
                onClick={() => switchMode('break')}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${mode === 'break' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Break
              </button>
            </div>

            <div className="text-6xl font-black text-gray-800 mb-8 tabular-nums tracking-tighter">
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </div>

            <div className="flex justify-center gap-4">
              <button 
                onClick={toggleTimer}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-md transition hover:scale-105 ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {isRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
              </button>
              <button 
                onClick={resetTimer}
                className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 shadow-sm hover:bg-gray-200 transition hover:scale-105"
              >
                <RotateCcw size={24} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PomodoroTimer;
