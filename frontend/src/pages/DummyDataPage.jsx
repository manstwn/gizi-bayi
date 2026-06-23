import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  FlaskConical, Zap, Trash2, Upload, RefreshCw, CheckSquare,
  Square, AlertTriangle, CheckCircle2, X, ChevronDown, BarChart3,
  FileText, PlusCircle, Info
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const CLASSES = [
  { key: 'Gizi Buruk (Severely Wasted)', color: 'bg-rose-100 text-rose-700', bar: 'bg-rose-500' },
  { key: 'Gizi Kurang (Wasted)', color: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' },
  { key: 'Gizi Baik (Normal)', color: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' },
  { key: 'Berisiko Gizi Lebih', color: 'bg-orange-100 text-orange-700', bar: 'bg-orange-500' },
  { key: 'Gizi Lebih (Overweight)', color: 'bg-yellow-100 text-yellow-700', bar: 'bg-yellow-500' },
  { key: 'Obesitas', color: 'bg-purple-100 text-purple-700', bar: 'bg-purple-500' },
];

const classStyle = (cls) => CLASSES.find(c => c.key === cls) || { color: 'bg-slate-100 text-slate-600', bar: 'bg-slate-400' };

// Template JSON untuk import
const IMPORT_TEMPLATE = `[
  {"umur_bulan": 12, "berat_badan": 7.5, "tinggi_badan": 71.5, "kategori_gizi": "Gizi Kurang (Wasted)"},
  {"umur_bulan": 24, "berat_badan": 11.0, "tinggi_badan": 85.0, "kategori_gizi": "Gizi Baik (Normal)"},
  {"umur_bulan": 6, "berat_badan": 4.5, "tinggi_badan": 62.0, "kategori_gizi": "Gizi Buruk (Severely Wasted)"}
]`;

// ─── Sub-components ──────────────────────────────────────────────────────────

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold
    ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}
    animate-in slide-in-from-bottom-4 duration-300`}>
    {type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
    <span>{msg}</span>
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={16} /></button>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const DummyDataPage = () => {
  const [data, setData] = useState({ records: [], total: 0, classCounts: {}, batchCounts: {} });
  const [loading, setLoading] = useState({ fetch: false, gen: false, del: false, import: false });
  const [selected, setSelected] = useState(new Set());
  const [toast, setToast] = useState(null);

  // Generate panel
  const [genCount, setGenCount] = useState(50);
  const [useCustomDist, setUseCustomDist] = useState(false);
  const [customDist, setCustomDist] = useState({
    'Gizi Buruk (Severely Wasted)': 10,
    'Gizi Kurang (Wasted)': 20,
    'Gizi Baik (Normal)': 40,
    'Berisiko Gizi Lebih': 10,
    'Gizi Lebih (Overweight)': 10,
    'Obesitas': 10,
  });
  const [batchLabel, setBatchLabel] = useState('');

  // Import panel
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importBatch, setImportBatch] = useState('');
  const [importErrors, setImportErrors] = useState([]);

  // Filter
  const [filterBatch, setFilterBatch] = useState('');
  const [filterClass, setFilterClass] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(l => ({ ...l, fetch: true }));
    try {
      const res = await api.get('/dummy-data?limit=1000');
      setData(res.data);
    } catch {
      showToast('Gagal memuat data.', 'error');
    } finally {
      setLoading(l => ({ ...l, fetch: false }));
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Generate ────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setLoading(l => ({ ...l, gen: true }));
    try {
      const payload = {
        jumlah: genCount,
        batch_label: batchLabel || undefined,
        distribusi: useCustomDist ? customDist : null,
      };
      const res = await api.post('/dummy-data/generate', payload);
      showToast(res.data.message);
      await fetchData();
    } catch (e) {
      showToast(e.response?.data?.message || 'Gagal generate.', 'error');
    } finally {
      setLoading(l => ({ ...l, gen: false }));
    }
  };

  // ── Import ──────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    setImportErrors([]);
    let parsed;
    try {
      parsed = JSON.parse(importText);
    } catch {
      setImportErrors(['JSON tidak valid. Periksa format input Anda.']);
      return;
    }
    setLoading(l => ({ ...l, import: true }));
    try {
      const res = await api.post('/dummy-data/import', { records: parsed, batch_label: importBatch || undefined });
      showToast(res.data.message);
      if (res.data.errors?.length) setImportErrors(res.data.errors);
      setImportText('');
      setShowImport(false);
      await fetchData();
    } catch (e) {
      showToast(e.response?.data?.message || 'Gagal import.', 'error');
    } finally {
      setLoading(l => ({ ...l, import: false }));
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Hapus ${selected.size} data yang dipilih?`)) return;
    setLoading(l => ({ ...l, del: true }));
    try {
      const res = await api.delete('/dummy-data/selected', { data: { ids: [...selected] } });
      showToast(res.data.message);
      setSelected(new Set());
      await fetchData();
    } catch {
      showToast('Gagal menghapus data.', 'error');
    } finally {
      setLoading(l => ({ ...l, del: false }));
    }
  };

  const handleDeleteBatch = async (batch) => {
    if (!confirm(`Hapus semua data dari batch "${batch}"?`)) return;
    setLoading(l => ({ ...l, del: true }));
    try {
      const res = await api.delete('/dummy-data/batch', { data: { batch_label: batch } });
      showToast(res.data.message);
      setSelected(s => { const ns = new Set(s); return ns; });
      await fetchData();
    } catch {
      showToast('Gagal menghapus batch.', 'error');
    } finally {
      setLoading(l => ({ ...l, del: false }));
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`HAPUS SEMUA ${data.total} data dummy? Tindakan ini tidak dapat dibatalkan.`)) return;
    setLoading(l => ({ ...l, del: true }));
    try {
      const res = await api.delete('/dummy-data/all');
      showToast(res.data.message);
      setSelected(new Set());
      await fetchData();
    } catch {
      showToast('Gagal menghapus semua data.', 'error');
    } finally {
      setLoading(l => ({ ...l, del: false }));
    }
  };

  // ── Selection ───────────────────────────────────────────────────────────────
  const filteredRecords = data.records.filter(r => {
    if (filterBatch && r.label !== filterBatch) return false;
    if (filterClass && r.kategori_gizi !== filterClass) return false;
    return true;
  });

  const toggleAll = () => {
    if (selected.size === filteredRecords.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredRecords.map(r => r.id)));
    }
  };

  const toggleOne = (id) => {
    const ns = new Set(selected);
    ns.has(id) ? ns.delete(id) : ns.add(id);
    setSelected(ns);
  };

  const customDistTotal = Object.values(customDist).reduce((a, b) => a + parseInt(b || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 pb-12">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="bg-teal-600 p-2 rounded-2xl shadow-lg shadow-teal-100">
              <FlaskConical className="text-white" size={32} />
            </div>
            Data Dummy
            <span className="text-xs bg-teal-900 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest">{data.total} record</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-semibold max-w-xl">
            Kelola data dummy untuk pelatihan model Naive Bayes. Generate otomatis, import JSON, atau hapus secara bulk.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {CLASSES.map(cls => {
          const count = data.classCounts?.[cls.key] ?? 0;
          const pct = data.total > 0 ? ((count / data.total) * 100).toFixed(0) : 0;
          return (
            <div key={cls.key} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <p className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full inline-block mb-2 ${cls.color}`}>
                {cls.key.split('(')[0].trim()}
              </p>
              <p className="text-2xl font-black text-slate-800">{count}</p>
              <div className="h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${cls.bar}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-4 space-y-5">

          {/* Generate Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 p-6 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-teal-50/50 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
            <h3 className="font-black text-slate-900 flex items-center gap-2">
              <Zap size={18} className="text-teal-600" /> Generate Otomatis
            </h3>

            {/* Batch label */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Nama Batch (opsional)</label>
              <input
                type="text"
                value={batchLabel}
                onChange={e => setBatchLabel(e.target.value)}
                placeholder="Misal: Batch Uji Coba 1"
                className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </div>

            {/* Toggle distribution mode */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-600">Distribusi Kustom</span>
              <button
                onClick={() => setUseCustomDist(!useCustomDist)}
                className={`relative w-12 h-6 rounded-full transition-colors ${useCustomDist ? 'bg-teal-500' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${useCustomDist ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {useCustomDist ? (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumlah per kelas</p>
                {CLASSES.map(cls => (
                  <div key={cls.key} className="flex items-center gap-3">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full flex-1 truncate ${cls.color}`}>
                      {cls.key.split('(')[0].trim()}
                    </span>
                    <input
                      type="number" min="0" max="500"
                      value={customDist[cls.key]}
                      onChange={e => setCustomDist(d => ({ ...d, [cls.key]: parseInt(e.target.value) || 0 }))}
                      className="w-20 border border-slate-200 rounded-xl px-2 py-1.5 text-sm font-black text-center focus:outline-none focus:ring-2 focus:ring-teal-300"
                    />
                  </div>
                ))}
                <p className="text-[10px] text-teal-600 font-black text-right">Total: {customDistTotal} data</p>
              </div>
            ) : (
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumlah Data</label>
                  <span className="font-black text-slate-800 text-lg">{genCount}</span>
                </div>
                <input
                  type="range" min="10" max="500" step="10" value={genCount}
                  onChange={e => setGenCount(parseInt(e.target.value))}
                  className="w-full accent-teal-500"
                />
                <div className="flex justify-between text-[9px] text-slate-300 font-bold mt-1">
                  <span>10</span><span>500</span>
                </div>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading.gen}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-teal-100 flex items-center justify-center gap-2"
            >
              {loading.gen ? <><RefreshCw size={16} className="animate-spin" /> Generating...</> : <><Zap size={16} /> Generate {useCustomDist ? customDistTotal : genCount} Data</>}
            </button>
          </div>

          {/* Import JSON Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <button
              onClick={() => setShowImport(!showImport)}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="font-black text-slate-900 flex items-center gap-2">
                <Upload size={18} className="text-indigo-500" /> Import JSON
              </h3>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${showImport ? 'rotate-180' : ''}`} />
            </button>

            {showImport && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Nama Batch</label>
                  <input
                    type="text"
                    value={importBatch}
                    onChange={e => setImportBatch(e.target.value)}
                    placeholder="Import Manual 1"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">JSON Array</label>
                  <textarea
                    value={importText}
                    onChange={e => setImportText(e.target.value)}
                    rows={8}
                    placeholder={IMPORT_TEMPLATE}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Info size={10} /> Field yang diperlukan</p>
                  <p className="font-mono text-[10px] text-slate-600">umur_bulan, berat_badan, tinggi_badan, kategori_gizi</p>
                  <p className="text-[10px] text-slate-400 mt-1">Alternatif field: umur, bb, tb, kelas, label_kelas</p>
                </div>

                {importErrors.length > 0 && (
                  <div className="space-y-1">
                    {importErrors.map((e, i) => (
                      <p key={i} className="text-[10px] text-rose-600 font-medium">{e}</p>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleImport}
                  disabled={loading.import || !importText.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  {loading.import ? <><RefreshCw size={14} className="animate-spin" /> Importing...</> : <><PlusCircle size={14} /> Import Data</>}
                </button>
              </div>
            )}
          </div>

          {/* Batch Manager */}
          {Object.keys(data.batchCounts || {}).length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3">
              <h3 className="font-black text-sm text-slate-700 flex items-center gap-2">
                <FileText size={16} className="text-slate-400" /> Kelola Batch
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(data.batchCounts).map(([batch, count]) => (
                  <div key={batch} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-700 truncate">{batch}</p>
                      <p className="text-[10px] text-slate-400">{count} record</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setFilterBatch(filterBatch === batch ? '' : batch)}
                        className={`text-[10px] font-black px-2 py-1 rounded-full transition-colors ${filterBatch === batch ? 'bg-teal-100 text-teal-700' : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-600'}`}
                      >
                        Filter
                      </button>
                      <button
                        onClick={() => handleDeleteBatch(batch)}
                        className="text-rose-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Data Table */}
        <div className="lg:col-span-8 space-y-4">
          {/* Table Toolbar */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
            {/* Filter by class */}
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
            >
              <option value="">Semua Kelas</option>
              {CLASSES.map(c => <option key={c.key} value={c.key}>{c.key.split('(')[0].trim()}</option>)}
            </select>

            {filterBatch && (
              <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-3 py-1.5">
                <span className="text-[10px] font-black text-teal-700 max-w-[150px] truncate">{filterBatch}</span>
                <button onClick={() => setFilterBatch('')} className="text-teal-500 hover:text-teal-700">
                  <X size={12} />
                </button>
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              {selected.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={loading.del}
                  className="flex items-center gap-2 px-3 py-2 bg-rose-600 text-white text-xs font-black rounded-xl hover:bg-rose-700 transition-colors"
                >
                  <Trash2 size={13} /> Hapus {selected.size}
                </button>
              )}
              <button
                onClick={handleDeleteAll}
                disabled={loading.del || data.total === 0}
                className="flex items-center gap-2 px-3 py-2 bg-rose-50 text-rose-600 text-xs font-black rounded-xl hover:bg-rose-100 transition-colors disabled:opacity-40"
              >
                <Trash2 size={13} /> Hapus Semua
              </button>
              <button
                onClick={fetchData}
                disabled={loading.fetch}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <RefreshCw size={15} className={loading.fetch ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 w-10">
                      <button onClick={toggleAll} className="text-slate-400 hover:text-slate-700 transition-colors">
                        {selected.size === filteredRecords.length && filteredRecords.length > 0
                          ? <CheckSquare size={16} className="text-teal-600" />
                          : <Square size={16} />}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Umur</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">BB (kg)</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">TB (cm)</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading.fetch ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16">
                        <RefreshCw className="animate-spin text-slate-300 mx-auto" size={24} />
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16">
                        <FlaskConical size={40} className="text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 font-bold text-sm">Belum ada data dummy.</p>
                        <p className="text-slate-300 text-xs mt-1">Generate atau import data untuk memulai.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r, i) => {
                      const style = classStyle(r.kategori_gizi);
                      const isSel = selected.has(r.id);
                      return (
                        <tr
                          key={r.id}
                          onClick={() => toggleOne(r.id)}
                          className={`cursor-pointer transition-colors hover:bg-slate-50 ${isSel ? 'bg-teal-50' : ''}`}
                        >
                          <td className="px-4 py-3">
                            {isSel
                              ? <CheckSquare size={16} className="text-teal-600" />
                              : <Square size={16} className="text-slate-300" />}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400 font-medium">{i + 1}</td>
                          <td className="px-4 py-3 text-sm font-bold text-slate-700">{r.umur_bulan} bln</td>
                          <td className="px-4 py-3 text-sm font-bold text-slate-700">{r.berat_badan}</td>
                          <td className="px-4 py-3 text-sm font-bold text-slate-700">{r.tinggi_badan}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${style.color}`}>
                              {r.kategori_gizi?.split('(')[0].trim()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[10px] text-slate-400 font-medium max-w-[120px] truncate">
                            {r.label}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {filteredRecords.length > 0 && (
              <div className="px-6 py-3 border-t border-slate-50 text-[10px] text-slate-400 font-medium flex justify-between">
                <span>{filteredRecords.length} record ditampilkan · {selected.size} dipilih</span>
                <span>Klik baris untuk memilih · Klik kolom header checkbox untuk pilih semua</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DummyDataPage;
