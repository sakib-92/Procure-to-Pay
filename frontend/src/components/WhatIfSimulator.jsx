import React, { useState, useEffect } from 'react';
import { Sliders, TrendingUp, DollarSign } from 'lucide-react';
import { api } from '../api/client';

export default function WhatIfSimulator({ spotBuyKpis }) {
  const [targetReduction, setTargetReduction] = useState(25);
  const [negotiatedDiscount, setNegotiatedDiscount] = useState(12);
  const [simResults, setSimResults] = useState(null);

  useEffect(() => {
    let active = true;
    const runSim = async () => {
      try {
        const res = await api.simulateSpotBuySavings(targetReduction, negotiatedDiscount);
        if (active) setSimResults(res);
      } catch (err) {
        if (spotBuyKpis && active) {
          const currentSpot = spotBuyKpis.spot_spend || 4800000000;
          const leakage = spotBuyKpis.total_spend_leakage || 1800000000;
          const converted = currentSpot * (targetReduction / 100);
          const directSavings = converted * (negotiatedDiscount / 100);
          const recovered = leakage * (targetReduction / 100);
          const posConverted = Math.round((spotBuyKpis.spot_pos || 960) * (targetReduction / 100));
          const laborSavings = posConverted * 3.2 * 850;
          setSimResults({
            current_spot_spend: currentSpot,
            spend_converted_to_contract: converted,
            direct_cost_savings: directSavings,
            leakage_recovered: recovered,
            pos_converted: posConverted,
            procurement_labor_hours_saved: posConverted * 3.2,
            procurement_labor_savings: laborSavings,
            total_projected_savings: directSavings + laborSavings,
          });
        }
      }
    };

    runSim();
    return () => { active = false; };
  }, [targetReduction, negotiatedDiscount, spotBuyKpis]);

  return (
    <div className="clean-panel" style={{ padding: '20px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
            What-If Financial Modeling: Spot Buy Reduction & Volume Consolidation
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b' }}>
            Simulate bottom-line EBITDA gains achieved by shifting uncontracted spot buys into preferred master contracts
          </p>
        </div>
        <span className="badge badge-neutral">Treasury Sensitivity</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px' }}>
        {/* Sliders Box */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px',
        }}>
          {/* Slider 1 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#1e293b' }}>
                Target Spot Buy Reduction
              </label>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af' }}>
                {targetReduction}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={targetReduction}
              onChange={(e) => setTargetReduction(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#1e40af', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
              <span>5% (Conservative)</span>
              <span>25% (Target)</span>
              <span>60% (Aggressive)</span>
            </div>
          </div>

          {/* Slider 2 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#1e293b' }}>
                Negotiated Volume Contract Discount
              </label>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f766e' }}>
                {negotiatedDiscount}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              step="1"
              value={negotiatedDiscount}
              onChange={(e) => setNegotiatedDiscount(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#0f766e', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
              <span>5% (Tier 3)</span>
              <span>12% (Tier 2)</span>
              <span>25% (Tier 1 Preferred)</span>
            </div>
          </div>
        </div>

        {/* Output Cards */}
        {simResults && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
          }}>
            {/* Total Hero Card */}
            <div style={{
              gridColumn: 'span 2',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#166534', textTransform: 'uppercase' }}>
                  Total Projected Net Financial Return
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#14532d', marginTop: '2px' }}>
                  ₹{(simResults.total_projected_savings / 10000000).toFixed(2)} Crores
                </div>
                <div style={{ fontSize: '11.5px', color: '#15803d', marginTop: '2px' }}>
                  Direct cost reduction &bull; {simResults.pos_converted} purchase orders converted to contracts
                </div>
              </div>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '6px',
                background: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#15803d',
              }}>
                <TrendingUp size={20} />
              </div>
            </div>

            {/* Direct Cost Savings */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '12px 14px',
            }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Direct Spend Savings</div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                ₹{(simResults.direct_cost_savings / 10000000).toFixed(2)} Cr
              </div>
              <div style={{ fontSize: '11px', color: '#0f766e', marginTop: '2px' }}>
                Price rate differential
              </div>
            </div>

            {/* Procurement Hours */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '12px 14px',
            }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Buyer Hours Saved</div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                {simResults.procurement_labor_hours_saved.toLocaleString()} hrs
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Fewer ad-hoc quote requests
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
