// src/components/NoInternet.tsx
import React, { useState, useEffect, useRef } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

// navigator.onLine only checks local network, not actual internet.
// We do a real connectivity check by pinging the backend health endpoint.
const checkRealConnectivity = async (): Promise<boolean> => {
  try {
    // First fast check: browser's own signal
    if (!navigator.onLine) return false;
    // Real check: try to reach backend
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    await fetch(
      `${(import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api'}/test`,
      { method: 'GET', signal: controller.signal, cache: 'no-store' }
    );
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
};

const NoInternet: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  // Start as online — only show overlay after confirmed offline
  const [isOnline, setIsOnline] = useState(true);
  const checkRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runCheck = async () => {
    const online = await checkRealConnectivity();
    setIsOnline(online);
  };

  useEffect(() => {
    // On mount, check after a short delay (don't block initial render)
    checkRef.current = setTimeout(runCheck, 3000);

    const handleOffline = () => {
      // Browser went offline → verify with real check
      setTimeout(runCheck, 500);
    };
    const handleOnline = () => {
      // Browser came back online → verify and dismiss overlay
      runCheck();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (checkRef.current) clearTimeout(checkRef.current);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsChecking(true);
    const online = await checkRealConnectivity();
    setIsChecking(false);
    if (online) {
      setIsOnline(true);
      window.location.reload();
    } else {
      alert("Still offline. Please check your internet connection.");
    }
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