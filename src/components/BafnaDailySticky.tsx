// ════════════════════════════════════════════════════════════
// BAFNA DAILY STICKY BANNER COMPONENT
// Extracted from Homepage.tsx — logic unchanged
// ════════════════════════════════════════════════════════════

import React, { useState } from "react";

const BD_IMG = "https://ik.imagekit.io/rishii/bafnatoys_images/sjkfs.webp?tr=w-400,f-auto,q-80";

const BafnaDailySticky: React.FC = () => {
  const [closed, setClosed] = useState(() => {
    try { return sessionStorage.getItem("bd_banner_closed") === "1"; } catch { return false; }
  });

  if (closed) return null;

  return (
    <div className="sp-bd-sticky-wrap" id="bafnadaily-sticky-banner">
      <button
        className="sp-bd-sticky-close"
        aria-label="Close Bafna Daily banner"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setClosed(true);
          try { sessionStorage.setItem("bd_banner_closed", "1"); } catch {}
        }}
      >
        ✕
      </button>
      <a
        href="https://bafnadaily.com"
        target="_blank"
        rel="noopener noreferrer"
        className="sp-bd-sticky-link"
        aria-label="Bafna Daily – Visit our lifestyle page"
      >
        <img
          src={BD_IMG}
          alt="Bafna Daily – Visit our lifestyle page!"
          className="sp-bd-sticky-img"
          loading="lazy"
          decoding="async"
          width={400}
          height={240}
        />
        <div className="sp-bd-sticky-label">
          <span className="sp-bd-sticky-title">Bafna Daily</span>
          <span className="sp-bd-sticky-sub">Visit our lifestyle page!</span>
        </div>
      </a>
    </div>
  );
};

export default BafnaDailySticky;
