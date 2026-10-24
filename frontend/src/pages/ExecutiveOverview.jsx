import React from 'react';
import { 
  DollarSign, 
  FileCheck, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  ArrowUpRight,
  Truck
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import ProcessFlowFunnel from '../components/ProcessFlowFunnel';

export default function ExecutiveOverview({ data, onNavigateTab }) {
  if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading dashboard telemetry...</div>;

  const { kpis, monthly_trend, department_spend, milestone_funnel } = data;

  return (
    <div>
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        padding: '16px 20px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            Executive Procure-to-Pay Overview
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
            Audited ledger of <strong>{kpis.total_pos.toLocaleString()}</strong> purchase orders &bull; Clean Single-Source ETL
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '6px 12px',
            textAlign: 'right',
          }}>
            <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Fleet OTIF Rate</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f766e' }}>{kpis.fleet_otif_rate_pct}%</div>
          </div>
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '6px 12px',
            textAlign: 'right',
          }}>
            <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Active Suppliers</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e40af' }}>{kpis.active_suppliers}</div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px',
        marginBottom: '20px',
      }}>
        {/* KPI 1: Total Spend */}
        <div className="clean-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Total Audited Spend
            </span>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1e40af',
            }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
            ₹{(kpis.total_spend / 10000000).toFixed(1)} Cr
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#64748b', marginTop: '6px' }}>
            <span className="badge badge-neutral">{kpis.total_pos.toLocaleString()} POs</span>
            <span>across 7 departments</span>
          </div>
        </div>

        {/* KPI 2: Contract vs Spot Buy Spend */}
        <div className="clean-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Contract Compliance Rate
            </span>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#065f46',
            }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f766e' }}>
            {kpis.contract_spend_pct}%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#64748b', marginTop: '6px' }}>
            <span className="badge badge-amber">{kpis.spot_spend_pct}% Spot Buy</span>
            <span>₹{(kpis.spot_spend / 10000000).toFixed(1)} Cr off-contract</span>
          </div>
        </div>

        {/* KPI 3: Spend Leakage */}
        <div className="clean-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Spend Leakage (Premium)
            </span>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              background: '#fff1f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9f1239',
            }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#be123c' }}>
            ₹{(kpis.spend_leakage / 10000000).toFixed(2)} Cr
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#64748b', marginTop: '6px' }}>
            <span className="badge badge-red">+{kpis.avg_spot_premium_pct || 14.5}% Spot Premium</span>
            <span>recoverable</span>
          </div>
        </div>

        {/* KPI 4: 3-Way Match Clean Rate */}
        <div className="clean-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              3-Way Match Clean Rate
            </span>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1d4ed8',
            }}>
              <FileCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#1d4ed8' }}>
            {kpis.match_clean_rate_pct}%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#64748b', marginTop: '6px' }}>
            <span style={{ color: '#b45309', fontWeight: 600 }}>₹{(kpis.disputed_exposure / 10000000).toFixed(1)} Cr</span>
            <span>dispute hold</span>
          </div>
        </div>
      </div>

      {/* Milestone Funnel */}
      <ProcessFlowFunnel funnelData={milestone_funnel} />

      {/* Trend & Department Spend */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.9fr 1.1fr',
        gap: '16px',
        marginBottom: '20px',
      }}>
        {/* Monthly Trend Area Chart */}
        <div className="clean-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                Monthly Procurement Spend & Contract Compliance
              </h3>
              <p style={{ fontSize: '11.5px', color: '#64748b' }}>
                Contracted volume vs. maverick spot buys across trailing 12 months
              </p>
            </div>
            <span className="badge badge-neutral">INR Crores</span>
          </div>

          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer>
              <AreaChart data={monthly_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="contractGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e40af" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1e40af" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="spotGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b45309" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#b45309" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month_year" stroke="#94a3b8" fontSize={11} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickFormatter={(val) => `₹${(val / 10000000).toFixed(0)}Cr`} 
                />
                <Tooltip 
                  contentStyle={{ background: '#ffffff', borderColor: '#cbd5e1', borderRadius: '6px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  formatter={(val) => [`₹${(val / 10000000).toFixed(2)} Crores`, '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="contract_spend" 
                  name="Contracted Spend" 
                  stroke="#1e40af" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#contractGrad)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="spot_spend" 
                  name="Spot Buy Spend" 
                  stroke="#b45309" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#spotGrad)" 
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Exposure */}
        <div className="clean-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                Departmental Maverick Exposure
              </h3>
              <p style={{ fontSize: '11.5px', color: '#64748b' }}>
                Spot buy rate by organizational department
              </p>
            </div>
            <button 
              onClick={() => onNavigateTab('spotbuys')}
              style={{ background: 'transparent', border: 'none', color: '#1e40af', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              <span>View</span>
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {department_spend.slice(0, 5).map((dept, idx) => (
              <div key={idx} style={{
                background: '#f8fafc',
                borderRadius: '6px',
                padding: '9px 12px',
                border: '1px solid #e2e8f0',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
                  <span>{dept.department}</span>
                  <span style={{ color: dept.spot_rate_pct > 10 ? '#be123c' : '#0f766e' }}>
                    {dept.spot_rate_pct}% Spot
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                  <span>₹{(dept.total_spend / 10000000).toFixed(1)} Cr total</span>
                  <span>{dept.po_count} POs</span>
                </div>
                {/* Progress bar */}
                <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '4px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(dept.spot_rate_pct * 4, 100)}%`,
                    height: '100%',
                    background: dept.spot_rate_pct > 10 ? '#be123c' : '#1e40af',
                    borderRadius: '4px',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
