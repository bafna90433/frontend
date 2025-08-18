// src/components/BulkPricingTable.tsx
import React from 'react';

export interface Tier {
  inner: number;
  price: number;
  qty?: number;
}

interface Props {
  innerQty: number;
  tiers: Tier[];
  selectedInner: number;
}

const BulkPricingTable: React.FC<Props> = ({ innerQty, tiers, selectedInner }) => {
  const sorted = [...tiers].sort((a, b) => a.inner - b.inner);

  return (
    <div className="bulk-pricing-list">
      {sorted.map((tier, i) => {
        // same quantity logic
        const rowQty = tier.qty ?? tier.inner * innerQty;
        const nextInner = sorted[i + 1]?.inner ?? Infinity;
        const highlight = selectedInner >= tier.inner && selectedInner < nextInner;

        return (
          <div
            key={i}
            className={`bulk-pricing-item${highlight ? ' highlight' : ''}`}
          >
            ₹{tier.price.toLocaleString()} / {tier.inner} inner / {rowQty} nos
          </div>
        );
      })}
    </div>
  );
};

export default BulkPricingTable;
