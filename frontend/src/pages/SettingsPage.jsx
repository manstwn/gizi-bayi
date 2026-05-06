import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Settings, Save, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

const SettingsPage = () => {
  const [params, setParams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeRuleTab, setActiveRuleTab] = useState('bayi');

  useEffect(() => {
    fetchParams();
  }, []);

  const fetchParams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/fuzzy');
      setParams(res.data);
    } catch (error) {
      console.error('Error fetching params:', error);
      setMessage({ type: 'error', text: 'Gagal mengambil parameter fuzzy' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      await api.post('/settings/fuzzy', params);
      setMessage({ type: 'success', text: 'Parameter berhasil disimpan!' });
    } catch (error) {
      console.error('Error saving params:', error);
      setMessage({ type: 'error', text: 'Gagal menyimpan parameter' });
    } finally {
      setSaving(false);
    }
  };

  const updateParam = (category, subcategory, index, value) => {
    const newParams = { ...params };
    newParams[category][subcategory][index] = parseFloat(value);
    setParams(newParams);
  };

  const updateCenter = (key, value) => {
    const newParams = { ...params };
    newParams.centers[key] = parseFloat(value);
    setParams(newParams);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-medical-600 mb-4" size={40} />
        <p className="text-slate-500 font-medium">Memuat parameter...</p>
      </div>
    );
  }

  const ParameterGroup = ({ title, category, fields }) => (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-800 flex items-center space-x-2">
          <span className="w-2 h-6 bg-medical-500 rounded-full mr-1"></span>
          {title}
        </h3>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fields.map((field) => (
          <div key={field.key} className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{field.label}</label>
            <div className="flex items-center space-x-2">
              {params[category][field.key].map((val, idx) => (
                <input
                  key={idx}
                  type="number"
                  step="0.1"
                  value={val}
                  onChange={(e) => updateParam(category, field.key, idx, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all"
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-400 italic">
              {params[category][field.key].length === 3 ? 'Segitiga (a, b, c)' : 'Trapesium (a, b, c, d)'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
            <Settings className="mr-3 text-medical-600" size={32} />
            Pengaturan Fuzzy Mamdani
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Sesuaikan parameter fungsi keanggotaan untuk perhitungan status gizi.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-medical-600 hover:bg-medical-700 text-white px-8 py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-medical-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {saving ? (
            <RefreshCw className="animate-spin" size={20} />
          ) : (
            <Save className="group-hover:scale-110 transition-transform" size={20} />
          )}
          <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
        </button>
      </div>

      {message && (
        <div className={`mb-8 p-4 rounded-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-sm">{message.text}</span>
        </div>
      )}

      <div className="space-y-2">
        <ParameterGroup 
          title="Berat Badan (BB)" 
          category="bb" 
          fields={[
            { key: 'rendah', label: 'Rendah (kg)' },
            { key: 'normal', label: 'Normal (kg)' },
            { key: 'tinggi', label: 'Tinggi (kg)' },
          ]} 
        />

        <ParameterGroup 
          title="Tinggi Badan (TB)" 
          category="tb" 
          fields={[
            { key: 'pendek', label: 'Pendek (cm)' },
            { key: 'sedang', label: 'Sedang (cm)' },
            { key: 'tinggi', label: 'Tinggi (cm)' },
          ]} 
        />

        <ParameterGroup 
          title="Umur" 
          category="umur" 
          fields={[
            { key: 'bayi', label: 'Bayi (bln)' },
            { key: 'toddler', label: 'Toddler (bln)' },
            { key: 'balita', label: 'Balita (bln)' },
          ]} 
        />

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="font-bold text-slate-800 flex items-center space-x-2">
                <span className="w-2 h-6 bg-medical-500 rounded-full mr-1"></span>
                Basis Aturan (Rule Base)
              </h3>
              
              <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200">
                {['bayi', 'toddler', 'balita'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveRuleTab(tab)}
                    className={`px-6 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      activeRuleTab === tab 
                        ? 'bg-white text-medical-600 shadow-sm ring-1 ring-slate-200' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => {
                  const newParams = { ...params };
                  newParams.rules.push({ bb: 'normal', tb: 'sedang', umur: activeRuleTab, output: 'baik' });
                  setParams(newParams);
                }}
                className="text-xs bg-medical-600 hover:bg-medical-700 text-white font-black uppercase tracking-widest py-2 px-6 rounded-xl shadow-lg shadow-medical-100 transition-all flex items-center space-x-2"
              >
                <span>+ Aturan {activeRuleTab}</span>
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {params.rules
                .map((rule, originalIndex) => ({ ...rule, originalIndex }))
                .filter(rule => rule.umur === activeRuleTab)
                .map((rule, filteredIndex) => (
                  <div key={rule.originalIndex} className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group animate-in fade-in slide-in-from-left-2">
                    <span className="text-sm font-bold text-slate-400 min-w-[30px]">{filteredIndex + 1}. IF</span>
                    
                    {/* BB Select */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-500 text-[10px] uppercase">Berat Badan</span>
                      <select 
                        value={rule.bb} 
                        onChange={(e) => {
                          const newParams = { ...params };
                          newParams.rules[rule.originalIndex].bb = e.target.value;
                          setParams(newParams);
                        }}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-semibold text-slate-700"
                      >
                        <option value="">-</option>
                        <option value="rendah">Rendah</option>
                        <option value="normal">Normal</option>
                        <option value="tinggi">Tinggi</option>
                      </select>
                    </div>

                    <span className="text-xs font-bold text-slate-400">AND</span>

                    {/* TB Select */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-500 text-[10px] uppercase">Tinggi Badan</span>
                      <select 
                        value={rule.tb} 
                        onChange={(e) => {
                          const newParams = { ...params };
                          newParams.rules[rule.originalIndex].tb = e.target.value;
                          setParams(newParams);
                        }}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-semibold text-slate-700"
                      >
                        <option value="">-</option>
                        <option value="pendek">Pendek</option>
                        <option value="sedang">Sedang</option>
                        <option value="tinggi">Tinggi</option>
                      </select>
                    </div>

                    <span className="text-xs font-bold text-slate-400">AND</span>

                    {/* Umur Select (Disabled since we filter by tab) */}
                    <div className="flex items-center space-x-2 opacity-50">
                      <span className="text-xs font-bold text-slate-500 text-[10px] uppercase">Kategori</span>
                      <span className="bg-slate-200 px-3 py-1 rounded-lg text-xs font-black text-slate-600 uppercase tracking-tighter">
                        {rule.umur}
                      </span>
                    </div>

                    <span className="text-sm font-bold text-medical-600">THEN</span>

                    <div className="flex items-center space-x-2 bg-white border border-slate-100 rounded-xl px-3 py-1.5 shadow-sm">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Status Gizi</span>
                      <select 
                        value={rule.output} 
                        onChange={(e) => {
                          const newParams = { ...params };
                          newParams.rules[rule.originalIndex].output = e.target.value;
                          setParams(newParams);
                        }}
                        className={`bg-transparent border-none focus:ring-0 p-0 text-sm font-bold ${
                          rule.output === 'buruk' ? 'text-rose-600' :
                          rule.output === 'kurang' ? 'text-amber-600' :
                          rule.output === 'baik' ? 'text-emerald-600' :
                          'text-blue-600'
                        }`}
                      >
                        <option value="buruk">Buruk</option>
                        <option value="kurang">Kurang</option>
                        <option value="baik">Baik</option>
                        <option value="lebih">Lebih</option>
                      </select>
                    </div>

                    <button 
                      onClick={() => {
                        const newParams = { ...params };
                        newParams.rules.splice(rule.originalIndex, 1);
                        setParams(newParams);
                      }}
                      className="ml-auto p-2 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <AlertCircle className="rotate-45" size={16} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center space-x-2">
              <span className="w-2 h-6 bg-medical-500 rounded-full mr-1"></span>
              Titik Tengah Defuzzifikasi (Centers)
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.keys(params.centers).map((key) => (
              <div key={key} className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{key}</label>
                <input
                  type="number"
                  value={params.centers[key]}
                  onChange={(e) => updateCenter(key, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
