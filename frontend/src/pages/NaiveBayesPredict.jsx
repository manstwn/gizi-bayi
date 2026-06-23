import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Sparkles, Brain, RefreshCw, AlertTriangle, ChevronRight,
  BarChart3, Activity, Info, CheckCircle2, Database, ChevronDown, Sigma
} from 'lucide-react';

// ─── Colour helpers ──────────────────────────────────────────────────────────
const classColor = (cls) => {
  if (!cls) return { bg: 'bg-slate-100', text: 'text-slate-600', bar: 'bg-slate-400', glow: '' };
  const l = cls.toLowerCase();
  if (l.includes('buruk'))  return { bg: 'bg-rose-50',    text: 'text-rose-700',    bar: 'bg-rose-500',    glow: 'shadow-rose-200'    };
  if (l.includes('kurang')) return { bg: 'bg-amber-50',   text: 'text-amber-700',   bar: 'bg-amber-500',   glow: 'shadow-amber-200'   };
  if (l.includes('lebih'))  return { bg: 'bg-orange-50',  text: 'text-orange-700',  bar: 'bg-orange-500',  glow: 'shadow-orange-200'  };
  return                           { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500', glow: 'shadow-emerald-200' };
};

const NUTRITIONAL_INTERPRETATION = {
  'Gizi Buruk':  { emoji: '🔴', desc: 'Berat badan sangat kurang. Perlu tindakan segera dan penanganan medis.', action: 'Rujuk ke tenaga kesehatan segera.' },
  'Gizi Kurang': { emoji: '🟡', desc: 'Berat badan di bawah normal. Perlu peningkatan asupan gizi.', action: 'Konsultasikan dengan petugas gizi untuk perbaikan pola makan.' },
  'Gizi Baik':   { emoji: '🟢', desc: 'Berat badan dan tinggi badan sesuai standar WHO.', action: 'Pertahankan pola makan dan tumbuh kembang yang baik.' },
  'Gizi Lebih':  { emoji: '🟠', desc: 'Berat badan melebihi standar untuk tinggi badan.', action: 'Perhatikan pola makan dan aktivitas fisik anak.' },
};

// ─── Slider input ────────────────────────────────────────────────────────────
const SliderInput = ({ label, unit, value, min, max, step, onChange }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-end">
      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black text-slate-900 leading-none">
          {typeof value === 'number' && step < 1 ? value.toFixed(1) : value}
        </span>
        <span className="text-xs text-slate-400 font-bold">{unit}</span>
      </div>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
      className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-violet-500"
    />
    <div className="flex justify-between text-[9px] font-bold text-slate-300 uppercase">
      <span>{min} {unit}</span>
      <span>{max} {unit}</span>
    </div>
  </div>
);

// ─── Model Picker ─────────────────────────────────────────────────────────────
const ModelPicker = ({ models, selectedId, onSelect }) => {
  const [open, setOpen] = useState(false);
  const selected = models.find((m) => m.id === selectedId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 bg-white border-2 border-indigo-200 rounded-2xl hover:border-indigo-400 transition-colors text-left"
      >
        <Database size={16} className="text-indigo-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {selected ? (
            <>
              <p className="font-black text-sm text-indigo-900 truncate">{selected.nama_model}</p>
              <p className="text-[10px] text-indigo-400 font-medium mt-0.5">
                {selected.jumlah_data} data
                {selected.akurasi != null ? ` · Akurasi ${selected.akurasi}%` : ''}
                {' · '}{new Date(selected.created_at).toLocaleDateString('id-ID')}
              </p>
            </>
          ) : (
            <p className="font-bold text-sm text-slate-400">Pilih model...</p>
          )}
        </div>
        <ChevronDown size={16} className={`text-indigo-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/60 overflow-hidden max-h-72 overflow-y-auto">
            {models.map((m, i) => {
              const isSel = m.id === selectedId;
              return (
                <button
                  key={m.id}
                  onClick={() => { onSelect(m.id); setOpen(false); }}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b border-slate-50 last:border-0
                    ${isSel ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${isSel ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                  <div className="min-w-0">
                    <p className={`font-black text-sm truncate ${isSel ? 'text-indigo-800' : 'text-slate-800'}`}>
                      {i === 0 && <span className="text-[9px] font-black text-indigo-500 bg-indigo-100 px-1.5 py-0.5 rounded-full mr-2 uppercase">Terbaru</span>}
                      {m.nama_model}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {m.jumlah_data} data latih
                      {m.akurasi != null ? ` · Akurasi ${m.akurasi}%` : ''}
                      {' · '}{new Date(m.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                  {isSel && <CheckCircle2 size={14} className="text-indigo-500 flex-shrink-0 mt-0.5 ml-auto" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Z-score step row ─────────────────────────────────────────────────────────
const FormulaRow = ({ cls, step, isPredicted }) => {
  const colors = classColor(cls);
  const fmtProb = (p) => {
    if (p == null) return '—';
    return p < 1e-6 ? p.toExponential(3) : p.toFixed(6);
  };
  const featureShort = {
    z_bbu:  'BB/U',
    z_tbu:  'TB/U',
    z_bbtb: 'BB/TB',
  };

  return (
    <div className={`rounded-2xl border p-4 ${isPredicted ? `${colors.bg} border-current ${colors.text} shadow-lg ${colors.glow}` : 'bg-slate-50 border-slate-100'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`font-black text-sm ${isPredicted ? colors.text : 'text-slate-700'}`}>
          {cls}
          {isPredicted && <span className="ml-2 text-[10px] bg-current/10 px-2 py-0.5 rounded-full font-black uppercase">✓ Prediksi</span>}
        </span>
        <span className={`text-[10px] font-black ${isPredicted ? colors.text : 'text-slate-400'}`}>
          log P = {step.logScore.toFixed(4)}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Prior */}
        <div className="bg-white/80 border border-slate-200 rounded-xl px-3 py-1.5 text-center">
          <p className="text-[9px] text-slate-400 font-bold uppercase">Prior P(C)</p>
          <p className="font-black text-slate-700">{fmtProb(step.prior)}</p>
        </div>

        {Object.entries(step.featureProbs || {}).map(([fKey, fp]) => (
          <React.Fragment key={fKey}>
            <ChevronRight size={12} className="text-slate-300 flex-shrink-0" />
            <div className="bg-white/80 border border-slate-200 rounded-xl px-3 py-1.5 text-center">
              <p className="text-[9px] text-slate-400 font-bold uppercase">Z {featureShort[fKey] || fKey}</p>
              <p className="font-mono text-[9px] text-slate-500 mb-0.5">x={fp.value?.toFixed(2)} μ={fp.mean?.toFixed(2)} σ={fp.stddev?.toFixed(2)}</p>
              <p className="font-black text-slate-700">{fmtProb(fp.probability)}</p>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const NaiveBayesPredict = () => {
  const [inputs, setInputs] = useState({ umur_bulan: 15, berat_badan: 10.0, tinggi_badan: 79 });
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const [models, setModels]               = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [modelsLoading, setModelsLoading] = useState(true);

  useEffect(() => {
    setModelsLoading(true);
    api.get('/naive-bayes/models')
      .then((res) => {
        setModels(res.data);
        if (res.data.length > 0) setSelectedModelId(res.data[0].id);
      })
      .catch(() => {})
      .finally(() => setModelsLoading(false));
  }, []);

  const selectedModel = models.find((m) => m.id === selectedModelId);
  const hasModel = models.length > 0;

  const handlePredict = useCallback(async () => {
    if (!selectedModelId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/naive-bayes/predict', { ...inputs, model_id: selectedModelId });
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal melakukan prediksi.');
    } finally {
      setLoading(false);
    }
  }, [inputs, selectedModelId]);

  useEffect(() => {
    if (!hasModel || !selectedModelId) return;
    const timer = setTimeout(handlePredict, 400);
    return () => clearTimeout(timer);
  }, [inputs, selectedModelId, hasModel, handlePredict]);

  const colors = result ? classColor(result.predicted_class) : null;
  const interp = result ? NUTRITIONAL_INTERPRETATION[result.predicted_class] : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
          <div className="bg-indigo-600 p-2 rounded-2xl shadow-lg shadow-indigo-100">
            <Sparkles className="text-white" size={32} />
          </div>
          Gaussian Naive Bayes
          <span className="text-xs bg-indigo-900 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest">Prediksi</span>
        </h1>
        <p className="text-slate-500 mt-2 text-sm font-semibold max-w-xl">
          Klasifikasi status gizi balita menggunakan{' '}
          <span className="text-indigo-600">Z-score BB/U, TB/U, BB/TB</span>.
          Langkah perhitungan Gaussian PDF ditampilkan lengkap.
        </p>
      </div>

      {/* No model warning */}
      {!modelsLoading && !hasModel && (
        <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-200 rounded-3xl">
          <AlertTriangle size={22} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-black text-amber-800">Belum ada model tersimpan!</p>
            <p className="text-sm text-amber-600 mt-1">
              Pergi ke halaman <strong>Naive Bayes — Training</strong> untuk melatih model terlebih dahulu.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input + Model Picker */}
        <div className="lg:col-span-4 space-y-5">

          {/* Model selector */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/40 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
            <h3 className="font-black text-slate-900 flex items-center gap-2 text-sm">
              <Database size={16} className="text-indigo-600" /> Pilih Model
            </h3>
            {modelsLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold py-2">
                <RefreshCw size={14} className="animate-spin" /> Memuat daftar model...
              </div>
            ) : hasModel ? (
              <>
                <ModelPicker models={models} selectedId={selectedModelId} onSelect={(id) => { setSelectedModelId(id); setResult(null); }} />
                {selectedModel && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Data Latih', value: selectedModel.jumlah_data },
                      { label: 'Kelas',      value: selectedModel.jumlah_kelas },
                      { label: 'Akurasi',    value: selectedModel.akurasi != null ? `${selectedModel.akurasi}%` : '—' },
                      { label: 'Tanggal',    value: new Date(selectedModel.created_at).toLocaleDateString('id-ID') },
                    ].map((s) => (
                      <div key={s.label} className="bg-slate-50 rounded-2xl p-3 text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                        <p className="font-black text-slate-800 text-sm mt-0.5">{s.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Input sliders */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h3 className="font-black text-slate-900 flex items-center gap-2 text-sm">
              <Activity size={16} className="text-indigo-600" /> Input Pengukuran
            </h3>
            <SliderInput label="Umur" unit="bulan" value={inputs.umur_bulan} min={0} max={60} step={1}
              onChange={(v) => setInputs((p) => ({ ...p, umur_bulan: v }))} />
            <SliderInput label="Berat Badan" unit="kg" value={inputs.berat_badan} min={2} max={30} step={0.1}
              onChange={(v) => setInputs((p) => ({ ...p, berat_badan: v }))} />
            <SliderInput label="Tinggi Badan" unit="cm" value={inputs.tinggi_badan} min={40} max={130} step={0.5}
              onChange={(v) => setInputs((p) => ({ ...p, tinggi_badan: v }))} />
            {loading && (
              <div className="flex items-center gap-2 text-indigo-500 text-xs font-bold">
                <RefreshCw size={14} className="animate-spin" /> Menghitung...
              </div>
            )}
          </div>

          {/* Z-scores panel */}
          {result?.zscores && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-black text-sm text-slate-700 mb-4 flex items-center gap-2">
                <Sigma size={15} className="text-indigo-500" /> Z-score Input (WHO)
              </h3>
              <div className="space-y-2">
                {[
                  ['BB/U',  result.zscores.z_bbu,  'Berat Badan per Umur'],
                  ['TB/U',  result.zscores.z_tbu,  'Tinggi Badan per Umur'],
                  ['BB/TB', result.zscores.z_bbtb, 'BB per Tinggi (primer)'],
                ].map(([label, val, desc]) => {
                  const v = parseFloat(val);
                  const color = isNaN(v) ? 'text-slate-400' : v < -3 ? 'text-rose-600' : v < -2 ? 'text-amber-600' : v > 2 ? 'text-orange-600' : 'text-emerald-600';
                  return (
                    <div key={label} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                      <div>
                        <span className="text-xs font-black text-slate-700">{label}</span>
                        <span className="text-[10px] text-slate-400 ml-2">{desc}</span>
                      </div>
                      <span className={`text-sm font-black font-mono ${color}`}>
                        {isNaN(v) ? '—' : v > 0 ? `+${v.toFixed(3)}` : v.toFixed(3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-8 space-y-5">
          {error && (
            <div className="flex items-start gap-3 p-5 bg-rose-50 border border-rose-200 rounded-3xl">
              <AlertTriangle size={20} className="text-rose-500 mt-0.5 flex-shrink-0" />
              <p className="text-rose-700 text-sm font-semibold">{error}</p>
            </div>
          )}

          {result && (
            <>
              {/* Result Card */}
              <div className={`rounded-3xl p-6 border-2 ${colors.bg} shadow-xl ${colors.glow}`}>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Hasil Prediksi</p>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className={`text-3xl font-black ${colors.text} leading-tight`}>
                      {interp?.emoji} {result.predicted_class}
                    </h2>
                    <p className={`text-lg font-black mt-1 ${colors.text} opacity-70`}>
                      Confidence: {result.confidence?.toFixed(2)}%
                    </p>
                  </div>
                  {result.model_name && (
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                      <Database size={10} /> {result.model_name}
                    </p>
                  )}
                </div>
                {interp && (
                  <div className={`mt-4 p-4 bg-white/60 rounded-2xl border border-current/10`}>
                    <p className={`text-xs font-bold ${colors.text} mb-1`}>{interp.desc}</p>
                    <p className={`text-[11px] font-black ${colors.text} opacity-80`}>💡 {interp.action}</p>
                  </div>
                )}
              </div>

              {/* WHO Assessment Comparison */}
              {result.who_assessment && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <h3 className="font-black text-sm text-slate-700 mb-4 flex items-center gap-2">
                    <Info size={16} className="text-slate-400" /> Perbandingan: NB vs WHO Langsung
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-indigo-50 rounded-2xl">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Prediksi Naive Bayes</p>
                      <p className="font-black text-indigo-800 text-sm">{result.predicted_class}</p>
                      <p className="text-[10px] text-indigo-400 mt-1">Confidence: {result.confidence?.toFixed(1)}%</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">WHO Z-score Langsung</p>
                      <p className="font-black text-slate-800 text-sm">{result.who_assessment?.summary?.status}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Berdasarkan Z BB/TB</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Probability Bar Chart */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-black text-sm text-slate-700 mb-5 flex items-center gap-2">
                  <BarChart3 size={16} className="text-indigo-500" /> Probabilitas per Kelas (%)
                </h3>
                <div className="space-y-4">
                  {Object.entries(result.probabilities)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cls, prob]) => {
                      const c = classColor(cls);
                      const isPred = cls === result.predicted_class;
                      return (
                        <div key={cls} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>{cls}</span>
                            <span className={`font-black text-sm ${isPred ? c.text : 'text-slate-500'}`}>{prob.toFixed(2)}%</span>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${c.bar} transition-all duration-700`}
                              style={{ width: `${Math.min(prob, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Step-by-step Gaussian calculation */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-black text-sm text-slate-700 mb-2 flex items-center gap-2">
                  <Brain size={16} className="text-violet-500" /> Langkah Perhitungan Gaussian Naive Bayes
                </h3>
                <p className="text-[10px] text-slate-400 font-medium mb-5">
                  log P(C|X) ∝ log P(C) + Σ log P(z_i | C) &nbsp;·&nbsp; P(x|μ,σ) = (1/√2πσ²) · exp(−(x−μ)²/2σ²)
                </p>
                <div className="space-y-3">
                  {result.steps.map((step) => (
                    <FormulaRow
                      key={step.class}
                      cls={step.class}
                      step={step}
                      isPredicted={step.class === result.predicted_class}
                    />
                  ))}
                </div>
                <div className="mt-5 p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Formula</p>
                  <p className="font-mono text-xs text-slate-600">argmax_C [ log P(C) + Σ log P(z_i | C) ]</p>
                  <p className="text-[10px] text-slate-400 mt-2">P(z|C) = Gaussian PDF dengan mean & variance per kelas</p>
                </div>
              </div>
            </>
          )}

          {!result && !error && hasModel && (
            <div className="flex flex-col items-center justify-center h-72 bg-white rounded-3xl border border-dashed border-slate-200">
              <Sparkles size={40} className="text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold text-sm">Sesuaikan input untuk melihat prediksi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NaiveBayesPredict;
