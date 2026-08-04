import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserPlus, User, Mail, Lock, Building, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    hospital: '',
    role: 'Neuro-Radiologist'
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const result = await register(formData);
    setIsLoading(false);

    if (result.success) {
      navigate('/upload');
    } else {
      setErrorMessage(result.error);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-orange-100 rounded-3xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-orange-100 text-orange-600 border border-orange-200 mb-3">
            <UserPlus className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('registerTitle')}</h2>
          <p className="text-xs text-slate-500 mt-1">{t('registerSubtitle')}</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2 shadow-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('registerFullName')}</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Dr. Jane Smith, MD"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-orange-200 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('registerHospital')}</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={formData.hospital}
                  onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                  placeholder="Medical Center"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-orange-200 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('registerRole')}</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-orange-200 text-slate-900 text-sm focus:outline-none focus:border-orange-500 font-medium"
              >
                <option value="Neuro-Radiologist">Neuro-Radiologist</option>
                <option value="Neurologist">Neurologist</option>
                <option value="AI Researcher">AI Researcher</option>
                <option value="Clinical Specialist">Clinical Specialist</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('registerEmail')}</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jsmith@hospital.org"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-orange-200 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('registerPassword')}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-orange-200 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all mt-2 disabled:opacity-50"
          >
            {isLoading ? "Creating Account..." : t('registerBtn')}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          {t('registerHasAccount')}{' '}
          <Link to="/login" className="text-orange-600 font-bold hover:underline">
            {t('registerLoginLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}

