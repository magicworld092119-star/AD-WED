import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  Save,
  Globe,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { language, setLanguage, t, SUPPORTED_LANGUAGES } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(language);

  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    hospital: user?.hospital || '',
    role: user?.role || t('profileRoleDefault'),
  });

  const handleSave = (e) => {
    e.preventDefault();
    setLanguage(selectedLanguage);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };



  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 px-4">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm relative overflow-hidden transition-colors duration-200">
        <div className="flex items-center space-x-5">
          <div className="w-20 h-20 rounded-2xl bg-orange-100 dark:bg-orange-950/80 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-2xl shadow-sm shrink-0">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{user?.fullName || t('profileTitle')}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-orange-600 dark:text-orange-400" /> Active Account
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">{user?.role || t('profileRoleDefault')} • {user?.hospital || t('profileHospitalDefault')}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Main Profile Settings Form */}
        <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-sm transition-colors duration-200">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2 border-b border-orange-100 dark:border-slate-800 pb-3">
            <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>{t('profileSectionInfo')}</span>
          </h2>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t('profileSaveSuccess')}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">{t('profileFullName')}</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter full name"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">{t('profileEmail')}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter clinical email"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">{t('profileHospital')}</label>
              <input
                type="text"
                value={formData.hospital}
                onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                placeholder="Enter hospital or institute name"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">{t('profileRole')}</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g. Neuro-Radiologist"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Theme & Appearance Section */}
        <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-sm transition-colors duration-200">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2 border-b border-orange-100 dark:border-slate-800 pb-3">
            <Sun className="w-4 h-4 text-orange-600 dark:text-amber-400" />
            <span>Theme & Appearance</span>
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Color Theme Mode</label>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-3">Choose between Light Mode and Dark Mode for the AD-WEB workspace.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex items-center space-x-4 p-4 rounded-2xl border text-left transition-all ${
                    theme === 'light'
                      ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 ring-2 ring-orange-500/20 text-orange-900 dark:text-orange-200 font-bold'
                      : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-orange-50/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-slate-700 flex items-center justify-center text-orange-600 dark:text-amber-400">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100">Light Mode</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Bright, clean white background optimized for day clinical use.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center space-x-4 p-4 rounded-2xl border text-left transition-all ${
                    theme === 'dark'
                      ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 ring-2 ring-orange-500/20 text-orange-900 dark:text-orange-200 font-bold'
                      : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-orange-50/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-amber-400 border border-slate-700">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100">Dark Mode</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Deep slate theme reduced eye strain for dark reading environments.</p>
                  </div>
                </button>

              </div>
            </div>
          </div>
        </div>

        {/* Language & Regional Preferences Section */}
        <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-sm transition-colors duration-200">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2 border-b border-orange-100 dark:border-slate-800 pb-3">
            <Globe className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>{t('profileSectionLang')}</span>
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">{t('profileLangLabel')}</label>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-3">{t('profileLangHelp')}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`flex items-center space-x-3 p-3 rounded-2xl border text-left transition-all ${
                      selectedLanguage === lang.code
                        ? 'bg-orange-50 dark:bg-orange-950/50 border-orange-500 ring-2 ring-orange-500/20 text-orange-900 dark:text-orange-200 font-bold'
                        : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-orange-50/50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{lang.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{lang.label}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all flex items-center space-x-2 shadow-md shadow-orange-500/20"
            >
              <Save className="w-4 h-4" />
              <span>{t('profileSaveBtn')}</span>
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}


