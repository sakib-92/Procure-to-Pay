import React, { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw, FileSpreadsheet, Eye } from 'lucide-react';
import { api } from '../api/client';

export default function ReportingCenterView() {
  const [reports, setReports] = useState([]);
  const [generatingType, setGeneratingType] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const loadReports = async () => {
    try {
      const res = await api.listReports();
      setReports(res.reports || []);
    } catch (err) {
      console.warn('Failed to list reports:', err);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleGeneratePDF = async () => {
    setGeneratingType('PDF');
    setStatusMessage('Compiling Executive PDF Audit Report via ReportLab...');
    try {
      const res = await api.generatePDF();
      setStatusMessage(`Generated: ${res.filename}`);
      await loadReports();
      window.open(`http://localhost:8000${res.download_url}`, '_blank');
    } catch (err) {
      setStatusMessage(`Error generating PDF: ${err.message}`);
    } finally {
      setGeneratingType(null);
    }
  };

  const handleGenerateExcel = async () => {
    setGeneratingType('EXCEL');
    setStatusMessage('Compiling financial audit Excel model via openpyxl...');
    try {
      const res = await api.generateExcel();
      setStatusMessage(`Generated: ${res.filename}`);
      await loadReports();
      window.open(`http://localhost:8000${res.download_url}`, '_blank');
    } catch (err) {
      setStatusMessage(`Error generating Excel: ${err.message}`);
    } finally {
      setGeneratingType(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
          Automated Procurement Reporting & Deliverables
        </h2>
        <p style={{ fontSize: '12.5px', color: '#64748b' }}>
          One-click compilation of board audit memoranda, multi-tab financial workbooks, and HTML digests
        </p>
      </div>

      {/* Action Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* PDF Card */}
        <div className="clean-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
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
                <FileText size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                  Executive PDF Audit Report
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>ReportLab Engine</span>
              </div>
            </div>
            <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.4', marginBottom: '16px' }}>
              Formatted memorandum featuring KPI scorecards, spot buy rule breakdown, 3-way match exceptions, and strategic recommendations.
            </p>
          </div>

          <button
            onClick={handleGeneratePDF}
            disabled={generatingType !== null}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            <Download size={14} />
            <span>{generatingType === 'PDF' ? 'Compiling PDF...' : 'Compile Executive PDF'}</span>
          </button>
        </div>

        {/* Excel Card */}
        <div className="clean-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: '#f0fdfa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0f766e',
              }}>
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                  Financial Model (Excel .xlsx)
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>openpyxl Styled Workbook</span>
              </div>
            </div>
            <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.4', marginBottom: '16px' }}>
              Multi-tab spreadsheet workbook with Executive Summary, Spot Buy Governance, 3-Way Match Exceptions, and Supplier OTIF Leaderboard.
            </p>
          </div>

          <button
            onClick={handleGenerateExcel}
            disabled={generatingType !== null}
            className="btn btn-emerald"
            style={{ width: '100%' }}
          >
            <Download size={14} />
            <span>{generatingType === 'EXCEL' ? 'Compiling Excel...' : 'Compile Excel Workbook'}</span>
          </button>
        </div>

        {/* HTML Card */}
        <div className="clean-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1d4ed8',
              }}>
                <Eye size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                  HTML Executive Digest
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Web / Email Briefing</span>
              </div>
            </div>
            <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.4', marginBottom: '16px' }}>
              Self-contained, email-ready HTML digest containing summary KPI scorecards, rule breakdown, and active discrepancy queue.
            </p>
          </div>

          <a
            href="http://localhost:8000/api/reports/html"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ width: '100%', textDecoration: 'none' }}
          >
            <Eye size={14} />
            <span>Preview HTML Digest</span>
          </a>
        </div>
      </div>

      {statusMessage && (
        <div style={{
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          padding: '10px 14px',
          marginBottom: '20px',
          fontSize: '12.5px',
          color: '#1e293b',
        }}>
          {statusMessage}
        </div>
      )}

      {/* Reports Table */}
      <div className="clean-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Generated Report Repository
            </h3>
            <p style={{ fontSize: '11.5px', color: '#64748b' }}>
              Audit artifacts available for download on local server
            </p>
          </div>
          <button onClick={loadReports} className="btn btn-secondary" style={{ fontSize: '12px', padding: '5px 10px' }}>
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="p2p-table-container">
          <table className="p2p-table">
            <thead>
              <tr>
                <th>Artifact Filename</th>
                <th>Format</th>
                <th>File Size</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.length > 0 ? (
                reports.map((r, idx) => (
                  <tr key={idx}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.filename}</td>
                    <td>
                      <span className={
                        r.file_type === 'PDF' ? 'badge badge-blue'
                        : r.file_type === 'XLSX' ? 'badge badge-green'
                        : 'badge badge-neutral'
                      }>
                        {r.file_type}
                      </span>
                    </td>
                    <td>{r.size_kb} KB</td>
                    <td>
                      <a
                        href={`http://localhost:8000${r.download_url}`}
                        download={r.filename}
                        className="btn btn-secondary"
                        style={{ fontSize: '11.5px', padding: '4px 8px', textDecoration: 'none' }}
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '16px', color: '#94a3b8' }}>
                    No reports compiled yet. Use the buttons above to generate one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
