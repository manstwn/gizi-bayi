import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Printer, 
  FileDown, 
  Filter,
  Calendar
} from 'lucide-react';
import { cn } from '../utils/cn';

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

  const [expandedId, setExpandedId] = useState(null);
  const [expandedDetails, setExpandedDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const processedData = React.useMemo(() => {
    let result = data;
    if (searchQuery) {
      result = result.filter(p => 
        p.balita?.nama.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [data, searchQuery]);

  const totalPages = Math.ceil(processedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = processedData.slice(startIndex, endIndex);

  const formatIndoVal = (val, unit) => {
    if (val == null || isNaN(val)) return '--';
    return `${val.toFixed(1).replace('.', ',')} ${unit}`;
  };

  const calculateSDPosition = (val, ref) => {
    if (!ref || val == null) return 50;
    const { minus3SD, minus2SD, median, plus2SD, plus3SD } = ref;
    if (minus3SD == null || minus2SD == null || median == null || plus2SD == null || plus3SD == null) return 50;

    if (val <= minus3SD) return 0;
    if (val <= minus2SD) {
      return 0 + 25 * ((val - minus3SD) / (minus2SD - minus3SD));
    }
    if (val <= median) {
      return 25 + 25 * ((val - minus2SD) / (median - minus2SD));
    }
    if (val <= plus2SD) {
      return 50 + 25 * ((val - median) / (plus2SD - median));
    }
    if (val <= plus3SD) {
      return 75 + 25 * ((val - plus2SD) / (plus3SD - plus2SD));
    }
    return 100;
  };

  const renderSDRangeBar = (currentVal, refData) => {
    if (!refData || currentVal == null) return null;
    const min = refData.minus3SD;
    const max = refData.plus3SD;
    if (min == null || max == null || max === min) return null;
    
    const percentage = calculateSDPosition(currentVal, refData);
    
    let dotColor = "bg-emerald-500 ring-emerald-100";
    if (currentVal < refData.minus2SD) {
      dotColor = "bg-rose-500 ring-rose-100";
    } else if (currentVal > refData.plus2SD) {
      dotColor = "bg-amber-500 ring-amber-100";
    }
    
    return (
      <tr className="border-none">
        <td colSpan="2" className="py-0"></td>
        <td colSpan="5" className="py-2 pb-5 pr-4">
          <div className="relative w-full h-1.5 bg-slate-100 rounded-full">
            {/* Range bar background colors */}
            <div className="absolute left-0 w-1/4 h-full bg-rose-400 rounded-l-full opacity-60" />
            <div className="absolute left-1/4 w-2/4 h-full bg-emerald-400 opacity-60" />
            <div className="absolute left-3/4 w-1/4 h-full bg-amber-400 rounded-r-full opacity-60" />

            {/* Static ticks under the columns */}
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white/70" />
            <div className="absolute left-1/4 top-0 bottom-0 w-0.5 bg-white/70" />
            <div className="absolute left-2/4 top-0 bottom-0 w-0.5 bg-white/70" />
            <div className="absolute left-3/4 top-0 bottom-0 w-0.5 bg-white/70" />
            <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-white/70" />

            {/* Current Value Dot */}
            <div 
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${dotColor} border-2 border-white shadow ring-4 ring-white/40 transition-all duration-500`}
              style={{ left: `${percentage}%` }}
            />
          </div>
        </td>
      </tr>
    );
  };

  const handleRowClick = async (item) => {
    if (expandedId === item.id) {
      setExpandedId(null);
      setExpandedDetails(null);
      return;
    }
    
    setExpandedId(item.id);
    setExpandedDetails(null);
    setDetailsLoading(true);
    try {
      const response = await api.post('/settings/simulate', {
        bb: item.berat_badan,
        tb: item.tinggi_badan,
        umur: item.umur_bulan
      });
      setExpandedDetails(response.data);
    } catch (error) {
      console.error('Error fetching calculation details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pemeriksaanRes, balitaRes] = await Promise.all([
        api.get('/pemeriksaan'),
        api.get('/balita')
      ]);
      
      setBalitas(balitaRes.data);
      setCurrentPage(1);
      
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
      {/* Page Header (Title + Print Button) */}
      <div className="flex justify-between items-center no-print px-4">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Laporan Posyandu</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Rekapitulasi Gizi Balita & Z-Score</p>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center space-x-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl hover:bg-slate-800 transition-all font-black text-xs uppercase tracking-widest shadow-md"
        >
          <Printer size={15} />
          <span>Cetak Laporan</span>
        </button>
      </div>

      {/* Filter Card */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 no-print">
        <div className="flex flex-wrap items-center gap-4">
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

          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Cari nama balita..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-100 rounded-2xl pl-9 pr-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-medical-500 focus:border-transparent w-full"
            />
          </div>

          {/* Limit Selector */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 text-sm font-bold text-slate-700">
            <span className="text-slate-400 text-xs">Limit:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-transparent border-none p-0 text-sm font-black focus:ring-0 cursor-pointer"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
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

        <div className="overflow-x-auto print:hidden">
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
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item, index) => {
                  const isExpanded = expandedId === item.id;
                  return (
                    <React.Fragment key={item.id}>
                      <tr 
                        onClick={() => handleRowClick(item)}
                        className={`text-sm hover:bg-slate-50 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50/50' : ''}`}
                      >
                        <td className="px-6 py-4 text-center text-slate-500">{startIndex + index + 1}</td>
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
                      
                      {isExpanded && (
                        <tr className="bg-slate-50/30 no-print">
                          <td colSpan="6" className="px-8 py-6">
                            {detailsLoading ? (
                              <div className="text-center py-4 text-slate-400 font-bold italic animate-pulse">
                                Menghitung data referensi...
                              </div>
                            ) : expandedDetails ? (
                              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-in slide-in-from-top-2 duration-300">
                                {/* Hasil Analisis Z-Score */}
                                <div className="xl:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
                                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                                    <span className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] mr-2">✓</span>
                                    Hasil Analisis Z-Score & Status Gizi
                                  </h4>
                                  
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                      <thead>
                                        <tr className="border-b border-slate-100">
                                          <th className="pb-3 font-bold text-slate-400 uppercase">Indeks Antropometri</th>
                                          <th className="pb-3 font-bold text-slate-400 uppercase">Z-Score</th>
                                          <th className="pb-3 font-bold text-slate-400 uppercase">Kategori Status</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50">
                                        <tr>
                                          <td className="py-3 font-medium text-slate-600">Berat Badan menurut Umur (BB/U)</td>
                                          <td className="py-3 font-mono font-bold text-slate-800">
                                            {expandedDetails.indices.bbu?.z ? (expandedDetails.indices.bbu.z >= 0 ? '+' : '') + expandedDetails.indices.bbu.z.toFixed(2).replace('.', ',') : '0,00'}
                                          </td>
                                          <td className="py-3">
                                            <span className={cn(
                                              "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight",
                                              expandedDetails.indices.bbu?.category.includes('Normal') ? "bg-green-50 text-green-600" : "bg-rose-50 text-rose-600"
                                            )}>
                                              {expandedDetails.indices.bbu?.category}
                                            </span>
                                          </td>
                                        </tr>
                                        <tr>
                                          <td className="py-3 font-medium text-slate-600">Tinggi Badan menurut Umur (TB/U)</td>
                                          <td className="py-3 font-mono font-bold text-slate-800">
                                            {expandedDetails.indices.tbu?.z ? (expandedDetails.indices.tbu.z >= 0 ? '+' : '') + expandedDetails.indices.tbu.z.toFixed(2).replace('.', ',') : '0,00'}
                                          </td>
                                          <td className="py-3">
                                            <span className={cn(
                                              "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight",
                                              expandedDetails.indices.tbu?.category.includes('Normal') ? "bg-green-50 text-green-600" : "bg-rose-50 text-rose-600"
                                            )}>
                                              {expandedDetails.indices.tbu?.category}
                                            </span>
                                          </td>
                                        </tr>
                                        <tr>
                                          <td className="py-3 font-medium text-slate-600">Berat Badan menurut Tinggi Badan (BB/TB)</td>
                                          <td className="py-3 font-mono font-bold text-slate-800">
                                            {expandedDetails.indices.bbtb?.z ? (expandedDetails.indices.bbtb.z >= 0 ? '+' : '') + expandedDetails.indices.bbtb.z.toFixed(2).replace('.', ',') : '0,00'}
                                          </td>
                                          <td className="py-3">
                                            <span className={cn(
                                              "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight",
                                              expandedDetails.indices.bbtb?.category.includes('Normal') || expandedDetails.indices.bbtb?.category.includes('Baik') ? "bg-green-50 text-green-600" : "bg-rose-50 text-rose-600"
                                            )}>
                                              {expandedDetails.indices.bbtb?.category}
                                            </span>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                  
                                  <div className="bg-slate-900 rounded-2xl p-4 text-white grid grid-cols-3 gap-2 text-center text-[10px]">
                                    <div>
                                      <p className="text-[7px] text-slate-400 uppercase font-bold mb-0.5">Status Gizi (BB/TB)</p>
                                      <p className="font-black text-emerald-400 truncate">{expandedDetails.indices.bbtb?.category || '--'}</p>
                                    </div>
                                    <div className="border-x border-white/10">
                                      <p className="text-[7px] text-slate-400 uppercase font-bold mb-0.5">Stunting (TB/U)</p>
                                      <p className={cn(
                                        "font-black truncate",
                                        expandedDetails.summary?.stunting === 'Normal' ? 'text-emerald-400' : 'text-rose-400'
                                      )}>{expandedDetails.summary?.stunting || '--'}</p>
                                    </div>
                                    <div>
                                      <p className="text-[7px] text-slate-400 uppercase font-bold mb-0.5">Underweight (BB/U)</p>
                                      <p className={cn(
                                        "font-black truncate",
                                        expandedDetails.summary?.underweight === 'Normal' ? 'text-emerald-400' : 'text-rose-400'
                                      )}>{expandedDetails.summary?.underweight || '--'}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Data Referensi Interpolasi (SD) */}
                                <div className="xl:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                                    <span className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] mr-2">i</span>
                                    Data Referensi Interpolasi (SD)
                                  </h4>
                                  
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                      <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase">
                                          <th className="pb-3">Indeks</th>
                                          <th className="pb-3 text-indigo-600">Nilai Sekarang</th>
                                          <th className="pb-3 text-rose-500">-3SD</th>
                                          <th className="pb-3 text-rose-400">-2SD</th>
                                          <th className="pb-3 text-emerald-600">Median</th>
                                          <th className="pb-3 text-blue-500">+2SD</th>
                                          <th className="pb-3 text-blue-600">+3SD</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                                        <tr>
                                          <td className="py-3 font-bold text-slate-700">Berat Badan menurut Umur ({item.umur_bulan} Bulan)</td>
                                          <td className="py-3 font-black text-indigo-600">{item.berat_badan.toFixed(1).replace('.', ',')} Kg</td>
                                          <td className="py-3">{formatIndoVal(expandedDetails.indices.bbu?.ref?.minus3SD, 'Kg')}</td>
                                          <td className="py-3">{formatIndoVal(expandedDetails.indices.bbu?.ref?.minus2SD, 'Kg')}</td>
                                          <td className="py-3 font-bold text-emerald-600">{formatIndoVal(expandedDetails.indices.bbu?.ref?.median, 'Kg')}</td>
                                          <td className="py-3">{formatIndoVal(expandedDetails.indices.bbu?.ref?.plus2SD, 'Kg')}</td>
                                          <td className="py-3">{formatIndoVal(expandedDetails.indices.bbu?.ref?.plus3SD, 'Kg')}</td>
                                        </tr>
                                        {renderSDRangeBar(item.berat_badan, expandedDetails.indices.bbu?.ref)}
                                        <tr>
                                          <td className="py-3 font-bold text-slate-700">Tinggi Badan menurut Umur ({item.umur_bulan} Bulan)</td>
                                          <td className="py-3 font-black text-indigo-600">{item.tinggi_badan.toFixed(1).replace('.', ',')} cm</td>
                                          <td className="py-3">{formatIndoVal(expandedDetails.indices.tbu?.ref?.minus3SD, 'cm')}</td>
                                          <td className="py-3">{formatIndoVal(expandedDetails.indices.tbu?.ref?.minus2SD, 'cm')}</td>
                                          <td className="py-3 font-bold text-emerald-600">{formatIndoVal(expandedDetails.indices.tbu?.ref?.median, 'cm')}</td>
                                          <td className="py-3">{formatIndoVal(expandedDetails.indices.tbu?.ref?.plus2SD, 'cm')}</td>
                                          <td className="py-3">{formatIndoVal(expandedDetails.indices.tbu?.ref?.plus3SD, 'cm')}</td>
                                        </tr>
                                        {renderSDRangeBar(item.tinggi_badan, expandedDetails.indices.tbu?.ref)}
                                        <tr>
                                          <td className="py-3 font-bold text-slate-700">Berat Badan menurut Tinggi Badan ({item.tinggi_badan.toFixed(1).replace('.', ',')} cm)</td>
                                          <td className="py-3 font-black text-indigo-600">{item.berat_badan.toFixed(1).replace('.', ',')} Kg</td>
                                          <td className="py-3">{formatIndoVal(expandedDetails.indices.bbtb?.ref?.minus3SD, 'Kg')}</td>
                                          <td className="py-3">{formatIndoVal(expandedDetails.indices.bbtb?.ref?.minus2SD, 'Kg')}</td>
                                          <td className="py-3 font-bold text-emerald-600">{formatIndoVal(expandedDetails.indices.bbtb?.ref?.median, 'Kg')}</td>
                                          <td className="py-3">{formatIndoVal(expandedDetails.indices.bbtb?.ref?.plus2SD, 'Kg')}</td>
                                          <td className="py-3">{formatIndoVal(expandedDetails.indices.bbtb?.ref?.plus3SD, 'Kg')}</td>
                                        </tr>
                                        {renderSDRangeBar(item.berat_badan, expandedDetails.indices.bbtb?.ref)}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4 text-rose-500 font-bold italic">
                                Gagal memuat data referensi.
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-slate-400 italic">Tidak ditemukan data.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Table (Full Data, No Pagination, No Details) */}
        <div className="overflow-x-auto hidden print:block">
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
              {processedData.length > 0 ? (
                processedData.map((item, index) => (
                  <tr key={item.id} className="text-sm">
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
                    <td className="px-6 py-4 font-bold text-slate-700">
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

        {/* Pagination Controls */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/20 flex flex-col sm:flex-row justify-between items-center gap-4 no-print print:hidden">
          <div className="text-xs font-bold text-slate-400">
            Menampilkan {Math.min(startIndex + 1, processedData.length)} - {Math.min(endIndex, processedData.length)} dari {processedData.length} entri
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-xs font-black text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm"
            >
              Sebelumnya
            </button>
            
            <span className="text-xs font-bold text-slate-700 px-3">
              Halaman {currentPage} dari {totalPages || 1}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-4 py-2 text-xs font-black text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm"
            >
              Berikutnya
            </button>
          </div>
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
