import React, { useState, useEffect } from 'react';
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
  Moon,
  Menu,
  X
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t, currentLanguageObj, SUPPORTED_LANGUAGES } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 pb-2 pointer-events-none">
      <header className={`pointer-events-auto w-full max-w-5xl rounded-2xl transition-all duration-300 backdrop-blur-[16px] border px-5 py-2.5 sm:px-6 shadow-sm flex flex-col ${scrolled ? 'bg-white/85 dark:bg-slate-900/85 border-orange-200/80 dark:border-orange-900/60 shadow-md' : 'bg-white/65 dark:bg-slate-900/65 border-orange-200/40 dark:border-orange-900/30'}`}>
        <div className="flex items-center justify-between w-full">
          
      {/* Brand Logo */}
<Link to="/" className="flex items-center space-x-3 group shrink-0">
  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
    <Brain className="w-5 h-5" />
  </div>

  <div className="flex flex-col justify-center">

    <span
      className="text-xl font-extrabold tracking-[-0.05em] bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-transparent leading-none mb-0.5"
      style={{
        fontFamily: "'Sora', sans-serif",
        fontWeight: 800,
      }}
    >
      AD-WEB
    </span>

    <span className="text-[9px] uppercase font-mono font-medium tracking-widest text-slate-500 dark:text-slate-400 leading-none">
      Explainable AI • 3D MRI
    </span>

  </div>
</Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 ml-4">
            <Link
              to="/"
              className={`text-sm font-heading font-medium transition-all duration-200 ${
                isActive('/') 
                  ? 'text-orange-600 dark:text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-orange-500 hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]'
              }`}
            >
              {t('navHome')}
            </Link>
            <Link
              to="/upload"
              className={`text-sm font-heading font-medium transition-all duration-200 ${
                isActive('/upload') 
                  ? 'text-orange-600 dark:text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-orange-500 hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]'
              }`}
            >
              {t('navUpload')}
            </Link>
            <Link
              to="/dashboard"
              className={`text-sm font-heading font-medium transition-all duration-200 ${
                isActive('/dashboard') 
                  ? 'text-orange-600 dark:text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-orange-500 hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]'
              }`}
            >
              {t('navDashboard')}
            </Link>
            <Link
              to="/history"
              className={`text-sm font-heading font-medium transition-all duration-200 ${
                isActive('/history') 
                  ? 'text-orange-600 dark:text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-orange-500 hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]'
              }`}
            >
              {t('navHistory')}
            </Link>
            <Link
              to="/about"
              className={`text-sm font-heading font-medium transition-all duration-200 ${
                isActive('/about') 
                  ? 'text-orange-600 dark:text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-orange-500 hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]'
              }`}
            >
              {t('navAbout') || 'About'}
            </Link>
          </nav>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-1 sm:space-x-2 ml-auto">
            
            {/* Sun / Moon Theme Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                toggleTheme();
              }}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer hidden sm:block"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Quick Language Selector */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center space-x-1 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Select Language"
              >
                <span className="text-sm leading-none">{currentLanguageObj.flag}</span>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 max-h-72 overflow-y-auto rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-orange-100 dark:border-slate-800 shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2">
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

            {/* User Controls */}
            {isAuthenticated ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 p-1 pr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <img
                    src={user.avatar}
                    alt={user.fullName}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-orange-400/50"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-orange-100 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2 border-b border-orange-100 dark:border-slate-800 mb-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.fullName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      <span className="mt-1 inline-flex items-center text-[10px] font-semibold text-orange-700 dark:text-orange-300 bg-orange-100/50 dark:bg-orange-900/30 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                        <ShieldCheck className="w-3 h-3 mr-1" /> {user.hospital}
                      </span>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      <User className="w-4 h-4 text-orange-500" />
                      <span>{t('navProfile')}</span>
                    </Link>

                    <Link
                      to="/history"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      <History className="w-4 h-4 text-orange-500" />
                      <span>{t('navHistory')} ({user.scansAnalyzed})</span>
                    </Link>

                    <div className="border-t border-orange-100 dark:border-slate-800 my-1"></div>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('navLogout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-1.5 ml-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition-all"
                >
                  {t('navLogin')}
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm shadow-orange-500/20 transition-all"
                >
                  {t('navRegister')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Hamburger */}
            <button 
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors ml-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-2 mt-2 border-t border-slate-200/50 dark:border-slate-700/50 animate-in slide-in-from-top-2 fade-in duration-200">
            <nav className="flex flex-col space-y-1">
              {[
                { path: '/', label: t('navHome') },
                { path: '/upload', label: t('navUpload') },
                { path: '/dashboard', label: t('navDashboard') },
                { path: '/history', label: t('navHistory') },
                { path: '/about', label: t('navAbout') || 'About' }
              ].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2.5 rounded-xl text-sm font-heading font-medium transition-colors ${
                    isActive(link.path) 
                      ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            
            <div className="border-t border-slate-200/50 dark:border-slate-700/50 my-3"></div>
            
            <div className="px-4 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Settings</span>
              <div className="flex space-x-2">
                <button onClick={toggleTheme} className="p-2 rounded-xl bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </button>
                <button onClick={() => setLangDropdownOpen(!langDropdownOpen)} className="p-2 rounded-xl bg-black/5 dark:bg-white/10 text-sm leading-none">
                  {currentLanguageObj.flag}
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200/50 dark:border-slate-700/50 my-3"></div>

            {isAuthenticated ? (
              <div className="px-4 space-y-2">
                <div className="flex items-center space-x-3 mb-4">
                  <img src={user.avatar} alt="User" className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{user.fullName}</p>
                    <p className="text-[10px] text-orange-600 dark:text-orange-400">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('navLogout')}</span>
                </button>
              </div>
            ) : (
              <div className="px-4 grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  className="flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  {t('navLogin')}
                </Link>
                <Link
                  to="/register"
                  className="flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-colors"
                >
                  {t('navRegister')}
                </Link>
              </div>
            )}
          </div>
        )}
      </header>
    </div>
  );
}

