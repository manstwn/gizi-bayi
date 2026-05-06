import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Play, Activity, Cpu, ArrowRight, RefreshCw, Layers } from 'lucide-react';

const LiveCalculation = () => {
  const [inputs, setInputs] = useState({
    bb: 12.5,
    tb: 85,
    umur: 24
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState(null);

  const fetchParams = useCallback(async () => {
    try {
      const res = await api.get('/settings/fuzzy');
      setParams(res.data);
    } catch (error) {
      console.error('Error fetching params:', error);
    }
  }, []);

  const simulate = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.post('/settings/simulate', inputs);
      setResult(res.data);
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setLoading(false);
    }
  }, [inputs]);

  useEffect(() => {
    fetchParams();
  }, [fetchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      simulate();
    }, 300);
    return () => clearTimeout(timer);
  }, [simulate]);

  const MembershipBar = ({ label, value, color }) => {
    // Robust color mapping to prevent Tailwind purging dynamic classes
    const bgMap = {
      'text-rose-500': 'bg-rose-500',
      'text-emerald-500': 'bg-emerald-500',
      'text-blue-500': 'bg-blue-500',
      'text-indigo-500': 'bg-indigo-500'
    };
    const bgClass = bgMap[color] || 'bg-slate-500';

    return (
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
          <span className="text-slate-500">{label}</span>
          <span className={value > 0 ? color : 'text-slate-300'}>{(value * 100).toFixed(1)}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50 relative">
          <div 
            className={`h-full transition-all duration-700 rounded-full ${value > 0 ? bgClass : 'bg-slate-200'}`}
            style={{ width: `${Math.max(value * 100, 1)}%`, opacity: value > 0 ? 1 : 0.1 }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
            <Cpu className="mr-3 text-medical-600" size={32} />
            Simulasi Perhitungan Fuzzy
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Ubah input di bawah untuk melihat bagaimana logika sistem bekerja secara real-time.</p>
        </div>
        {loading && <RefreshCw className="animate-spin text-medical-400" size={24} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/50 space-y-8">
            <h3 className="text-lg font-black text-slate-800 flex items-center">
              <Activity className="mr-2 text-medical-500" size={20} />
              Input Data
            </h3>
            
            {/* BB Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Berat Badan</label>
                <span className="text-2xl font-black text-medical-600">{inputs.bb} <span className="text-xs">kg</span></span>
              </div>
              <input 
                type="range" min="2" max="30" step="0.1"
                value={inputs.bb}
                onChange={(e) => setInputs({...inputs, bb: parseFloat(e.target.value)})}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-medical-500"
              />
            </div>

            {/* TB Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tinggi Badan</label>
                <span className="text-2xl font-black text-medical-600">{inputs.tb} <span className="text-xs">cm</span></span>
              </div>
              <input 
                type="range" min="40" max="130" step="0.5"
                value={inputs.tb}
                onChange={(e) => setInputs({...inputs, tb: parseFloat(e.target.value)})}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-medical-500"
              />
            </div>

            {/* Umur Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Umur Balita</label>
                <span className="text-2xl font-black text-medical-600">{inputs.umur} <span className="text-xs">bln</span></span>
              </div>
              <input 
                type="range" min="0" max="60" step="1"
                value={inputs.umur}
                onChange={(e) => setInputs({...inputs, umur: parseInt(e.target.value)})}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-medical-500"
              />
            </div>
          </div>

          {/* Result Card */}
          {result && (
            <div className={`rounded-[2.5rem] p-8 border-2 shadow-2xl transition-all duration-500 scale-100 ${
              result.category.includes('Buruk') ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-rose-100' :
              result.category.includes('Kurang') ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-amber-100' :
              result.category.includes('Baik') ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-emerald-100' :
              'bg-blue-50 border-blue-200 text-blue-900 shadow-blue-100'
            }`}>
              <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-2">Hasil Perhitungan</p>
              <h2 className="text-4xl font-black tracking-tighter mb-4">{result.category}</h2>
              <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm rounded-2xl px-4 py-2 inline-flex">
                <span className="text-xs font-bold opacity-60">Nilai SPK:</span>
                <span className="text-xl font-black">{result.value.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Logic Visualization */}
        <div className="lg:col-span-8 space-y-8">
          {/* Step 1: Fuzzification */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center">
              <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] mr-3">1</span>
              Fuzzification (Derajat Keanggotaan)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* BB Memberships */}
              <div className="space-y-4">
                <p className="text-xs font-black text-slate-800 mb-4 border-b border-slate-50 pb-2">Berat Badan</p>
                <MembershipBar label="Rendah" value={result?.details?.fuzzification?.bbM?.rendah} color="text-rose-500" />
                <MembershipBar label="Normal" value={result?.details?.fuzzification?.bbM?.normal} color="text-emerald-500" />
                <MembershipBar label="Tinggi" value={result?.details?.fuzzification?.bbM?.tinggi} color="text-blue-500" />
              </div>

              {/* TB Memberships */}
              <div className="space-y-4">
                <p className="text-xs font-black text-slate-800 mb-4 border-b border-slate-50 pb-2">Tinggi Badan</p>
                <MembershipBar label="Pendek" value={result?.details?.fuzzification?.tbM?.pendek} color="text-rose-500" />
                <MembershipBar label="Sedang" value={result?.details?.fuzzification?.tbM?.sedang} color="text-emerald-500" />
                <MembershipBar label="Tinggi" value={result?.details?.fuzzification?.tbM?.tinggi} color="text-blue-500" />
              </div>

              {/* Umur Memberships */}
              <div className="space-y-4">
                <p className="text-xs font-black text-slate-800 mb-4 border-b border-slate-50 pb-2">Kategori Umur</p>
                <MembershipBar label="Bayi" value={result?.details?.fuzzification?.uM?.bayi} color="text-indigo-500" />
                <MembershipBar label="Toddler" value={result?.details?.fuzzification?.uM?.toddler} color="text-indigo-500" />
                <MembershipBar label="Balita" value={result?.details?.fuzzification?.uM?.balita} color="text-indigo-500" />
              </div>
            </div>
          </div>

          {/* Step 2: Rules Inference */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center">
              <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] mr-3">2</span>
              Inference (Aturan yang Terpicu)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {params?.rules
                ?.map((rule, idx) => {
                  const bbVal = result?.details?.fuzzification?.bbM?.[rule.bb] || 0;
                  const tbVal = result?.details?.fuzzification?.tbM?.[rule.tb] || 0;
                  const uVal = result?.details?.fuzzification?.uM?.[rule.umur] || 0;
                  const fired = Math.min(bbVal, tbVal, uVal);
                  return { ...rule, fired, id: idx + 1 };
                })
                .filter(r => r.fired > 0)
                .map((rule) => (
                  <div key={rule.id} className="p-5 rounded-[2rem] bg-emerald-50/50 border border-emerald-100 flex items-center justify-between group hover:bg-emerald-50 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-md uppercase tracking-tighter">Rule #{rule.id}</span>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Inference Active</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700 flex items-center flex-wrap gap-2">
                        <span className="bg-white px-2 py-1 rounded-lg border border-slate-100">{rule.bb}</span>
                        <span className="text-slate-300 text-[10px]">&</span>
                        <span className="bg-white px-2 py-1 rounded-lg border border-slate-100">{rule.tb}</span>
                        <span className="text-slate-300 text-[10px]">&</span>
                        <span className="bg-white px-2 py-1 rounded-lg border border-slate-100">{rule.umur}</span>
                        <ArrowRight size={14} className="text-emerald-400 mx-1" />
                        <span className="text-emerald-700 font-black uppercase">{rule.output}</span>
                      </p>
                      <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-medium">
                        <span className="bg-white px-1.5 rounded border border-slate-100">MIN</span>
                        <span>({result?.details?.fuzzification?.bbM?.[rule.bb]?.toFixed(2)}, {result?.details?.fuzzification?.tbM?.[rule.tb]?.toFixed(2)}, {result?.details?.fuzzification?.uM?.[rule.umur]?.toFixed(2)})</span>
                      </div>
                    </div>
                    <div className="text-right pl-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Firing Strength</p>
                      <p className="text-2xl font-black text-emerald-600 leading-none">{rule.fired.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              {result?.details?.firedCount === 0 && (
                <div className="col-span-full p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm font-bold italic">Tidak ada aturan yang terpenuhi 100%</p>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Defuzzification */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center">
                <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] mr-3">3</span>
                Defuzzification (COA)
              </h3>
              <div className="flex space-x-4">
                {Object.entries(params?.centers || {}).map(([key, val]) => (
                  <div key={key} className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase">{key}</p>
                    <p className="text-xs font-bold text-slate-800">{val}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-slate-900 rounded-3xl p-6 text-emerald-400 font-mono text-sm overflow-x-auto">
              <p className="mb-2 text-slate-500">// Center of Area Calculation</p>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p>Numerator</p>
                  <p className="border-t border-emerald-400 mt-1">Denominator</p>
                </div>
                <div className="text-xl"> = </div>
                <div>
                  <p>
                    {Object.entries(result?.details?.aggregation || {})
                      .filter(([_, v]) => v > 0)
                      .map(([key, v], i) => (
                        <span key={key}>
                          {i > 0 && ' + '}
                          ({v.toFixed(2)} * {params?.centers[key]})
                        </span>
                      ))}
                  </p>
                  <p className="border-t border-emerald-400 mt-1">
                    {Object.entries(result?.details?.aggregation || {})
                      .filter(([_, v]) => v > 0)
                      .map(([_, v], i) => (
                        <span key={i}>
                          {i > 0 && ' + '}
                          {v.toFixed(2)}
                        </span>
                      ))}
                  </p>
                </div>
                <div className="text-xl"> = </div>
                <div className="text-2xl font-black text-white">{result?.value.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveCalculation;
