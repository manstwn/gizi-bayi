import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Brain, PlayCircle, Database, RefreshCw, Trash2, CheckCircle2,
  ChevronDown, ChevronUp, AlertTriangle, TrendingUp, Table2, Info,
  FlaskConical, Layers
} from 'lucide-react';

// ─── Colour helpers ─────────────────────────────────────────────────────────
const classColor = (cls) => {
  if (!cls) return 'bg-slate-100 text-slate-600';
  const l = cls.toLowerCase();
  if (l.includes('buruk')) return 'bg-rose-100 text-rose-700';
  if (l.includes('kurang') || l.includes('wasted')) return 'bg-amber-100 text-amber-700';
  if (l.includes('obesitas')) return 'bg-purple-100 text-purple-700';
  if (l.includes('lebih') || l.includes('overweight') || l.includes('berisiko')) return 'bg-orange-100 text-orange-700';
  return 'bg-emerald-100 text-emerald-700';
};

const classColorBar = (cls) => {
  if (!cls) return 'bg-slate-400';
  const l = cls.toLowerCase();
  if (l.includes('buruk')) return 'bg-rose-500';
  if (l.includes('kurang') || l.includes('wasted')) return 'bg-amber-500';
  if (l.includes('obesitas')) return 'bg-purple-500';
  if (l.includes('lebih') || l.includes('overweight') || l.includes('berisiko')) return 'bg-orange-500';
  return 'bg-emerald-500';
};

// ─── Sub-components ─────────────────────────────────────────────────────────

const SectionCard = ({ icon: Icon, title, subtitle, children, color = 'blue' }) => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
      <div className={`p-2 rounded-xl bg-${color}-50`}>
        <Icon size={18} className={`text-${color}-600`} />
      </div>
      <div>
        <h3 className="font-black text-slate-900 text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
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

// ─── Data Source Selector ────────────────────────────────────────────────────

const DATA_SOURCES = [
  {
    key: 'main',
    label: 'Data Utama',
    desc: 'Hanya data pemeriksaan nyata',
    icon: Database,
    color: 'blue',
    bg: 'bg-blue-50 border-blue-200',
    ring: 'ring-blue-500',
    text: 'text-blue-700',
  },
  {
    key: 'dummy',
    label: 'Data Dummy',
    desc: 'Hanya data sintetis/dummy',
    icon: FlaskConical,
    color: 'teal',
    bg: 'bg-teal-50 border-teal-200',
    ring: 'ring-teal-500',
    text: 'text-teal-700',
  },
  {
    key: 'both',
    label: 'Gabungan',
    desc: 'Data utama + data dummy',
    icon: Layers,
    color: 'violet',
    bg: 'bg-violet-50 border-violet-200',
    ring: 'ring-violet-500',
    text: 'text-violet-700',
  },
];

// ─── Main Component ─────────────────────────────────────────────────────────

