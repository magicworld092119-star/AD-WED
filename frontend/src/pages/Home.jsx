import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Brain,
  Upload,
  Activity,
  History,
  Sparkles,
  ArrowRight,
  Lock
} from 'lucide-react';
import AgenticBackground from '../components/AgenticBackground';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleUploadClick = () => {
    if (isAuthenticated) {
      navigate('/upload');
    } else {
      navigate('/login', { state: { message: "Please sign in to upload brain MRI scans." } });
    }
  };

  return (
    <div className="space-y-16 pb-16 px-4 max-w-7xl mx-auto">

      <AgenticBackground />

      <div className="relative z-10 space-y-16">
        {/* Hero Section */}
        <section className="text-center pt-2 sm:pt-4 space-y-6 max-w-4xl mx-auto relative">

          <div className="relative z-10">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-orange-100/80 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-xs font-bold shadow-sm mb-6">
              <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>{t('heroBadge')}</span>
            </div>

            <h1
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 900,
              }}
              className="text-6xl sm:text-7xl md:text-8xl  tracking-[-0.05em] leading-[0.88] text-slate-900 dark:text-slate-100"
            >
              {t('heroTitlePrefix')}{' '}
              <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                {t('heroTitleHighlight')}
              </span>
            </h1>

            {/* <p className="mt-4 text-slate-600 dark:text-slate-300 text-base sm:text-sm max-w-2xl mx-auto leading-relaxed">
              {t('heroSubtitle')}
            </p> */}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={handleUploadClick}
              className="px-7 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium text-sm shadow-xl shadow-orange-500/25 transition-all flex items-center space-x-2 group"
            >
              <Upload className="w-4 h-4" />
              <span>{t('heroCtaUpload')}</span>
              {!isAuthenticated && <Lock className="w-3.5 h-3.5 text-orange-100 ml-1" />}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <Link
              to="/history"
              className="px-7 py-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-orange-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-sm border border-orange-200 dark:border-slate-800 shadow-sm transition-all flex items-center space-x-2"
            >
              <History className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>{t('heroCtaDemo')}</span>
            </Link>
          </div>

        </section>

        {/* Feature Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-7 space-y-4 hover:border-orange-300 dark:hover:border-orange-800 hover:shadow-xl transition-all shadow-sm group">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200 dark:border-orange-800 group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-heading font-semibold text-slate-900 dark:text-slate-100">{t('feature1Title')}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('feature1Desc')}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-7 space-y-4 hover:border-orange-300 dark:hover:border-orange-800 hover:shadow-xl transition-all shadow-sm group">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-heading font-semibold text-slate-900 dark:text-slate-100">{t('feature2Title')}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('feature2Desc')}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-7 space-y-4 hover:border-orange-300 dark:hover:border-orange-800 hover:shadow-xl transition-all shadow-sm group">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200 dark:border-orange-800 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-heading font-semibold text-slate-900 dark:text-slate-100">{t('feature3Title')}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('feature3Desc')}
            </p>
          </div>
        </section>

        {/* Processing Pipeline Workflow */}
        <section className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-md transition-colors duration-200">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-slate-100">End-to-End Clinical Pipeline</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Automated workflow from raw NIfTI scan to Explainable AI diagnostic report</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-slate-800/60 border border-orange-100 dark:border-slate-800 space-y-2">
              <span className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center mx-auto shadow-sm">1</span>
              <p className="text-xs font-heading font-semibold text-slate-800 dark:text-slate-200">{t('navUpload')}</p>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">.nii or .nii.gz format</p>
            </div>

            <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-slate-800/60 border border-orange-100 dark:border-slate-800 space-y-2">
              <span className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center mx-auto shadow-sm">2</span>
              <p className="text-xs font-heading font-semibold text-slate-800 dark:text-slate-200">Preprocess Volume</p>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Skull Strip & MNI Register</p>
            </div>

            <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-slate-800/60 border border-orange-100 dark:border-slate-800 space-y-2">
              <span className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center mx-auto shadow-sm">3</span>
              <p className="text-xs font-heading font-semibold text-slate-800 dark:text-slate-200">3D CNN Inference</p>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">CN / MCI / AD Classification</p>
            </div>

            <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-slate-800/60 border border-orange-100 dark:border-slate-800 space-y-2">
              <span className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center mx-auto shadow-sm">4</span>
              <p className="text-xs font-heading font-semibold text-slate-800 dark:text-slate-200">Grad-CAM</p>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Heatmap & Clinical Report</p>
            </div>
          </div>
        </section>
      </div>


    </div>
  );
}
