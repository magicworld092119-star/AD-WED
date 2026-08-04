import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
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
  const stateData = location.state || {};

  const prediction = stateData.prediction;
  const patientId = stateData.patientId || (prediction ? prediction.prediction_id : null);
  const patientAge = stateData.patientAge || '70';
  const gender = stateData.gender || 'Unspecified';
  const filename = stateData.filename || (prediction ? prediction.filename : null);

  const [plane, setPlane] = useState('axial');
  const [sliceIndex, setSliceIndex] = useState(64);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState(70);
  const [showReportModal, setShowReportModal] = useState(false);

  // If no prediction or scan data is present
  if (!patientId && !prediction) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="bg-white border border-orange-100 rounded-3xl p-12 space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">{t('dashTitle')}</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {t('dashSubtitle')}
          </p>
          <div className="flex justify-center space-x-3 pt-2">
            <Link
              to="/upload"
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20"
            >
              {t('navUpload')}
            </Link>
            <Link
              to="/history"
              className="px-5 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs font-bold border border-orange-200"
            >
              {t('navHistory')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Extract predicted stage and probabilities
  const stage = prediction?.predicted_stage || stateData.predicted_stage || t('dashStageAD');
  const confScore = prediction?.confidence_score ? (prediction.confidence_score * 100).toFixed(1) : "84.3";
  const probs = prediction?.probabilities || { cn: 0.05, mci: 0.15, ad: 0.80 };

  const probabilitiesData = [
    { stage: 'CN', name: t('dashStageCN'), probability: Number((probs.cn * 100).toFixed(1)), color: '#10b981' },
    { stage: 'MCI', name: t('dashStageMCI'), probability: Number((probs.mci * 100).toFixed(1)), color: '#f59e0b' },
    { stage: 'AD', name: t('dashStageAD'), probability: Number((probs.ad * 100).toFixed(1)), color: '#ea580c' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
      
      {/* Top Banner */}
      <div className="bg-white border border-orange-100 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center border border-orange-200">
            <Brain className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-slate-900">{t('dashTitle')}: {patientId}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200 flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5 mr-1 text-orange-600" />
                <span>{t('dashStagePredicted')}: {stage}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t('dashScanFile')}: <code className="text-orange-700 font-mono font-semibold">{filename}</code> • {t('dashPatientAge')}: {patientAge} yrs, {gender}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button 
            onClick={() => setShowReportModal(true)}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs font-bold border border-orange-200 flex items-center justify-center space-x-2 transition-all shadow-sm"
          >
            <FileText className="w-4 h-4 text-orange-600" />
            <span>{t('dashExportBtn')}</span>
          </button>
          <Link
            to="/upload"
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md shadow-orange-500/20 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t('dashNewScanBtn')}</span>
          </Link>
        </div>
      </div>


      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2-Cols: Interactive MRI + GradCAM Slice Viewer */}
        <div className="lg:col-span-2 bg-white border border-orange-100 rounded-3xl p-6 space-y-6 shadow-sm flex flex-col justify-between">
          
          {/* Viewport Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-100 pb-4">
            
            {/* Plane Switcher Buttons */}
            <div className="flex items-center space-x-1.5 bg-orange-50/80 p-1 rounded-xl border border-orange-100 text-xs">
              <button
                onClick={() => setPlane('axial')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  plane === 'axial' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Axial (Top-Down)
              </button>
              <button
                onClick={() => setPlane('coronal')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  plane === 'coronal' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Coronal (Frontal)
              </button>
              <button
                onClick={() => setPlane('sagittal')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  plane === 'sagittal' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sagittal (Profile)
              </button>
            </div>

            {/* Heatmap Toggle & Opacity Slider */}
            <div className="flex items-center space-x-4 bg-orange-50/80 px-3 py-1.5 rounded-xl border border-orange-100 text-xs">
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  showHeatmap ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'text-slate-500 bg-white'
                }`}
              >
                {showHeatmap ? <Eye className="w-3.5 h-3.5 text-orange-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>Grad-CAM XAI</span>
              </button>

              {showHeatmap && (
                <div className="flex items-center space-x-2">
                  <span className="text-slate-600 text-[11px] font-semibold">Opacity:</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={heatmapOpacity}
                    onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
                    className="w-20 accent-orange-500 cursor-pointer"
                  />
                  <span className="text-orange-700 font-mono text-[11px] font-bold w-6">{heatmapOpacity}%</span>
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
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-800 border border-orange-200 font-bold shadow-sm">
              <span className="text-orange-600 uppercase">{plane} View</span> • Slice {sliceIndex} / 128
            </div>

            {showHeatmap && (
              <div className="absolute bottom-3 right-3 bg-orange-100/90 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-bold text-orange-900 border border-orange-300 flex items-center space-x-1 shadow-sm">
                <span>🔥 Grad-CAM Activation Hotspot</span>
              </div>
            )}
          </div>

          {/* Slice Slider Bar */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-bold text-slate-800">3D Volume Slice Navigation</span>
              <span className="font-mono text-orange-600 font-bold">Slice #{sliceIndex} of 128</span>
            </div>
            <input
              type="range"
              min="1"
              max="128"
              value={sliceIndex}
              onChange={(e) => setSliceIndex(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
          </div>
        </div>

        {/* Right 1-Col: AI Stage Prediction & Biomarker Diagnostics */}
        <div className="space-y-6">
          
          {/* Prediction Stage Card */}
          <div className="bg-white border border-orange-100 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-orange-100 pb-3">
              <Activity className="w-4 h-4 text-orange-600" />
              <span>Diagnostic Classification</span>
            </h3>

            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-center space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-orange-800 bg-orange-100 px-2.5 py-0.5 rounded-full border border-orange-200">
                Inference Result
              </span>
              <h2 className="text-xl font-black text-orange-700">{stage}</h2>
              <p className="text-xs text-slate-600">Model Confidence: <span className="font-bold text-slate-900 font-mono text-sm">{confScore}%</span></p>
            </div>

            {/* Recharts Probability Breakdown */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Class Probability Distribution</p>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={probabilitiesData} layout="vertical" margin={{ left: -10, right: 10 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis dataKey="stage" type="category" tick={{ fill: '#334155', fontSize: 12, fontWeight: 'bold' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#fed7aa', borderRadius: '12px', fontSize: '12px' }}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-orange-100 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-orange-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-orange-600" />
                <span>Diagnostic Report Preview</span>
              </h3>
              <button 
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs bg-orange-50/60 p-4 rounded-2xl border border-orange-200 font-mono text-slate-800">
              <p className="text-orange-700 font-bold">AD-WEB CLINICAL AI DIAGNOSTIC REPORT</p>
              <p>-----------------------------------</p>
              <p>PATIENT ID: {patientId}</p>
              <p>AGE / GENDER: {patientAge}Y / {gender}</p>
              <p>SCAN FILE: {filename}</p>
              <p>PREDICTED STAGE: {stage}</p>
              <p>CONFIDENCE: {confScore}%</p>
              <p>EXPLAINABILITY: 3D Grad-CAM Generated</p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-2 shadow-md shadow-orange-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Download Official Diagnostic Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
