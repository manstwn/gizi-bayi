import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Brain, PlayCircle, Database, RefreshCw, Trash2, CheckCircle2,
  ChevronDown, ChevronUp, AlertTriangle, TrendingUp, Table2, Info,
  FlaskConical, Layers, BarChart3, Target, Sigma
} from 'lucide-react';

// ─── Colour helpers ──────────────────────────────────────────────────────────
const classColor = (cls) => {
  if (!cls) return 'bg-slate-100 text-slate-600';
  const l = cls.toLowerCase();
  if (l.includes('buruk')) return 'bg-rose-100 text-rose-700';
  if (l.includes('kurang')) return 'bg-amber-100 text-amber-700';
  if (l.includes('lebih')) return 'bg-orange-100 text-orange-700';
  return 'bg-emerald-100 text-emerald-700';
};

const classColorBar = (cls) => {
  if (!cls) return 'bg-slate-400';
  const l = cls.toLowerCase();
  if (l.includes('buruk')) return 'bg-rose-500';
  if (l.includes('kurang')) return 'bg-amber-500';
  if (l.includes('lebih')) return 'bg-orange-500';
  return 'bg-emerald-500';
};

const classColorHex = (cls) => {
  if (!cls) return '#94a3b8';
  const l = cls.toLowerCase();
  if (l.includes('buruk')) return '#ef4444';
  if (l.includes('kurang')) return '#f59e0b';
  if (l.includes('lebih')) return '#f97316';
  return '#10b981';
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const SectionCard = ({ icon: Icon, title, subtitle, children, color = 'blue', action }) => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl bg-${color}-50`}>
          <Icon size={18} className={`text-${color}-600`} />
        </div>
        <div>
          <h3 className="font-black text-slate-900 text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Collapsible = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <span className="font-bold text-sm text-slate-700">{title}</span>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
};

// ─── Confusion Matrix ────────────────────────────────────────────────────────

const ConfusionMatrix = ({ matrix, classes }) => {
  if (!matrix || !classes || classes.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
        Baris = Aktual &nbsp;·&nbsp; Kolom = Prediksi
      </p>
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="px-3 py-2 text-slate-400 font-bold text-[10px] text-right">Aktual ↓ / Prediksi →</th>
            {classes.map((cls) => (
              <th key={cls} className="px-3 py-2 text-center">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${classColor(cls)}`}>
                  {cls.split('(')[0].trim()}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {classes.map((actual) => (
            <tr key={actual} className="border-t border-slate-100">
              <td className="px-3 py-2 text-right">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${classColor(actual)}`}>
                  {actual.split('(')[0].trim()}
                </span>
              </td>
              {classes.map((pred) => {
                const val = matrix[actual]?.[pred] ?? 0;
                const isDiag = actual === pred;
                return (
                  <td
                    key={pred}
                    className={`px-3 py-2 text-center font-black text-sm rounded ${
                      isDiag
                        ? val > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'
                        : val > 0 ? 'bg-rose-50 text-rose-600' : 'text-slate-300'
                    }`}
                  >
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Per-Class Metrics Table ─────────────────────────────────────────────────

const MetricsTable = ({ perClass, macro, classes }) => {
  if (!perClass || !classes) return null;
  const fmt = (v) => (v * 100).toFixed(1) + '%';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">Kelas</th>
            <th className="pb-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">Precision</th>
            <th className="pb-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">Recall</th>
            <th className="pb-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">F1-Score</th>
            <th className="pb-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">TP</th>
            <th className="pb-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">FP</th>
            <th className="pb-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">FN</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {classes.map((cls) => {
            const m = perClass[cls];
            if (!m) return null;
            return (
              <tr key={cls} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 pr-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${classColor(cls)}`}>
                    {cls}
                  </span>
                </td>
                <td className="py-3 text-center font-black text-slate-700">{fmt(m.precision)}</td>
                <td className="py-3 text-center font-black text-slate-700">{fmt(m.recall)}</td>
                <td className="py-3 text-center">
                  <span className={`font-black ${m.f1 >= 0.7 ? 'text-emerald-600' : m.f1 >= 0.4 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {fmt(m.f1)}
                  </span>
                </td>
                <td className="py-3 text-center text-emerald-600 font-black">{m.TP}</td>
                <td className="py-3 text-center text-rose-400 font-medium">{m.FP}</td>
                <td className="py-3 text-center text-amber-400 font-medium">{m.FN}</td>
              </tr>
            );
          })}
          {/* Macro average */}
          {macro && (
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              <td className="py-3 pr-4 font-black text-slate-600 text-[10px] uppercase tracking-widest">Macro Avg</td>
              <td className="py-3 text-center font-black text-slate-800">{fmt(macro.precision)}</td>
              <td className="py-3 text-center font-black text-slate-800">{fmt(macro.recall)}</td>
              <td className="py-3 text-center font-black text-slate-800">{fmt(macro.f1)}</td>
              <td colSpan={3} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// ─── Export Helpers ──────────────────────────────────────────────────────────
const downloadCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  const headers = ['ID', 'Nama', 'Jenis Kelamin', 'Umur (Bulan)', 'Berat Badan (kg)', 'Tinggi Badan (cm)', 'Z BB/U', 'Z TB/U', 'Z BB/TB', 'Kategori Gizi', 'Status'];
  const rows = data.map(r => [
    r.id,
    `"${r.nama || '—'}"`,
    r.jenis_kelamin || '—',
    r.umur_bulan,
    r.berat_badan,
    r.tinggi_badan,
    r.zscores?.z_bbu ?? '—',
    r.zscores?.z_tbu ?? '—',
    r.zscores?.z_bbtb ?? '—',
    `"${r.kategori_gizi || '—'}"`,
    r.status_data
  ]);
  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const downloadExcelXLS = (data, filename) => {
  if (!data || data.length === 0) return;
  let tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
      <x:Name>Data Latih</x:Name>
      <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
      </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml>
      <![endif]-->
      <meta charset="utf-8">
    </head>
    <body>
      <table border="1">
        <tr style="background-color: #7c3aed; color: #ffffff; font-weight: bold;">
          <th>ID</th><th>Nama</th><th>Jenis Kelamin</th><th>Umur (Bulan)</th>
          <th>Berat Badan (kg)</th><th>Tinggi Badan (cm)</th>
          <th>Z BB/U</th><th>Z TB/U</th><th>Z BB/TB</th><th>Kategori Gizi</th><th>Status</th>
        </tr>
  `;

  data.forEach(r => {
    tableHtml += `
      <tr>
        <td>${r.id}</td>
        <td>${r.nama || '—'}</td>
        <td>${r.jenis_kelamin || '—'}</td>
        <td>${r.umur_bulan}</td>
        <td>${r.berat_badan}</td>
        <td>${r.tinggi_badan}</td>
        <td>${r.zscores?.z_bbu ?? '—'}</td>
        <td>${r.zscores?.z_tbu ?? '—'}</td>
        <td>${r.zscores?.z_bbtb ?? '—'}</td>
        <td>${r.kategori_gizi || '—'}</td>
        <td>${r.status_data}</td>
      </tr>
    `;
  });

  tableHtml += `</table></body></html>`;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ─── Data Source Selector ────────────────────────────────────────────────────

const DATA_SOURCES = [
  { key: 'main',  label: 'Data Utama',  desc: 'Hanya data pemeriksaan nyata',      icon: Database,    color: 'blue',   bg: 'bg-blue-50 border-blue-200',   ring: 'ring-blue-500',   text: 'text-blue-700'   },
  { key: 'dummy', label: 'Data Dummy',  desc: 'Hanya data sintetis/dummy',          icon: FlaskConical, color: 'teal',  bg: 'bg-teal-50 border-teal-200',   ring: 'ring-teal-500',   text: 'text-teal-700'   },
  { key: 'both',  label: 'Gabungan',    desc: 'Data utama + data dummy',            icon: Layers,      color: 'violet', bg: 'bg-violet-50 border-violet-200', ring: 'ring-violet-500', text: 'text-violet-700' },
];

// ─── Main Component ──────────────────────────────────────────────────────────

const NaiveBayesTrain = () => {
  const [trainingData, setTrainingData] = useState(null);
  const [models, setModels]             = useState([]);
  const [latestModel, setLatestModel]   = useState(null);
  const [loading, setLoading]           = useState({ data: false, train: false, models: false });
  const [trainResult, setTrainResult]   = useState(null);
  const [error, setError]               = useState(null);
  const [modelName, setModelName]       = useState('');
  const [dataSource, setDataSource]     = useState('main');
  const [modalOpen, setModalOpen]       = useState(false);
  const [modalTab, setModalTab]         = useState('main');
  const [searchQuery, setSearchQuery]   = useState('');

  const fetchAll = useCallback(async () => {
    setLoading((l) => ({ ...l, data: true, models: true }));
    try {
      const [dataRes, modelsRes] = await Promise.all([
        api.get('/naive-bayes/training-data'),
        api.get('/naive-bayes/models'),
      ]);
      setTrainingData(dataRes.data);
      setModels(modelsRes.data);

      if (modelsRes.data.length > 0) {
        const latest = await api.get('/naive-bayes/models/latest');
        setLatestModel(latest.data.model_json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading((l) => ({ ...l, data: false, models: false }));
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleTrain = async () => {
    setLoading((l) => ({ ...l, train: true }));
    setError(null);
    setTrainResult(null);
    try {
      const res = await api.post('/naive-bayes/train', {
        nama_model: modelName || undefined,
        data_source: dataSource,
      });
      setTrainResult(res.data.model);
      setLatestModel(res.data.model);
      await fetchAll();
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal melatih model.');
    } finally {
      setLoading((l) => ({ ...l, train: false }));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus model ini?')) return;
    try {
      await api.delete(`/naive-bayes/models/${id}`);
      fetchAll();
    } catch {
      alert('Gagal menghapus model.');
    }
  };

  const displayModel = trainResult || latestModel;

  const mainCount  = trainingData?.total    ?? 0;
  const dummyCount = trainingData?.dummyTotal ?? 0;
  const availableCount =
    dataSource === 'main'  ? mainCount  :
    dataSource === 'dummy' ? dummyCount :
    mainCount + dummyCount;

  const featureLabels = {
    z_bbu:  'Z-score BB/U',
    z_tbu:  'Z-score TB/U',
    z_bbtb: 'Z-score BB/TB atau BB/PB',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
          <div className="bg-violet-600 p-2 rounded-2xl shadow-lg shadow-violet-100">
            <Brain className="text-white" size={32} />
          </div>
          Gaussian Naive Bayes
          <span className="text-xs bg-violet-900 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest">Training</span>
        </h1>
        <p className="text-slate-500 mt-2 text-sm font-semibold max-w-xl">
          Latih model Gaussian NB menggunakan fitur{' '}
          <span className="text-violet-600">Z-score WHO (BB/U, TB/U, BB/TB)</span>.
          Akurasi dievaluasi pada test set terpisah (80/20 stratified split).
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Data Utama',       value: mainCount,  color: 'blue'   },
          { label: 'Data Dummy',       value: dummyCount, color: 'teal'   },
          { label: 'Model Tersimpan',  value: models.length, color: 'violet' },
          { label: 'Akurasi Test Set', value: models[0]?.akurasi != null ? `${models[0].akurasi}%` : '—', color: 'emerald' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-3xl font-black text-${stat.color}-600`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-4 space-y-5">

          {/* Train Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 p-6 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-violet-50/50 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
            <h3 className="font-black text-slate-900 flex items-center gap-2">
              <PlayCircle size={18} className="text-violet-600" /> Latih Model Baru
            </h3>

            {/* Model Name */}
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nama Model (opsional)</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder={`Gaussian NB - ${new Date().toLocaleDateString('id-ID')}`}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent"
              />
            </div>

            {/* Data Source */}
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Sumber Data Pelatihan</label>
              <div className="space-y-2">
                {DATA_SOURCES.map((src) => {
                  const count = src.key === 'main' ? mainCount : src.key === 'dummy' ? dummyCount : mainCount + dummyCount;
                  const isSelected = dataSource === src.key;
                  const SrcIcon = src.icon;
                  return (
                    <button
                      key={src.key}
                      onClick={() => setDataSource(src.key)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
                        isSelected ? `${src.bg} ring-2 ${src.ring} ring-offset-1` : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`p-1.5 rounded-xl ${isSelected ? `bg-${src.color}-100` : 'bg-white'}`}>
                        <SrcIcon size={16} className={isSelected ? src.text : 'text-slate-400'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-black text-xs ${isSelected ? src.text : 'text-slate-600'}`}>{src.label}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{src.desc}</p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isSelected ? `bg-${src.color}-200 ${src.text}` : 'bg-slate-200 text-slate-500'}`}>
                        {count} data
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {dataSource === 'both' && (
              <div className="p-3 bg-violet-50 border border-violet-100 rounded-2xl text-[10px] font-semibold text-violet-600">
                {mainCount} data utama + {dummyCount} data dummy = {mainCount + dummyCount} total data latih
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                <AlertTriangle size={18} className="text-rose-500 mt-0.5 flex-shrink-0" />
                <p className="text-rose-700 text-xs font-semibold">{error}</p>
              </div>
            )}

            {trainResult && (
              <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-emerald-700 text-xs font-black">Model Gaussian NB berhasil dilatih!</p>
                  <p className="text-emerald-600 text-xs mt-1">
                    {trainResult.trainCount} train · {trainResult.testCount} test
                    {trainResult.mainCount != null && ` (${trainResult.mainCount} utama + ${trainResult.dummyCount} dummy)`}
                    {' '}· {trainResult.activeClasses?.length} kelas · Akurasi {trainResult.accuracy}%
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleTrain}
              disabled={loading.train || availableCount === 0}
              className="w-full py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-violet-200 flex items-center justify-center gap-2"
            >
              {loading.train ? (
                <><RefreshCw size={18} className="animate-spin" /> Melatih Model...</>
              ) : (
                <><Brain size={18} /> Latih Model ({availableCount} data)</>
              )}
            </button>

            {availableCount === 0 && (
              <p className="text-xs text-amber-600 font-semibold text-center">
                ⚠️ Tidak ada data dari sumber yang dipilih.
              </p>
            )}
          </div>

          {/* Saved Models */}
          <SectionCard icon={Database} title="Model Tersimpan" color="blue">
            {loading.models ? (
              <div className="flex justify-center py-6"><RefreshCw className="animate-spin text-slate-300" size={24} /></div>
            ) : models.length === 0 ? (
              <p className="text-slate-400 text-xs font-medium text-center py-4">Belum ada model. Latih model terlebih dahulu.</p>
            ) : (
              <div className="space-y-3">
                {models.map((m, i) => (
                  <div key={m.id} className={`p-4 rounded-2xl border ${i === 0 ? 'border-violet-200 bg-violet-50' : 'border-slate-100 bg-slate-50'} flex items-start justify-between gap-2`}>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-800 truncate">{m.nama_model}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">
                        {m.jumlah_data} data · {m.jumlah_kelas} kelas · {m.akurasi != null ? `Akurasi ${m.akurasi}%` : 'N/A'}
                      </p>
                      <p className="text-[10px] text-slate-400">{new Date(m.created_at).toLocaleString('id-ID')}</p>
                    </div>
                    <button onClick={() => handleDelete(m.id)} className="text-rose-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 transition-colors flex-shrink-0">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-8 space-y-5">
          {/* Training Data Preview */}
          {trainingData && (
            <SectionCard
              icon={Table2}
              title="Data Latih (Preview)"
              subtitle={`${trainingData.total} data utama · ${dummyCount} data dummy`}
              color="violet"
              action={
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setModalTab('main');
                    setModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-100 hover:border-violet-200 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-sm"
                >
                  <Table2 size={12} /> Buka Full View
                </button>
              }
            >
              <div className="space-y-8">
                {/* Tabel Data Utama */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      Data Utama (Preview)
                    </h4>
                    <span className="text-[10px] font-black text-slate-400 px-2 py-0.5 bg-slate-100 rounded-full">
                      {trainingData.total} Data Utama
                    </span>
                  </div>
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          {['Nama', 'Status', 'Umur', 'BB', 'TB', 'Z BB/U', 'Z TB/U', 'Z BB/TB', 'Kelas'].map((h, i) => (
                            <th key={i} className="py-2.5 px-3 font-black uppercase tracking-wide text-slate-400 text-[10px]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {trainingData.records.slice(0, 10).map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-3 font-semibold text-slate-700 max-w-[120px] truncate">{r.nama || '—'}</td>
                            <td className="py-2 px-3">
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-blue-50 text-blue-600">
                                {r.status_data}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600">{r.umur_bulan} bln</td>
                            <td className="py-2 px-3 text-slate-600">{r.berat_badan} kg</td>
                            <td className="py-2 px-3 text-slate-600">{r.tinggi_badan} cm</td>
                            <td className="py-2 px-3 font-mono text-[10px] text-slate-500">{r.zscores?.z_bbu ?? '—'}</td>
                            <td className="py-2 px-3 font-mono text-[10px] text-slate-500">{r.zscores?.z_tbu ?? '—'}</td>
                            <td className="py-2 px-3 font-mono text-[10px] text-slate-500">{r.zscores?.z_bbtb ?? '—'}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${classColor(r.kategori_gizi)}`}>
                                {r.kategori_gizi?.split('(')[0].trim() || '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tabel Data Dummy */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                      Data Dummy (Preview)
                    </h4>
                    <span className="text-[10px] font-black text-slate-400 px-2 py-0.5 bg-slate-100 rounded-full">
                      {trainingData.dummyTotal} Data Dummy
                    </span>
                  </div>
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          {['Nama', 'Status', 'Umur', 'BB', 'TB', 'Z BB/U', 'Z TB/U', 'Z BB/TB', 'Kelas'].map((h, i) => (
                            <th key={i} className="py-2.5 px-3 font-black uppercase tracking-wide text-slate-400 text-[10px]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {(trainingData.dummyRecords || []).slice(0, 10).map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-3 font-semibold text-slate-700 max-w-[120px] truncate">{r.nama || '—'}</td>
                            <td className="py-2 px-3">
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-teal-50 text-teal-600">
                                {r.status_data}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600">{r.umur_bulan} bln</td>
                            <td className="py-2 px-3 text-slate-600">{r.berat_badan} kg</td>
                            <td className="py-2 px-3 text-slate-600">{r.tinggi_badan} cm</td>
                            <td className="py-2 px-3 font-mono text-[10px] text-slate-500">{r.zscores?.z_bbu ?? '—'}</td>
                            <td className="py-2 px-3 font-mono text-[10px] text-slate-500">{r.zscores?.z_tbu ?? '—'}</td>
                            <td className="py-2 px-3 font-mono text-[10px] text-slate-500">{r.zscores?.z_bbtb ?? '—'}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${classColor(r.kategori_gizi)}`}>
                                {r.kategori_gizi?.split('(')[0].trim() || '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {(!trainingData.dummyRecords || trainingData.dummyRecords.length === 0) && (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-slate-400 font-bold text-xs">
                              Tidak ada data dummy untuk ditampilkan.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Model Results */}
          {displayModel && (
            <>
              {/* Data source badge */}
              {displayModel.data_source && (
                <div className="flex items-center gap-2 p-3 bg-violet-50 border border-violet-100 rounded-2xl text-xs text-violet-700 font-semibold">
                  <Info size={14} />
                  Model dilatih dari:{' '}
                  <strong>{{ main: 'Data Utama', dummy: 'Data Dummy', both: 'Gabungan' }[displayModel.data_source] || displayModel.data_source}</strong>
                  {displayModel.data_source === 'both' && (
                    <span className="text-violet-500 font-medium">
                      ({displayModel.mainCount} utama + {displayModel.dummyCount} dummy)
                    </span>
                  )}
                  {displayModel.trainCount != null && (
                    <span className="ml-auto text-violet-500 font-medium">
                      {displayModel.trainCount} train / {displayModel.testCount} test (80/20 stratified)
                    </span>
                  )}
                </div>
              )}

              {/* Priors */}
              <SectionCard icon={TrendingUp} title="Probabilitas Prior P(Kelas)" subtitle="Frekuensi tiap kelas dalam data latih" color="emerald">
                <div className="space-y-3">
                  {displayModel.activeClasses.map((cls) => {
                    const count = displayModel.classCounts?.[cls] ?? 0;
                    const prior = displayModel.priors[cls];
                    const pct   = (prior * 100).toFixed(1);
                    return (
                      <div key={cls} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${classColor(cls)}`}>{cls}</span>
                          <div className="text-right">
                            <span className="font-black text-slate-800 text-sm">{pct}%</span>
                            <span className="text-slate-400 text-[10px] ml-2">({count} / {displayModel.trainCount ?? displayModel.totalRecords})</span>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${classColorBar(cls)} transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              {/* Gaussian Parameters */}
              <Collapsible title="Parameter Gaussian P(x | Kelas) — Mean & Standar Deviasi" defaultOpen={true}>
                <p className="text-[10px] text-slate-400 font-medium mb-4 flex items-center gap-1">
                  <Sigma size={10} /> P(x|C) = (1/√(2πσ²)) · exp(−(x−μ)² / (2σ²))
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-3 text-[10px] font-black text-slate-400 uppercase pr-4">Kelas</th>
                        {(displayModel.featureKeys || ['z_bbu', 'z_tbu', 'z_bbtb']).map((fKey) => (
                          <th key={fKey} className="pb-3 text-[10px] font-black text-slate-500 uppercase text-center px-3">
                            {featureLabels[fKey] || fKey}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {displayModel.activeClasses.map((cls) => (
                        <tr key={cls} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 pr-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${classColor(cls)}`}>{cls}</span>
                          </td>
                          {(displayModel.featureKeys || ['z_bbu', 'z_tbu', 'z_bbtb']).map((fKey) => {
                            const params = displayModel.gaussianParams?.[cls]?.[fKey];
                            return (
                              <td key={fKey} className="py-3 text-center">
                                {params ? (
                                  <div>
                                    <div className="font-black text-slate-800 text-xs">μ = {params.mean.toFixed(3)}</div>
                                    <div className="text-[9px] text-slate-400 mt-0.5">σ = {Math.sqrt(params.variance).toFixed(3)}</div>
                                  </div>
                                ) : '—'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-slate-400 mt-3 font-medium">
                  μ = rata-rata fitur per kelas &nbsp;·&nbsp; σ = standar deviasi
                </p>
              </Collapsible>

              {/* Evaluation Metrics */}
              {displayModel.metrics && (
                <SectionCard icon={Target} title="Evaluasi Model" subtitle="Dievaluasi pada test set yang terpisah (20% data)" color="rose">
                  <div className="space-y-6">
                    {/* Accuracy highlight */}
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'Akurasi Test',  value: `${displayModel.accuracy}%`,                       color: 'emerald' },
                        { label: 'Macro Precision', value: `${(displayModel.metrics.macro?.precision * 100).toFixed(1)}%`, color: 'blue'    },
                        { label: 'Macro Recall',    value: `${(displayModel.metrics.macro?.recall * 100).toFixed(1)}%`,    color: 'violet'  },
                        { label: 'Macro F1',        value: `${(displayModel.metrics.macro?.f1 * 100).toFixed(1)}%`,        color: 'amber'   },
                      ].map((s) => (
                        <div key={s.label} className={`p-4 rounded-2xl bg-${s.color}-50 border border-${s.color}-100 text-center`}>
                          <p className={`text-[9px] font-black uppercase tracking-widest text-${s.color}-400 mb-1`}>{s.label}</p>
                          <p className={`text-2xl font-black text-${s.color}-700`}>{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Confusion Matrix */}
                    <Collapsible title="Confusion Matrix" defaultOpen={true}>
                      <ConfusionMatrix matrix={displayModel.metrics.matrix} classes={displayModel.activeClasses} />
                    </Collapsible>

                    {/* Per-class metrics */}
                    <Collapsible title="Precision · Recall · F1 per Kelas" defaultOpen={true}>
                      <MetricsTable
                        perClass={displayModel.metrics.perClass}
                        macro={displayModel.metrics.macro}
                        classes={displayModel.activeClasses}
                      />
                    </Collapsible>
                  </div>
                </SectionCard>
              )}

              {/* Feature Info */}
              <SectionCard icon={Info} title="Fitur yang Digunakan (Z-score WHO)" subtitle="3 fitur numerik turunan dari standar WHO/Kemenkes" color="amber">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { key: 'z_bbu',  label: 'Z-score BB/U', desc: 'Berat Badan per Umur', range: 'Sangat Kurang < -3 ≤ Kurang < -2 ≤ Normal ≤ 1 < Risiko' },
                    { key: 'z_tbu',  label: 'Z-score TB/U', desc: 'Tinggi Badan per Umur', range: 'Sangat Pendek < -3 ≤ Pendek < -2 ≤ Normal ≤ 3 < Tinggi'  },
                    { key: 'z_bbtb', label: 'Z-score BB/TB', desc: 'Berat Badan per Tinggi (indikator utama)', range: 'Buruk < -3 ≤ Kurang < -2 ≤ Baik ≤ 2 < Lebih'   },
                  ].map((f) => (
                    <div key={f.key} className="space-y-2">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{f.label}</p>
                      <p className="text-xs font-bold text-slate-700">{f.desc}</p>
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <span className="text-[10px] text-slate-500 font-mono">{f.range}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </>
          )}

          {!displayModel && !loading.data && (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border border-dashed border-slate-200">
              <Brain size={40} className="text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold text-sm">Latih model untuk melihat parameter dan evaluasi</p>
            </div>
          )}
        </div>
      </div>

      {/* Full Data Preview Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <Table2 className="text-violet-600" size={20} />
                  Semua Data Latih (Debugging View)
                </h3>
                <p className="text-xs text-slate-400 mt-1">Gunakan tab di bawah untuk melihat detail data latih utama dan dummy</p>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-2.5 rounded-full transition-all border border-slate-200 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 flex flex-col flex-grow overflow-hidden">
              {/* Tab & Search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button
                      onClick={() => setModalTab('main')}
                      className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                        modalTab === 'main' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Data Utama ({trainingData?.records?.length || 0})
                    </button>
                    <button
                      onClick={() => setModalTab('dummy')}
                      className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                        modalTab === 'dummy' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Data Dummy ({trainingData?.dummyRecords?.length || 0})
                    </button>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const targetData = modalTab === 'main' ? trainingData?.records : trainingData?.dummyRecords;
                        const filename = `data_latih_${modalTab}_${new Date().toISOString().slice(0, 10)}.csv`;
                        downloadCSV(targetData, filename);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 hover:border-emerald-200 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all shadow-sm"
                    >
                      Unduh CSV
                    </button>
                    <button
                      onClick={() => {
                        const targetData = modalTab === 'main' ? trainingData?.records : trainingData?.dummyRecords;
                        const filename = `data_latih_${modalTab}_${new Date().toISOString().slice(0, 10)}.xls`;
                        downloadExcelXLS(targetData, filename);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 hover:border-blue-200 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all shadow-sm"
                    >
                      Unduh Excel (XLS)
                    </button>
                  </div>
                </div>
                
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-700 w-full md:max-w-xs focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </div>

              {/* Table wrapper */}
              <div className="flex-grow overflow-y-auto border border-slate-100 rounded-2xl custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 z-10">
                    <tr>
                      {['ID', 'Nama', 'JK', 'Umur', 'BB', 'TB', 'Z BB/U', 'Z TB/U', 'Z BB/TB', 'Kelas', 'Status'].map((h, i) => (
                        <th key={i} className="py-3 px-4 font-black uppercase tracking-wide text-slate-500 text-[10px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(modalTab === 'main' ? trainingData?.records : trainingData?.dummyRecords)
                      ?.filter(r => r.nama?.toLowerCase().includes(searchQuery.toLowerCase()))
                      ?.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-400">#{r.id}</td>
                          <td className="py-3 px-4 font-semibold text-slate-700">{r.nama || '—'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                              r.jenis_kelamin === 'P' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {r.jenis_kelamin || 'L'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{r.umur_bulan} bln</td>
                          <td className="py-3 px-4 text-slate-600">{r.berat_badan} kg</td>
                          <td className="py-3 px-4 text-slate-600">{r.tinggi_badan} cm</td>
                          <td className="py-3 px-4 font-mono text-[10px] text-slate-500">{r.zscores?.z_bbu ?? '—'}</td>
                          <td className="py-3 px-4 font-mono text-[10px] text-slate-500">{r.zscores?.z_tbu ?? '—'}</td>
                          <td className="py-3 px-4 font-mono text-[10px] text-slate-500">{r.zscores?.z_bbtb ?? '—'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${classColor(r.kategori_gizi)}`}>
                              {r.kategori_gizi || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                              r.status_data === 'Dummy' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {r.status_data}
                            </span>
                          </td>
                        </tr>
                      ))}
                    {((modalTab === 'main' ? trainingData?.records : trainingData?.dummyRecords)
                      ?.filter(r => r.nama?.toLowerCase().includes(searchQuery.toLowerCase()))?.length === 0) && (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-slate-400 font-bold text-sm">Tidak ada data ditemukan</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NaiveBayesTrain;
