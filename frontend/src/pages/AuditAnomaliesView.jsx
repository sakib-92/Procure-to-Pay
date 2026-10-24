import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Search, Filter, Cpu, CheckCircle } from 'lucide-react';

export default function AuditAnomaliesView({ data }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  if (!data) return <div style={{ padding: '40px', textAlign: 'center' }}>Running audit scan...</div>;

  const { kpis, anomalies } = data;

  const filteredAnomalies = anomalies.filter((item) => {
    const matchesSearch = 
      item.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.flags.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = 
      filterType === 'ALL' || item.flags.toLowerCase().includes(filterType.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
          Procurement Forensic Audit & Anomaly Intelligence
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Unsupervised Isolation Forest scans cross-referenced with statutory approval thresholds & split order detection
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
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Screened POs</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#6366f1', marginTop: '4px' }}>
            {kpis.total_screened_pos.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
            {kpis.anomaly_rate_pct}% anomaly flag rate
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Split PO Evasions (&lt; ₹5L)</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#f43f5e', marginTop: '4px' }}>
            {kpis.split_po_count} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dim)' }}>Orders</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
            Structuring below approval ceiling
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Weekend / Off-Hours Approvals</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
            {kpis.weekend_approval_count.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
            Saturday/Sunday sign-off audits
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Duplicate Invoices Flagged</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#ec4899', marginTop: '4px' }}>
            {kpis.duplicate_invoice_count} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dim)' }}>Bills</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
            Immediate payment freeze enforced
          </div>
        </div>
      </div>

      {/* Flagged Audit Queue */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              Forensic Audit Exception Log
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Transactions flagged by Isolation Forest or statutory compliance boundary checks
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Search */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--card-border)',
              borderRadius: '8px',
              padding: '6px 12px',
            }}>
              <Search size={14} color="#64748b" />
              <input
                type="text"
                placeholder="Search PO, Vendor, Department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  outline: 'none',
                  width: '180px',
                }}
              />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-tertiary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
              {['ALL', 'Split PO', 'Duplicate', 'Weekend', 'Price'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterType(tab)}
                  style={{
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: filterType === tab ? 700 : 500,
                    cursor: 'pointer',
                    background: filterType === tab ? 'var(--accent-indigo)' : 'transparent',
                    color: filterType === tab ? '#ffffff' : 'var(--text-muted)',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p2p-table-container">
          <table className="p2p-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Department</th>
                <th>Item</th>
                <th>PO Amount</th>
                <th>Approval Date</th>
                <th>Risk Score</th>
                <th>Audit Violation Flags</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnomalies.map((a, idx) => (
                <tr key={idx}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#818cf8' }}>
                    {a.po_number}
                  </td>
                  <td style={{ fontWeight: 600 }}>{a.vendor_name}</td>
                  <td>{a.department}</td>
                  <td>{a.item_name}</td>
                  <td style={{ fontWeight: 700 }}>₹{a.po_total_amount.toLocaleString()}</td>
                  <td style={{ color: 'var(--text-dim)' }}>{a.approval_date}</td>
                  <td>
                    <span style={{
                      fontWeight: 800,
                      color: a.risk_score >= 80 ? '#f43f5e' : a.risk_score >= 60 ? '#f59e0b' : '#10b981',
                    }}>
                      {a.risk_score}/100
                    </span>
                  </td>
                  <td>
                    <span className={
                      a.flags.includes('Split PO') ? 'badge badge-red'
                      : a.flags.includes('Duplicate') ? 'badge badge-red'
                      : 'badge badge-amber'
                    }>
                      {a.flags}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
