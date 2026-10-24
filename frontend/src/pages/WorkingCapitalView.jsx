import React, { useState } from 'react';
import { DollarSign, Clock, TrendingUp, AlertTriangle, CheckCircle, Percent } from 'lucide-react';

export default function WorkingCapitalView({ data }) {
  const [dpoExtensionDays, setDpoExtensionDays] = useState(15);
  const [costOfCapital, setCostOfCapital] = useState(8.5);

  if (!data) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading working capital analytics...</div>;

  const { kpis, payment_terms, aging_buckets } = data;

  // Working Capital Simulation calculation
  // Daily spend = total spend (approx 72,889 Cr / 365)
  // Let's compute based on eligible spend or total spend
  const totalSpend = 72889074788;
  const dailySpend = totalSpend / 365;
  const cashFreedUp = dailySpend * dpoExtensionDays;
  const annualInterestBenefit = cashFreedUp * (costOfCapital / 100);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
          Working Capital & Accounts Payable (DPO) Optimization
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Cash conversion cycles, early payment discount capture, and payment term renegotiation
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Weighted DPO</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#6366f1', marginTop: '4px' }}>
            {kpis.weighted_dpo_days} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dim)' }}>days</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
            Average: {kpis.average_dpo_days} days across all payments
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Early Discounts Captured</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            ₹{(kpis.captured_discount_savings / 10000000).toFixed(2)} Cr
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
            {kpis.discount_capture_rate_pct}% capture rate on 2/10 Net 30
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Lost Discount Opportunity</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f43f5e', marginTop: '4px' }}>
            ₹{(kpis.lost_discount_savings / 10000000).toFixed(2)} Cr
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
            Invoices eligible for 2% rebate paid late
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Overdue Invoice Liabilities</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
            {kpis.overdue_po_count.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dim)' }}>POs</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
            Paid past contracted credit terms
          </div>
        </div>
      </div>

      {/* DPO Extension Simulator */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
              Interactive DPO Extension Cash Flow Simulator
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Model the liquidity impact of extending standard payment terms from Net 30 to Net 45/60
            </p>
          </div>
          <span className="badge badge-blue">Treasury Optimization</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>
          {/* Controls */}
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--card-border)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Target DPO Extension (Days)
                </label>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                  +{dpoExtensionDays} days
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="45"
                step="5"
                value={dpoExtensionDays}
                onChange={(e) => setDpoExtensionDays(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#6366f1' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Corporate Cost of Capital (%)
                </label>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  {costOfCapital}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="15"
                step="0.5"
                value={costOfCapital}
                onChange={(e) => setCostOfCapital(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#10b981' }}
              />
            </div>
          </div>

          {/* Results Output */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '14px',
          }}>
            <div style={{
              gridColumn: 'span 2',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.15))',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              borderRadius: '12px',
              padding: '18px 22px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase' }}>
                Working Capital Cash Freed Up
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
                ₹{(cashFreedUp / 10000000).toFixed(2)} Crores
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                Additional operating treasury runway without external debt financing
              </div>
            </div>

            <div style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--card-border)',
              borderRadius: '10px',
              padding: '14px',
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Annual Interest Savings</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                ₹{(annualInterestBenefit / 10000000).toFixed(2)} Cr/yr
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                Avoided short-term borrowing costs
              </div>
            </div>

            <div style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--card-border)',
              borderRadius: '10px',
              padding: '14px',
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>New Projected DPO</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                {(kpis.weighted_dpo_days + dpoExtensionDays).toFixed(1)} days
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                Benchmark industry quartile: 45-60 days
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Terms & Aging Tables */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1.8fr',
        gap: '20px',
      }}>
        {/* Payment Terms */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
            Payment Terms Portfolio Share
          </h3>
          <div className="p2p-table-container">
            <table className="p2p-table">
              <thead>
                <tr>
                  <th>Credit Terms</th>
                  <th>POs</th>
                  <th>Total Spend</th>
                  <th>Actual DPO</th>
                </tr>
              </thead>
              <tbody>
                {payment_terms.map((t, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{t.payment_terms}</td>
                    <td>{t.po_count}</td>
                    <td>₹{(t.total_spend / 10000000).toFixed(1)} Cr</td>
                    <td style={{ fontWeight: 700 }}>{t.avg_actual_dpo}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Aging Buckets */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
            Payment Aging Schedule (Compliance with Terms)
          </h3>
          <div className="p2p-table-container">
            <table className="p2p-table">
              <thead>
                <tr>
                  <th>Aging Bucket</th>
                  <th>Purchase Orders</th>
                  <th>Compliance Status</th>
                </tr>
              </thead>
              <tbody>
                {aging_buckets.map((b, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{b.bucket}</td>
                    <td style={{ fontWeight: 700 }}>{b.count.toLocaleString()} POs</td>
                    <td>
                      <span className={
                        b.bucket.includes('Within') ? 'badge badge-green'
                        : b.bucket.includes('1 - 15') ? 'badge badge-amber'
                        : 'badge badge-red'
                      }>
                        {b.bucket.includes('Within') ? 'On-Schedule' : 'Overdue / Delinquent'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
