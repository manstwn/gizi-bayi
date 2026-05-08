import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Activity, Cpu, ArrowRight, RefreshCw, BarChart3, TrendingUp, Info, CheckCircle2 } from 'lucide-react';

const LiveCalculation = () => {
  const [inputs, setInputs] = useState({
    bb: 10.3,
    tb: 79,
    umur: 15
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [isFollowMode, setIsFollowMode] = useState(false);

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

  const ZScoreGauge = ({ label, value, title, category }) => {
    // ... (Keep existing Gauge code, maybe polish colors later)
    const percentage = Math.min(Math.max(((value + 4) / 8) * 100, 0), 100);
    const getColor = (v) => {
      if (v < -3 || v > 3) return 'bg-rose-600';
      if (v < -2 || v > 2) return 'bg-amber-500';
      return 'bg-emerald-500';
    };

    return (
      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <h4 className="font-bold text-slate-800">{label}</h4>
          </div>
          <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${getColor(value)} text-white shadow-sm`}>
            Z: {value.toFixed(2)}
          </div>
        </div>
        
        <div className="relative h-4 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
          <div className="absolute inset-0 flex justify-between px-[12.5%] opacity-10 pointer-events-none">
            {[...Array(7)].map((_, i) => <div key={i} className="border-l border-slate-900 h-full"></div>)}
          </div>
          <div className={`absolute top-0 bottom-0 transition-all duration-700 ease-out ${getColor(value)}`} style={{ left: '0', width: `${percentage}%` }}></div>
        </div>
        
        <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase px-1">
          <span>-4 SD</span>
          <span>Median</span>
          <span>+4 SD</span>
        </div>

        <div className={`p-3 rounded-2xl text-xs font-bold text-center ${
          category.includes('Normal') || category.includes('Baik') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
        }`}>
          {category}
        </div>
      </div>
    );
  };

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
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-medical-50/50 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center">
              <Activity className="mr-3 text-medical-500" size={20} />
              Input Pengukuran
            </h3>
            <div className="space-y-6">
              {/* Umur Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Umur (Bulan)</label>
                  <span className="text-4xl font-black text-slate-900 leading-none">{inputs.umur}</span>
                </div>
                <input type="range" min="0" max="60" step="1" value={inputs.umur}
                  onChange={(e) => setInputs({...inputs, umur: parseInt(e.target.value)})}
                  className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-medical-500 hover:accent-medical-600 transition-all"
                />
                <button 
                  onClick={() => setIsFollowMode(!isFollowMode)}
                  className={`w-full py-3 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 border ${
                    isFollowMode 
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' 
                      : 'bg-white border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 hover:bg-emerald-50'
                  }`}
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
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Berat Badan (kg)</label>
                    <span className="text-3xl font-black text-slate-800 leading-none">{inputs.bb.toFixed(1)}</span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Ideal (WHO)</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {result?.indices?.bbu?.ref?.median && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          inputs.bb >= result.indices.bbu.ref.median ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {(inputs.bb - result.indices.bbu.ref.median) >= 0 ? '+' : ''}{(inputs.bb - result.indices.bbu.ref.median).toFixed(1)}
                        </span>
                      )}
                      <p className="text-lg font-black text-emerald-500 leading-none">{result?.indices?.bbu?.ref?.median?.toFixed(1) || '--'}</p>
                    </div>
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
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tinggi Badan (cm)</label>
                    <span className="text-3xl font-black text-slate-800 leading-none">{inputs.tb.toFixed(1)}</span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Ideal (WHO)</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {result?.indices?.tbu?.ref?.median && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          inputs.tb >= result.indices.tbu.ref.median ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {(inputs.tb - result.indices.tbu.ref.median) >= 0 ? '+' : ''}{(inputs.tb - result.indices.tbu.ref.median).toFixed(1)}
                        </span>
                      )}
                      <p className="text-lg font-black text-emerald-500 leading-none">{result?.indices?.tbu?.ref?.median?.toFixed(1) || '--'}</p>
                    </div>
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
          {result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ZScoreGauge 
                title="Weight-for-Age" 
                label="Berat Badan menurut Umur" 
                value={result.indices.bbu.z} 
                category={result.indices.bbu.category} 
              />
              <ZScoreGauge 
                title="Height-for-Age" 
                label="Tinggi Badan menurut Umur" 
                value={result.indices.tbu.z} 
                category={result.indices.tbu.category} 
              />
              <ZScoreGauge 
                title="Weight-for-Height" 
                label="Berat Badan menurut Tinggi Badan" 
                value={result.indices.bbtb.z} 
                category={result.indices.bbtb.category} 
              />
              
              <div className="bg-slate-900 rounded-[2rem] p-6 text-white flex flex-col justify-center space-y-4 shadow-xl border border-white/5">
                <div className="flex items-center space-x-3 text-medical-400">
                  <TrendingUp size={20} />
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Kesimpulan Assessment</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Status Gizi (BB/TB)</p>
                    <p className="text-lg font-black text-emerald-400 leading-tight">{result.indices.bbtb.category}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-3xl border ${result.summary.stunting === 'Normal' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Stunting</p>
                      <p className="text-xs font-black">{result.summary.stunting}</p>
                    </div>
                    <div className={`p-4 rounded-3xl border ${result.summary.underweight === 'Normal' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Underweight</p>
                      <p className="text-xs font-black">{result.summary.underweight}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reference Details Table */}
          {result && (
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
                      <th className="pb-4 text-[10px] font-black text-rose-500 uppercase">-3SD</th>
                      <th className="pb-4 text-[10px] font-black text-rose-400 uppercase">-2SD</th>
                      <th className="pb-4 text-[10px] font-black text-emerald-600 uppercase">Median</th>
                      <th className="pb-4 text-[10px] font-black text-blue-500 uppercase">+2SD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <tr>
                      <td className="py-4 font-bold text-slate-700 text-xs">Berat Badan menurut Umur</td>
                      <td className="py-4 text-xs font-medium">{result.indices.bbu.ref.minus3SD.toFixed(2)}</td>
                      <td className="py-4 text-xs font-medium">{result.indices.bbu.ref.minus2SD.toFixed(2)}</td>
                      <td className="py-4 text-xs font-bold text-emerald-600">{result.indices.bbu.ref.median.toFixed(2)}</td>
                      <td className="py-4 text-xs font-medium">{result.indices.bbu.ref.plus2SD.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-4 font-bold text-slate-700 text-xs">Tinggi Badan menurut Umur</td>
                      <td className="py-4 text-xs font-medium">{result.indices.tbu.ref.minus3SD.toFixed(2)}</td>
                      <td className="py-4 text-xs font-medium">{result.indices.tbu.ref.minus2SD.toFixed(2)}</td>
                      <td className="py-4 text-xs font-bold text-emerald-600">{result.indices.tbu.ref.median.toFixed(2)}</td>
                      <td className="py-4 text-xs font-medium">{result.indices.tbu.ref.plus2SD.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-4 font-bold text-slate-700 text-xs">Berat Badan menurut Tinggi Badan</td>
                      <td className="py-4 text-xs font-medium">{result.indices.bbtb.ref.minus3SD.toFixed(2)}</td>
                      <td className="py-4 text-xs font-medium">{result.indices.bbtb.ref.minus2SD.toFixed(2)}</td>
                      <td className="py-4 text-xs font-bold text-emerald-600">{result.indices.bbtb.ref.median.toFixed(2)}</td>
                      <td className="py-4 text-xs font-medium">{result.indices.bbtb.ref.plus2SD.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveCalculation;
