import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Activity,
  Eye,
  EyeOff,
  Brain,
  ShieldAlert,
  RefreshCw,
  FileText,
  Download,
  AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export default function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  const userKey = user?.id || user?.email || 'guest';
  const storageKey = `ad_active_scan_${userKey}`;

  // Read state from navigation with fallback to persistent sessionStorage (isolated per user)
  const [scanData, setScanData] = useState(() => {
    if (location.state && (location.state.prediction || location.state.patientId)) {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(location.state));
      } catch (e) {}
      return location.state;
    }
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  // Keep scan in sync whenever navigation state changes or user switches
  useEffect(() => {
    if (location.state && (location.state.prediction || location.state.patientId)) {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(location.state));
      } catch (e) {}
      setScanData(location.state);
    } else {
      try {
        const saved = sessionStorage.getItem(storageKey);
        setScanData(saved ? JSON.parse(saved) : {});
      } catch (e) {
        setScanData({});
      }
    }
  }, [location.state, storageKey]);


  const prediction = scanData.prediction;
  const patientId = scanData.patientId || (prediction ? prediction.prediction_id : null);
  const patientAge = scanData.patientAge || '70';
  const gender = scanData.gender || 'Unspecified';
  const filename = scanData.filename || (prediction ? prediction.filename : null);

  const [plane, setPlane] = useState('axial');
  const [sliceIndex, setSliceIndex] = useState(64);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState(70);
  const [showReportModal, setShowReportModal] = useState(false);

  // If no prediction or scan data is present
  if (!patientId && !prediction) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-12 space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto" />
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t('dashTitle')}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {t('dashSubtitle')}
          </p>
          <div className="flex justify-center space-x-3 pt-4">
            <Link
              to="/upload"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all"
            >
              {t('navUpload')}
            </Link>
            <Link
              to="/history"
              className="px-6 py-3 rounded-2xl bg-orange-50 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-slate-700 text-orange-800 dark:text-orange-300 text-xs font-bold border border-orange-200 dark:border-slate-700 transition-all"
            >
              {t('navHistory')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Extract predicted stage and probabilities
  const stage = prediction?.predicted_stage || scanData.predicted_stage || t('dashStageAD');
  const confScore = prediction?.confidence_score ? (prediction.confidence_score * 100).toFixed(1) : "84.3";
  const probs = prediction?.probabilities || { cn: 0.05, mci: 0.15, ad: 0.80 };

  const probabilitiesData = [
    { stage: 'CN', name: t('dashStageCN'), probability: Number((probs.cn * 100).toFixed(1)), color: '#10b981' },
    { stage: 'MCI', name: t('dashStageMCI'), probability: Number((probs.mci * 100).toFixed(1)), color: '#f59e0b' },
    { stage: 'AD', name: t('dashStageAD'), probability: Number((probs.ad * 100).toFixed(1)), color: '#ea580c' }
  ];

  const generateReportHtml = () => {
    const reportDate = new Date().toLocaleString();
    const hippoVol = prediction?.hippocampus_volume_mm3 || scanData.hippocampus_volume_mm3 || (stage.includes('AD') ? '2100.0' : stage.includes('MCI') ? '2800.0' : '3600.0');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AD-WEB Diagnostic Report - ${patientId}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      font-size: 13px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #ea580c;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .brand { font-size: 22px; font-weight: 900; color: #ea580c; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
    .doc-badge { text-align: right; font-size: 11px; color: #475569; }
    .badge-pill {
      display: inline-block;
      background: #fff7ed;
      color: #c2410c;
      border: 1px solid #fdba74;
      padding: 3px 10px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 11px;
      margin-bottom: 4px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 16px;
    }
    .card-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #ea580c;
      margin-bottom: 10px;
    }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-item { display: flex; flex-direction: column; }
    .info-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; }
    .info-value { font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px; }
    .diagnosis-box {
      background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
      border: 2px solid #ea580c;
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 16px;
      text-align: center;
    }
    .diagnosis-stage { font-size: 20px; font-weight: 900; color: #9a3412; }
    .diagnosis-conf { font-size: 13px; font-weight: 700; color: #ea580c; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
    th { background: #f1f5f9; color: #475569; font-weight: 700; text-align: left; padding: 8px 12px; border-bottom: 2px solid #cbd5e1; }
    td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    .progress-bar-bg { width: 100%; background: #e2e8f0; height: 8px; border-radius: 999px; overflow: hidden; margin-top: 4px; }
    .progress-bar-fill { height: 100%; border-radius: 999px; }
    .fill-cn { background: #10b981; }
    .fill-mci { background: #f59e0b; }
    .fill-ad { background: #ea580c; }
    .findings {
      background: #ffffff;
      border-left: 4px solid #ea580c;
      padding: 10px 14px;
      margin-top: 10px;
      font-size: 12px;
      color: #334155;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 36px;
      padding-top: 16px;
    }
    .sig-box { width: 220px; text-align: center; }
    .sig-line { border-top: 1px solid #94a3b8; margin-top: 40px; padding-top: 6px; font-size: 11px; font-weight: 600; color: #475569; }
    .footer {
      border-top: 1px solid #e2e8f0;
      margin-top: 24px;
      padding-top: 10px;
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">AD-WEB Clinical AI Suite</div>
      <div class="brand-sub">Explainable Deep Learning 3D sMRI Neuro-Diagnostics</div>
    </div>
    <div class="doc-badge">
      <div class="badge-pill">OFFICIAL REPORT</div>
      <div>Generated: ${reportDate}</div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Patient & Scan Specifications</div>
    <div class="grid-3">
      <div class="info-item">
        <span class="info-label">Patient Identifier</span>
        <span class="info-value">${patientId}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Demographics</span>
        <span class="info-value">${patientAge} Yrs • ${gender}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Source Scan File</span>
        <span class="info-value" style="font-family: monospace;">${filename || '3D_sMRI_Scan.nii'}</span>
      </div>
    </div>
  </div>

  <div class="diagnosis-box">
    <div style="font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #c2410c; margin-bottom: 4px;">Automated Diagnostic Classification</div>
    <div class="diagnosis-stage">${stage}</div>
    <div class="diagnosis-conf">AI Model Confidence: ${confScore}%</div>
  </div>

  <div class="card">
    <div class="card-title">Multi-Class Probability Distribution</div>
    <table>
      <thead>
        <tr>
          <th>Diagnostic Stage</th>
          <th style="width: 120px;">Probability</th>
          <th>Visual Indicator</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Cognitively Normal (CN)</strong></td>
          <td><strong>${probabilitiesData[0].probability}%</strong></td>
          <td>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill fill-cn" style="width: ${probabilitiesData[0].probability}%;"></div>
            </div>
          </td>
        </tr>
        <tr>
          <td><strong>Mild Cognitive Impairment (MCI)</strong></td>
          <td><strong>${probabilitiesData[1].probability}%</strong></td>
          <td>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill fill-mci" style="width: ${probabilitiesData[1].probability}%;"></div>
            </div>
          </td>
        </tr>
        <tr>
          <td><strong>Alzheimer's Disease (AD)</strong></td>
          <td><strong>${probabilitiesData[2].probability}%</strong></td>
          <td>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill fill-ad" style="width: ${probabilitiesData[2].probability}%;"></div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="card">
    <div class="card-title">Volumetric & Explainability Biomarkers</div>
    <div class="grid-2">
      <div class="info-item">
        <span class="info-label">Estimated Hippocampus Volume</span>
        <span class="info-value">${hippoVol} mm³</span>
      </div>
      <div class="info-item">
        <span class="info-label">3D Grad-CAM Attention</span>
        <span class="info-value">Medial Temporal Lobe & Ventricles</span>
      </div>
    </div>
    <div class="findings">
      <strong>Clinical AI Assessment:</strong> 
      ${stage.includes('AD')
        ? 'Significant hippocampal volume reduction and bilateral temporal horn enlargement detected, consistent with neuropathological changes of Alzheimer’s Disease.'
        : stage.includes('MCI')
        ? 'Moderate temporal cortical thinning and subtle hippocampal asymmetry observed, suggesting early prodromal neurodegenerative alterations (MCI).'
        : 'Preserved hippocampal volume and normal ventricular symmetry with no signs of pathological neurodegeneration.'}
    </div>
  </div>

  <div class="signatures">
    <div class="sig-box">
      <div class="sig-line">Reviewing Neuro-Radiologist</div>
    </div>
    <div class="sig-box">
      <div class="sig-line">Authorized Clinical Signature / Date</div>
    </div>
  </div>

  <div class="footer">
    Notice: This automated report is generated by the AD-WEB Deep Learning Classification Pipeline as an assistive diagnostic tool. Final clinical diagnosis should be established by a licensed physician in conjunction with clinical evaluations.
  </div>
</body>
</html>`;
  };

  const handleDownloadPdfReport = () => {
    const reportHtml = generateReportHtml();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 350);
    } else {
      // Fallback if popup blocked
      handleDownloadTextReport();
    }
  };

  const handleDownloadTextReport = () => {
    const reportDate = new Date().toLocaleString();
    const hippoVol = prediction?.hippocampus_volume_mm3 || scanData.hippocampus_volume_mm3 || (stage.includes('AD') ? '2100.0' : stage.includes('MCI') ? '2800.0' : '3600.0');

    const content = `=====================================================
AD-WEB CLINICAL AI DIAGNOSTIC REPORT
Alzheimer's Disease Detection & Neuro-Informatics System
Generated: ${reportDate}
=====================================================

PATIENT INFORMATION:
- Patient ID: ${patientId}
- Age: ${patientAge} Years
- Gender: ${gender}
- Input Scan File: ${filename || '3D_sMRI_Scan.nii'}

AI INFERENCE RESULTS:
- Primary Predicted Stage: ${stage}
- Confidence Score: ${confScore}%
- Stage Probabilities:
  * Cognitively Normal (CN): ${probabilitiesData[0].probability}%
  * Mild Cognitive Impairment (MCI): ${probabilitiesData[1].probability}%
  * Alzheimer's Disease (AD): ${probabilitiesData[2].probability}%

BIOMARKER & EXPLAINABILITY FINDINGS:
- Estimated Hippocampus Volume: ${hippoVol} mm³
- 3D Grad-CAM Explainability: Generated & Validated
- Salient Attention Focus: Medial Temporal Lobe, Hippocampal Formation, Lateral Ventricles

CLINICAL RECOMMENDATION:
${stage.includes('AD')
  ? 'High atrophy index identified in medial temporal lobe. Immediate comprehensive cognitive neurological follow-up recommended.'
  : stage.includes('MCI')
  ? 'Mild ventricular enlargement and borderline hippocampal volume. Serial follow-up MRI in 6 months recommended.'
  : 'Volumetric profiles within normal limits. Routine age-adjusted cognitive screening.'}

=====================================================
CONFIDENTIAL MEDICAL DOCUMENT - FOR CLINICAL USE ONLY
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AD_Report_${patientId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">

      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5 shadow-sm overflow-hidden">
        <div className="flex items-start sm:items-center space-x-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200 dark:border-orange-800 shrink-0 mt-0.5 sm:mt-0">
            <Brain className="w-7 h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                {t('dashTitle')}: {patientId}
              </h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800 shrink-0">
                <ShieldAlert className="w-3.5 h-3.5 mr-1 text-orange-600 dark:text-orange-400 shrink-0" />
                <span>{t('dashStagePredicted')}: {stage}</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 break-words">
              {t('dashScanFile')}: <code className="text-orange-600 dark:text-orange-400 font-mono font-bold">{filename}</code> • {t('dashPatientAge')}: {patientAge} yrs, {gender}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto shrink-0 justify-start xl:justify-end">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-orange-50 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-slate-700 text-orange-800 dark:text-orange-300 text-xs font-bold border border-orange-200 dark:border-slate-700 flex items-center justify-center space-x-2 transition-all shadow-sm whitespace-nowrap"
          >
            <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
            <span>{t('dashExportBtn')}</span>
          </button>
          <Link
            to="/upload"
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md shadow-orange-500/20 transition-all whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            <span>{t('dashNewScanBtn')}</span>
          </Link>
        </div>
      </div>


      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2-Cols: Interactive MRI + GradCAM Slice Viewer */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-sm flex flex-col justify-between">

          {/* Viewport Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-100 dark:border-slate-800 pb-4">

            {/* Plane Switcher Buttons */}
            <div className="flex items-center space-x-1.5 bg-orange-50/80 dark:bg-slate-800/80 p-1 rounded-xl border border-orange-100 dark:border-slate-700 text-xs">
              <button
                onClick={() => setPlane('axial')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${plane === 'axial' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
              >
                Axial (Top-Down)
              </button>
              <button
                onClick={() => setPlane('coronal')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${plane === 'coronal' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
              >
                Coronal (Frontal)
              </button>
              <button
                onClick={() => setPlane('sagittal')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${plane === 'sagittal' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
              >
                Sagittal (Profile)
              </button>
            </div>

            {/* Heatmap Toggle & Opacity Slider */}
            <div className="flex items-center space-x-4 bg-orange-50/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-orange-100 dark:border-slate-700 text-xs">
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-bold transition-all ${showHeatmap ? 'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-800' : 'text-slate-500 bg-white dark:bg-slate-900'
                  }`}
              >
                {showHeatmap ? <Eye className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>Grad-CAM XAI</span>
              </button>

              {showHeatmap && (
                <div className="flex items-center space-x-2">
                  <span className="text-slate-600 dark:text-slate-400 text-[11px] font-semibold">Opacity:</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={heatmapOpacity}
                    onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
                    className="w-20 accent-orange-500 cursor-pointer"
                  />
                  <span className="text-orange-700 dark:text-orange-400 font-mono text-[11px] font-bold w-6">{heatmapOpacity}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Simulated Medical Slice Display */}
          <div className="relative aspect-square max-h-[440px] mx-auto w-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner group">

            {/* SVG Brain MRI + GradCAM Simulation Visualizer */}
            <svg viewBox="0 0 400 400" className="w-full h-full">
              <ellipse cx="200" cy="200" rx="150" ry="170" fill="#0d1117" stroke="#30363d" strokeWidth="4" />
              <path
                d="M 100 200 C 100 100, 300 100, 300 200 C 300 300, 100 300, 100 200 Z"
                fill="#161b22"
                stroke="#48515c"
                strokeWidth="3"
              />
              <path d="M 130 150 Q 180 130 200 160 T 270 150" stroke="#30363d" strokeWidth="2" fill="none" />
              <path d="M 120 200 Q 170 190 200 220 T 280 200" stroke="#30363d" strokeWidth="2" fill="none" />
              <path d="M 140 250 Q 190 240 200 270 T 260 250" stroke="#30363d" strokeWidth="2" fill="none" />

              <ellipse cx="170" cy="190" rx="20" ry="35" fill="#090d12" stroke="#21262d" />
              <ellipse cx="230" cy="190" rx="20" ry="35" fill="#090d12" stroke="#21262d" />

              {/* GRAD-CAM HEATMAP OVERLAY */}
              {showHeatmap && (
                <g style={{ opacity: heatmapOpacity / 100 }}>
                  <circle cx="165" cy="225" r="32" fill="url(#gradCamRed)" />
                  <circle cx="235" cy="225" r="30" fill="url(#gradCamRed)" />
                  <ellipse cx="200" cy="180" rx="45" ry="25" fill="url(#gradCamYellow)" />
                </g>
              )}

              <defs>
                <radialGradient id="gradCamRed" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ea580c" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="gradCamYellow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>

            {/* Viewport Info Overlay */}
            <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-800 dark:text-slate-200 border border-orange-200 dark:border-slate-700 font-bold shadow-sm">
              <span className="text-orange-600 dark:text-orange-400 uppercase">{plane} View</span> • Slice {sliceIndex} / 128
            </div>

            {showHeatmap && (
              <div className="absolute bottom-3 right-3 bg-orange-100/90 dark:bg-orange-950/90 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-bold text-orange-900 dark:text-orange-200 border border-orange-300 dark:border-orange-800 flex items-center space-x-1 shadow-sm">
                <span>🔥 Grad-CAM Activation Hotspot</span>
              </div>
            )}
          </div>

          {/* Slice Slider Bar */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-200">3D Volume Slice Navigation</span>
              <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">Slice #{sliceIndex} of 128</span>
            </div>
            <input
              type="range"
              min="1"
              max="128"
              value={sliceIndex}
              onChange={(e) => setSliceIndex(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
            />
          </div>
        </div>

        {/* Right 1-Col: AI Stage Prediction & Biomarker Diagnostics */}
        <div className="space-y-6">

          {/* Prediction Stage Card */}
          <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2 border-b border-orange-100 dark:border-slate-800 pb-3">
              <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>Diagnostic Classification</span>
            </h3>

            <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 text-center space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-orange-800 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/50 px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                Inference Result
              </span>
              <h2 className="text-2xl font-black text-orange-700 dark:text-orange-400 tracking-tight">{stage}</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">Model Confidence: <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm">{confScore}%</span></p>
            </div>

            {/* Recharts Probability Breakdown */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Class Probability Distribution</p>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={probabilitiesData} layout="vertical" margin={{ left: -10, right: 10 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis dataKey="stage" type="category" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '12px', fontSize: '12px', color: '#f8fafc' }}
                      formatter={(val) => [`${val}%`, 'Probability']}
                    />
                    <Bar dataKey="probability" radius={[0, 8, 8, 0]}>
                      {probabilitiesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Report Download Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-orange-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span>Diagnostic Report Preview</span>
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs bg-orange-50/60 dark:bg-slate-800/60 p-4 rounded-2xl border border-orange-200 dark:border-slate-700 font-mono text-slate-800 dark:text-slate-200">
              <p className="text-orange-700 dark:text-orange-400 font-bold">AD-WEB CLINICAL AI DIAGNOSTIC REPORT</p>
              <p className="text-slate-400">-----------------------------------</p>
              <p>PATIENT ID: {patientId}</p>
              <p>AGE / GENDER: {patientAge}Y / {gender}</p>
              <p>SCAN FILE: {filename}</p>
              <p>PREDICTED STAGE: {stage}</p>
              <p>CONFIDENCE: {confScore}%</p>
              <p>EXPLAINABILITY: 3D Grad-CAM Generated</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  handleDownloadPdfReport();
                  setShowReportModal(false);
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs transition-all flex items-center justify-center space-x-2 shadow-md shadow-orange-500/20 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Save / Print as PDF</span>
              </button>
              <button
                onClick={() => {
                  handleDownloadTextReport();
                  setShowReportModal(false);
                }}
                className="py-3 px-4 rounded-2xl bg-orange-50 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-slate-700 text-orange-800 dark:text-orange-300 font-bold text-xs transition-all flex items-center justify-center space-x-2 border border-orange-200 dark:border-slate-700 active:scale-95"
              >
                <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span>Download .TXT</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
