import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Brain, 
  Upload, 
  History, 
  User, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Activity,
  ShieldCheck,
  ChevronDown,
  Globe,
  Sun,
  Moon
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t, currentLanguageObj, SUPPORTED_LANGUAGES } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;


  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-orange-100/80 dark:border-slate-800 px-6 py-3 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
                AD-WEB
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                XAI 3D sMRI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Alzheimer's Explainable AI Platform</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link
            to="/"
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive('/') 
                ? 'bg-orange-100/80 dark:bg-orange-950/60 text-orange-800 dark:text-orange-200 shadow-sm border border-orange-200 dark:border-orange-800' 
                : 'text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800'
            }`}
          >
            {t('navHome')}
          </Link>

          <Link
            to="/upload"
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive('/upload') 
                ? 'bg-orange-500 text-white font-semibold shadow-md shadow-orange-500/20' 
                : 'text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800'
            }`}
          >
            <Upload className="w-4 h-4 text-orange-600 dark:text-orange-400 group-hover:text-white" />
            <span>{t('navUpload')}</span>
          </Link>

          <Link
            to="/dashboard"
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive('/dashboard') 
                ? 'bg-orange-100/80 dark:bg-orange-950/60 text-orange-800 dark:text-orange-200 shadow-sm border border-orange-200 dark:border-orange-800' 
                : 'text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>{t('navDashboard')}</span>
          </Link>

          <Link
            to="/history"
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive('/history') 
                ? 'bg-orange-100/80 dark:bg-orange-950/60 text-orange-800 dark:text-orange-200 shadow-sm border border-orange-200 dark:border-orange-800' 
                : 'text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>{t('navHistory')}</span>
          </Link>
        </nav>

        {/* User Auth, Theme Toggle & Language Selector Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">

          {/* Sun / Moon Theme Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggleTheme();
            }}
            className="p-2 rounded-xl bg-orange-50/80 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-slate-700 border border-orange-200 dark:border-slate-700 text-slate-700 dark:text-amber-400 transition-all cursor-pointer shadow-sm"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >

            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Quick Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-orange-50/80 dark:bg-slate-800 hover:bg-orange-100/80 dark:hover:bg-slate-700 border border-orange-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm"
              title="Select Language"
            >
              <Globe className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>{currentLanguageObj.flag}</span>
              <span className="hidden sm:inline">{currentLanguageObj.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 max-h-72 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-2 py-1 border-b border-orange-100 dark:border-slate-800 mb-1 text-[10px] uppercase font-bold text-slate-400">
                  Select Language
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      language === lang.code
                        ? 'bg-orange-100/80 dark:bg-orange-950/80 text-orange-800 dark:text-orange-200 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                    {language === lang.code && <span className="w-1.5 h-1.5 rounded-full bg-orange-600 dark:bg-orange-400"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>


          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-3 p-1.5 pr-3 rounded-xl bg-orange-50 hover:bg-orange-100/80 border border-orange-200 transition-all cursor-pointer"
              >
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-lg object-cover ring-2 ring-orange-400"
                />
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight">{user.fullName}</p>
                  <p className="text-[10px] text-orange-700 font-medium">{user.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-orange-100 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-orange-100 mb-1">
                    <p className="text-xs font-bold text-slate-800">{user.fullName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <span className="mt-1 inline-flex items-center text-[10px] font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                      <ShieldCheck className="w-3 h-3 mr-1" /> {user.hospital}
                    </span>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                  >
                    <User className="w-4 h-4 text-orange-600" />
                    <span>{t('navProfile')}</span>
                  </Link>

                  <Link
                    to="/history"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                  >
                    <History className="w-4 h-4 text-orange-600" />
                    <span>{t('navHistory')} ({user.scansAnalyzed})</span>
                  </Link>

                  <div className="border-t border-orange-100 my-1"></div>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                      navigate('/');
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('navLogout')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-orange-50 hover:bg-orange-100/80 border border-orange-200 transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-orange-600" />
                <span>{t('navLogin')}</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t('navRegister')}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

