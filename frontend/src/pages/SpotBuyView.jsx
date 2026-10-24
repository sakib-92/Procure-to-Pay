import React from 'react';
import { Sliders, HelpCircle, AlertCircle, ShieldCheck, DollarSign } from 'lucide-react';
import WhatIfSimulator from '../components/WhatIfSimulator';

export default function SpotBuyView({ data, onOpenSpotRuleModal }) {
  if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading spot buy analytics...</div>;

  const { kpis, rule_breakdown, department_compliance, top_spot_vendors, category_exposure } = data;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            Contract Compliance & Spot Buy Rule Engine
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748b' }}>
            Identification of uncontracted maverick purchases, rule trigger causes, and spend leakage
          </p>
        </div>
        <button 
          onClick={onOpenSpotRuleModal}
          className="btn btn-secondary"
          style={{ fontSize: '12.5px' }}
        >
          <HelpCircle size={14} color="#b45309" />
          <span>Rule Methodology</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px',
        marginBottom: '20px',
      }}>
        <div className="clean-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Contracted Spend</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f766e', marginTop: '2px' }}>
            ₹{(kpis.contract_spend / 10000000).toFixed(1)} Cr
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
            {kpis.contract_spend_pct}% of total ({kpis.contract_pos.toLocaleString()} POs)
          </div>
        </div>

        <div className="clean-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Spot Buy (Maverick) Spend</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#b45309', marginTop: '2px' }}>
            ₹{(kpis.spot_spend / 10000000).toFixed(1)} Cr
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
            {kpis.spot_spend_pct}% of total ({kpis.spot_pos.toLocaleString()} POs)
          </div>
        </div>

        <div className="clean-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Spend Leakage Incurred</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#be123c', marginTop: '2px' }}>
            ₹{(kpis.total_spend_leakage / 10000000).toFixed(2)} Cr
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
            Premium over benchmark contract pricing
          </div>
        </div>

        <div className="clean-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Avg Spot Price Surcharge</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
            +{kpis.avg_spot_premium_pct || 14.5}%
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
            Unnegotiated unit rate penalty
          </div>
        </div>
      </div>

      {/* What-If Financial Calculator */}
      <WhatIfSimulator spotBuyKpis={kpis} />

      {/* Rule Trigger Breakdown Table */}
      <div className="clean-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Spot Buy Classification Rule Diagnostics
            </h3>
            <p style={{ fontSize: '11.5px', color: '#64748b' }}>
              Ledger distribution across Rule 1 (Infrequent Supplier), Rule 2 (No MSA), and Rule 3 (Ad-hoc Requisitions)
            </p>
          </div>
          <span className="badge badge-neutral">Rule Analysis</span>
        </div>

        <div className="p2p-table-container">
          <table className="p2p-table">
            <thead>
              <tr>
                <th>Classification Rule Trigger</th>
                <th>PO Count</th>
                <th>% of POs</th>
                <th>Spend Volume</th>
                <th>% of Spend</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rule_breakdown.map((r, idx) => {
                const isContract = r.rule.includes('Contract Purchase');
                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{r.rule}</td>
                    <td>{r.po_count.toLocaleString()}</td>
                    <td>{r.po_pct}%</td>
                    <td style={{ fontWeight: 700, color: isContract ? '#0f766e' : '#b45309' }}>
                      ₹{(r.spend_amount / 10000000).toFixed(2)} Cr
                    </td>
                    <td>{r.spend_pct}%</td>
                    <td>
                      <span className={isContract ? 'badge badge-green' : 'badge badge-amber'}>
                        {isContract ? 'Contract Compliant' : 'Spot Buy Trigger'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Spot Buy Vendors Table */}
      <div className="clean-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Top Spot Buy Suppliers Driving Spend Leakage
            </h3>
            <p style={{ fontSize: '11.5px', color: '#64748b' }}>
              Vendors with highest uncontracted volume representing priority targets for annual master agreements
            </p>
          </div>
          <span className="badge badge-red">Contract Targets</span>
        </div>

        <div className="p2p-table-container">
          <table className="p2p-table">
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Supplier City</th>
                <th>Primary Commodity</th>
                <th>Total Spot Spend</th>
                <th>PO Count</th>
                <th>Spend Leakage</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {top_spot_vendors.map((v, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{v.vendor_name}</td>
                  <td>{v.vendor_city}</td>
                  <td>{v.primary_category}</td>
                  <td style={{ fontWeight: 700, color: '#b45309' }}>
                    ₹{(v.total_spend / 10000000).toFixed(2)} Cr
                  </td>
                  <td>{v.po_count} POs</td>
                  <td style={{ fontWeight: 700, color: '#be123c' }}>
                    ₹{(v.leakage / 100000).toFixed(1)} Lakhs
                  </td>
                  <td>
                    <span className="badge badge-blue">Negotiate Contract</span>
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
