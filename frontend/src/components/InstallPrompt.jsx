import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(
    localStorage.getItem('pwaPromptDismissed') === 'true'
  );

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwaPromptDismissed', 'true');
  };

  if (!isInstallable || isDismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 bg-black/40 sm:bg-transparent z-50 flex items-center justify-center sm:block p-4 sm:p-0 backdrop-blur-xs sm:backdrop-blur-none">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 z-50 flex items-start gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-base">Install StudyMate App</h3>
          <p className="text-sm text-gray-600 mt-1">Add this app to your home screen for quick access and offline support.</p>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-soft"
            >
              <Download size={16} />
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 p-1">
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
