import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: any };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error("UI crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, maxWidth: 960, margin: "40px auto", fontFamily: "system-ui" }}>
          <h2>Something broke on this page</h2>
          <p style={{ color: "#555" }}>Open the Console (F12) for details. Fix and reload.</p>
          <pre style={{ background: "#111", color: "#fff", padding: 16, borderRadius: 8, overflow: "auto" }}>
            {String(this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
