import React from 'react';
import { 
  FileText, 
  Download, 
  HelpCircle, 
  Layers,
  GitBranch,
  ShieldAlert,
  Users,
  CheckCircle2
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onOpenSpotRuleModal, 
  onQuickDownloadPDF,
  onQuickDownloadExcel,
  isGenerating
}) {
  const navTabs = [
    { id: 'overview', label: 'Executive Overview', icon: Layers },
    { id: 'spotbuys', label: 'Contract vs. Spot Buys', icon: GitBranch },
    { id: 'threeway', label: '3-Way Match Reconciliation', icon: ShieldAlert },
    { id: 'vendors', label: 'Supplier Performance', icon: Users },
    { id: 'reports', label: 'Automated Reports', icon: FileText },
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '0 24px',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    }}>
      {/* Top Header Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '62px',
        borderBottom: '1px solid #f1f5f9',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: '#1e40af',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
          }}>
            <GitBranch size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
                Procure-to-Pay Process Analytics
              </span>
              <span className="badge badge-neutral">Single-Source Clean ETL</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
              8,500 Audited Purchase Orders &bull; Project 1 Clean Data Integration
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Rule Inspector */}
          <button 
            onClick={onOpenSpotRuleModal}
            className="btn btn-secondary" 
            title="View formal Spot Buy classification rule"
          >
            <HelpCircle size={14} color="#b45309" />
            <span>Spot Buy Rule Logic</span>
          </button>

          {/* PDF Report Export */}
          <button 
            onClick={onQuickDownloadPDF}
            disabled={isGenerating}
            className="btn btn-primary"
          >
            <Download size={14} />
            <span>{isGenerating ? 'Compiling...' : 'Export PDF Report'}</span>
          </button>

          {/* Excel Model Export */}
          <button 
            onClick={onQuickDownloadExcel}
            disabled={isGenerating}
            className="btn btn-emerald"
          >
            <FileText size={14} />
            <span>Excel Model (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        padding: '6px 0 0 0',
      }}>
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '9px 14px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: isActive ? '#1e40af' : '#64748b',
                borderBottom: isActive ? '2px solid #1e40af' : '2px solid transparent',
                borderRadius: '0',
                transition: 'all 0.1s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={15} color={isActive ? '#1e40af' : '#94a3b8'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
