// ════════════════════════════════════════════════════════════
// PRODUCT SKELETON COMPONENT
// Extracted from Homepage.tsx — logic unchanged
// ════════════════════════════════════════════════════════════

import React from "react";

const ProductSkeleton: React.FC = () => (
  <div className="sp-skeleton-card">
    <div className="sp-skeleton-img sp-shimmer" />
    <div className="sp-skeleton-body">
      <div className="sp-skeleton-line sp-shimmer" style={{ width: "75%" }} />
      <div className="sp-skeleton-line sp-shimmer" style={{ width: "50%" }} />
      <div
        className="sp-skeleton-line short sp-shimmer"
        style={{ width: "35%" }}
      />
    </div>
  </div>
);

export default ProductSkeleton;
