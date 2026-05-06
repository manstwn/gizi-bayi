import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, Heart, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
      {/* Visual Side (Hidden on Mobile) */}
      <div className="hidden md:flex md:w-1/2 bg-medical-600 relative items-center justify-center p-12 overflow-hidden">
        {/* Abstract shapes for medical feel */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 border-4 border-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 border-8 border-white rounded-full opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white rounded-full opacity-30"></div>
        </div>
        
        <div className="relative z-10 text-white text-center max-w-lg">
          <div className="bg-white/10 backdrop-blur-md inline-block p-4 rounded-3xl mb-8 border border-white/20 shadow-2xl">
            <Heart size={64} fill="currentColor" className="text-white" />
          </div>
          <h1 className="text-4xl font-black mb-4 tracking-tight">Sistem Pendukung Keputusan Status Gizi Balita</h1>
          <p className="text-medical-100 text-lg font-medium leading-relaxed">
            Meningkatkan kualitas pelayanan kesehatan di Posyandu Sari Kemuning melalui teknologi cerdas Fuzzy Mamdani.
          </p>
        </div>
        
        {/* Footer info in sidebar */}
        <div className="absolute bottom-8 left-12 right-12 flex justify-between items-center text-medical-100 text-sm">
          <div className="flex items-center space-x-2">
            <ShieldCheck size={18} />
            <span>Sistem Terenkripsi</span>
          </div>
          <span>v1.0.0</span>
        </div>
      </div>

      {/* Login Side */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Header Logo */}
          <div className="md:hidden text-center mb-12">
            <div className="bg-medical-600 inline-block p-4 rounded-2xl shadow-xl mb-4">
              <Heart size={32} fill="white" className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">SPK Gizi Balita</h2>
            <p className="text-slate-400 font-medium">Posyandu Sari Kemuning</p>
          </div>

          <div className="bg-white md:bg-transparent md:border-none rounded-3xl p-8 md:p-0 shadow-xl shadow-slate-200/50 md:shadow-none">
            <div className="mb-8 hidden md:block">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Selamat Datang</h2>
              <p className="text-slate-500 font-medium">Silakan masuk untuk mengakses sistem</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center space-x-3 text-sm animate-shake">
                  <AlertCircle size={20} className="flex-shrink-0" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 px-1 uppercase tracking-wider">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-medical-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-medical-500/10 focus:border-medical-500 transition-all outline-none text-slate-700 font-medium"
                    placeholder="nama_pengguna"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 px-1 uppercase tracking-wider">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-medical-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-medical-500/10 focus:border-medical-500 transition-all outline-none text-slate-700 font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-medical-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:bg-medical-700 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-medical-100/50 flex items-center justify-center space-x-3"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Masuk Ke Dashboard</span>
                )}
              </button>
            </form>
            
            <div className="mt-8 text-center md:text-left">
              <p className="text-slate-400 text-xs font-medium">
                Masalah akses? Hubungi Admin Posyandu atau Pengembang Sistem.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
