import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { historyAPI } from '../services/apiService';
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
  const { t } = useLanguage();
  const [historyRecords, setHistoryRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await historyAPI.getHistory();
      setHistoryRecords(data || []);
    } catch (error) {
      console.error("Failed to load history records", error);
      setHistoryRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecords = historyRecords.filter(record => {
    const pId = record.patient_id || '';
    const file = record.filename || '';
    const stage = record.predicted_stage || '';

    const matchesSearch = pId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          file.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'ALL' || stage.includes(stageFilter);
    return matchesSearch && matchesStage;
  });

  const getStageBadge = (stage) => {
    if (!stage) return null;
    if (stage.includes('AD')) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">AD</span>;
    } else if (stage.includes('MCI')) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">MCI</span>;
    } else {
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">CN</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
      
      {/* Header Banner */}
      <div className="bg-white border border-orange-100 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center border border-orange-200">
            <History className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('historyTitle')}</h1>
            <p className="text-xs text-slate-500 mt-1">
              {t('historySubtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-orange-50 text-orange-800 font-bold border border-orange-200">
            Total Records: {historyRecords.length} Scans
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-orange-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={t('historySearchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Stage Filter */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-600 font-medium">Filter Stage:</span>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Stages</option>
            <option value="AD">Alzheimer's Disease (AD)</option>
            <option value="MCI">Mild Cognitive Impairment (MCI)</option>
            <option value="CN">Cognitively Normal (CN)</option>
          </select>
        </div>
      </div>

      {/* Records Table or Empty State */}
      {isLoading ? (
        <div className="bg-white border border-orange-100 rounded-3xl p-12 text-center text-slate-500 text-xs font-medium">
          Loading historical scan records...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white border border-orange-100 rounded-3xl p-12 text-center space-y-3 shadow-sm">
          <FolderOpen className="w-12 h-12 text-orange-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">{t('historyNoScans')}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || stageFilter !== 'ALL' 
              ? "No scan records match your search query or stage filter criteria." 
              : "No MRI scan analyses have been executed yet. Upload a 3D sMRI volume scan to run inference and record patient history."}
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors shadow-sm mt-2"
          >
            {t('navUpload')}
          </button>
        </div>
      ) : (
        <div className="bg-white border border-orange-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-orange-50/80 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-orange-100">
                <tr>
                  <th className="py-3.5 px-4">{t('historyTableId')}</th>
                  <th className="py-3.5 px-4">{t('historyTableAge')}</th>
                  <th className="py-3.5 px-4">{t('dashScanFile')}</th>
                  <th className="py-3.5 px-4">{t('historyTableStage')}</th>
                  <th className="py-3.5 px-4">{t('historyTableConfidence')}</th>
                  <th className="py-3.5 px-4">Hippocampus Vol</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">{t('historyTableAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-orange-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center space-x-2">
                      <User className="w-3.5 h-3.5 text-orange-600" />
                      <span>{record.patient_id}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {record.patient_age} Yrs • {record.gender}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-orange-700 font-semibold">
                      {record.filename}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStageBadge(record.predicted_stage)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {(record.confidence_score * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono">
                      {record.hippocampus_volume_mm3} mm³
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center text-[10px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-orange-600" /> {record.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate('/dashboard', { 
                          state: { 
                            patientId: record.patient_id, 
                            patientAge: record.patient_age, 
                            gender: record.gender, 
                            filename: record.filename,
                            prediction: {
                              predicted_stage: record.predicted_stage,
                              confidence_score: record.confidence_score,
                              probabilities: record.probabilities
                            }
                          } 
                        })}
                        className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] inline-flex items-center space-x-1 transition-colors shadow-sm"
                      >
                        <span>{t('historyViewDetails')}</span>
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

