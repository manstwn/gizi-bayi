import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Printer, 
  FileDown, 
  Filter,
  Calendar
} from 'lucide-react';

const Laporan = () => {
  const [data, setData] = useState([]);
  const [balitas, setBalitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    kategori: '',
    balitaId: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pemeriksaanRes, balitaRes] = await Promise.all([
        api.get('/pemeriksaan'),
        api.get('/balita')
      ]);
      
      setBalitas(balitaRes.data);
      
      let filtered = pemeriksaanRes.data;
      
      if (filters.startDate) {
        filtered = filtered.filter(p => p.tanggal_pemeriksaan >= filters.startDate);
      }
      if (filters.endDate) {
        filtered = filtered.filter(p => p.tanggal_pemeriksaan <= filters.endDate);
      }
      if (filters.kategori) {
        filtered = filtered.filter(p => p.kategori_gizi === filters.kategori);
      }
      if (filters.balitaId) {
        filtered = filtered.filter(p => p.balita_id.toString() === filters.balitaId);
      }
      
      setData(filtered);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const formatIndoDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 no-print">
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <Calendar size={18} className="text-medical-500 ml-2" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0"
            />
            <span className="text-slate-300 font-bold">→</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0"
            />
          </div>

          <select
            value={filters.balitaId}
            onChange={(e) => setFilters({...filters, balitaId: e.target.value})}
            className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-medical-500 focus:border-transparent min-w-[200px]"
          >
            <option value="">Semua Balita</option>
            {balitas.map(b => (
              <option key={b.id} value={b.id}>{b.nama}</option>
            ))}
          </select>

          <select
            value={filters.kategori}
            onChange={(e) => setFilters({...filters, kategori: e.target.value})}
            className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-medical-500 focus:border-transparent"
          >
            <option value="">Semua Status Gizi</option>
            <option value="Gizi Buruk">Gizi Buruk</option>
            <option value="Gizi Kurang">Gizi Kurang</option>
            <option value="Gizi Baik">Gizi Baik</option>
            <option value="Gizi Lebih">Gizi Lebih</option>
          </select>
        </div>
        
        <div className="flex space-x-3 w-full lg:w-auto">
          <button 
            onClick={handlePrint}
            className="flex-1 lg:flex-none flex items-center justify-center space-x-2 bg-slate-800 text-white px-6 py-2.5 rounded-2xl hover:bg-slate-900 transition-all font-bold shadow-lg shadow-slate-100"
          >
            <Printer size={18} />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-100/50 border border-slate-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        <div className="p-10 hidden print:block text-center border-b border-slate-100 mb-8">
          <div className="flex items-center justify-center space-x-3 mb-2">
             <div className="bg-medical-500 p-2 rounded-xl text-white">
                <span className="font-bold text-xl">♥</span>
             </div>
             <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">LAPORAN STATUS GIZI BALITA</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Posyandu Sari Kemuning</p>
             </div>
          </div>
          <div className="mt-4 flex justify-center space-x-8 text-sm font-bold text-slate-400">
             <p>Periode: {filters.startDate || 'Awal'} s/d {filters.endDate || 'Sekarang'}</p>
             {filters.balitaId && <p>Balita: {balitas.find(b => b.id.toString() === filters.balitaId)?.nama}</p>}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-900 text-xs font-black uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4 text-center">No</th>
                <th className="px-6 py-4">Hari & Tanggal</th>
                <th className="px-6 py-4">Nama Balita</th>
                <th className="px-6 py-4 text-center">BB/TB/Umur</th>
                <th className="px-6 py-4 text-center">Nilai SPK</th>
                <th className="px-6 py-4">Status Gizi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-20 text-center text-slate-400 font-bold">Memproses data...</td></tr>
              ) : data.length > 0 ? (
                data.map((item, index) => (
                  <tr key={item.id} className="text-sm hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-center text-slate-500">{index + 1}</td>
                    <td className="px-6 py-4">
                       <p className="text-slate-700">{formatIndoDate(item.tanggal_pemeriksaan)}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                       {item.balita?.nama || 'Tidak diketahui'}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">
                       {item.berat_badan} kg / {item.tinggi_badan} cm / {item.umur_bulan} bln
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-slate-600">
                       {item.hasil_fuzzy?.toFixed(2) || '0.00'}
                    </td>
                    <td className={`px-6 py-4 font-bold ${
                      item.kategori_gizi === 'Gizi Baik' ? 'text-emerald-600' :
                      item.kategori_gizi === 'Gizi Buruk' ? 'text-rose-600' :
                      'text-amber-600'
                    }`}>
                       {item.kategori_gizi}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-slate-400 italic">Tidak ditemukan data.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-10 hidden print:flex justify-end mt-16 border-t border-slate-50">
          <div className="text-center w-72">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-20">Dicetak pada {new Date().toLocaleDateString('id-ID')}</p>
            <div className="border-b-2 border-slate-900 w-full mb-2"></div>
            <p className="font-black text-slate-900 uppercase tracking-tighter">Petugas Posyandu</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background-color: white !important; color: black !important; }
          main { padding: 0 !important; margin: 0 !important; }
          .max-w-7xl { max-width: 100% !important; }
          table { width: 100% !important; border: 1px solid #e2e8f0 !important; }
          th, td { border: 1px solid #e2e8f0 !important; }
        }
      `}} />
    </div>
  );
};

export default Laporan;
