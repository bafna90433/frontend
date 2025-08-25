import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./WhatsAppButton.css";

// ✅ Use env variable for backend API
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

type Agent = {
  name: string;
  phone: string;
  title?: string;
  avatar?: string;
  enabled?: boolean;
  message?: string;
};

type Settings = {
  enabled: boolean;
  defaultMessage: string;
  position: "right" | "left";
  offsetX: number;
  offsetY: number;
  showGreeting: boolean;
  greetingText: string;
  autoOpenDelay: number;
  showOnMobile: boolean;
  showOnDesktop: boolean;
  showOnPaths: string[];
  hideOnPaths: string[];
  enableSchedule: boolean;
  startHour: number;
  endHour: number;
  days: number[];
  agents: Agent[];
};

const matchPath = (p: string, pattern: string) => {
  if (pattern.endsWith("/*")) {
    const base = pattern.replace(/\/\*$/, "");
    return p === base || p.startsWith(base + "/");
  }
  return p === pattern;
};

const isPathAllowed = (path: string, show: string[], hide: string[]) => {
  if (hide?.some((h) => matchPath(path, h))) return false;
  if (show?.length) return show.some((s) => matchPath(path, s));
  return true;
};

const withinSchedule = (s: Settings) => {
  if (!s.enableSchedule) return true;
  const now = new Date();
  const h = now.getHours();
  const d = now.getDay();
  return s.days.includes(d) && h >= s.startHour && h < s.endHour;
};

// ✅ make avatar URL absolute when needed
const resolveUrl = (u?: string) => {
  if (!u) return "";
  if (u.startsWith("http") || u.startsWith("blob:") || u.startsWith("data:")) return u;
  return `${API}${u.startsWith("/") ? u : `/uploads/${u}`}`;
};

const WhatsAppButton: React.FC = () => {
  const [s, setS] = useState<Settings | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get<Settings>(`${API}/api/whatsapp`);
        setS(data);
        if (data.autoOpenDelay && data.autoOpenDelay > 0) {
          setTimeout(() => setOpen(true), data.autoOpenDelay);
        }
      } catch (err) {
        console.error("Failed to fetch WhatsApp settings", err);
      }
    })();
  }, []);

  const activeAgents = useMemo(
    () => (s?.agents || []).filter((a) => a.enabled !== false && a.phone),
    [s]
  );

  if (!s || !s.enabled) return null;

  const pathOk = isPathAllowed(window.location.pathname, s.showOnPaths, s.hideOnPaths);
  const deviceOk =
    (s.showOnDesktop && window.innerWidth >= 768) ||
    (s.showOnMobile && window.innerWidth < 768);

  if (!pathOk || !deviceOk || !withinSchedule(s)) return null;

  const launcherStyle: React.CSSProperties = {
    position: "fixed",
    [s.position === "right" ? "right" : "left"]: s.offsetX,
    bottom: s.offsetY,
    zIndex: 999999,
  } as React.CSSProperties;

  const openUrl = (agent: Agent) => {
    const message = (agent.message || s.defaultMessage || "").trim();
    const url = `https://wa.me/${agent.phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`wa-launcher ${s.position}`} style={launcherStyle}>
      {open && (
        <div className="wa-panel">
          <div className="wa-panel-head">
            <div className="wa-title">Start a Conversation</div>
            <div className="wa-sub">
              Hi! Click one of our team members below to chat on WhatsApp
            </div>
          </div>

          <div className="wa-panel-body">
            {activeAgents.length === 0 && <div className="wa-empty">No agents configured.</div>}

            {activeAgents.map((a, i) => (
              <button className="wa-agent-item" key={i} onClick={() => openUrl(a)}>
                <div className="wa-agent-avatar">
                  {a.avatar ? (
                    <img
                      src={resolveUrl(a.avatar)}
                      alt={a.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                        const parent = (e.currentTarget as HTMLImageElement).parentElement!;
                        const fallback = document.createElement("div");
                        fallback.className = "wa-avatar-fallback";
                        fallback.textContent = (a.name?.[0] || "A").toUpperCase();
                        parent.appendChild(fallback);
                      }}
                    />
                  ) : (
                    <div className="wa-avatar-fallback">
                      {(a.name?.[0] || "A").toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="wa-agent-info">
                  <div className="wa-agent-name">{a.name}</div>
                  <div className="wa-agent-title">{a.title || "Support"}</div>
                </div>
                <div className="wa-agent-icon">🟢</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        className="wa-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat on WhatsApp"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
};

export default WhatsAppButton;
