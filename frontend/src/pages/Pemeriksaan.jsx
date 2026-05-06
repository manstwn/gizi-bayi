import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Search, 
  Baby, 
  Calculator, 
  CheckCircle2,
  History,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Info
} from 'lucide-react';
import { cn } from '../utils/cn';

const Pemeriksaan = () => {
  const [balita, setBalita] = useState([]);
  const [selectedBalita, setSelectedBalita] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  
  const [formData, setFormData] = useState({
    berat_badan: '',
    tinggi_badan: '',
    umur_bulan: '',
    catatan: ''
  });
  
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (search.length >= 2) {
      const fetchBalita = async () => {
        try {
          const response = await api.get(`/balita?search=${search}`);
          setBalita(response.data);
        } catch (error) {
          console.error('Error fetching balita:', error);
        }
      };
      fetchBalita();
    } else {
      setBalita([]);
    }
  }, [search]);

  const handleSelectBalita = async (item) => {
    setSelectedBalita(item);
    setSearch('');
    setBalita([]);
    setResult(null);
    
    try {
      const response = await api.get(`/pemeriksaan/balita/${item.id}`);
      setHistory(response.data);
      
      const birthDate = new Date(item.tanggal_lahir);
      const today = new Date();
      const diffMonth = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
      setFormData(prev => ({ ...prev, umur_bulan: diffMonth }));
      
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/pemeriksaan', {
        balita_id: selectedBalita.id,
        ...formData
      });
      setResult(response.data);
      
      const historyRes = await api.get(`/pemeriksaan/balita/${selectedBalita.id}`);
      setHistory(historyRes.data);
      
      setFormData({
        berat_badan: '',
        tinggi_badan: '',
        umur_bulan: formData.umur_bulan,
        catatan: ''
      });
    } catch (error) {
      console.error('Error calculating fuzzy:', error);
      alert('Gagal melakukan perhitungan. Pastikan data input valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {!selectedBalita ? (
        <div className="medical-card p-10 md:p-16 text-center space-y-8 max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-medical-50 rounded-[2.5rem] flex items-center justify-center text-medical-600 mx-auto shadow-inner border border-medical-100">
            <Search size={40} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">Mulai Pemeriksaan</h3>
            <p className="text-slate-500 font-medium mt-2">Cari nama balita untuk memulai analisis status gizi cerdas.</p>
          </div>
          
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Ketik nama balita..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-12 h-14 text-lg font-medium shadow-xl shadow-slate-100"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
               <Search size={24} />
            </div>
            
            {balita.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                {balita.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectBalita(item)}
                    className="w-full text-left px-6 py-4 hover:bg-slate-50 flex items-center justify-between group border-b border-slate-50 last:border-0"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-medical-500 group-hover:text-white transition-all">
                        <Baby size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{item.nama}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.nama_orang_tua}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-medical-500 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="pt-4 border-t border-slate-50">
             <p className="text-xs text-slate-400 font-medium">Belum terdaftar? Pergi ke menu <span className="text-medical-600 font-bold">Data Balita</span> untuk menambahkan baru.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Form Area */}
          <div className="lg:col-span-8 space-y-8">
            <div className="medical-card p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-medical-50 rounded-[1.5rem] flex items-center justify-center text-medical-600 shadow-inner border border-medical-100">
                    <Baby size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{selectedBalita.nama}</h3>
                    <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       <span>{selectedBalita.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                       <span className="mx-2">•</span>
                       <span>Tgl Lahir: {selectedBalita.tanggal_lahir}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedBalita(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all uppercase tracking-widest"
                >
                  Ganti Pasien
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Berat Badan (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.berat_badan}
                      onChange={(e) => setFormData({...formData, berat_badan: e.target.value})}
                      className="input-field h-12 text-lg font-black"
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Tinggi Badan (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.tinggi_badan}
                      onChange={(e) => setFormData({...formData, tinggi_badan: e.target.value})}
                      className="input-field h-12 text-lg font-black"
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Umur (Bulan)</label>
                    <input
                      type="number"
                      required
                      value={formData.umur_bulan}
                      onChange={(e) => setFormData({...formData, umur_bulan: e.target.value})}
                      className="input-field h-12 text-lg font-black"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Observasi Tambahan (Opsional)</label>
                  <textarea
                    rows="2"
                    value={formData.catatan}
                    onChange={(e) => setFormData({...formData, catatan: e.target.value})}
                    className="input-field resize-none py-3"
                    placeholder="Contoh: Anak terlihat ceria, nafsu makan baik..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary h-14 text-lg shadow-xl shadow-medical-100/50 group"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Calculator size={24} />
                      <span>Jalankan Analisis Fuzzy</span>
                      <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* History Card */}
            <div className="medical-card overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <History size={18} className="text-slate-400" />
                  <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Rekam Medis Sebelumnya</h4>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                      <th className="px-6 py-4">Tanggal Check</th>
                      <th className="px-6 py-4">Antropometri</th>
                      <th className="px-6 py-4">Kategori Nutrisi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {history.length > 0 ? history.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-600">{p.tanggal_pemeriksaan}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-500">{p.berat_badan}kg <span className="text-slate-200mx-1">•</span> {p.tinggi_badan}cm <span className="text-slate-200 mx-1">•</span> {p.umur_bulan} bln</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                             "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight",
                             p.kategori_gizi === 'Gizi Baik' ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                          )}>
                            {p.kategori_gizi}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-400 italic">Belum ada rekam medis sebelumnya.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Analysis Sidebar Area */}
          <div className="lg:col-span-4 space-y-6">
             <div className={cn(
               "medical-card p-8 sticky top-24 transition-all duration-500 overflow-hidden relative",
               result ? "bg-white border-medical-500 shadow-2xl shadow-medical-500/10 border-t-[8px]" : "bg-slate-50 border-slate-100 opacity-80"
             )}>
                {/* Visual Accent */}
                {result && <div className="absolute top-0 right-0 w-32 h-32 bg-medical-50 rounded-full -mr-16 -mt-16 opacity-50"></div>}

                <div className="relative z-10 space-y-8">
                  <h3 className="text-lg font-black text-slate-800 flex items-center space-x-2">
                    <CheckCircle2 size={24} className={result ? "text-medical-600" : "text-slate-300"} />
                    <span>Hasil Klasifikasi</span>
                  </h3>
                  
                  {result ? (
                    <div className="space-y-8 animate-in zoom-in-95 duration-500">
                      <div className="text-center bg-slate-50 rounded-[2rem] p-8 border border-slate-100 shadow-inner">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Status Nutrisi Final</p>
                        <div className={cn(
                          "inline-block px-6 py-3 rounded-2xl text-2xl font-black shadow-lg shadow-current/10 tracking-tight",
                          result.data.kategori_gizi === 'Gizi Baik' ? "bg-green-500 text-white" :
                          result.data.kategori_gizi === 'Gizi Lebih' ? "bg-medical-500 text-white" :
                          result.data.kategori_gizi === 'Gizi Kurang' ? "bg-amber-500 text-white" :
                          "bg-rose-500 text-white"
                        )}>
                          {result.data.kategori_gizi}
                        </div>
                        
                        <div className="mt-8 flex items-center justify-center space-x-1">
                           <span className="text-xs font-bold text-slate-400">Skor Defuzzifikasi:</span>
                           <span className="text-lg font-black text-slate-800 font-mono">{result.data.hasil_fuzzy.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                         <div className="flex justify-between items-end px-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Indeks Keyakinan</span>
                            <span className="text-sm font-black text-medical-600">{result.data.hasil_fuzzy.toFixed(0)}%</span>
                         </div>
                         <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                           <div 
                             className="bg-medical-500 h-full transition-all duration-1000 ease-out" 
                             style={{ width: `${result.data.hasil_fuzzy}%` }}
                           ></div>
                         </div>
                      </div>

                      <div className="bg-medical-50 p-5 rounded-2xl flex items-start space-x-3 border border-medical-100">
                         <Info size={20} className="text-medical-600 flex-shrink-0 mt-0.5" />
                         <p className="text-xs text-medical-800 font-medium leading-relaxed italic">
                           Hasil ini dihitung otomatis menggunakan rule-base Fuzzy Mamdani. Gunakan sebagai bahan pertimbangan medis utama.
                         </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4 border border-slate-50">
                        <Calculator size={32} />
                      </div>
                      <p className="text-sm text-slate-400 font-medium leading-relaxed">Silakan lengkapi form <br/>dan jalankan analisis.</p>
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pemeriksaan;
