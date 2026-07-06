import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Activity, Cpu, ArrowRight, RefreshCw, BarChart3, TrendingUp, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils/cn';

const LiveCalculation = () => {
  const [inputs, setInputs] = useState({
    bb: 10.3,
    tb: 79,
    umur: 15,
    gender: 'L'
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [isFollowMode, setIsFollowMode] = useState(false);

  const [balitaList, setBalitaList] = useState([]);
  const [selectedBalita, setSelectedBalita] = useState(null);
  const [search, setSearch] = useState('');
  const [isAgeLocked, setIsAgeLocked] = useState(false);
  const [pairData, setPairData] = useState(null);

  useEffect(() => {
    if (search.length >= 2) {
      const fetchBalita = async () => {
        try {
          const response = await api.get(`/balita?search=${search}`);
          setBalitaList(response.data);
        } catch (error) {
          console.error('Error fetching balita:', error);
        }
      };
      fetchBalita();
    } else {
      setBalitaList([]);
    }
  }, [search]);

  useEffect(() => {
    const fetchPairData = async () => {
      try {
        const res = await api.get('/settings/pairs');
        setPairData(res.data);
      } catch (error) {
        console.error('Error fetching pair data:', error);
      }
    };
    fetchPairData();
  }, []);

  const handleSelectBalita = (item) => {
    setSelectedBalita(item);
    
    // Calculate age in months
    const birthDate = new Date(item.tanggal_lahir);
    const today = new Date();
    const diffMonth = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
    const umur = diffMonth >= 0 ? diffMonth : 0;

    setInputs(prev => ({ ...prev, umur, gender: item.jenis_kelamin }));
    setIsAgeLocked(true);
    setSearch('');
    setBalitaList([]);
  };

  const handleClearBalita = () => {
    setSelectedBalita(null);
    setIsAgeLocked(false);
  };

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
        <td colSpan="5" className="py-2 pb-6 pr-4">
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
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full ${dotColor} border-2 border-white shadow ring-4 ring-white/40 transition-all duration-500`}
              style={{ left: `${percentage}%` }}
            />
          </div>
        </td>
      </tr>
    );
  };

  const simulate = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.post('/settings/simulate', inputs);
      setResult(res.data);
      
      // If follow mode is on, update BB/TB based on the NEW result from the age change
      if (isFollowMode && res.data?.indices) {
        setInputs(prev => ({
          ...prev,
          bb: parseFloat(res.data.indices.bbu.ref.median.toFixed(1)),
          tb: parseFloat(res.data.indices.tbu.ref.median.toFixed(1))
        }));
      }
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setLoading(false);
    }
  }, [inputs, isFollowMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      simulate();
    }, 300);
    return () => clearTimeout(timer);
  }, [simulate]);



  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center">
            <div className="bg-medical-600 p-2 rounded-2xl mr-4 shadow-lg shadow-medical-100">
              <Cpu className="text-white" size={32} />
            </div>
            GiziEngine Pro <span className="ml-3 text-xs bg-slate-900 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest">v2.1</span>
          </h1>
          <p className="text-slate-500 mt-3 font-semibold text-sm max-w-xl">
            Sistem pakar status gizi berbasis WHO Anthropometric Standards dengan teknologi 
            <span className="text-medical-600 ml-1">Dynamic Anchor Interpolation</span>.
          </p>
        </div>
        {loading && <RefreshCw className="animate-spin text-medical-600" size={28} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          {/* Pilih Balita Contoh */}
          <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm relative">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
              Pilih Balita Contoh (Opsional)
            </h3>
            
            {!selectedBalita ? (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari nama balita..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field h-10 text-sm pl-9"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <span className="text-xs">🔍</span>
                </div>
                
                {balitaList.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                    {balitaList.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectBalita(item)}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between text-xs border-b border-slate-50 last:border-0"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{item.nama}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{item.nama_orang_tua}</p>
                        </div>
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          {(() => {
                            const birth = new Date(item.tanggal_lahir);
                            const today = new Date();
                            const diff = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
                            return diff >= 0 ? `${diff} bln` : '0 bln';
                          })()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">👶</span>
                  <div>
                    <p className="font-black text-indigo-900 text-xs">{selectedBalita.nama}</p>
                    <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">
                      Umur Terkunci: {inputs.umur} Bulan
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClearBalita}
                  className="px-3 py-1 bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors"
                >
                  Ganti
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-medical-50/50 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center">
              <Activity className="mr-3 text-medical-500" size={20} />
              Input Pengukuran
            </h3>
            <div className="space-y-6">
              {/* Gender Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Jenis Kelamin</label>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    disabled={isAgeLocked}
                    onClick={() => setInputs({ ...inputs, gender: 'L' })}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all",
                      isAgeLocked && inputs.gender !== 'L' ? "text-slate-300 cursor-not-allowed opacity-50" : "",
                      inputs.gender === 'L' 
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-800'
                    )}
                  >
                    LAKI-LAKI
                  </button>
                  <button
                    type="button"
                    disabled={isAgeLocked}
                    onClick={() => setInputs({ ...inputs, gender: 'P' })}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all",
                      isAgeLocked && inputs.gender !== 'P' ? "text-slate-300 cursor-not-allowed opacity-50" : "",
                      inputs.gender === 'P' 
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-800'
                    )}
                  >
                    PEREMPUAN
                  </button>
                </div>
              </div>

              {/* Umur Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Umur (Bulan)</label>
                  <span className="text-4xl font-black text-slate-900 leading-none">{inputs.umur}</span>
                </div>
                <input type="range" min="0" max="60" step="1" value={inputs.umur}
                  disabled={isAgeLocked}
                  onChange={(e) => setInputs({...inputs, umur: parseInt(e.target.value)})}
                  className={cn(
                    "w-full h-2 rounded-full appearance-none transition-all",
                    isAgeLocked 
                      ? "bg-slate-200 accent-slate-400 cursor-not-allowed opacity-50" 
                      : "bg-slate-100 accent-medical-500 hover:accent-medical-600 cursor-pointer"
                  )}
                />
                <button 
                  onClick={() => !isAgeLocked && setIsFollowMode(!isFollowMode)}
                  disabled={isAgeLocked}
                  className={cn(
                    "w-full py-3 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 border",
                    isAgeLocked
                      ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
                      : isFollowMode 
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' 
                        : 'bg-white border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 hover:bg-emerald-50'
                  )}
                >
                  <CheckCircle2 size={18} className={isFollowMode ? 'animate-pulse' : ''} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {isFollowMode ? 'Auto-Follow Ideal Active' : 'Enable Auto-Follow Ideal'}
                  </span>
                </button>
              </div>

              {/* BB Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Ideal (WHO)</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-lg font-black text-emerald-500 leading-none">{result?.indices?.bbu?.ref?.median?.toFixed(1) || '--'}</p>
                      {result?.indices?.bbu?.ref?.median && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          Math.abs(inputs.bb - result.indices.bbu.ref.median) <= 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {(inputs.bb - result.indices.bbu.ref.median) >= 0 ? '+' : ''}{(inputs.bb - result.indices.bbu.ref.median).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Berat Badan (kg)</label>
                    <span className="text-3xl font-black text-slate-800 leading-none">{inputs.bb.toFixed(1)}</span>
                  </div>
                </div>
                <div className="relative pt-2">
                  {!isFollowMode && result?.indices?.bbu?.ref?.median && (
                    <div 
                      className="absolute top-2 w-4 h-4 bg-rose-500/30 rounded-full blur-[2px] -ml-2 pointer-events-none transition-all duration-500"
                      style={{ left: `${((result.indices.bbu.ref.median - 2) / 28) * 100}%` }}
                    ></div>
                  )}
                  <input type="range" min="2" max="30" step="0.1" value={inputs.bb}
                    onChange={(e) => {
                      setIsFollowMode(false);
                      setInputs({...inputs, bb: parseFloat(e.target.value)});
                    }}
                    className={`w-full h-2 rounded-full appearance-none cursor-pointer transition-all ${
                      isFollowMode ? 'bg-emerald-100 accent-emerald-600 opacity-50 pointer-events-none' : 'bg-slate-100 accent-medical-500'
                    }`}
                  />
                </div>
              </div>

              {/* TB Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Ideal (WHO)</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-lg font-black text-emerald-500 leading-none">{result?.indices?.tbu?.ref?.median?.toFixed(1) || '--'}</p>
                      {result?.indices?.tbu?.ref?.median && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          Math.abs(inputs.tb - result.indices.tbu.ref.median) <= 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {(inputs.tb - result.indices.tbu.ref.median) >= 0 ? '+' : ''}{(inputs.tb - result.indices.tbu.ref.median).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                      {inputs.umur < 24 ? 'Panjang Badan (cm)' : 'Tinggi Badan (cm)'}
                    </label>
                    <span className="text-[9px] text-slate-400 font-bold mb-1">
                      *{inputs.umur < 24 ? '0-23 Bulan - Panjang' : '24-60 Bulan - Tinggi'}
                    </span>
                    <span className="text-3xl font-black text-slate-800 leading-none">{inputs.tb.toFixed(1)}</span>
                  </div>
                </div>
                <div className="relative pt-2">
                  {!isFollowMode && result?.indices?.tbu?.ref?.median && (
                    <div 
                      className="absolute top-2 w-4 h-4 bg-rose-500/30 rounded-full blur-[2px] -ml-2 pointer-events-none transition-all duration-500"
                      style={{ left: `${((result.indices.tbu.ref.median - 40) / 90) * 100}%` }}
                    ></div>
                  )}
                  <input type="range" min="40" max="130" step="0.5" value={inputs.tb}
                    onChange={(e) => {
                      setIsFollowMode(false);
                      setInputs({...inputs, tb: parseFloat(e.target.value)});
                    }}
                    className={`w-full h-2 rounded-full appearance-none cursor-pointer transition-all ${
                      isFollowMode ? 'bg-emerald-100 accent-emerald-600 opacity-50 pointer-events-none' : 'bg-slate-100 accent-medical-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right: Indices Visualizations */}
        <div className="lg:col-span-8 space-y-6">
          {result && result.indices ? (
            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm overflow-hidden">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center">
                <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] mr-3">✓</span>
                Hasil Analisis Z-Score & Status Gizi
              </h3>
              
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase">Indeks Antropometri</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase">Z-Score</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase">Kategori Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <tr>
                      <td className="py-4 font-bold text-slate-700 text-xs">Berat Badan menurut Umur (BB/U)</td>
                      <td className="py-4 text-xs font-mono font-black text-slate-800">
                        {result.indices.bbu?.z ? (result.indices.bbu.z >= 0 ? '+' : '') + result.indices.bbu.z.toFixed(2).replace('.', ',') : '0,00'}
                      </td>
                      <td className="py-4 text-xs">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight",
                          result.indices.bbu?.category.includes('Normal') ? "bg-green-50 text-green-600 border border-green-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                        )}>
                          {result.indices.bbu?.category}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 font-bold text-slate-700 text-xs">Tinggi Badan menurut Umur (TB/U)</td>
                      <td className="py-4 text-xs font-mono font-black text-slate-800">
                        {result.indices.tbu?.z ? (result.indices.tbu.z >= 0 ? '+' : '') + result.indices.tbu.z.toFixed(2).replace('.', ',') : '0,00'}
                      </td>
                      <td className="py-4 text-xs">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight",
                          result.indices.tbu?.category?.toLowerCase().includes('normal') ? "bg-green-50 text-green-600 border border-green-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                        )}>
                          {result.indices.tbu?.category}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 font-bold text-slate-700 text-xs">
                        <div>Berat Badan menurut {inputs.umur < 24 ? 'Panjang' : 'Tinggi'} Badan</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">*{inputs.umur < 24 ? 'BB/PB - 0-23 Bulan' : 'BB/TB - 24-60 Bulan'}</div>
                      </td>
                      <td className="py-4 text-xs font-mono font-black text-slate-800">
                        {result.indices.bbtb?.z ? (result.indices.bbtb.z >= 0 ? '+' : '') + result.indices.bbtb.z.toFixed(2).replace('.', ',') : '0,00'}
                      </td>
                      <td className="py-4 text-xs">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight",
                          result.indices.bbtb?.category?.toLowerCase().includes('normal') || result.indices.bbtb?.category?.toLowerCase().includes('baik') ? "bg-green-50 text-green-600 border border-green-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                        )}>
                          {result.indices.bbtb?.category}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Ringkasan Kesimpulan */}
              <div className="bg-slate-900 rounded-3xl p-5 text-white grid grid-cols-3 gap-4 border border-white/5">
                <div className="text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Status Gizi ({inputs.umur < 24 ? 'BB/PB - 0-23 Bulan' : 'BB/TB - 24-60 Bulan'})</p>
                  <p className="text-xs font-black text-emerald-400 truncate">{result.indices.bbtb?.category || '--'}</p>
                </div>
                <div className="text-center border-x border-white/10">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Stunting (TB/U)</p>
                  <p className={cn(
                    "text-xs font-black truncate",
                    result.summary?.stunting === 'Normal' ? 'text-emerald-400' : 'text-rose-400'
                  )}>{result.summary?.stunting || '--'}</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Underweight (BB/U)</p>
                  <p className={cn(
                    "text-xs font-black truncate",
                    result.summary?.underweight === 'Normal' ? 'text-emerald-400' : 'text-rose-400'
                  )}>{result.summary?.underweight || '--'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-[2rem] border border-dashed border-slate-200">
              <RefreshCw className="animate-spin text-medical-200 mb-4" size={32} />
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Waiting for simulation data...</p>
            </div>
          )}

          {/* Reference Details Table */}
          {result && result.indices && (
            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm overflow-hidden">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center">
                <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] mr-3">i</span>
                Data Referensi Interpolasi (SD)
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase">Indeks</th>
                      <th className="pb-4 text-[10px] font-black text-indigo-600 uppercase">Nilai Sekarang</th>
                      <th className="pb-4 text-[10px] font-black text-rose-500 uppercase">-3SD</th>
                      <th className="pb-4 text-[10px] font-black text-rose-400 uppercase">-2SD</th>
                      <th className="pb-4 text-[10px] font-black text-emerald-600 uppercase">Median</th>
                      <th className="pb-4 text-[10px] font-black text-blue-500 uppercase">+2SD</th>
                      <th className="pb-4 text-[10px] font-black text-blue-600 uppercase">+3SD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <tr>
                      <td className="py-4 font-bold text-slate-700 text-xs">Berat Badan menurut Umur ({inputs.umur} Bulan)</td>
                      <td className="py-4 text-xs font-black text-indigo-600">{inputs.bb.toFixed(1).replace('.', ',')} Kg</td>
                      <td className="py-4 text-xs font-medium">{formatIndoVal(result.indices.bbu?.ref?.minus3SD, 'Kg')}</td>
                      <td className="py-4 text-xs font-medium">{formatIndoVal(result.indices.bbu?.ref?.minus2SD, 'Kg')}</td>
                      <td className="py-4 text-xs font-bold text-emerald-600">{formatIndoVal(result.indices.bbu?.ref?.median, 'Kg')}</td>
                      <td className="py-4 text-xs font-medium">{formatIndoVal(result.indices.bbu?.ref?.plus2SD, 'Kg')}</td>
                      <td className="py-4 text-xs font-medium">{formatIndoVal(result.indices.bbu?.ref?.plus3SD, 'Kg')}</td>
                    </tr>
                    {renderSDRangeBar(inputs.bb, result.indices.bbu?.ref)}
                    <tr>
                      <td className="py-4 font-bold text-slate-700 text-xs">Tinggi Badan menurut Umur ({inputs.umur} Bulan)</td>
                      <td className="py-4 text-xs font-black text-indigo-600">{inputs.tb.toFixed(1).replace('.', ',')} cm</td>
                      <td className="py-4 text-xs font-medium">{formatIndoVal(result.indices.tbu?.ref?.minus3SD, 'cm')}</td>
                      <td className="py-4 text-xs font-medium">{formatIndoVal(result.indices.tbu?.ref?.minus2SD, 'cm')}</td>
                      <td className="py-4 text-xs font-bold text-emerald-600">{formatIndoVal(result.indices.tbu?.ref?.median, 'cm')}</td>
                      <td className="py-4 text-xs font-medium">{formatIndoVal(result.indices.tbu?.ref?.plus2SD, 'cm')}</td>
                      <td className="py-4 text-xs font-medium">{formatIndoVal(result.indices.tbu?.ref?.plus3SD, 'cm')}</td>
                    </tr>
                    {renderSDRangeBar(inputs.tb, result.indices.tbu?.ref)}
                    <tr>
                      <td className="py-4 font-bold text-slate-700 text-xs">
                        <div>Berat Badan menurut {inputs.umur < 24 ? 'Panjang' : 'Tinggi'} Badan ({inputs.tb.toFixed(1).replace('.', ',')} cm)</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">*{inputs.umur < 24 ? 'BB/PB - 0-23 Bulan' : 'BB/TB - 24-60 Bulan'}</div>
                      </td>
                      <td className="py-4 text-xs font-black text-indigo-600">{inputs.bb.toFixed(1).replace('.', ',')} Kg</td>
                      <td className="py-4 text-xs font-medium">{formatIndoVal(result.indices.bbtb?.ref?.minus3SD, 'Kg')}</td>
                      <td className="py-4 text-xs font-medium">{formatIndoVal(result.indices.bbtb?.ref?.minus2SD, 'Kg')}</td>
                      <td className="py-4 text-xs font-bold text-emerald-600">{formatIndoVal(result.indices.bbtb?.ref?.median, 'Kg')}</td>
                      <td className="py-4 text-xs font-medium">{formatIndoVal(result.indices.bbtb?.ref?.plus2SD, 'Kg')}</td>
                      <td className="py-4 text-xs font-medium">{formatIndoVal(result.indices.bbtb?.ref?.plus3SD, 'Kg')}</td>
                    </tr>
                    {renderSDRangeBar(inputs.bb, result.indices.bbtb?.ref)}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Anchor Data Repository WHO */}
      {pairData && (
        <div className="space-y-6 pt-8 border-t border-slate-100">
          <div className="flex items-center space-x-4 px-4">
            <div className="bg-slate-900 p-3 rounded-2xl shadow-lg">
              <Activity className="text-emerald-400" size={24} />
            </div>
            <div>
              <h3 className="text-slate-900 font-black text-xl">Repository Data Referensi WHO</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                Menggunakan Data Kurva: {inputs.gender === 'L' ? 'Laki-Laki (Boy)' : 'Perempuan (Girl)'} (Otomatis Mengikuti Form)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[
              { id: 'umurToBerat', title: 'Berat Badan / Umur (Age)', xLabel: 'Bulan' },
              { id: 'umurToTinggi', title: 'Tinggi Badan / Umur (Age)', xLabel: 'Bulan' },
              { id: 'panjangToBerat', title: 'Berat Badan / Panjang (0-23 Bulan)', xLabel: 'Cm' },
              { id: 'tinggiToBerat', title: 'Berat Badan / Tinggi (24-60 Bulan)', xLabel: 'Cm' }
            ].map((table) => (
              <div key={table.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[400px]">
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
                      {pairData?.[inputs.gender]?.[table.id]?.map((row, i) => (
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
      )}
    </div>
  );
};

export default LiveCalculation;
