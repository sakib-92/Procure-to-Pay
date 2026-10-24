import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function ThreeWayMatchView({ data }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading reconciliation data...</div>;

  const { kpis, exception_queue } = data;

  const filteredQueue = exception_queue.filter((exc) => {
    const matchesFilter = filterStatus === 'ALL' || exc.status.toLowerCase().includes(filterStatus.toLowerCase());
    const matchesSearch = 
      exc.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exc.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exc.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exc.item_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
          3-Way Match Reconciliation Audit (PO vs GRN vs Invoice)
        </h2>
        <p style={{ fontSize: '12.5px', color: '#64748b' }}>
          Line-item automated verification preventing overbilling, missing goods receipts, and duplicate invoices
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px',
        marginBottom: '20px',
      }}>
        <div className="clean-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Clean 3-Way Match Rate</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f766e', marginTop: '2px' }}>
            {kpis.matched_rate_pct}%
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
            {kpis.matched_pos.toLocaleString()} verified orders
          </div>
        </div>

        <div className="clean-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Total Disputed Financial Exposure</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#be123c', marginTop: '2px' }}>
            ₹{(kpis.total_disputed_exposure / 10000000).toFixed(1)} Cr
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
            {kpis.total_discrepancy_count.toLocaleString()} flagged discrepancies
          </div>
        </div>

        <div className="clean-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Price Overcharge Discrepancies</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#b45309', marginTop: '2px' }}>
            {kpis.price_discrepancy_count} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>POs</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
            ₹{(kpis.price_discrepancy_exposure / 10000000).toFixed(2)} Cr unauthorized variance
          </div>
        </div>

        <div className="clean-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Missing GRN / Duplicate Bills</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#be123c', marginTop: '2px' }}>
            {kpis.missing_grn_count + kpis.duplicate_invoice_count} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>Alerts</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
            Payment on hold pending warehouse intake
          </div>
        </div>
      </div>

      {/* Exception Queue */}
      <div className="clean-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Active Discrepancy Exception Resolution Queue
            </h3>
            <p style={{ fontSize: '11.5px', color: '#64748b' }}>
              Orders currently on accounts payable hold due to unit price variances or short-shipment quantities
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '6px 10px',
            }}>
              <Search size={14} color="#64748b" />
              <input
                type="text"
                placeholder="Search PO, Vendor, Item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#0f172a',
                  fontSize: '12px',
                  outline: 'none',
                  width: '180px',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '2px', background: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
              {['ALL', 'Price', 'Quantity', 'Missing'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  style={{
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: filterStatus === tab ? 600 : 500,
                    cursor: 'pointer',
                    background: filterStatus === tab ? '#ffffff' : 'transparent',
                    color: filterStatus === tab ? '#0f172a' : '#64748b',
                    boxShadow: filterStatus === tab ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
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
                <th>Invoice #</th>
                <th>GRN Intake</th>
                <th>Vendor Name</th>
                <th>Item</th>
                <th>PO / Recv Qty</th>
                <th>PO Amount</th>
                <th>Invoice Amount</th>
                <th>Disputed Value</th>
                <th>Status</th>
                <th>Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.map((exc, idx) => (
                <tr key={idx}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#1e40af' }}>
                    {exc.po_number}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                    {exc.invoice_number}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
                    {exc.grn_number}
                  </td>
                  <td style={{ fontWeight: 600 }}>{exc.vendor_name}</td>
                  <td>{exc.item_name}</td>
                  <td>
                    {exc.po_qty} ord / <strong style={{ color: exc.grn_qty < exc.po_qty ? '#be123c' : '#0f766e' }}>{exc.grn_qty} recv</strong>
                  </td>
                  <td>₹{exc.po_total.toLocaleString()}</td>
                  <td style={{ fontWeight: 600, color: exc.invoice_total > exc.po_total ? '#be123c' : '#0f172a' }}>
                    ₹{exc.invoice_total.toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 700, color: '#be123c' }}>
                    ₹{exc.disputed_value.toLocaleString()}
                  </td>
                  <td>
                    <span className={
                      exc.status.includes('Price') ? 'badge badge-amber'
                      : exc.status.includes('Quantity') ? 'badge badge-red'
                      : 'badge badge-blue'
                    }>
                      {exc.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '11.5px', color: '#475569' }}>
                    {exc.recommended_action}
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