const NaiveBayesTrain = () => {
  const [trainingData, setTrainingData] = useState(null);
  const [models, setModels] = useState([]);
  const [latestModel, setLatestModel] = useState(null);
  const [loading, setLoading] = useState({ data: false, train: false, models: false });
  const [trainResult, setTrainResult] = useState(null);
  const [error, setError] = useState(null);
  const [modelName, setModelName] = useState('');
  const [dataSource, setDataSource] = useState('main');

  const fetchAll = useCallback(async () => {
    setLoading(l => ({ ...l, data: true, models: true }));
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
      setLoading(l => ({ ...l, data: false, models: false }));
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleTrain = async () => {
    setLoading(l => ({ ...l, train: true }));
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
      setLoading(l => ({ ...l, train: false }));
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

  // Compute available data count for selected source
  const mainCount = trainingData?.total ?? 0;
  const dummyCount = trainingData?.dummyTotal ?? 0;
  const availableCount = dataSource === 'main' ? mainCount : dataSource === 'dummy' ? dummyCount : mainCount + dummyCount;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
          <div className="bg-violet-600 p-2 rounded-2xl shadow-lg shadow-violet-100">
            <Brain className="text-white" size={32} />
          </div>
          Naive Bayes
          <span className="text-xs bg-violet-900 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest">Training</span>
        </h1>
        <p className="text-slate-500 mt-2 text-sm font-semibold max-w-xl">
          Latih model klasifikasi status gizi. Pilih sumber data:{' '}
          <span className="text-violet-600">data utama, dummy, atau keduanya.</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Data Utama', value: mainCount, color: 'blue' },
          { label: 'Data Dummy', value: dummyCount, color: 'teal' },
          { label: 'Model Tersimpan', value: models.length, color: 'violet' },
          { label: 'Akurasi Terbaru', value: models[0]?.akurasi != null ? `${models[0].akurasi}%` : '—', color: 'emerald' },
        ].map(stat => (
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
                onChange={e => setModelName(e.target.value)}
                placeholder={`Model Naive Bayes - ${new Date().toLocaleDateString('id-ID')}`}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent"
              />
            </div>

            {/* Data Source Selector */}
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Sumber Data Pelatihan</label>
              <div className="space-y-2">
                {DATA_SOURCES.map(src => {
                  const count = src.key === 'main' ? mainCount : src.key === 'dummy' ? dummyCount : mainCount + dummyCount;
                  const isSelected = dataSource === src.key;
                  const SrcIcon = src.icon;
                  return (
                    <button
                      key={src.key}
                      onClick={() => setDataSource(src.key)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
                        isSelected
                          ? `${src.bg} ring-2 ${src.ring} ring-offset-1`
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
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

            {/* Data source info */}
            {dataSource === 'both' && (
              <div className="p-3 bg-violet-50 border border-violet-100 rounded-2xl text-[10px] font-semibold text-violet-600">
                Menggunakan {mainCount} data utama + {dummyCount} data dummy = {mainCount + dummyCount} total data latih
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
                  <p className="text-emerald-700 text-xs font-black">Model berhasil dilatih!</p>
                  <p className="text-emerald-600 text-xs mt-1">
                    {trainResult.totalRecords} data
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

        {/* Right: Calculation Display */}
        <div className="lg:col-span-8 space-y-5">
          {/* Training Data Preview */}
          {trainingData && (
            <SectionCard
              icon={Table2}
              title="Data Latih (Tampilan Awal)"
              subtitle={`${trainingData.total} data utama · ${dummyCount} data dummy`}
              color="violet"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Nama', 'Umur', '→', 'BB (kg)', '→', 'TB (cm)', '→', 'Kelas'].map((h, i) => (
                        <th key={i} className={`pb-3 font-black uppercase tracking-wide ${h === '→' ? 'text-slate-300 text-center' : 'text-slate-500 pr-3'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {trainingData.records.slice(0, 10).map(r => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 pr-3 font-semibold text-slate-700 max-w-[80px] truncate">{r.nama || '—'}</td>
                        <td className="py-2 pr-2 text-slate-600">{r.umur_bulan}</td>
                        <td className="py-2 text-slate-300 text-center">→</td>
                        <td className="py-2 pr-2 text-slate-600">{r.berat_badan}</td>
                        <td className="py-2 text-slate-300 text-center">→</td>
                        <td className="py-2 pr-2 text-slate-600">{r.tinggi_badan}</td>
                        <td className="py-2 text-slate-300 text-center">→</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${classColor(r.kategori_gizi)}`}>
                            {r.kategori_gizi?.split('(')[0].trim() || '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {trainingData.records.length > 10 && (
                  <p className="text-[10px] text-slate-400 font-medium mt-3 text-center">
                    ... dan {trainingData.total - 10} rekaman lainnya
                  </p>
                )}
              </div>
            </SectionCard>
          )}

          {/* Model Calculation Tables */}
          {displayModel && (
            <>
              {/* Data source info badge */}
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
                </div>
              )}

              {/* Priors */}
              <SectionCard icon={TrendingUp} title="Probabilitas Prior P(Kelas)" subtitle="Frekuensi tiap kelas dalam data latih" color="emerald">
                <div className="space-y-3">
                  {displayModel.activeClasses.map(cls => {
                    const count = displayModel.classCounts?.[cls] ?? 0;
                    const prior = displayModel.priors[cls];
                    const pct = (prior * 100).toFixed(1);
                    return (
                      <div key={cls} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${classColor(cls)}`}>
                            {cls.split('(')[0].trim()}
                          </span>
                          <div className="text-right">
                            <span className="font-black text-slate-800 text-sm">{pct}%</span>
                            <span className="text-slate-400 text-[10px] ml-2">({count} / {displayModel.totalRecords})</span>
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

              {/* Likelihood Tables */}
              {['umur_bulan', 'berat_badan', 'tinggi_badan'].map(fKey => {
                const featureLabel = { umur_bulan: 'Umur Bulan', berat_badan: 'Berat Badan', tinggi_badan: 'Tinggi Badan' }[fKey];
                const bins = Object.keys(displayModel.likelihoods[displayModel.activeClasses[0]]?.[fKey] ?? {});
                return (
                  <Collapsible key={fKey} title={`P(${featureLabel} | Kelas) — Likelihood dengan Laplace Smoothing`} defaultOpen={fKey === 'umur_bulan'}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="pb-3 text-[10px] font-black text-slate-400 uppercase pr-4">Kelas</th>
                            {bins.map(b => (
                              <th key={b} className="pb-3 text-[10px] font-black text-slate-500 uppercase text-center px-2">{b}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {displayModel.activeClasses.map(cls => (
                            <tr key={cls} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 pr-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${classColor(cls)}`}>
                                  {cls.split('(')[0].trim()}
                                </span>
                              </td>
                              {bins.map(b => {
                                const entry = displayModel.likelihoods[cls]?.[fKey]?.[b];
                                return (
                                  <td key={b} className="py-3 text-center">
                                    <div className="font-black text-slate-800 text-xs">{entry ? entry.probability.toFixed(4) : '—'}</div>
                                    {entry && <div className="text-[9px] text-slate-400 mt-0.5">{entry.smoothed_numerator}/{entry.smoothed_denominator}</div>}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3 font-medium flex items-center gap-1">
                      <Info size={10} /> P(x|C) = (count + 1) / (|C| + jumlah_bin) — Laplace smoothing
                    </p>
                  </Collapsible>
                );
              })}

              {/* Binning Guide */}
              <SectionCard icon={Info} title="Panduan Diskretisasi Fitur" subtitle="Aturan binning yang digunakan" color="amber">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Umur Bulan', bins: [['bayi', '0–11 bln'], ['batita', '12–35 bln'], ['balita', '36–60 bln']] },
                    { label: 'Berat Badan', bins: [['sangat_kurang', '<7 kg'], ['kurang', '7–9 kg'], ['normal', '9–16 kg'], ['lebih', '>16 kg']] },
                    { label: 'Tinggi Badan', bins: [['sangat_pendek', '<65 cm'], ['pendek', '65–75 cm'], ['normal', '75–100 cm'], ['tinggi', '>100 cm']] },
                  ].map(f => (
                    <div key={f.label} className="space-y-2">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{f.label}</p>
                      {f.bins.map(([lbl, range]) => (
                        <div key={lbl} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                          <span className="text-[10px] font-bold text-slate-600 font-mono">{lbl}</span>
                          <span className="text-[10px] text-slate-400">{range}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </SectionCard>
            </>
          )}

          {!displayModel && !loading.data && (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border border-dashed border-slate-200">
              <Brain size={40} className="text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold text-sm">Latih model untuk melihat tabel probabilitas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NaiveBayesTrain;
