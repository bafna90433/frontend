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
    <table className="bulk-table">
      <thead>
        <tr>
          <th>Inner</th>
          <th>Qty</th>
          <th>Per Piece Price</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((tier, i) => {
          const rowQty = tier.qty ?? tier.inner * innerQty;
          const nextInner = sorted[i + 1]?.inner ?? Infinity;
          const highlight = selectedInner >= tier.inner && selectedInner < nextInner;

          return (
            <tr key={i} className={highlight ? 'highlight' : ''}>
              <td>{tier.inner} inner</td>
              <td>{rowQty}</td>
              <td>₹{tier.price.toLocaleString()}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default BulkPricingTable;
