// src/components/NoInternet.tsx
import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

const NoInternet: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      if (navigator.onLine) {
        window.location.reload();
      } else {
        alert("Still offline. Please check your connection.");
      }
    }, 1000);
  };

  if (isOnline) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#f8fafc',
      zIndex: 999999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      textAlign: 'center',
      fontFamily: '"Inter", sans-serif'
    }}>
      <div style={{
        backgroundColor: '#fee2e2',
        padding: '20px',
        borderRadius: '50%',
        marginBottom: '24px'
      }}>
        <WifiOff size={48} color="#ef4444" />
      </div>
      
      <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
        No Internet Connection
      </h2>
      
      <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '300px', marginBottom: '32px', lineHeight: 1.5 }}>
        It looks like you're offline. Please check your Wi-Fi or mobile data and try again.
      </p>
      
      <button 
        onClick={handleRetry}
        disabled={isChecking}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '14px 32px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '15px',
          fontWeight: 700,
          cursor: isChecking ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
          transition: 'all 0.2s ease',
          opacity: isChecking ? 0.7 : 1
        }}
      >
        <RefreshCw size={18} className={isChecking ? 'spin' : ''} />
        {isChecking ? 'Checking...' : 'Try Again'}
      </button>

      {/* Animation for the spinning icon */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default NoInternet;