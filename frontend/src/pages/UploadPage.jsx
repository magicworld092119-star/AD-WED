import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictAPI } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Upload, 
  FileCheck, 
  Sliders, 
  Sparkles, 
  CheckCircle2, 
  Brain,
  AlertCircle
} from 'lucide-react';

export default function UploadPage() {
  const navigate = useNavigate();
  const { user, refreshUserScans } = useAuth();
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [patientId, setPatientId] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const steps = [
    t('uploadStep1'),
    t('uploadStep2'),
    t('uploadStep3'),
    t('uploadStep4'),
    t('uploadStep5'),
    t('uploadStep6')
  ];

  const handleFileChange = (selectedFile) => {
    if (selectedFile && (selectedFile.name.endsWith('.nii') || selectedFile.name.endsWith('.nii.gz'))) {
      setFile(selectedFile);
      setErrorMessage('');
    } else {
      setErrorMessage("Invalid file. Please select a valid NIfTI 3D Brain MRI scan (.nii or .nii.gz)");
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    handleFileChange(droppedFile);
  };

  const handleStartInference = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMessage('');
    setProcessStep(0);

    const stepInterval = setInterval(() => {
      setProcessStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 700);

    try {
      const response = await predictAPI.uploadAndPredict(
        file, 
        patientId, 
        patientAge, 
        gender, 
        user?.id, 
        user?.email
      );
      clearInterval(stepInterval);
      
      // Refresh scan count for the user
      if (refreshUserScans) {
        refreshUserScans();
      }

      setTimeout(() => {
        navigate('/dashboard', { 
          state: { 
            prediction: response,
            patientId: patientId || response.prediction_id, 
            patientAge: patientAge || '70', 
            gender: gender || 'Female', 
            filename: file.name,
            userId: user?.id,
            userEmail: user?.email
          } 
        });
      }, 500);


    } catch (error) {
      clearInterval(stepInterval);
      setIsProcessing(false);
      const msg = error.response?.data?.detail || "Failed to process sMRI scan. Please ensure the backend server is running.";
      setErrorMessage(msg);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
      
      {/* Page Header */}
      <div className="text-center space-y-2">
        <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-xs font-bold tracking-wide">
          {t('uploadTag')}
        </span>
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t('uploadTitle')}</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl mx-auto">
          {t('uploadSubtitle')}
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center space-x-2 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isProcessing ? (
        /* Processing Loading State */
        <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-10 text-center space-y-8 shadow-xl transition-colors duration-200">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-orange-200 dark:border-orange-900 border-t-orange-500 animate-spin"></div>
            <Brain className="w-10 h-10 text-orange-600 dark:text-orange-400 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('uploadProcessingTitle')}</h3>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-mono font-bold">{steps[processStep]}</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 max-w-md mx-auto">
            <div 
              className="bg-gradient-to-r from-orange-500 to-amber-500 h-full transition-all duration-500 ease-out"
              style={{ width: `${((processStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left text-xs">
            {steps.map((stepName, idx) => (
              <div 
                key={idx}
                className={`p-2.5 rounded-xl border flex items-center space-x-2 transition-all ${
                  idx <= processStep 
                    ? 'bg-orange-50 dark:bg-orange-950/60 border-orange-300 dark:border-orange-800 text-orange-900 dark:text-orange-200 font-medium' 
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${idx <= processStep ? 'text-orange-600 dark:text-orange-400' : 'text-slate-300 dark:text-slate-600'}`} />
                <span className="text-[11px] truncate">{stepName.split('(')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* File Upload Form */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Upload Box */}
          <div className="md:col-span-2 space-y-6">
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer group ${
                file 
                  ? 'bg-orange-50/80 dark:bg-orange-950/40 border-orange-400 dark:border-orange-600' 
                  : 'bg-white dark:bg-slate-900 border-orange-200 dark:border-slate-800 hover:border-orange-400 dark:hover:border-orange-600 hover:bg-orange-50/30 dark:hover:bg-slate-800/40'
              }`}
            >
              <input 
                type="file" 
                accept=".nii,.nii.gz" 
                onChange={(e) => handleFileChange(e.target.files[0])} 
                className="hidden" 
                id="mri-upload-input"
              />
              <label htmlFor="mri-upload-input" className="cursor-pointer block space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto border border-orange-200 dark:border-orange-800 group-hover:scale-110 transition-transform">
                  {file ? <FileCheck className="w-8 h-8 text-orange-600 dark:text-orange-400" /> : <Upload className="w-8 h-8" />}
                </div>

                {file ? (
                  <div className="space-y-1">
                    <p className="text-base font-bold text-orange-900 dark:text-orange-200">{file.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB • {t('uploadSelectedFile')}</p>
                    <span className="inline-block px-3 py-1 bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-[11px] font-bold mt-2">
                      Ready for Inference
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{t('uploadTitle')}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('uploadDragDrop')}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">Structural 3D T1-weighted sMRI scan</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Patient Details & Pipeline Options */}
          <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-sm transition-colors duration-200">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>{t('uploadPatientInfoTitle')}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">{t('uploadPatientId')}</label>
                <input
                  type="text"
                  placeholder="e.g. PT-2026-9041"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">{t('uploadPatientAge')}</label>
                  <input
                    type="number"
                    placeholder="72"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">{t('uploadPatientGender')}</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Female">{t('uploadFemale')}</option>
                    <option value="Male">{t('uploadMale')}</option>
                    <option value="Other">{t('uploadOther')}</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartInference}
              disabled={!file}
              className={`w-full py-3 rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 ${
                file 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/20 cursor-pointer' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('uploadAnalyzeBtn')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
