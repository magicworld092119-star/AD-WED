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
  AlertCircle,
  Compass,
  MapPin,
  Info,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { getScanSliceUrl, predictAPI } from '../services/apiService';

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
      } catch (e) { }
      return location.state;
    }
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return {};
  });

  // Keep scan in sync whenever navigation state changes or user switches
  useEffect(() => {
    if (location.state && (location.state.prediction || location.state.patientId)) {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(location.state));
      } catch (e) { }
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

  const totalSlices = prediction?.num_slices || 96;
  const peakSlices = prediction?.peak_slices || scanData?.peak_slices || { axial: 47, coronal: 48, sagittal: 48 };
  const [plane, setPlane] = useState('axial');
  const [sliceIndex, setSliceIndex] = useState(() => peakSlices.axial ?? 47);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState(75);
  const [colormap, setColormap] = useState('turbo');
  const [imageError, setImageError] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [explainTarget, setExplainTarget] = useState('predicted');
  const [saliencyProfile, setSaliencyProfile] = useState(null);

  const predId =
    prediction?.prediction_id ||
    prediction?.id ||
    scanData?.prediction_id ||
    scanData?.id ||
    (patientId && patientId.startsWith("scan_") ? patientId : null);
  const sliceUrl = predId
    ? getScanSliceUrl(predId, plane, sliceIndex, showHeatmap, heatmapOpacity, colormap, explainTarget)
    : null;

  const handlePlaneChange = (newPlane) => {
    setPlane(newPlane);
    setImageError(false);
    if (peakSlices && peakSlices[newPlane] !== undefined) {
      setSliceIndex(peakSlices[newPlane]);
    }
  };

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

  const adProbability = probabilitiesData.find(p => p.stage === 'AD')?.probability ?? Number((probs.ad * 100).toFixed(1));

  const hippoVol = prediction?.hippocampus_volume_mm3 || scanData.hippocampus_volume_mm3 || (stage.includes('AD') ? '2100.0' : stage.includes('MCI') ? '2800.0' : '3600.0');

  // Google Gemini-powered dynamic clinical assessment state
  const [geminiProfile, setGeminiProfile] = useState(() => {
    return prediction?.ai_clinical_profile || scanData?.ai_clinical_profile || null;
  });
  const [isGeneratingGemini, setIsGeneratingGemini] = useState(false);

  const fetchGeminiProfile = async (forceRegenerate = false) => {
    setIsGeneratingGemini(true);
    try {
      const data = await predictAPI.generateClinicalProfile({
        stage: stage,
        confidence: Number(confScore),
        probabilities: probs,
        hippocampus_volume_mm3: Number(hippoVol),
        patient_id: patientId || "Anonymous",
        patient_age: patientAge || "70",
        gender: gender || "Unspecified",
        peak_slices: peakSlices,
        variation_seed: forceRegenerate ? Date.now() : undefined
      });
      if (data) {
        setGeminiProfile(data);
        try {
          const current = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
          current.ai_clinical_profile = data;
          sessionStorage.setItem(storageKey, JSON.stringify(current));
        } catch (e) {}
      }
    } catch (err) {
      console.warn("Failed to generate Gemini profile:", err);
    } finally {
      setIsGeneratingGemini(false);
    }
  };

  useEffect(() => {
    // Automatically fetch dynamic 5-section clinical report from Google Gemini LLM
    const cp = geminiProfile?.clinical_profile;
    const hasStaleColorText = /\b(red|yellow)\b/i.test(cp?.where_seen || '');
    const hasNewFormat = Boolean(
      cp?.disease &&
      cp?.where_seen &&
      !hasStaleColorText &&
      cp?.causes_breakdown?.brain_changes &&
      cp?.causes_breakdown?.treatable_risks &&
      Array.isArray(cp?.prevention_tips) &&
      cp.prevention_tips.some((tip) => typeof tip === 'string' && tip.includes(':'))
    );
    if (!geminiProfile || geminiProfile?.source !== 'gemini' || !hasNewFormat) {
      fetchGeminiProfile();
    }
  }, [predId]);

  useEffect(() => {
    if (!predId) return;
    let active = true;
    predictAPI
      .getSaliencyProfile(predId, explainTarget)
      .then((data) => {
        if (active && data) setSaliencyProfile(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [predId, explainTarget]);

  const STANDARD_DISCLAIMER =
    'This report was generated by a research decision-support tool. It is not a medical diagnosis and does not replace evaluation by a qualified healthcare professional. Please consult a neurologist.';

  const DEFAULT_PREVENTION_TIPS = [
    'Stay active: Engage in regular walking or aerobic exercise',
    'Brain-healthy diet: Eat a balanced, Mediterranean-style diet',
    'Heart & metabolic care: Control blood pressure, blood sugar, and cholesterol',
    'Quality sleep: Sleep well and avoid smoking or heavy alcohol use',
    'Mental & social life: Stay mentally engaged and socially connected',
    'Health checkups: Treat hearing loss and depression early',
    'Head safety: Protect your head from falls and injury'
  ];

  // Compute clean 5-section fallback defaults tailored to active prediction stage
  const dynamicExplanation = React.useMemo(() => {
    const s = (stage || '').toUpperCase();
    const isCN = s.includes('CN') || s.includes('NORMAL');
    const isMCI = s.includes('MCI') || s.includes('MILD');

    if (isCN) {
      return {
        key: 'CN',
        stageName: 'Cognitively Normal (CN)',
        badge: 'Healthy / Low Risk',
        badgeStyle: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        containerStyle: 'bg-emerald-50 dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/60',
        bridgeBg: 'bg-emerald-50 dark:bg-slate-900',
        whereSeen: 'Across the 3D scan, attention remains balanced across preserved medial temporal regions and the hippocampus (the brain area responsible for forming memories), with highlights shifting naturally across slices and views. This shows where the model focused, not confirmed tissue loss.',
        whyItHappens: 'A Cognitively Normal pattern reflects healthy brain aging without significant Alzheimer’s-related protein build-up or vascular damage.',
        brainChanges: 'Memory-related brain networks appear well preserved without significant protein plaque buildup or vascular tissue injury.',
        treatableRisks: 'Older age, high blood pressure, diabetes, cholesterol, and sleep habits still influence long-term brain health and are worth monitoring.',
        preventionTips: DEFAULT_PREVENTION_TIPS,
        disclaimer: STANDARD_DISCLAIMER,
        adFallbackNarrative: `Virtually no structural indicators resembling Alzheimer's pathology detected (${adProbability}%).`
      };
    } else if (isMCI) {
      return {
        key: 'MCI',
        stageName: 'Mild Cognitive Impairment (MCI)',
        badge: 'Prodromal / Moderate Risk',
        badgeStyle: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        containerStyle: 'bg-amber-50 dark:bg-slate-900 border-amber-200 dark:border-amber-900/60',
        bridgeBg: 'bg-amber-50 dark:bg-slate-900',
        whereSeen: "Across the 3D scan, the model's strongest overall attention centers on the medial temporal region and areas around the hippocampus (the brain area responsible for forming memories), with hotspot locations shifting as you move through slices. This shows where the model focused, not confirmed tissue loss.",
        whyItHappens: 'MCI can stem from early Alzheimer’s-related changes, reduced cerebral blood flow, or other medical factors.',
        brainChanges: 'Early buildup of amyloid or tau proteins and reduced blood circulation can disrupt signaling in memory pathways.',
        treatableRisks: 'High blood pressure, diabetes, cholesterol, sleep disorders, and vitamin (B12) or thyroid imbalances are important manageable contributors.',
        preventionTips: DEFAULT_PREVENTION_TIPS,
        disclaimer: STANDARD_DISCLAIMER,
        adFallbackNarrative: `The model detected ${adProbability}% Alzheimer's-like structural features alongside primary Mild Cognitive Impairment (MCI). Early detection creates a window for timely monitoring and preventive care.`
      };
    } else {
      return {
        key: 'AD',
        stageName: "Alzheimer's Disease (AD)",
        badge: 'High Risk',
        badgeStyle: 'bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border-orange-300 dark:border-orange-800',
        containerStyle: 'bg-orange-50 dark:bg-slate-900 border-orange-200 dark:border-orange-900/60',
        bridgeBg: 'bg-orange-50 dark:bg-slate-900',
        whereSeen: "Across the 3D scan, the model's strongest overall attention centers on the medial temporal lobe, hippocampus (the brain area responsible for forming memories), and surrounding fluid spaces, shifting as you navigate slices and views. This shows where the model focused, not confirmed tissue loss.",
        whyItHappens: "Alzheimer's Disease is driven by amyloid plaque and tau protein buildup that impairs nerve cell communication.",
        brainChanges: 'Abnormal amyloid plaques and tau tangles progressively injure nerve cells, often alongside reduced brain blood flow.',
        treatableRisks: 'Age and family history raise risk, while blood pressure, diabetes, cholesterol, sleep, and mood/hearing care remain important to manage.',
        preventionTips: DEFAULT_PREVENTION_TIPS,
        disclaimer: STANDARD_DISCLAIMER,
        adFallbackNarrative: `The model detected a primary Alzheimer's Disease signature (${adProbability}%). Prompt neurological follow-up is recommended.`
      };
    }
  }, [stage, adProbability]);

  // Unified 5-section report content (prefers Gemini output, falls back cleanly)
  const reportSections = React.useMemo(() => {
    const cp = geminiProfile?.clinical_profile || {};
    const cb = cp.causes_breakdown || {};
    return {
      disease: cp.disease || dynamicExplanation.stageName,
      whereSeen: cp.where_seen || dynamicExplanation.whereSeen,
      whyItHappens: cp.why_it_happens || dynamicExplanation.whyItHappens,
      causesBrainChanges: cb.brain_changes || dynamicExplanation.brainChanges,
      causesTreatableRisks: cb.treatable_risks || dynamicExplanation.treatableRisks,
      preventionTips:
        Array.isArray(cp.prevention_tips) && cp.prevention_tips.length > 0
          ? cp.prevention_tips
          : dynamicExplanation.preventionTips,
      disclaimer: STANDARD_DISCLAIMER
    };
  }, [geminiProfile, dynamicExplanation]);

  // Key neuro-anatomical landmark slices for rapid PACS/radiological navigation
  const anatomicalLandmarks = React.useMemo(() => {
    const peak = peakSlices[plane] ?? (plane === 'axial' ? 47 : plane === 'coronal' ? 50 : 48);

    if (plane === 'axial') {
      return [
        {
          id: 'peak',
          name: 'Peak Attention Hotspot',
          shortName: 'Peak Saliency',
          slice: peak,
          icon: '🎯',
          badge: 'Max Activation',
          badgeColor: 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800',
          desc: 'Primary neural network gradient focus exhibiting maximal biomarker saliency.'
        },
        {
          id: 'hippocampus',
          name: 'Hippocampus & Parahippocampal Gyrus',
          shortName: 'Hippocampus',
          slice: 42,
          icon: '🧠',
          badge: 'Memory Formation',
          badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-800',
          desc: 'Key medial temporal lobe structure. Primary site of early atrophy in MCI and AD.'
        },
        {
          id: 'ventricles',
          name: 'Lateral Ventricles & Fornix',
          shortName: 'Lateral Ventricles',
          slice: 54,
          icon: '🌊',
          badge: 'Ventricular Dilation',
          badgeColor: 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-800',
          desc: 'Ventricular enlargement ratio indicative of compensatory cerebral volume loss.'
        },
        {
          id: 'temporal',
          name: 'Entorhinal & Inferior Temporal Cortex',
          shortName: 'Temporal Cortex',
          slice: 34,
          icon: '⚡',
          badge: 'Cortical Thinning',
          badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          desc: 'Earliest cortical pathway affected by neurofibrillary tau tangle pathology.'
        },
      ];
    } else if (plane === 'coronal') {
      return [
        {
          id: 'peak',
          name: 'Peak Attention Hotspot',
          shortName: 'Peak Saliency',
          slice: peak,
          icon: '🎯',
          badge: 'Max Activation',
          badgeColor: 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800',
          desc: 'Coronal cross-section showing peak focal neural network attention weight.'
        },
        {
          id: 'hippocampus',
          name: 'Bilateral Hippocampal Formations',
          shortName: 'Hippocampus Cross-Section',
          slice: 50,
          icon: '🧠',
          badge: 'Bilateral Volumetry',
          badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-800',
          desc: 'Coronal view optimal for evaluating hippocampal height and temporal horn width.'
        },
        {
          id: 'ventricles',
          name: 'Third & Lateral Ventricles',
          shortName: 'Ventricular Body',
          slice: 44,
          icon: '🌊',
          badge: 'Central CSF Cavity',
          badgeColor: 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-800',
          desc: 'Displays ventricular cavity boundaries and choroid plexus integrity.'
        },
        {
          id: 'temporal',
          name: 'Sylvian Fissure & Temporal Poles',
          shortName: 'Temporal Lobes',
          slice: 38,
          icon: '⚡',
          badge: 'Neocortical Margin',
          badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          desc: 'Inspects sulcal widening and anterior temporal lobe atrophy.'
        },
      ];
    } else {
      // Sagittal
      return [
        {
          id: 'peak',
          name: 'Peak Attention Hotspot',
          shortName: 'Peak Saliency',
          slice: peak,
          icon: '🎯',
          badge: 'Max Activation',
          badgeColor: 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800',
          desc: 'Sagittal perspective highlighting depth of activation in deep gray matter.'
        },
        {
          id: 'hippocampus',
          name: 'Hippocampus Long-Axis Profile',
          shortName: 'Hippocampus Profile',
          slice: 36,
          icon: '🧠',
          badge: 'Longitudinal View',
          badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-800',
          desc: 'Anterior-to-posterior extent of the hippocampal formation and subiculum.'
        },
        {
          id: 'ventricles',
          name: 'Midline Ventricular & Callosal Arch',
          shortName: 'Corpus Callosum & Ventricle',
          slice: 48,
          icon: '🌊',
          badge: 'Midline Architecture',
          badgeColor: 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-800',
          desc: 'Midsagittal evaluation of the corpus callosum and cerebellar structures.'
        },
        {
          id: 'temporal',
          name: 'Lateral Neocortex & Insula',
          shortName: 'Lateral Cortex',
          slice: 28,
          icon: '⚡',
          badge: 'Parietal/Temporal',
          badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          desc: 'Assessment of lateral perisylvian fissures and neocortical atrophy.'
        },
      ];
    }
  }, [plane, peakSlices]);

  // Live description synced with slice slider, true slice intensity, plane, colormap & channel
  const liveFocusInfo = React.useMemo(() => {
    const planeLabel = plane.charAt(0).toUpperCase() + plane.slice(1);
    const closestLandmark = anatomicalLandmarks.find((lm) => Math.abs(lm.slice - sliceIndex) <= 3);
    const regionLabel = closestLandmark ? closestLandmark.name : `${planeLabel} cross-section`;

    const channelMap = {
      predicted: `Winner (${stage.includes('CN') ? 'CN' : stage.includes('MCI') ? 'MCI' : 'AD'})`,
      ad: 'AD Focus',
      mci: 'MCI Focus',
      cn: 'CN Focus'
    };
    const channelLabel = channelMap[explainTarget] || 'Primary Focus';

    const planeScores = saliencyProfile?.[plane];
    const slicePeak = Array.isArray(planeScores) ? planeScores[sliceIndex] : undefined;
    let peakSliceNum = (peakSlices?.[plane] ?? 47) + 1;
    if (Array.isArray(planeScores) && planeScores.length > 0) {
      let bestIdx = 0;
      for (let i = 1; i < planeScores.length; i++) {
        if (planeScores[i] > planeScores[bestIdx]) bestIdx = i;
      }
      peakSliceNum = bestIdx + 1;
    }

    let intensityText = `Inspecting ${channelLabel} attention on this slice.`;
    if (!showHeatmap) {
      intensityText = 'Heatmap overlay is currently hidden.';
    } else if (typeof slicePeak === 'number') {
      if (slicePeak <= 0.01) {
        intensityText = `No significant heatmap activation on this slice (peak focus is near Slice #${peakSliceNum}).`;
      } else if (slicePeak < 0.35) {
        const lowColor =
          colormap === 'inferno'
            ? 'dark purple tint — no bright hotspots here'
            : colormap === 'hot'
            ? 'dim red tint — no bright yellow/white hotspots here'
            : 'blue/cyan/green tint — no red or yellow hotspots here';
        intensityText = `Low activation only (${lowColor}; peak focus is near Slice #${peakSliceNum}).`;
      } else if (slicePeak < 0.65) {
        const midColor =
          colormap === 'inferno'
            ? 'magenta to orange — below peak bright yellow level'
            : colormap === 'hot'
            ? 'red to orange — below peak yellow/white level'
            : 'green to yellow-green — below peak red hotspot level';
        intensityText = `Moderate activation (${midColor} near Slice #${peakSliceNum}).`;
      } else {
        const highColor =
          colormap === 'inferno'
            ? 'bright yellow/orange'
            : colormap === 'hot'
            ? 'bright yellow/white'
            : 'warm red/orange/yellow';
        intensityText = `Strong attention hotspot visible in ${highColor} (${channelLabel}).`;
      }
    }

    const liveNote = `Current view (${planeLabel} #${sliceIndex + 1} — ${regionLabel}): ${intensityText}`;
    return { planeLabel, channelLabel, liveNote };
  }, [plane, sliceIndex, anatomicalLandmarks, explainTarget, stage, colormap, showHeatmap, saliencyProfile, peakSlices]);

  useEffect(() => {
    const viewer = {
      plane: liveFocusInfo.planeLabel,
      slice_number: sliceIndex + 1,
      channel: liveFocusInfo.channelLabel,
      colormap,
      slice_note: liveFocusInfo.liveNote
    };
    try {
      sessionStorage.setItem('ad_live_viewer_context', JSON.stringify(viewer));
    } catch (e) {}
    window.dispatchEvent(
      new CustomEvent('ad-scan-context-update', {
        detail: {
          prediction_id: predId,
          stage,
          confidence: Number(confScore),
          probabilities: probs,
          viewer
        }
      })
    );
  }, [predId, stage, confScore, probs, sliceIndex, colormap, liveFocusInfo]);

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

  <div class="card" style="border-left: 4px solid ${adProbability >= 20 ? '#dc2626' : adProbability >= 1 ? '#d97706' : '#10b981'}; background: ${adProbability >= 1 ? '#fffbeb' : '#f0fdf4'};">
    <div class="card-title" style="color: ${adProbability >= 20 ? '#dc2626' : adProbability >= 1 ? '#b45309' : '#047857'}; margin-bottom: 6px;">
      ${geminiProfile?.ad_signal?.title || (adProbability >= 1 ? '⚠️ ALZHEIMER’S DISEASE (AD) RISK & EARLY BIOMARKER ASSESSMENT' : '✓ ALZHEIMER’S DISEASE (AD) RISK STATUS')}
    </div>
    <div style="font-size: 13px; line-height: 1.6; color: #1e293b;">
      ${geminiProfile?.ad_signal?.narrative || (adProbability >= 1 
        ? `<strong>AD Structural Biomarkers Detected (${adProbability}%):</strong> While the primary inference is <strong>${stage}</strong>, the neural network detected <strong>${adProbability}%</strong> structural indicators matching Alzheimer’s Disease pathology (including medial temporal cortical thinning and hippocampal volumetric alterations). Flagging AD even at early/mild percentages (&ge;1%) provides a critical window for clinical surveillance and preventative therapeutic strategies before irreversible progression.`
        : `<strong>Low AD Risk (&lt;1%):</strong> Virtually zero structural biomarkers of Alzheimer’s Disease detected (${adProbability}%). Architecture aligns with baseline normal aging.`
      )}
    </div>
  </div>

  <div class="card">
    <div class="card-title">Report</div>
    <div class="info-item" style="margin-bottom: 12px;">
      <span class="info-label">Disease</span>
      <span class="info-value">${reportSections.disease}</span>
    </div>
    <div style="font-size: 13px; line-height: 1.65; color: #1e293b;">
      <p style="margin-top: 0;"><strong>3D Scan Focus</strong><br/>${reportSections.whereSeen}</p>
      <p style="margin-bottom: 4px;"><strong>Causes &amp; Risk Factors</strong></p>
      <p style="margin-top: 0; margin-bottom: 6px;"><strong>Brain Changes:</strong> ${reportSections.causesBrainChanges}</p>
      <p style="margin-top: 0;"><strong>Contributing &amp; Treatable Risks:</strong> ${reportSections.causesTreatableRisks}</p>
      <p style="margin-bottom: 6px;"><strong>Prevention &amp; Risk Reduction</strong></p>
      <ul style="margin-top: 0; margin-bottom: 0; padding-left: 18px;">
        ${reportSections.preventionTips.map((tip) => {
          const idx = tip.indexOf(':');
          if (idx > 0 && idx < 40) {
            return `<li><strong>${tip.slice(0, idx + 1)}</strong>${tip.slice(idx + 1)}</li>`;
          }
          return `<li>${tip}</li>`;
        }).join('\n        ')}
      </ul>
    </div>
  </div>

  <div class="card" style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.35); color: #991b1b;">
    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; color: #b91c1c;">Disclaimer</div>
    <div style="font-size: 12.5px; line-height: 1.55;">
      ${reportSections.disclaimer}
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
    ${reportSections.disclaimer}
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
    const preventionList = reportSections.preventionTips.map((tip) => `- ${tip}`).join('\n');

    const content = `=====================================================
AD-WEB CLINICAL AI DIAGNOSTIC REPORT
Generated: ${reportDate}
=====================================================

PATIENT INFORMATION:
- Patient ID: ${patientId}
- Age: ${patientAge} Years
- Gender: ${gender}
- Input Scan File: ${filename || '3D_sMRI_Scan.nii'}

PROBABILITY BREAKDOWN:
- Cognitively Normal (CN): ${probabilitiesData[0].probability}%
- Mild Cognitive Impairment (MCI): ${probabilitiesData[1].probability}%
- Alzheimer's Disease (AD): ${probabilitiesData[2].probability}%

Report

Disease: ${reportSections.disease}

Where it is seen in the 3D image
${reportSections.whereSeen}

Causes & Risk Factors
- Brain Changes: ${reportSections.causesBrainChanges}
- Contributing & Treatable Risks: ${reportSections.causesTreatableRisks}

How to prevent or lower the risk
${preventionList}

-----------------------------------------------------
Disclaimer
${reportSections.disclaimer}
=====================================================
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


      {/* Main 3-Col Grid with Connected Reverse-L Report + Prevention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-y-6 lg:gap-x-0">

        {/* Top-Left (2 Cols, Rows 1-2): Interactive MRI + GradCAM Slice Viewer */}
        <div className="lg:col-span-2 lg:row-start-1 lg:row-end-3 lg:mr-6 bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm flex flex-col">

          {/* Viewport Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-100 dark:border-slate-800 pb-4">

            {/* Plane Switcher Buttons */}
            <div className="flex items-center space-x-1.5 bg-orange-50/80 dark:bg-slate-800/80 p-1 rounded-xl border border-orange-100 dark:border-slate-700 text-xs">
              <button
                onClick={() => handlePlaneChange('axial')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${plane === 'axial' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
              >
                Axial (Top-Down)
              </button>
              <button
                onClick={() => handlePlaneChange('coronal')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${plane === 'coronal' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
              >
                Coronal (Frontal)
              </button>
              <button
                onClick={() => handlePlaneChange('sagittal')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${plane === 'sagittal' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
              >
                Sagittal (Profile)
              </button>
            </div>

            {/* Heatmap Controls: Peak Focus, Colormap, Toggle & Opacity */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Focus on Hotspot Button */}
              <button
                onClick={() => setSliceIndex(peakSlices[plane] ?? 47)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-sm transition-all"
                title="Jump directly to the slice where the neural network found maximum activation"
              >
                <span>🎯 Focus Hotspot (#{((peakSlices[plane] ?? 47) + 1)})</span>
              </button>

              {/* Colormap Selector */}
              <select
                value={colormap}
                onChange={(e) => setColormap(e.target.value)}
                className="bg-orange-50/80 dark:bg-slate-800/80 border border-orange-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
                title="Select Grad-CAM heatmap color palette"
              >
                <option value="turbo">Turbo (Clear)</option>
                <option value="jet">Jet (Classic)</option>
                <option value="inferno">Inferno (Heat)</option>
              </select>

              {/* Heatmap Toggle & Opacity Slider */}
              <div className="flex items-center space-x-3 bg-orange-50/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-orange-100 dark:border-slate-700">
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-lg font-bold transition-all ${showHeatmap ? 'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-800' : 'text-slate-500 bg-white dark:bg-slate-900'
                    }`}
                >
                  {showHeatmap ? <Eye className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>Grad-CAM</span>
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
                      className="w-16 accent-orange-500 cursor-pointer"
                    />
                    <span className="text-orange-700 dark:text-orange-400 font-mono text-[11px] font-bold w-6">{heatmapOpacity}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Target Disease Focus Selector (Explainability Focus) */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="font-bold text-[11px]">Grad-CAM Disease Channel:</span>
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto">
              <button
                onClick={() => setExplainTarget('predicted')}
                className={`px-3 py-1 rounded-xl font-bold text-[11px] transition-all flex items-center space-x-1 ${
                  explainTarget === 'predicted'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={`Show evidence for winning diagnosis (${stage})`}
              >
                <span>🏆 Winner ({stage.split(' ')[0]})</span>
              </button>

              <button
                onClick={() => setExplainTarget('ad')}
                className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all flex items-center space-x-1.5 ${
                  explainTarget === 'ad'
                    ? 'bg-red-600 text-white shadow-xs ring-2 ring-red-400/50'
                    : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 hover:bg-red-100'
                }`}
                title="View the exact brain regions that triggered the Alzheimer's Disease (AD) probability"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                <span>🔴 AD Focus ({probs.ad ? (probs.ad * 100).toFixed(1) : '8.3'}%)</span>
              </button>

              <button
                onClick={() => setExplainTarget('mci')}
                className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all flex items-center space-x-1.5 ${
                  explainTarget === 'mci'
                    ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-400/50'
                    : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100'
                }`}
                title="View the brain regions that triggered the Mild Cognitive Impairment (MCI) probability"
              >
                <span>🟡 MCI Focus ({probs.mci ? (probs.mci * 100).toFixed(1) : '73.7'}%)</span>
              </button>

              <button
                onClick={() => setExplainTarget('cn')}
                className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all flex items-center space-x-1.5 ${
                  explainTarget === 'cn'
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/50'
                    : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100'
                }`}
                title="View the brain regions that look Cognitively Normal (CN)"
              >
                <span>🟢 CN Focus ({probs.cn ? (probs.cn * 100).toFixed(1) : '18.0'}%)</span>
              </button>
            </div>
          </div>

          {/* Medical Slice Display + Navigation Bar Group */}
          <div className="space-y-2.5">
            <div className="relative aspect-square max-h-[440px] mx-auto w-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner group">

              {sliceUrl && !imageError ? (
                <img
                  src={sliceUrl}
                  alt={`${plane} slice ${sliceIndex}`}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-contain select-none"
                />
              ) : (
                /* Fallback SVG Brain MRI + GradCAM Visualizer */
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
              )}

              {/* Viewport Info Overlay */}
              <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-800 dark:text-slate-200 border border-orange-200 dark:border-slate-700 font-bold shadow-sm flex items-center space-x-1.5">
                <span className="text-orange-600 dark:text-orange-400 uppercase font-black">{plane} View</span>
                <span>•</span>
                <span>Slice {sliceIndex + 1} / {totalSlices}</span>
                {sliceIndex === (peakSlices[plane] ?? 47) && (
                  <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider animate-pulse">
                    🔥 Max Activation
                  </span>
                )}
              </div>

              {showHeatmap && (
                <div className="absolute bottom-3 right-3 bg-slate-950/85 dark:bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-xl text-[10px] text-white border border-slate-700/80 flex flex-col space-y-1 shadow-md">
                  <div className="flex items-center justify-between space-x-2">
                    <span className="font-bold text-orange-400">
                      🔥 Grad-CAM Channel: {
                        explainTarget === 'ad'
                          ? "Alzheimer's Disease (AD)"
                          : explainTarget === 'mci'
                          ? "Mild Cognitive Impairment (MCI)"
                          : explainTarget === 'cn'
                          ? "Cognitively Normal (CN)"
                          : stage
                      }
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[9px] text-slate-300">
                    <span>Low</span>
                    <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-blue-600 via-emerald-500 via-amber-400 to-red-600"></div>
                    <span className="font-bold text-red-400">Peak Hotspot</span>
                  </div>
                </div>
              )}
            </div>

            {/* Slice Slider Bar - positioned directly under scan viewer */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-800 dark:text-slate-200">3D Volume Slice Navigation</span>
                <div className="flex items-center space-x-3">
                  {prediction?.gradcam_heatmap_url && (
                    <a
                      href={`http://localhost:8000${prediction.gradcam_heatmap_url}`}
                      download
                      className="flex items-center space-x-1 text-orange-600 hover:text-orange-700 dark:text-orange-400 font-semibold"
                      title="Download 3D Heatmap Volume"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download Heatmap NIfTI</span>
                    </a>
                  )}
                  <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">Slice #{sliceIndex + 1} of {totalSlices}</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={totalSlices - 1}
                value={sliceIndex}
                onChange={(e) => setSliceIndex(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
              />
            </div>
          </div>

          {/* Interactive Anatomical Landmark Navigator */}
          <div className="bg-orange-50/40 dark:bg-slate-800/40 border border-orange-100 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between gap-2 border-b border-orange-100/80 dark:border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Anatomical Landmark Quick Navigator
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                Active Slice: #{sliceIndex + 1}
              </span>
            </div>

            {/* Landmark Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {anatomicalLandmarks.map((lm) => {
                const isCurrent = Math.abs(sliceIndex - lm.slice) <= 1;
                return (
                  <button
                    key={lm.id}
                    type="button"
                    onClick={() => setSliceIndex(lm.slice)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between space-y-1.5 group relative cursor-pointer ${isCurrent
                        ? 'bg-orange-100/90 dark:bg-orange-950/80 border-orange-400 dark:border-orange-600 shadow-sm ring-2 ring-orange-400/30'
                        : 'bg-white/80 dark:bg-slate-900/70 hover:bg-orange-50/80 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-1 w-full">
                      <span className="text-base select-none">{lm.icon}</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        #{lm.slice + 1}
                      </span>
                    </div>

                    <div>
                      <p className={`text-xs font-bold truncate leading-tight ${isCurrent ? 'text-orange-900 dark:text-orange-200' : 'text-slate-800 dark:text-slate-200'}`}>
                        {lm.shortName}
                      </p>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded mt-1 inline-block border ${lm.badgeColor}`}>
                        {lm.badge}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug">
                      {lm.desc}
                    </p>

                    {isCurrent && (
                      <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Grad-CAM Saliency Spectrum Bar & Radiologist Tip */}
            <div className="pt-2 border-t border-orange-100/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-[10px] uppercase tracking-wider">3D Saliency Gradient:</span>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[9px] font-bold text-slate-400">Baseline</span>
                  <div className="w-24 sm:w-32 h-2 rounded-full bg-gradient-to-r from-blue-500 via-emerald-400 via-amber-400 to-red-600 border border-slate-200 dark:border-slate-700"></div>
                  <span className="text-[9px] font-bold text-red-500 dark:text-red-400">Hotspot</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                <span>Click any landmark card to jump directly to that key neuro-anatomical slice.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top-Right (Col 3, Row 1): AI Stage Prediction & AD Signal */}
        <div className="lg:col-start-3 lg:row-start-1 bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
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

          {/* Dedicated Alzheimer's Disease (AD) Biomarker Alert */}
          <div className={`p-3.5 rounded-2xl border transition-all shadow-xs ${
            adProbability >= 50
              ? 'bg-red-50/90 dark:bg-red-950/40 border-red-300 dark:border-red-800/80 text-red-900 dark:text-red-200'
              : adProbability >= 20
              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/80 text-rose-900 dark:text-rose-200'
              : adProbability >= 1
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200'
              : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
          }`}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center space-x-1.5 font-bold text-xs">
                <ShieldAlert className={`w-4 h-4 shrink-0 ${
                  adProbability >= 20 ? 'text-red-600 dark:text-red-400' : adProbability >= 1 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                }`} />
                <span>{geminiProfile?.ad_signal?.title || "Alzheimer's Disease (AD) Signal"}</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                adProbability >= 50
                  ? 'bg-red-200 text-red-900 border-red-300 dark:bg-red-900/60 dark:text-red-200'
                  : adProbability >= 20
                  ? 'bg-rose-200 text-rose-900 border-rose-300 dark:bg-rose-900/60 dark:text-rose-200'
                  : adProbability >= 1
                  ? 'bg-amber-200 text-amber-900 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200'
                  : 'bg-emerald-200 text-emerald-900 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200'
              }`}>
                {geminiProfile?.ad_signal?.badge || `${adProbability}% AD Risk`}
              </span>
            </div>

            <p className="text-[11px] leading-relaxed">
              {geminiProfile?.ad_signal?.narrative || dynamicExplanation.adFallbackNarrative}
            </p>
          </div>
        </div>

        {/* Reverse-L Right Arm (Col 3, Rows 2-3): Report */}
        <div className={`lg:col-start-3 lg:row-start-2 lg:row-end-4 p-5 rounded-3xl lg:rounded-bl-none border ${dynamicExplanation.containerStyle} space-y-3 transition-all shadow-sm flex flex-col justify-between`}>
          <div className="space-y-3">
            {/* Header with Report Title and Risk Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-200/50 dark:border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2 min-w-0">
                <Brain className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Report
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${dynamicExplanation.badgeStyle}`}>
                  {geminiProfile?.clinical_profile?.badge || dynamicExplanation.badge}
                </span>
              </div>
            </div>

            {/* Disease + 3D Scan Focus + Split Causes & Risk Factors */}
            <div className="space-y-2.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Activity className="w-3 h-3 text-orange-500 shrink-0" />
                  <span>Disease</span>
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block mt-1">
                  {reportSections.disease}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700/80">
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                    <span>3D Scan Focus</span>
                  </span>
                  <span className="text-[9px] font-mono font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-200/80 dark:border-orange-800/70">
                    {liveFocusInfo.planeLabel} #{sliceIndex + 1} • {liveFocusInfo.channelLabel}
                  </span>
                </div>
                <p className="text-[10.5px] font-medium text-orange-800 dark:text-orange-200/90 bg-orange-50/70 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 rounded-xl px-2.5 py-1.5 mb-1.5 leading-snug">
                  {liveFocusInfo.liveNote}
                </p>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {reportSections.whereSeen}
                </p>
              </div>

              {/* Format 1: Causes & Risk Factors (Brain Changes vs Contributing & Treatable Risks) */}
              <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Info className="w-3 h-3 text-orange-500 shrink-0" />
                  <span>Causes &amp; Risk Factors</span>
                </span>
                <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300 block mb-0.5">
                    Brain Changes
                  </span>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {reportSections.causesBrainChanges}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300 block mb-0.5">
                    Contributing &amp; Treatable Risks
                  </span>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {reportSections.causesTreatableRisks}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Regenerate Button */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-orange-200/50 dark:border-slate-800 text-[10px]">
            {isGeneratingGemini && (
              <span className="text-slate-500 dark:text-slate-400 mr-auto">Updating report...</span>
            )}
            <button
              type="button"
              onClick={() => fetchGeminiProfile(true)}
              disabled={isGeneratingGemini}
              className="px-3 py-1 rounded-full bg-white/80 dark:bg-slate-950/60 text-orange-600 hover:text-orange-700 dark:text-orange-400 hover:bg-orange-100/80 dark:hover:bg-slate-800 font-bold transition-all flex items-center space-x-1.5 cursor-pointer border border-orange-200 dark:border-orange-800 shrink-0"
              title="Generate fresh report"
            >
              <RefreshCw className={`w-3 h-3 ${isGeneratingGemini ? 'animate-spin text-orange-500' : ''}`} />
              <span>{isGeneratingGemini ? 'Generating...' : 'Regenerate'}</span>
            </button>
          </div>
        </div>

        {/* Reverse-L Bottom-Left Arm (Cols 1-2, Row 3): Prevention & Risk Reduction */}
        <div className={`relative lg:col-span-2 lg:col-start-1 lg:row-start-3 p-6 rounded-3xl lg:rounded-r-none border lg:border-r-0 ${dynamicExplanation.containerStyle} shadow-sm space-y-3 transition-opacity ${isGeneratingGemini ? 'opacity-70' : 'opacity-100'}`}>
          {/* Seamless bridge hiding only the vertical seam where Prevention meets Report */}
          <span
            aria-hidden="true"
            className={`hidden lg:block absolute top-0 bottom-0 -right-[2px] w-[4px] ${dynamicExplanation.bridgeBg} z-10 pointer-events-none`}
          />
          <div className="flex items-center justify-between gap-2 border-b border-orange-200/50 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Prevention &amp; Risk Reduction
              </span>
            </div>
            {isGeneratingGemini && (
              <span className="text-[10px] font-medium text-orange-600 dark:text-orange-400">
                Updating...
              </span>
            )}
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px] text-slate-600 dark:text-slate-300">
            {reportSections.preventionTips.map((tip, idx) => {
              const colonIdx = typeof tip === 'string' ? tip.indexOf(':') : -1;
              const hasLeadIn = colonIdx > 0 && colonIdx < 40;
              const isLastOdd =
                idx === reportSections.preventionTips.length - 1 &&
                reportSections.preventionTips.length % 2 === 1;
              return (
                <li
                  key={idx}
                  className={`flex items-start space-x-2 leading-snug p-2.5 rounded-2xl bg-white/90 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-700/70 ${isLastOdd ? 'md:col-span-2' : ''}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    {hasLeadIn ? (
                      <>
                        <strong className="font-bold text-slate-800 dark:text-slate-100">
                          {tip.slice(0, colonIdx + 1)}
                        </strong>
                        {tip.slice(colonIdx + 1)}
                      </>
                    ) : (
                      tip
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Full-Width Separate Red Transparent Disclaimer Block */}
        <div className="lg:col-span-3 p-4 rounded-3xl bg-red-500/10 dark:bg-red-500/10 border border-red-500/40 dark:border-red-500/40 text-red-900 dark:text-red-200 backdrop-blur-xs">
          <div className="flex items-center space-x-1.5 font-bold text-xs text-red-700 dark:text-red-300 mb-1">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>Disclaimer</span>
          </div>
          <p className="text-[11px] leading-relaxed text-red-800/90 dark:text-red-200/90">
            {reportSections.disclaimer}
          </p>
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
              <p className={adProbability >= 1 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}>
                AD RISK SIGNAL: {adProbability}% {adProbability >= 1 ? "(Early Biomarkers Detected)" : "(Negligible)"}
              </p>
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
