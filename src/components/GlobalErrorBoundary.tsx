import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // Check if it's a chunk loading error (failed to fetch dynamically imported module)
    const isChunkLoadFailed = error.name === 'ChunkLoadError' || 
                              error.message.includes('Failed to fetch dynamically imported module') ||
                              error.message.includes('Importing a module script failed');
                              
    if (isChunkLoadFailed) {
      // Auto-reload once if a chunk fails
      const reloaded = sessionStorage.getItem('chunk_reloaded');
      if (!reloaded) {
        sessionStorage.setItem('chunk_reloaded', 'true');
        window.location.reload();
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
          <h2>Oops, something went wrong.</h2>
          <p>We are having trouble loading this page. This is usually caused by an outdated browser cache.</p>
          <button 
            onClick={() => {
              sessionStorage.removeItem('chunk_reloaded');
              window.location.reload();
            }}
            style={{ padding: "10px 20px", background: "#059669", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", marginTop: "20px" }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
