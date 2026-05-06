import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Lock, Save, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

const ProfilePage = () => {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    nama: user?.nama || '',
    username: user?.username || '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Password konfirmasi tidak cocok!' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      
      const payload = {
        nama: formData.nama,
        username: formData.username,
      };
      
      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await api.put('/auth/profile', payload);
      
      // Update local storage and context
      const userData = JSON.parse(localStorage.getItem('user'));
      const newUserData = { ...userData, ...response.data.user };
      localStorage.setItem('user', JSON.stringify(newUserData));
      
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Gagal memperbarui profil' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pengaturan Profil</h1>
        <p className="text-slate-500 mt-2">Kelola informasi pribadi dan keamanan akun Anda.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-sm">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Info */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex items-center space-x-3">
            <User size={20} className="text-medical-600" />
            <h3 className="font-bold text-slate-800">Informasi Pribadi</h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Nama Lengkap</label>
              <input
                type="text"
                required
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-medical-500 transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Username</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-medical-500 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex items-center space-x-3">
            <Lock size={20} className="text-medical-600" />
            <h3 className="font-bold text-slate-800">Keamanan & Password</h3>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Password Baru</label>
                <input
                  type="password"
                  placeholder="Isi jika ingin mengganti"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-medical-500 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Konfirmasi Password</label>
                <input
                  type="password"
                  placeholder="Ulangi password baru"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-medical-500 transition-all outline-none"
                />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400 italic font-medium bg-slate-50 p-3 rounded-xl inline-block border border-slate-100">
              Kosongkan field password jika Anda tidak ingin mengubah password saat ini.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-medical-600 hover:bg-medical-700 text-white px-10 py-4 rounded-[2rem] font-bold flex items-center justify-center space-x-2 shadow-xl shadow-medical-100 transition-all disabled:opacity-50 active:scale-95 group"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : (
              <Save className="group-hover:scale-110 transition-transform" size={20} />
            )}
            <span>{loading ? 'Menyimpan...' : 'Perbarui Profil'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
