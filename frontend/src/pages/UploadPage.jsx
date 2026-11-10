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
  const [gender, setGender] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const validateMetadata = (pId, pAge, pGender) => {
    const errors = {};
    if (!pId || !pId.trim()) {
      errors.patientId = 'Patient Identifier is required';
    }
    if (!pAge || !String(pAge).trim()) {
      errors.patientAge = 'Patient Age is required';
    } else {
      const num = Number(pAge);
      if (isNaN(num) || num < 1 || num > 125) {
        errors.patientAge = 'Please enter a valid age (1 - 125)';
      }
    }
    if (!pGender || !pGender.trim()) {
      errors.gender = 'Gender is required';
    }
    return errors;
  };

  const handlePatientIdChange = (val) => {
    setPatientId(val);
    if (touched.patientId || formErrors.patientId) {
      if (val.trim()) {
        setFormErrors(prev => ({ ...prev, patientId: '' }));
      }
    }
  };

  const handlePatientAgeChange = (val) => {
    setPatientAge(val);
    if (touched.patientAge || formErrors.patientAge) {
      const num = Number(val);
      if (val.trim() && !isNaN(num) && num >= 1 && num <= 125) {
        setFormErrors(prev => ({ ...prev, patientAge: '' }));
      }
    }
  };

  const handleGenderChange = (val) => {
    setGender(val);
    if (touched.gender || formErrors.gender) {
      if (val.trim()) {
        setFormErrors(prev => ({ ...prev, gender: '' }));
      }
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const currentErrors = validateMetadata(patientId, patientAge, gender);
    if (currentErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: currentErrors[field] }));
    } else {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isAgeValid = patientAge.trim() !== '' && !isNaN(Number(patientAge)) && Number(patientAge) >= 1 && Number(patientAge) <= 125;
  const isMetadataComplete = Boolean(patientId.trim() && isAgeValid && gender.trim());
  const canSubmit = Boolean(file && isMetadataComplete && !isProcessing);

  const steps = [
    t('uploadStep1'),
    t('uploadStep2'),
    t('uploadStep3'),
    t('uploadStep4'),
    t('uploadStep5'),
    t('uploadStep6')
  ];

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    const name = selectedFile.name.toLowerCase();
    if (name.endsWith('.nii') || name.endsWith('.nii.gz') || name.endsWith('.gz')) {
      setFile(selectedFile);
      setErrorMessage('');
    } else {
      setErrorMessage("Invalid file format. Please select a valid NIfTI 3D Brain MRI scan (.nii or .nii.gz)");
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    handleFileChange(droppedFile);
  };

  const handleStartInference = async () => {
    const errors = validateMetadata(patientId, patientAge, gender);
    setTouched({ patientId: true, patientAge: true, gender: true });
    setFormErrors(errors);

    if (!file) {
      setErrorMessage("Please select or drop a valid NIfTI 3D Brain MRI scan (.nii or .nii.gz)");
      return;
    }

    if (Object.keys(errors).length > 0) {
      setErrorMessage("Please complete all mandatory Patient & Clinical Metadata fields.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setProcessStep(0);

    const stepInterval = setInterval(() => {
      setProcessStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 700);

    try {//api invokes it moves to predict api function
      const response = await predictAPI.uploadAndPredict(
        file, 
        patientId.trim(), 
        patientAge.trim(), 
        gender.trim(), 
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
            patientId: patientId.trim(), 
            patientAge: patientAge.trim(), 
            gender: gender.trim(), 
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
                accept=".nii,.nii.gz,.gz,application/gzip,application/x-gzip,application/octet-stream" 
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
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">Supports .nii and .nii.gz (Compressed NIfTI 3D Brain MRI)</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Patient Details & Pipeline Options */}
          <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-sm transition-colors duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span>{t('uploadPatientInfoTitle')}</span>
              </h3>
              <span className="text-[10px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                {t('uploadRequiredBadge') || 'Required'}
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="patient-id-input" className="text-slate-700 dark:text-slate-300 font-semibold flex items-center space-x-1">
                    <span>{t('uploadPatientId')}</span>
                    <span className="text-red-500 font-bold text-sm">*</span>
                  </label>
                  {formErrors.patientId && touched.patientId && (
                    <span className="text-[10px] text-red-500 font-medium">{formErrors.patientId}</span>
                  )}
                </div>
                <input
                  id="patient-id-input"
                  type="text"
                  placeholder="e.g. PT-2026-9041"
                  value={patientId}
                  onChange={(e) => handlePatientIdChange(e.target.value)}
                  onBlur={() => handleBlur('patientId')}
                  className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-slate-100 focus:outline-none transition-colors ${
                    formErrors.patientId && touched.patientId
                      ? 'border-red-400 dark:border-red-500 focus:border-red-500 bg-red-50/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-orange-500'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="patient-age-input" className="text-slate-700 dark:text-slate-300 font-semibold flex items-center space-x-1">
                      <span>{t('uploadPatientAge')}</span>
                      <span className="text-red-500 font-bold text-sm">*</span>
                    </label>
                  </div>
                  <input
                    id="patient-age-input"
                    type="number"
                    min="1"
                    max="125"
                    placeholder="72"
                    value={patientAge}
                    onChange={(e) => handlePatientAgeChange(e.target.value)}
                    onBlur={() => handleBlur('patientAge')}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-slate-100 focus:outline-none transition-colors ${
                      formErrors.patientAge && touched.patientAge
                        ? 'border-red-400 dark:border-red-500 focus:border-red-500 bg-red-50/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-orange-500'
                    }`}
                    required
                  />
                  {formErrors.patientAge && touched.patientAge && (
                    <p className="text-[10px] text-red-500 font-medium mt-1">{formErrors.patientAge}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="patient-gender-select" className="text-slate-700 dark:text-slate-300 font-semibold flex items-center space-x-1">
                      <span>{t('uploadPatientGender')}</span>
                      <span className="text-red-500 font-bold text-sm">*</span>
                    </label>
                  </div>
                  <select
                    id="patient-gender-select"
                    value={gender}
                    onChange={(e) => handleGenderChange(e.target.value)}
                    onBlur={() => handleBlur('gender')}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-slate-100 focus:outline-none transition-colors ${
                      formErrors.gender && touched.gender
                        ? 'border-red-400 dark:border-red-500 focus:border-red-500 bg-red-50/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-orange-500'
                    }`}
                    required
                  >
                    <option value="" disabled>{t('uploadSelectGender') || 'Select Gender'}</option>
                    <option value="Female">{t('uploadFemale')}</option>
                    <option value="Male">{t('uploadMale')}</option>
                    <option value="Other">{t('uploadOther')}</option>
                  </select>
                  {formErrors.gender && touched.gender && (
                    <p className="text-[10px] text-red-500 font-medium mt-1">{formErrors.gender}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                id="execute-prediction-button"
                onClick={handleStartInference}
                disabled={!canSubmit}
                className={`w-full py-3 rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 ${
                  canSubmit 
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/20 cursor-pointer active:scale-[0.99]' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{t('uploadAnalyzeBtn')}</span>
              </button>

              {!canSubmit && !isProcessing && (
                <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
                  {!file && !isMetadataComplete
                    ? "Upload an MRI volume and enter mandatory patient metadata"
                    : !file
                    ? "Upload an MRI volume (.nii/.nii.gz) to proceed"
                    : "Complete all required patient fields (*) to proceed"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
