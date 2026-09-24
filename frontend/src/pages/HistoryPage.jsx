import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { historyAPI } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  History,
  Search,
  Filter,
  ExternalLink,
  User,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { user, refreshUserScans } = useAuth();
  const { t } = useLanguage();

  const [historyRecords, setHistoryRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [user?.id, user?.email]);

  const fetchHistory = async () => {
    setIsLoading(true);

    try {
      const data = await historyAPI.getHistory(user?.id, user?.email);
      let records = Array.isArray(data) ? data : [];
      if (user?.id || user?.email) {
        // Match user's account records; also include unassigned guest scans if user has no saved scans yet
        const userRecords = records.filter((r) => {
          const matchEmail = user?.email && r.user_email && r.user_email.toLowerCase() === user.email.toLowerCase();
          const matchId = user?.id && r.user_id && r.user_id === user.id;
          return matchEmail || matchId;
        });
        setHistoryRecords(userRecords.length > 0 ? userRecords : records);
      } else {
        setHistoryRecords(records);
      }
      if (refreshUserScans) {
        refreshUserScans();
      }
    } catch (error) {
      console.error('Failed to load history records', error);
      setHistoryRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecords = historyRecords.filter((record) => {
    const pId = record.patient_id || '';
    const file = record.filename || '';
    const stage = record.predicted_stage || '';

    const matchesSearch =
      pId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage =
      stageFilter === 'ALL' || stage.includes(stageFilter);

    return matchesSearch && matchesStage;
  });

  const getStageBadge = (stage) => {
    if (!stage) return null;

    if (stage.includes('AD')) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
          AD
        </span>
      );
    }

    if (stage.includes('MCI')) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          MCI
        </span>
      );
    }

    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        CN
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">

      {/* =========================
          HEADER BANNER
      ========================== */}
      <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm overflow-hidden">

        <div className="flex items-center space-x-4 flex-1 min-w-0">

          {/* History Icon */}
          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200 dark:border-orange-800 shrink-0">
            <History className="w-7 h-7" />
          </div>

          {/* Title */}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              {t('historyTitle')}
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
              <span>Clinician: <strong className="text-orange-600 dark:text-orange-400">{user?.fullName || user?.email || 'Guest Clinician'}</strong></span>
              <span>•</span>
              <span className="text-[11px] text-slate-400">Strictly Isolated Patient Archive</span>
            </p>
          </div>

        </div>

        {/* Total Records */}
        <div className="flex items-center space-x-3 text-xs shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 font-bold border border-orange-200 dark:border-orange-800 whitespace-nowrap">
            Total Records: {historyRecords.length} Scans
          </span>
        </div>

      </div>

      {/* =========================
          SEARCH AND FILTER
      ========================== */}
      <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">

        {/* Search */}
        <div className="relative w-full sm:w-80">

          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />

          <input
            type="text"
            placeholder={t('historySearchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-200"
          />

        </div>

        {/* Stage Filter */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">

          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />

          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Filter Stage:
          </span>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">
              All Stages
            </option>

            <option value="AD">
              Alzheimer's Disease (AD)
            </option>

            <option value="MCI">
              Mild Cognitive Impairment (MCI)
            </option>

            <option value="CN">
              Cognitively Normal (CN)
            </option>
          </select>

        </div>

      </div>

      {/* =========================
          LOADING STATE
      ========================== */}
      {isLoading ? (

        <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-500 dark:text-slate-400 text-xs font-medium shadow-sm">

          <div className="flex flex-col items-center gap-3">

            <div className="w-8 h-8 border-2 border-orange-200 dark:border-orange-800 border-t-orange-500 rounded-full animate-spin" />

            <span>
              Loading historical scan records...
            </span>

          </div>

        </div>

      ) : filteredRecords.length === 0 ? (

        /* =========================
           EMPTY STATE
        ========================== */
        <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3 shadow-sm">

          <FolderOpen className="w-12 h-12 text-orange-400 mx-auto" />

          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {t('historyNoScans')}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            {searchTerm || stageFilter !== 'ALL'
              ? 'No scan records match your search query or stage filter criteria.'
              : `No scans have been uploaded under ${user?.email || 'this account'} yet. Patient records are strictly isolated to each individual clinician account.`}
          </p>

          <button
            onClick={() => navigate('/upload')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-bold text-xs transition-colors shadow-sm mt-2"
          >
            {t('navUpload')}
          </button>

        </div>

      ) : (

        /* =========================
           HISTORY TABLE
        ========================== */
        <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">

              {/* Table Header */}
              <thead className="bg-orange-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-orange-100 dark:border-slate-800">

                <tr>

                  <th className="py-3.5 px-4">
                    {t('historyTableId')}
                  </th>

                  <th className="py-3.5 px-4">
                    {t('historyTableAge')}
                  </th>

                  <th className="py-3.5 px-4">
                    {t('dashScanFile')}
                  </th>

                  <th className="py-3.5 px-4">
                    {t('historyTableStage')}
                  </th>

                  <th className="py-3.5 px-4">
                    {t('historyTableConfidence')}
                  </th>

                  <th className="py-3.5 px-4">
                    Hippocampus Vol
                  </th>

                  <th className="py-3.5 px-4">
                    Status
                  </th>

                  <th className="py-3.5 px-4 text-right">
                    {t('historyTableAction')}
                  </th>

                </tr>

              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                {filteredRecords.map((record) => (

                  <tr
                    key={record.id}
                    className="hover:bg-orange-50/40 dark:hover:bg-slate-800/50 transition-colors"
                  >

                    {/* Patient ID */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">

                      <div className="flex items-center space-x-2">

                        <User className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />

                        <span>
                          {record.patient_id}
                        </span>

                      </div>

                    </td>

                    {/* Age */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {record.patient_age} Yrs • {record.gender}
                    </td>

                    {/* File */}
                    <td className="py-3.5 px-4 font-mono text-orange-700 dark:text-orange-400 font-semibold">
                      {record.filename}
                    </td>

                    {/* Stage */}
                    <td className="py-3.5 px-4">
                      {getStageBadge(record.predicted_stage)}
                    </td>

                    {/* Confidence */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {(record.confidence_score * 100).toFixed(1)}%
                    </td>

                    {/* Hippocampus Volume */}
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono">
                      {record.hippocampus_volume_mm3} mm³
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">

                      <span className="inline-flex items-center text-[10px] font-bold text-orange-800 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/80 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">

                        <CheckCircle2 className="w-3 h-3 mr-1 text-orange-600 dark:text-orange-400" />

                        {record.status}

                      </span>

                    </td>

                    {/* View Details */}
                    <td className="py-3.5 px-4 text-right">

                      <button
                        onClick={() =>
                          navigate('/dashboard', {
                            state: {
                              id: record.id,
                              prediction_id: record.id,
                              patientId: record.patient_id,
                              patientAge: record.patient_age,
                              gender: record.gender,
                              filename: record.filename,
                              hippocampus_volume_mm3: record.hippocampus_volume_mm3,
                              peak_slices: record.peak_slices,

                              prediction: {
                                id: record.id,
                                prediction_id: record.id,
                                filename: record.filename,
                                predicted_stage: record.predicted_stage,
                                confidence_score: record.confidence_score,
                                probabilities: record.probabilities,
                                hippocampus_volume_mm3: record.hippocampus_volume_mm3,
                                peak_slices: record.peak_slices,
                                num_slices: record.num_slices || 96,
                                gradcam_heatmap_url: record.gradcam_heatmap_url || `/storage/heatmaps/${record.id}_heatmap.nii.gz`,
                                processed_mri_url: record.processed_mri_url || `/storage/uploads/${record.id}_${record.filename}`
                              }
                            }
                          })
                        }
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-bold text-[11px] inline-flex items-center space-x-1 transition-colors shadow-sm"
                      >

                        <span>
                          {t('historyViewDetails')}
                        </span>

                        <ExternalLink className="w-3 h-3" />

                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      )}

    </div>
  );
}