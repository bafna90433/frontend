// ════════════════════════════════════════════════════════════
// HOMEPAGE SVG ICONS
// Extracted from Homepage.tsx — logic unchanged
// ════════════════════════════════════════════════════════════

import React from "react";

export const RazorpayIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.076 21.337H2L14.47 2.663h5.024L7.076 21.337z" fill="#3395FF" />
    <path d="M13.228 15.262L10.916 21.337H16.94L22 6.876h-5.012l-3.76 8.386z" fill="#072654" />
  </svg>
);

export const DelhiveryIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 17h2v-4h2l3 4h2.5l-3.4-4.5C9.8 12 11 10.8 11 9c0-2.2-1.8-4-4-4H2v12zm2-6V7h3c1.1 0 2 .9 2 2s-.9 2-2 2H4z" fill="#E42529" />
    <path d="M13 5v12h2v-4h3c2.2 0 4-1.8 4-4s-1.8-4-4-4h-5zm2 6V7h3c1.1 0 2 .9 2 2s-.9 2-2 2h-3z" fill="#E42529" />
  </svg>
);
