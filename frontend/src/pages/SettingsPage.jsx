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

  useEffect(() => {
    fetchPairData();
  }, []);

  const fetchPairData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/pairs');
      setPairData(res.data);
    } catch (error) {
      console.error('Error fetching pair data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-medical-600 mb-4" size={40} />
        <p className="text-slate-500 font-medium">Sinkronisasi data @pairs...</p>
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
          onClick={fetchPairData}
          className="bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-2xl font-bold border border-slate-200 flex items-center space-x-2 transition-all shadow-sm"
        >
          <RefreshCw size={20} />
          <span>Refresh Data CSV</span>
        </button>
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
