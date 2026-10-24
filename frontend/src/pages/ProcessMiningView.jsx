import React from 'react';
import { Clock, AlertTriangle, Cpu, TrendingUp, CheckCircle, BarChart3, GitCommit } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

export default function ProcessMiningView({ data }) {
  if (!data) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading process mining telemetry...</div>;

  const { 
    summary, 
    department_approval_bottlenecks, 
    category_fulfillment, 
    bottlenecks, 
    approval_distribution, 
    delivery_distribution, 
    ml_forecaster 
  } = data;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
          P2P Process Mining & Cycle Time Bottlenecks
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Milestone lead times, SLA compliance distributions, and approval queue latency across departments
        </p>
      </div>

      {/* Cycle Time Stage Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '14px',
        marginBottom: '24px',
      }}>
        {[
          { label: 'Requisition -> Approval', key: 'cycle_time_creation_to_approval', color: '#6366f1' },
          { label: 'Approval -> Delivery', key: 'cycle_time_approval_to_delivery', color: '#06b6d4' },
          { label: 'Delivery -> Invoicing', key: 'cycle_time_delivery_to_invoice', color: '#10b981' },
          { label: 'Invoicing -> AP Payment', key: 'cycle_time_invoice_to_payment', color: '#f59e0b' },
          { label: 'Total P2P Lifecycle', key: 'total_p2p_cycle_time', color: '#ec4899', isTotal: true },
        ].map((stage, idx) => {
          const stats = summary[stage.key] || { mean_days: 0, p90_days: 0, median_days: 0 };
          return (
            <div key={idx} className="glass-panel" style={{
              padding: '16px',
              borderTop: `3px solid ${stage.color}`,
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px' }}>
                {stage.label}
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
                {stats.mean_days} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-dim)' }}>days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                <span>P50: {stats.median_days}d</span>
                <span style={{ color: stage.color, fontWeight: 600 }}>P90: {stats.p90_days}d</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '20px',
        marginBottom: '24px',
      }}>
        {/* Chart 1: Approval Distribution */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              Managerial Approval SLA Distribution
            </h3>
            <span className="badge badge-blue">Requisition Sign-Off</span>
          </div>
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer>
              <BarChart data={approval_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="bucket" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ background: '#131c31', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="count" name="PO Count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Delivery Distribution */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              Supplier Fulfillment Lead Time Distribution
            </h3>
            <span className="badge badge-green">Approval to GRN</span>
          </div>
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer>
              <BarChart data={delivery_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="bucket" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ background: '#131c31', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="count" name="PO Count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Departmental Approval Bottlenecks Table */}
      <div className="glass-panel" style={{ padding: '22px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              Departmental Approval Bottlenecks & Escalations
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Identifies managerial sign-off friction points where cycle time exceeds the 5-day SLA
            </p>
          </div>
          <span className="badge badge-red">
            {bottlenecks.approval_stall_count} Orders Over 10-Day SLA
          </span>
        </div>

        <div className="p2p-table-container">
          <table className="p2p-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Audited POs</th>
                <th>Total Spend</th>
                <th>Avg Approval Days</th>
                <th>P90 Approval Days</th>
                <th>Bottlenecks (&gt;10d)</th>
                <th>SLA Health Status</th>
              </tr>
            </thead>
            <tbody>
              {department_approval_bottlenecks.map((dept, idx) => {
                const isSlow = dept.avg_approval_days > 4.5 || dept.p90_approval_days > 12;
                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{dept.department}</td>
                    <td>{dept.po_count.toLocaleString()}</td>
                    <td>₹{(dept.total_spend / 10000000).toFixed(2)} Cr</td>
                    <td style={{ fontWeight: 700, color: isSlow ? '#f43f5e' : '#10b981' }}>
                      {dept.avg_approval_days} days
                    </td>
                    <td>{dept.p90_approval_days} days</td>
                    <td>
                      <span className={dept.approval_bottlenecks > 20 ? 'badge badge-red' : 'badge badge-amber'}>
                        {dept.approval_bottlenecks} stalled
                      </span>
                    </td>
                    <td>
                      <span className={isSlow ? 'badge badge-red' : 'badge badge-green'}>
                        {isSlow ? 'Under Review' : 'Healthy SLA'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ML Delivery Risk Forecaster Card */}
      {ml_forecaster && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Cpu size={22} color="#818cf8" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                Machine Learning Fulfillment Lead Time Forecaster (Gradient Boosting)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Trained on <strong>{ml_forecaster.training_samples.toLocaleString()} historical deliveries</strong> &bull; Mean Absolute Error (MAE): <strong>{ml_forecaster.mae_days} days</strong>
              </div>
            </div>
          </div>
          <span className="badge badge-blue">ML Model Online</span>
        </div>
      )}
    </div>
  );
}
