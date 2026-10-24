import React from 'react';
import { FilePlus, CheckCircle, PackageCheck, Receipt, CreditCard } from 'lucide-react';

const STAGE_ICONS = [
  FilePlus,
  CheckCircle,
  PackageCheck,
  Receipt,
  CreditCard,
];

export default function ProcessFlowFunnel({ funnelData }) {
  if (!funnelData || funnelData.length === 0) return null;

  return (
    <div className="clean-panel" style={{ padding: '20px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
            Procure-to-Pay Milestone Funnel & Cycle Velocity
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b' }}>
            Transaction progression across the 5 stages from Requisition to Accounts Payable disbursement
          </p>
        </div>
        <span className="badge badge-neutral">5 Stages</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${funnelData.length}, 1fr)`,
        gap: '10px',
      }}>
        {funnelData.map((stage, idx) => {
          const Icon = STAGE_ICONS[idx] || CheckCircle;
          const isSlow = stage.avg_step_days > 10;
          return (
            <div
              key={idx}
              style={{
                background: '#f8fafc',
                border: isSlow ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '4px',
                    background: isSlow ? '#fee2e2' : '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isSlow ? '#b91c1c' : '#1e40af',
                  }}>
                    <Icon size={14} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>
                    0{idx + 1}
                  </span>
                </div>

                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
                  {stage.stage.replace(/^\d+\.\s*/, '')}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', minHeight: '32px', lineHeight: '1.4' }}>
                  {stage.description}
                </div>
              </div>

              <div style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: '8px',
                marginTop: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}>
                <div>
                  <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Volume</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                    {stage.count.toLocaleString()}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Lead Time</div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isSlow ? '#b91c1c' : '#1e40af',
                  }}>
                    {stage.avg_step_days > 0 ? `${stage.avg_step_days}d` : '0d'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
