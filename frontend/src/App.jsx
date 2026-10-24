import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SpotBuyModal from './components/SpotBuyModal';

import ExecutiveOverview from './pages/ExecutiveOverview';
import SpotBuyView from './pages/SpotBuyView';
import ThreeWayMatchView from './pages/ThreeWayMatchView';
import VendorScorecardView from './pages/VendorScorecardView';
import ReportingCenterView from './pages/ReportingCenterView';

import { api } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSpotRuleOpen, setIsSpotRuleOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Data states
  const [overviewData, setOverviewData] = useState(null);
  const [spotData, setSpotData] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initial Data Fetch
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [
          ov,
          spot,
          twm,
          vnd,
        ] = await Promise.all([
          api.getOverview().catch(() => null),
          api.getSpotBuys().catch(() => null),
          api.getThreeWayMatch().catch(() => null),
          api.getVendors().catch(() => null),
        ]);

        setOverviewData(ov);
        setSpotData(spot);
        setMatchData(twm);
        setVendorData(vnd);
      } catch (err) {
        console.warn('Error loading procurement data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const handleQuickPDF = async () => {
    setIsGenerating(true);
    try {
      const res = await api.generatePDF();
      window.open(`http://localhost:8000${res.download_url}`, '_blank');
    } catch (err) {
      alert(`Could not compile PDF: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickExcel = async () => {
    setIsGenerating(true);
    try {
      const res = await api.generateExcel();
      window.open(`http://localhost:8000${res.download_url}`, '_blank');
    } catch (err) {
      alert(`Could not compile Excel: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSpotRuleModal={() => setIsSpotRuleOpen(true)}
        onQuickDownloadPDF={handleQuickPDF}
        onQuickDownloadExcel={handleQuickExcel}
        isGenerating={isGenerating}
      />

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        maxWidth: '1360px',
        width: '100%',
        margin: '0 auto',
        padding: '24px 20px 48px 20px',
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '45vh',
            gap: '10px',
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
              Loading Procure-to-Pay Analytics...
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Reconciling 8,500 PO records, 3-way match variances, and spot buy rule triggers
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <ExecutiveOverview 
                data={overviewData} 
                onNavigateTab={setActiveTab} 
              />
            )}
            {activeTab === 'spotbuys' && (
              <SpotBuyView 
                data={spotData} 
                onOpenSpotRuleModal={() => setIsSpotRuleOpen(true)} 
              />
            )}
            {activeTab === 'threeway' && (
              <ThreeWayMatchView data={matchData} />
            )}
            {activeTab === 'vendors' && (
              <VendorScorecardView data={vendorData} />
            )}
            {activeTab === 'reports' && (
              <ReportingCenterView />
            )}
          </>
        )}
      </main>

      {/* Spot Buy Rule Modal */}
      <SpotBuyModal
        isOpen={isSpotRuleOpen}
        onClose={() => setIsSpotRuleOpen(false)}
      />

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #e2e8f0',
        padding: '16px 20px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#64748b',
        background: '#ffffff',
      }}>
        Procure-to-Pay Process Analytics & Automated Reporting &copy; 2026. Single-source clean data architecture.
      </footer>
    </div>
  );
}
