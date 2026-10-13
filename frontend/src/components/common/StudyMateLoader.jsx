import React, { useState, useEffect } from 'react';

const icons = ['✏️', '🧑‍🎓', '📖', '📝', '🧽', '🔪'];

const StudyMateLoader = ({ size = 'md', text }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % icons.length);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  const containerSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
  };

  return (
    <div className="flex flex-col items-center justify-center p-4" role="status" aria-label="StudyMate loading">
      <div className={`relative flex items-center justify-center ${containerSizes[size]}`}>
        {icons.map((icon, index) => (
          <div
            key={index}
            className={`absolute transition-all duration-150 ease-in-out ${sizeClasses[size]}
              ${index === currentIndex 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-[0.85]'
              }
            `}
          >
            {icon}
          </div>
        ))}
      </div>
      {text && (
        <p className="mt-4 text-gray-500 dark:text-gray-400 font-semibold text-sm tracking-wide">
          {text}
        </p>
      )}
    </div>
  );
};

export default StudyMateLoader;
