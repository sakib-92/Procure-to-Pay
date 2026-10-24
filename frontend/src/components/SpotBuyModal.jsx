import React from 'react';
import { X, Scale, FileText, CheckCircle2 } from 'lucide-react';

export default function SpotBuyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '10px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1e40af',
            }}>
              <Scale size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                Spot Buy vs. Contract Classification Rule Engine
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Operational criteria used across all audited purchase orders
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Specification Quote */}
        <div style={{
          background: '#f8fafc',
          borderLeft: '3px solid #1e40af',
          borderRadius: '4px',
          padding: '12px 16px',
          marginBottom: '20px',
          fontSize: '12.5px',
          lineHeight: '1.5',
          color: '#334155',
        }}>
          <strong>Governance Rule:</strong><br/>
          <em>"You need PO creation, approval and delivery dates, plus a flag or field showing whether the purchase was against a contract or a one-off. If the dataset has no such field, define 'spot buy' by a rule and state the rule openly in the README."</em>
        </div>

        {/* 3 Core Rules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span className="badge badge-amber">Rule 1</span>
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                Infrequent / Single-Use Supplier
              </strong>
            </div>
            <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.4' }}>
              Any vendor with <strong>&le; 2 total purchase orders</strong> across the historical dataset is classified as an ad-hoc, one-off supplier without an established relationship.
            </p>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span className="badge badge-blue">Rule 2</span>
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                Lack of Active Master Services Agreement (MSA)
              </strong>
            </div>
            <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.4' }}>
              Orders where the supplier contract type is <code>trial</code>, <code>none</code>, or lacks a pre-negotiated master agreement (<code>contract_id IS NULL</code>).
            </p>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span className="badge badge-red">Rule 3</span>
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                Ad-hoc Non-Catalog / Emergency Requisitions
              </strong>
            </div>
            <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.4' }}>
              Purchases belonging to emergency courier freight or unnegotiated services that bypass the central corporate catalog.
            </p>
          </div>
        </div>

        {/* Spend Leakage Note */}
        <div style={{
          background: '#fff1f2',
          border: '1px solid #ffe4e6',
          borderRadius: '6px',
          padding: '14px',
          marginBottom: '20px',
        }}>
          <strong style={{ fontSize: '12.5px', color: '#9f1239', display: 'block', marginBottom: '4px' }}>
            Spend Leakage Quantification Formula
          </strong>
          <p style={{ fontSize: '12px', color: '#881337', lineHeight: '1.5' }}>
            Spot buys incur an average <strong>+14.5% unnegotiated price premium</strong>. Leakage is calculated as:
            <br/>
            <code>Spend Leakage = MAX(0, Actual Unit Price - Benchmark Contract Price) &times; Quantity</code>
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
