import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  Sparkles,
  Eye,
  Layers,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  UploadCloud
} from 'lucide-react';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen pb-20 px-4 max-w-7xl mx-auto space-y-16">
      <div className="space-y-16">

        {/* Page Header */}
        <section className="text-center pt-4 sm:pt-8 space-y-5 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-orange-100/80 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-xs font-bold shadow-sm">
            <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>{t('aboutBadge')}</span>
          </div>

          <h1
            style={{ fontFamily: "'Sora', sans-serif" }}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-[1.05]"
          >
            {t('aboutTitlePrefix')}{' '}
            <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              {t('aboutTitleHighlight')}
            </span>
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
            {t('aboutHeroDesc')}
          </p>
        </section>

        {/* The Core Clinical Problem */}
        <section className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              ?
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                {t('aboutChallengeTitle')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('aboutChallengeSubtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>{t('aboutChallengeP1')}</p>
              <p>{t('aboutChallengeP2')}</p>
            </div>

            <div className="bg-orange-50/60 dark:bg-slate-800/60 rounded-2xl p-6 border border-orange-100 dark:border-slate-700 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                {t('aboutTraditionalAITitle')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('aboutTraditionalAIDesc')}
              </p>
              <div className="pt-2 flex items-center text-xs font-semibold text-orange-700 dark:text-orange-300 space-x-2">
                <CheckCircle2 className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                <span>{t('aboutTraditionalAISolution')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* The 3 Diagnostic Stages */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              {t('aboutStagesTitle')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              {t('aboutStagesSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stage 1: CN */}
            <div className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-950/60 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                CN
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('aboutStageCNTitle')}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('aboutStageCNDesc')}
              </p>
              <div className="pt-2 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {t('aboutStageCNVol')}
              </div>
            </div>

            {/* Stage 2: MCI */}
            <div className="bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-950/60 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                MCI
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('aboutStageMCITitle')}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('aboutStageMCIDesc')}
              </p>
              <div className="pt-2 text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                {t('aboutStageMCIVol')}
              </div>
            </div>

            {/* Stage 3: AD */}
            <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-orange-950/60 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 flex items-center justify-center font-bold text-xs">
                AD
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('aboutStageADTitle')}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('aboutStageADDesc')}
              </p>
              <div className="pt-2 text-[11px] font-mono text-orange-600 dark:text-orange-400 font-semibold">
                {t('aboutStageADVol')}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works (4 Steps) */}
        <section className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-8 sm:p-10 space-y-8 shadow-sm">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              {t('aboutWorkflowTitle')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('aboutWorkflowSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-orange-50/50 dark:bg-slate-800/60 border border-orange-100 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                1
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t('aboutStep1Title')}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('aboutStep1Desc')} (<code className="text-orange-600">.nii</code> / <code className="text-orange-600">.nii.gz</code>).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-orange-50/50 dark:bg-slate-800/60 border border-orange-100 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                2
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t('aboutStep2Title')}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('aboutStep2Desc')}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-orange-50/50 dark:bg-slate-800/60 border border-orange-100 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                3
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t('aboutStep3Title')}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('aboutStep3Desc')}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-orange-50/50 dark:bg-slate-800/60 border border-orange-100 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                4
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t('aboutStep4Title')}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('aboutStep4Desc')}
              </p>
            </div>
          </div>
        </section>

        {/* Key Features Grid */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              {t('aboutFeaturesTitle')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('aboutFeaturesSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
              <Eye className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t('aboutFeat1Title')}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('aboutFeat1Desc')}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
              <Layers className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t('aboutFeat2Title')}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('aboutFeat2Desc')}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
              <FileCheck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t('aboutFeat3Title')}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('aboutFeat3Desc')}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
              <Cpu className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t('aboutFeat4Title')}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('aboutFeat4Desc')}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
              <Database className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t('aboutFeat5Title')}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('aboutFeat5Desc')}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t('aboutFeat6Title')}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('aboutFeat6Desc')}
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 rounded-3xl p-8 sm:p-12 text-center text-white space-y-6 shadow-xl shadow-orange-500/20">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t('aboutCtaTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-orange-100 max-w-lg mx-auto leading-relaxed">
            {t('aboutCtaSubtitle')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/upload"
              className="px-7 py-3.5 rounded-2xl bg-white text-orange-600 hover:bg-orange-50 font-bold text-xs shadow-md transition-all flex items-center space-x-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{t('aboutCtaUpload')}</span>
            </Link>
            <Link
              to="/history"
              className="px-7 py-3.5 rounded-2xl bg-orange-700/60 hover:bg-orange-700/80 text-white font-bold text-xs border border-white/20 transition-all flex items-center space-x-2"
            >
              <span>{t('aboutCtaHistory')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
