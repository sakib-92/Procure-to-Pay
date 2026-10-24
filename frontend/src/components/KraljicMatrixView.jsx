import React from 'react';
import { Target, ShieldAlert, Award, RefreshCw, Info } from 'lucide-react';

const QUADRANTS = [
  {
    id: 'Bottleneck',
    title: 'Bottleneck Items',
    sub: 'Low Spend, High Supply Risk',
    color: '#b45309',
    badge: 'badge-amber',
    bg: '#fffbeb',
    border: '#fde68a',
    icon: ShieldAlert,
    strategy: 'Strategy: Secure supply with buffer safety stock & develop secondary dual-sources.',
  },
  {
    id: 'Strategic',
    title: 'Strategic Partners',
    sub: 'High Spend, High Supply Risk',
    color: '#1e40af',
    badge: 'badge-blue',
    bg: '#eff6ff',
    border: '#bfdbfe',
    icon: Award,
    strategy: 'Strategy: Executive alliance partnerships, joint performance reviews & deep SLAs.',
  },
  {
    id: 'Routine',
    title: 'Routine / Non-Critical',
    sub: 'Low Spend, Low Supply Risk',
    color: '#475569',
    badge: 'badge-neutral',
    bg: '#f8fafc',
    border: '#e2e8f0',
    icon: RefreshCw,
    strategy: 'Strategy: Automate with e-procurement catalogs, p-cards & standard pricing.',
  },
  {
    id: 'Leverage',
    title: 'Leverage Commodities',
    sub: 'High Spend, Low Supply Risk',
    color: '#0f766e',
    badge: 'badge-green',
    bg: '#f0fdfa',
    border: '#99f6e4',
    icon: Target,
    strategy: 'Strategy: Aggressive reverse auctions & competitive multi-vendor volume tendering.',
  },
];

export default function KraljicMatrixView({ kraljicSummary, onSelectQuadrant, selectedQuadrant }) {
  const summaryMap = {};
  if (kraljicSummary) {
    kraljicSummary.forEach((k) => {
      summaryMap[k.quadrant] = k;
    });
  }

  return (
    <div className="clean-panel" style={{ padding: '20px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
            Kraljic Portfolio Matrix (2x2 Strategic Segmentation)
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b' }}>
            Segment suppliers by Financial Impact (Spend Volume) vs. Supply Market Complexity & Lead Time Risk
          </p>
        </div>
        <span className="badge badge-neutral">Portfolio Strategy</span>
      </div>

      {/* 2x2 Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
      }}>
        {QUADRANTS.map((q) => {
          const Icon = q.icon;
          const data = summaryMap[q.id] || { vendor_count: 0, total_spend: 0 };
          const isSelected = selectedQuadrant === q.id;

          return (
            <div
              key={q.id}
              onClick={() => onSelectQuadrant(isSelected ? null : q.id)}
              style={{
                background: isSelected ? q.bg : '#ffffff',
                border: isSelected ? `2px solid ${q.color}` : `1px solid ${q.border}`,
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '4px',
                    background: q.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: q.color,
                  }}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      {q.title}
                    </h4>
                    <span style={{ fontSize: '11px', color: q.color, fontWeight: 500 }}>
                      {q.sub}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <span className={`badge ${q.badge}`}>Filtered</span>
                )}
              </div>

              {/* Numbers */}
              <div style={{
                display: 'flex',
                gap: '20px',
                padding: '10px 0',
                borderTop: '1px solid #f1f5f9',
                borderBottom: '1px solid #f1f5f9',
                marginBottom: '10px',
              }}>
                <div>
                  <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Suppliers</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    {data.vendor_count} vendors
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Spend Volume</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: q.color }}>
                    ₹{(data.total_spend / 10000000).toFixed(1)} Cr
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '11.5px', color: '#64748b', lineHeight: '1.4' }}>
                {q.strategy}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
