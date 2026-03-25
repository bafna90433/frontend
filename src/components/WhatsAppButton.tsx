import React, { useEffect, useMemo, useState, useCallback } from "react";
import api, { MEDIA_URL } from "../utils/api";
import "./WhatsAppButton.css";

// ════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════
// ICONS
// ════════════════════════════════════════════════════════════

const WhatsAppIcon: React.FC<{ className?: string }> = React.memo(({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
));

const CloseIcon: React.FC<{ className?: string }> = React.memo(({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
));

const ArrowIcon: React.FC<{ className?: string }> = React.memo(({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
));

const ShieldIcon: React.FC<{ className?: string }> = React.memo(({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
));

// ════════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════════

const matchPath = (p: string, pattern: string): boolean => {
  if (pattern.endsWith("/*")) {
    const base = pattern.replace(/\/\*$/, "");
    return p === base || p.startsWith(base + "/");
  }
  return p === pattern;
};

const isPathAllowed = (
  path: string,
  show: string[],
  hide: string[]
): boolean => {
  if (hide?.some((h) => matchPath(path, h))) return false;
  if (show?.length) return show.some((s) => matchPath(path, s));
  return true;
};

const withinSchedule = (s: Settings): boolean => {
  if (!s.enableSchedule) return true;
  const now = new Date();
  const h = now.getHours();
  const d = now.getDay();
  return s.days.includes(d) && h >= s.startHour && h < s.endHour;
};

const resolveUrl = (u?: string): string => {
  if (!u) return "";
  if (u.startsWith("http") || u.startsWith("blob:") || u.startsWith("data:"))
    return u;
  return `${MEDIA_URL}${u.startsWith("/") ? u : `/uploads/${u}`}`;
};

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════

const WhatsAppButton: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // 🔴 IMPORTANT FIX: Check if current page is Home OR Product page
  const currentPath = window.location.pathname;
  const isProductPage = currentPath.includes("/product");
  const isHomePage = currentPath === "/";

  // Fetch settings - Only run if on relevant pages
  useEffect(() => {
    if (!isProductPage && !isHomePage) return;

    let timeoutId: NodeJS.Timeout;
    const fetchSettings = async () => {
      try {
        const { data } = await api.get<Settings>("/whatsapp");
        setSettings(data);

        // Auto-open panel after delay
        if (data.autoOpenDelay && data.autoOpenDelay > 0) {
          timeoutId = setTimeout(() => setIsOpen(true), data.autoOpenDelay);
        }
      } catch {
        // Silently fail
      }
    };

    fetchSettings();
    return () => {
        if(timeoutId) clearTimeout(timeoutId);
    };
  }, [isProductPage, isHomePage]);

  // Active agents
  const activeAgents = useMemo(
    () => {
        if (!settings?.agents) return [];
        return settings.agents.filter((a) => a.enabled !== false && a.phone);
    }, [settings?.agents]
  );

  // Toggle panel with animation
  const togglePanel = useCallback(() => {
    if (isOpen) {
      setIsClosing(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
      }, 250);
    } else {
      setIsOpen(true);
    }
  }, [isOpen]);

  // Open WhatsApp URL
  const openWhatsApp = useCallback(
    (agent: Agent) => {
      const message = (
        agent.message ||
        settings?.defaultMessage ||
        ""
      ).trim();
      const url = `https://wa.me/${agent.phone}?text=${encodeURIComponent(
        message
      )}`;
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [settings?.defaultMessage]
  );

  // Don't render if disabled, settings not loaded, or not on allowed pages
  if (!settings || !settings.enabled || (!isProductPage && !isHomePage)) return null;

  // Check path and device from settings
  const pathOk = isPathAllowed(
    currentPath,
    settings.showOnPaths,
    settings.hideOnPaths
  );
  
  const isMobile = window.innerWidth < 768;
  const deviceOk =
    (settings.showOnDesktop && !isMobile) ||
    (settings.showOnMobile && isMobile);

  if (!pathOk || !deviceOk || !withinSchedule(settings)) return null;

  // Dynamic positioning
  const launcherStyle: React.CSSProperties = {
    [settings.position === "right" ? "right" : "left"]: `${settings.offsetX}px`,
    bottom: `${settings.offsetY}px`,
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="wa-overlay" onClick={togglePanel} />}

      {/* Launcher Container */}
      <div
        className={`wa-launcher ${settings.position}`}
        style={launcherStyle}
      >
        {/* Panel */}
        {isOpen && (
          <div className={`wa-panel ${isClosing ? "closing" : ""}`}>
            {/* Header */}
            <div className="wa-panel-head">
              <div className="wa-panel-head-content">
                <div className="wa-header-row">
                  <div className="wa-header-icon">
                    <WhatsAppIcon />
                  </div>
                  <h3 className="wa-title">Start a Conversation</h3>
                </div>
                <p className="wa-sub">
                  Hi! Click one of our team members below to chat on WhatsApp.
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="wa-panel-body">
              {activeAgents.length === 0 ? (
                <div className="wa-empty">
                  <div className="wa-empty-icon">💬</div>
                  <p>No agents available right now.</p>
                </div>
              ) : (
                activeAgents.map((agent, index) => (
                  <button
                    key={index}
                    className="wa-agent-item"
                    onClick={() => openWhatsApp(agent)}
                    aria-label={`Chat with ${agent.name}`}
                  >
                    {/* Avatar */}
                    <div className="wa-agent-avatar">
                      {agent.avatar ? (
                        <img
                          src={resolveUrl(agent.avatar)}
                          alt={agent.name}
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = "none";
                            const fallback = document.createElement("div");
                            fallback.className = "wa-avatar-fallback";
                            fallback.textContent = (
                              agent.name?.[0] || "A"
                            ).toUpperCase();
                            target.parentElement?.appendChild(fallback);
                          }}
                        />
                      ) : (
                        <div className="wa-avatar-fallback">
                          {(agent.name?.[0] || "A").toUpperCase()}
                        </div>
                      )}
                      <span className="wa-online-dot" />
                    </div>

                    {/* Info */}
                    <div className="wa-agent-info">
                      <div className="wa-agent-name">{agent.name}</div>
                      <div className="wa-agent-title">
                        {agent.title || "Support"}
                        <span className="wa-agent-status">Online</span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="wa-agent-arrow">
                      <ArrowIcon />
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="wa-panel-footer">
              <p className="wa-footer-text">
                <ShieldIcon />
                Secure & Private Messaging
              </p>
            </div>
          </div>
        )}

        {/* FAB Button */}
        <button
          className={`wa-fab ${isOpen ? "is-open" : ""}`}
          onClick={togglePanel}
          aria-label={isOpen ? "Close chat" : "Open WhatsApp chat"}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <CloseIcon className="wa-fab-icon" />
          ) : (
            <WhatsAppIcon className="wa-fab-icon" />
          )}
        </button>
      </div>
    </>
  );
};

export default WhatsAppButton;