import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Settings, RefreshCw, BarChart3, Database, FileText, CheckCircle2, TrendingUp, AlertTriangle, Trash2 } from 'lucide-react';

const SettingsPage = () => {
  const [pairData, setPairData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTable, setActiveTable] = useState('umurToBerat');
  const [selectedGender, setSelectedGender] = useState('L');

  const [showConfirmInput, setShowConfirmInput] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleDeleteAll = async () => {
    if (confirmText !== 'HAPUS') return;
    try {
      setDeleting(true);
      setErrorMsg('');
      setSuccessMsg('');
      const res = await api.delete('/balita/all');
      setSuccessMsg(res.data.message || 'Semua data balita dan riwayat pemeriksaan berhasil dihapus.');
      setShowConfirmInput(false);
      setConfirmText('');
    } catch (error) {
      console.error('Error resetting database:', error);
      setErrorMsg(error.response?.data?.message || 'Gagal menghapus data. Pastikan Anda memiliki akses admin.');
    } finally {
      setDeleting(false);
    }
  };

  const [rules, setRules] = useState([]);
  const [rulesSearch, setRulesSearch] = useState('');
  const [rulesPage, setRulesPage] = useState(1);
  const rulesPerPage = 10;

  const [appSettings, setAppSettings] = useState({
    calculation_mode: 'WHO',
    selected_model_id: ''
  });
  const [models, setModels] = useState([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState('');
  const [settingsErrorMsg, setSettingsErrorMsg] = useState('');

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const fetchSettingsData = async () => {
    try {
      setLoading(true);
      const [pairRes, rulesRes, settingsRes, modelsRes] = await Promise.all([
        api.get('/settings/pairs'),
        api.get('/settings/rules'),
        api.get('/settings/fuzzy'),
        api.get('/naive-bayes/models')
      ]);
      setPairData(pairRes.data);
      setRules(rulesRes.data || []);
      setAppSettings(settingsRes.data || { calculation_mode: 'WHO', selected_model_id: '' });
      setModels(modelsRes.data || []);
    } catch (error) {
      console.error('Error fetching settings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAppSettings = async () => {
    try {
      setSavingSettings(true);
      setSettingsSuccessMsg('');
      setSettingsErrorMsg('');
      const res = await api.post('/settings/fuzzy', appSettings);
      setSettingsSuccessMsg(res.data.message || 'Pengaturan kalkulasi berhasil disimpan.');
    } catch (error) {
      console.error('Error saving settings:', error);
      setSettingsErrorMsg('Gagal menyimpan pengaturan.');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-medical-600 mb-4" size={40} />
        <p className="text-slate-500 font-medium">Sinkronisasi data @pairs & aturan keputusan...</p>
      </div>
    );
  }

  const ThresholdCard = ({ title, ranges }) => (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
        <h4 className="font-bold text-slate-800 text-sm uppercase tracking-widest">{title}</h4>
      </div>
      <div className="p-6 space-y-3">
        {ranges.map((r, i) => (
          <div key={i} className="flex justify-between items-center text-xs font-medium">
            <span className="text-slate-500">{r.label}</span>
            <span className={`px-3 py-1 rounded-lg ${r.color} bg-opacity-10 font-bold`}>{r.range}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const filteredRules = rules.filter(r => 
    (r.bbu?.toLowerCase() || '').includes(rulesSearch.toLowerCase()) ||
    (r.tbu?.toLowerCase() || '').includes(rulesSearch.toLowerCase()) ||
    (r.bbtb?.toLowerCase() || '').includes(rulesSearch.toLowerCase()) ||
    (r.keputusan?.toLowerCase() || '').includes(rulesSearch.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredRules.length / rulesPerPage);
  const startIndex = (rulesPage - 1) * rulesPerPage;
  const endIndex = startIndex + rulesPerPage;
  const paginatedRules = filteredRules.slice(startIndex, endIndex);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
            <Settings className="mr-3 text-medical-600" size={32} />
            Konfigurasi Assessment @Pairs
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Sistem kini sepenuhnya menggunakan anchor data @pairs (Z-Score Standard WHO).</p>
        </div>
        <button 
          onClick={fetchSettingsData}
          className="bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-2xl font-bold border border-slate-200 flex items-center space-x-2 transition-all shadow-sm"
        >
          <RefreshCw size={20} />
          <span>Refresh Data CSV</span>
        </button>
      </div>

      {/* Global Calculation Settings Card */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden p-8 space-y-6">
        <div className="flex items-center space-x-4 border-b border-slate-100 pb-5">
          <div className="bg-medical-500 p-3 rounded-2xl shadow-lg shadow-medical-500/20 text-white flex-shrink-0">
            <Settings size={24} />
          </div>
          <div>
            <h3 className="text-slate-900 font-black text-xl">Metode Klasifikasi Gizi Default (Global)</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
              Tentukan metode klasifikasi gizi yang akan dikunci untuk pengguna Kader
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              Metode Klasifikasi
            </label>
            <select
              value={appSettings.calculation_mode || 'WHO'}
              onChange={(e) => setAppSettings({ ...appSettings, calculation_mode: e.target.value })}
              className="input-field h-12 text-xs font-bold bg-white"
            >
              <option value="WHO">Gunakan standar WHO Z-score</option>
              <option value="NB_LATEST">Gunakan Categorical Naive Bayes - Model Terbaru</option>
              <option value="NB_SPECIFIC">Gunakan Categorical Naive Bayes - Pilih Model</option>
            </select>
          </div>

          {appSettings.calculation_mode === 'NB_SPECIFIC' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Pilih Model Naive Bayes Spesifik
              </label>
              {models.length > 0 ? (
                <select
                  value={appSettings.selected_model_id || ''}
                  onChange={(e) => setAppSettings({ ...appSettings, selected_model_id: e.target.value })}
                  className="input-field h-12 text-xs font-bold bg-white"
                >
                  <option value="">-- Pilih Model --</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama_model} (Akurasi: {m.akurasi}%, Data: {m.jumlah_data})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-rose-500 font-bold p-3 bg-rose-50 border border-rose-100 rounded-xl">
                  Belum ada model Naive Bayes yang dilatih. Silakan train model terlebih dahulu.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-4 pt-2">
          <button
            onClick={handleSaveAppSettings}
            disabled={savingSettings || (appSettings.calculation_mode === 'NB_SPECIFIC' && !appSettings.selected_model_id)}
            className="bg-medical-500 hover:bg-medical-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-medical-500/10"
          >
            {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>

          {settingsSuccessMsg && (
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl animate-in fade-in duration-300">
              ✓ {settingsSuccessMsg}
            </span>
          )}
          {settingsErrorMsg && (
            <span className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl animate-in fade-in duration-300">
              ⚠ {settingsErrorMsg}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <ThresholdCard 
          title="Ambang Batas Berat Badan menurut Umur" 
          ranges={[
            { label: 'Sangat Kurang', range: '< -3 SD', color: 'text-rose-600' },
            { label: 'Kurang', range: '-3 s/d -2 SD', color: 'text-rose-400' },
            { label: 'Normal', range: '-2 s/d +1 SD', color: 'text-emerald-600' },
            { label: 'Risiko Lebih', range: '> +1 SD', color: 'text-amber-500' }
          ]}
        />
        <ThresholdCard 
          title="Ambang Batas Tinggi Badan menurut Umur" 
          ranges={[
            { label: 'Sangat Pendek', range: '< -3 SD', color: 'text-rose-600' },
            { label: 'Pendek', range: '-3 s/d -2 SD', color: 'text-rose-400' },
            { label: 'Normal', range: '-2 s/d +3 SD', color: 'text-emerald-600' },
            { label: 'Tinggi', range: '> +3 SD', color: 'text-blue-500' }
          ]}
        />
        <ThresholdCard 
          title="Ambang Batas Berat Badan menurut Tinggi Badan" 
          ranges={[
            { label: 'Gizi Buruk', range: '< -3 SD', color: 'text-rose-600' },
            { label: 'Gizi Kurang', range: '-3 s/d -2 SD', color: 'text-rose-400' },
            { label: 'Gizi Baik', range: '-2 s/d +1 SD', color: 'text-emerald-600' },
            { label: 'Gizi Lebih', range: '> +1 SD', color: 'text-blue-500' }
          ]}
        />
      </div>

      {/* Decision Rules Card */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-violet-600 p-3 rounded-2xl shadow-lg shadow-violet-600/20 text-white">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-slate-900 font-black text-xl">Matriks Keputusan Status Gizi</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                Logika Klasifikasi Kombinasi Z-score (new-data.csv)
              </p>
            </div>
          </div>
          <div className="w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Cari aturan (misal: 'Sangat Pendek', 'Gizi Buruk')..."
              value={rulesSearch}
              onChange={(e) => {
                setRulesSearch(e.target.value);
                setRulesPage(1);
              }}
              className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
        </div>

        {/* Rules Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-wider text-[10px] w-20">No</th>
                <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-wider text-[10px]">BB/U (Berat / Umur)</th>
                <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-wider text-[10px]">TB/U (Tinggi / Umur)</th>
                <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-wider text-[10px]">BB/TB (Berat / Tinggi)</th>
                <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-wider text-[10px] text-center">Keputusan Status Gizi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedRules.map((rule, index) => {
                const globalIndex = (rulesPage - 1) * rulesPerPage + index + 1;
                return (
                  <tr key={globalIndex} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-400 font-bold">{globalIndex}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{rule.bbu}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{rule.tbu}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{rule.bbtb}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase inline-block ${
                        rule.keputusan === 'Gizi Buruk' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                        rule.keputusan === 'Gizi Kurang' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        rule.keputusan === 'Gizi Baik' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        {rule.keputusan}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredRules.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-bold">
                    Tidak ada aturan keputusan yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-5">
            <span className="text-xs text-slate-400 font-bold">
              Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredRules.length)} dari {filteredRules.length} aturan
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={rulesPage === 1}
                onClick={() => setRulesPage(prev => Math.max(prev - 1, 1))}
                className="px-4 py-2.5 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Sebelumnya
              </button>
              <span className="text-xs text-slate-700 font-black px-2">
                Halaman {rulesPage} dari {totalPages}
              </span>
              <button
                disabled={rulesPage === totalPages}
                onClick={() => setRulesPage(prev => Math.min(prev + 1, totalPages))}
                className="px-4 py-2.5 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 px-4">
          <div className="flex items-center space-x-4">
            <div className="bg-slate-900 p-3 rounded-2xl shadow-lg">
              <Database className="text-emerald-400" size={24} />
            </div>
            <div>
              <h3 className="text-slate-900 font-black text-xl">Anchor Data Repository</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Source: WHO Growth Standards (CSV Pairs)</p>
            </div>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl self-start sm:self-auto border border-slate-200">
            <button
              onClick={() => setSelectedGender('L')}
              className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider transition-all ${selectedGender === 'L' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
            >
              LAKI-LAKI (MALE)
            </button>
            <button
              onClick={() => setSelectedGender('P')}
              className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider transition-all ${selectedGender === 'P' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
            >
              PEREMPUAN (FEMALE)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
            { id: 'umurToBerat', title: 'Berat Badan / Umur (Age)', xLabel: 'Bulan' },
            { id: 'umurToTinggi', title: 'Tinggi Badan / Umur (Age)', xLabel: 'Bulan' },
            { id: 'panjangToBerat', title: 'Berat Badan / Panjang (0-23 Bulan)', xLabel: 'Cm' },
            { id: 'tinggiToBerat', title: 'Berat Badan / Tinggi (24-60 Bulan)', xLabel: 'Cm' }
          ].map((table) => (
            <div key={table.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[500px]">
              <div className="bg-slate-900 px-6 py-4 border-b border-slate-800">
                <h4 className="text-white font-black text-xs uppercase tracking-[0.2em]">{table.title}</h4>
              </div>
              <div className="overflow-y-auto flex-grow custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-tighter">{table.xLabel}</th>
                      <th className="px-2 py-3 text-[10px] font-black text-rose-500 uppercase tracking-tighter">-3 SD</th>
                      <th className="px-2 py-3 text-[10px] font-black text-rose-400 uppercase tracking-tighter">-2 SD</th>
                      <th className="px-2 py-3 text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Median</th>
                      <th className="px-2 py-3 text-[10px] font-black text-blue-500 uppercase tracking-tighter">+2 SD</th>
                      <th className="px-2 py-3 text-[10px] font-black text-blue-600 uppercase tracking-tighter">+3 SD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pairData?.[selectedGender]?.[table.id]?.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-black text-slate-900">{Object.values(row)[0]}</td>
                        <td className="px-2 py-3 text-xs font-medium text-rose-400">{row.Minus_3SD != null && typeof row.Minus_3SD === 'number' ? row.Minus_3SD.toFixed(1) : '--'}</td>
                        <td className="px-2 py-3 text-xs font-bold text-rose-500">{row.Minus_2SD != null && typeof row.Minus_2SD === 'number' ? row.Minus_2SD.toFixed(1) : '--'}</td>
                        <td className="px-2 py-3 text-xs font-black text-emerald-600">{row.Median != null && typeof row.Median === 'number' ? row.Median.toFixed(1) : '--'}</td>
                        <td className="px-2 py-3 text-xs font-bold text-blue-500">{row.Plus_2SD != null && typeof row.Plus_2SD === 'number' ? row.Plus_2SD.toFixed(1) : '--'}</td>
                        <td className="px-2 py-3 text-xs font-medium text-blue-600">{row.Plus_3SD != null && typeof row.Plus_3SD === 'number' ? row.Plus_3SD.toFixed(1) : '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50/50 rounded-[2rem] border border-rose-100 shadow-xl p-8 mt-12 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="bg-rose-600 p-3 rounded-2xl shadow-lg shadow-rose-600/20 text-white">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-rose-950 font-black text-xl">Zona Bahaya (Danger Zone)</h3>
            <p className="text-rose-600 text-xs font-bold uppercase tracking-widest">Tindakan Destruktif & Permanen</p>
          </div>
        </div>

        <div className="border-t border-rose-100/70 pt-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h4 className="text-slate-800 font-bold text-base">Hapus Semua Data Balita & Pemeriksaan</h4>
            <p className="text-slate-500 text-sm mt-1">
              Tindakan ini akan menghapus seluruh data balita dan semua riwayat pengukuran/pemeriksaan secara permanen dari database. ID data baru akan disetel ulang ke 1.
            </p>
          </div>

          {!showConfirmInput ? (
            <button
              onClick={() => {
                setShowConfirmInput(true);
                setConfirmText('');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white px-6 py-4 rounded-2xl font-black transition-all shadow-md shadow-rose-600/10 flex items-center justify-center space-x-2 whitespace-nowrap self-start md:self-auto"
            >
              <Trash2 size={20} />
              <span>Hapus Semua Data</span>
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-rose-800 uppercase tracking-wider">Ketik "HAPUS" untuk konfirmasi:</label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="HAPUS"
                  className="bg-white border border-rose-200 rounded-xl px-4 py-2 text-rose-950 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 text-center w-full sm:w-48 placeholder-rose-200"
                />
              </div>
              <div className="flex items-end gap-2 mt-auto sm:mt-0">
                <button
                  onClick={handleDeleteAll}
                  disabled={confirmText !== 'HAPUS' || deleting}
                  className={`px-5 py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all ${
                    confirmText === 'HAPUS' && !deleting
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/10 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {deleting ? 'Memproses...' : 'Ya, Hapus Semua'}
                </button>
                <button
                  onClick={() => setShowConfirmInput(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-bold flex items-center space-x-2 animate-in fade-in duration-300">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm font-bold flex items-center space-x-2 animate-in fade-in duration-300">
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
