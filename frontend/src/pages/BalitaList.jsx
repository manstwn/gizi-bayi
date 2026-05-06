import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Baby,
  User,
  MapPin,
  Calendar,
  X,
  Smartphone
} from 'lucide-react';
import { cn } from '../utils/cn';

const BalitaList = () => {
  const [balita, setBalita] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBalita, setCurrentBalita] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    jenis_kelamin: 'L',
    tanggal_lahir: '',
    nama_orang_tua: '',
    alamat: '',
    kontak: ''
  });

  const fetchBalita = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/balita?search=${search}`);
      setBalita(response.data);
    } catch (error) {
      console.error('Error fetching balita:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBalita();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenModal = (item = null) => {
    if (item) {
      setCurrentBalita(item);
      setFormData(item);
    } else {
      setCurrentBalita(null);
      setFormData({
        nama: '',
        jenis_kelamin: 'L',
        tanggal_lahir: '',
        nama_orang_tua: '',
        alamat: '',
        kontak: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentBalita) {
        await api.put(`/balita/${currentBalita.id}`, formData);
      } else {
        await api.post('/balita', formData);
      }
      fetchBalita();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving balita:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus data balita ini secara permanen?')) {
      try {
        await api.delete(`/balita/${id}`);
        fetchBalita();
      } catch (error) {
        console.error('Error deleting balita:', error);
      }
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let months = (today.getFullYear() - birth.getFullYear()) * 12;
    months += today.getMonth() - birth.getMonth();
    return months >= 0 ? months : 0;
  };

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

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Cari nama balita atau orang tua..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-11"
          />
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          <Plus size={20} />
          <span>Tambah Data</span>
        </button>
      </div>

      <div className="medical-card overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-900 text-xs font-black uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">Nama Balita</th>
                <th className="px-6 py-4 text-center">L/P</th>
                <th className="px-6 py-4">Tgl Lahir</th>
                <th className="px-6 py-4 text-center">Umur</th>
                <th className="px-6 py-4">Keluarga</th>
                <th className="px-6 py-4">Alamat</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-medium italic">Memuat data...</td></tr>
              ) : balita.length > 0 ? (
                balita.map((item) => (
                  <tr key={item.id} className="text-sm hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-800">
                       {item.nama}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className={`font-bold ${item.jenis_kelamin === 'L' ? 'text-blue-600' : 'text-rose-600'}`}>
                          {item.jenis_kelamin}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                       {formatIndoDate(item.tanggal_lahir)}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">
                       {calculateAge(item.tanggal_lahir)} bln / {Math.floor(calculateAge(item.tanggal_lahir) / 12)} thn
                    </td>
                    <td className="px-6 py-4">
                       <p className="font-bold text-slate-700 text-xs">{item.nama_orang_tua || '-'}</p>
                       <p className="text-[10px] text-slate-400">{item.kontak || '-'}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                       <p className="line-clamp-1">{item.alamat || '-'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-1">
                        <button onClick={() => handleOpenModal(item)} className="p-2 text-medical-600 hover:bg-medical-50 rounded-xl transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">Data balita tidak tersedia</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-50">
          {loading ? (
            <div className="p-8 text-center text-slate-400 italic">Memuat data...</div>
          ) : balita.map(item => (
            <div key={item.id} className="p-5 flex items-start justify-between">
              <div className="flex space-x-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0",
                  item.jenis_kelamin === 'L' ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
                )}>
                  {item.nama.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base mb-1">{item.nama}</h4>
                  <p className="text-xs text-slate-500 font-medium mb-3">{item.nama_orang_tua} • {item.kontak}</p>
                  <div className="flex space-x-2">
                    <button onClick={() => handleOpenModal(item)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="px-3 py-1.5 bg-rose-50 text-rose-500 rounded-lg text-[10px] font-black uppercase tracking-widest">Hapus</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden scale-in">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center space-x-3">
                 <div className="bg-medical-500 p-2.5 rounded-2xl text-white shadow-lg shadow-medical-100">
                    <Baby size={24} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">
                      {currentBalita ? 'Update Pasien' : 'Registrasi Balita'}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Formulir Data Antropometri</p>
                 </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-600 rounded-full transition-all shadow-sm">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nama Lengkap Pasien</label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({...formData, nama: e.target.value})}
                    className="input-field"
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Jenis Kelamin</label>
                  <div className="grid grid-cols-2 gap-2">
                     <button 
                        type="button" 
                        onClick={() => setFormData({...formData, jenis_kelamin: 'L'})}
                        className={cn("py-2.5 rounded-xl text-xs font-bold border transition-all", formData.jenis_kelamin === 'L' ? "bg-blue-50 border-blue-200 text-blue-600 ring-2 ring-blue-500/10" : "bg-white border-slate-200 text-slate-400")}
                     >Laki-laki</button>
                     <button 
                        type="button" 
                        onClick={() => setFormData({...formData, jenis_kelamin: 'P'})}
                        className={cn("py-2.5 rounded-xl text-xs font-bold border transition-all", formData.jenis_kelamin === 'P' ? "bg-rose-50 border-rose-200 text-rose-600 ring-2 ring-rose-500/10" : "bg-white border-slate-200 text-slate-400")}
                     >Perempuan</button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal_lahir}
                    onChange={(e) => setFormData({...formData, tanggal_lahir: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Wali / Orang Tua</label>
                  <input
                    type="text"
                    value={formData.nama_orang_tua}
                    onChange={(e) => setFormData({...formData, nama_orang_tua: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nomor Telepon</label>
                  <input
                    type="text"
                    value={formData.kontak}
                    onChange={(e) => setFormData({...formData, kontak: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Alamat Domisili</label>
                  <textarea
                    rows="2"
                    value={formData.alamat}
                    onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                    className="input-field resize-none"
                  ></textarea>
                </div>
              </div>
              <div className="flex items-center space-x-4 mt-10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3.5 text-sm font-bold text-slate-500 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"
                >
                  Batalkan
                </button>
                <button
                  type="submit"
                  className="flex-[2] px-4 py-3.5 text-sm font-bold text-white bg-medical-600 rounded-2xl hover:bg-medical-700 shadow-xl shadow-medical-100 transition-all active:scale-95"
                >
                  Simpan Data Pasien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalitaList;
