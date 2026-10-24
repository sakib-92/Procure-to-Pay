import React, { useState } from 'react';
import { Search } from 'lucide-react';
import KraljicMatrixView from '../components/KraljicMatrixView';

export default function VendorScorecardView({ data }) {
  const [selectedQuadrant, setSelectedQuadrant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading supplier scorecard...</div>;

  const { kpis, kraljic_summary, scorecard_table } = data;

  const filteredScorecard = scorecard_table.filter((v) => {
    const matchesQuad = !selectedQuadrant || v.kraljic_quadrant === selectedQuadrant;
    const matchesSearch = 
      v.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vendor_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.primary_category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesQuad && matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
          Supplier Performance Scorecard & Portfolio Segmentation
        </h2>
        <p style={{ fontSize: '12.5px', color: '#64748b' }}>
          Operational evaluation across {kpis.total_suppliers} active corporate suppliers based on OTIF fulfillment and spend magnitude
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
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Fleet OTIF Fulfillment</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f766e', marginTop: '2px' }}>
            {kpis.avg_fleet_otif}%
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
            On-Time In-Full delivery rate
          </div>
        </div>

        <div className="clean-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Tier 1 Preferred Partners</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e40af', marginTop: '2px' }}>
            {kpis.preferred_suppliers} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>Vendors</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
            Score &ge; 85/100
          </div>
        </div>

        <div className="clean-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Watchlist / High Risk</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#be123c', marginTop: '2px' }}>
            {kpis.watchlist_suppliers} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>Vendors</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
            Score &lt; 65/100 (Disruption risk)
          </div>
        </div>

        <div className="clean-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Avg Fulfillment Lead Time</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
            {kpis.avg_fulfillment_days} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>days</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
            Approval to warehouse GRN
          </div>
        </div>
      </div>

      {/* Kraljic Matrix 2x2 */}
      <KraljicMatrixView 
        kraljicSummary={kraljic_summary}
        selectedQuadrant={selectedQuadrant}
        onSelectQuadrant={setSelectedQuadrant}
      />

      {/* Supplier Leaderboard */}
      <div className="clean-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Supplier Performance Leaderboard
              {selectedQuadrant && <span style={{ color: '#1e40af', marginLeft: '6px' }}>({selectedQuadrant})</span>}
            </h3>
            <p style={{ fontSize: '11.5px', color: '#64748b' }}>
              Multi-dimensional evaluation across OTIF, fulfillment cycle time, price disputes, and spend volume
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
                placeholder="Search Supplier or City..."
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
            {selectedQuadrant && (
              <button
                onClick={() => setSelectedQuadrant(null)}
                className="btn btn-secondary"
                style={{ fontSize: '11.5px', padding: '5px 10px' }}
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        <div className="p2p-table-container">
          <table className="p2p-table">
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>City</th>
                <th>Category</th>
                <th>Kraljic Quadrant</th>
                <th>Performance Score</th>
                <th>Total Spend</th>
                <th>OTIF Rate</th>
                <th>Lead Time</th>
                <th>Risk Tier</th>
              </tr>
            </thead>
            <tbody>
              {filteredScorecard.map((s, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{s.vendor_name}</td>
                  <td>{s.vendor_city}</td>
                  <td>{s.primary_category}</td>
                  <td>
                    <span className={
                      s.kraljic_quadrant === 'Strategic' ? 'badge badge-blue'
                      : s.kraljic_quadrant === 'Leverage' ? 'badge badge-green'
                      : s.kraljic_quadrant === 'Bottleneck' ? 'badge badge-amber'
                      : 'badge badge-neutral'
                    }>
                      {s.kraljic_quadrant}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: s.performance_score >= 85 ? '#0f766e' : s.performance_score >= 65 ? '#b45309' : '#be123c' }}>
                    {s.performance_score}/100
                  </td>
                  <td style={{ fontWeight: 600 }}>₹{(s.total_spend / 10000000).toFixed(2)} Cr</td>
                  <td style={{ fontWeight: 600, color: s.otif_rate >= 90 ? '#0f766e' : '#b45309' }}>
                    {s.otif_rate}%
                  </td>
                  <td>{s.avg_cycle_days} days</td>
                  <td>
                    <span className={
                      s.risk_tier.includes('Tier 1') ? 'badge badge-green'
                      : s.risk_tier.includes('Tier 2') ? 'badge badge-blue'
                      : 'badge badge-red'
                    }>
                      {s.risk_tier}
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
