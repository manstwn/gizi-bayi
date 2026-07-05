import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  Baby,
  CalendarDays
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { cn } from '../utils/cn';

const DashboardCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="medical-card p-6 flex flex-col justify-between">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color} shadow-lg shadow-current/10`}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <span className="text-[10px] font-bold px-2 py-1 bg-green-50 text-green-600 rounded-lg uppercase tracking-wider">
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBalita: 0,
    totalPemeriksaan: 0,
    kategoriDist: [],
    recentPemeriksaan: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [balitaRes, pemeriksaanRes] = await Promise.all([
          api.get('/balita'),
          api.get('/pemeriksaan')
        ]);

        const balita = balitaRes.data;
        const pemeriksaan = pemeriksaanRes.data;

        const dist = {
          'Gizi Buruk': 0,
          'Gizi Kurang': 0,
          'Gizi Baik': 0,
          'Gizi Lebih': 0
        };

        pemeriksaan.forEach(p => {
          if (dist[p.kategori_gizi] !== undefined) {
            dist[p.kategori_gizi]++;
          }
        });

        const chartData = Object.keys(dist).map(name => ({
          name,
          value: dist[name]
        }));

        setStats({
          totalBalita: balita.length,
          totalPemeriksaan: pemeriksaan.length,
          kategoriDist: chartData,
          recentPemeriksaan: pemeriksaan.slice(0, 5)
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#0ea5e9'];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-medical-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Ringkasan Kesehatan</h2>
          <p className="text-slate-500 font-medium">Statistik status gizi balita di Posyandu Sari Kemuning</p>
        </div>
        <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
           <div className="bg-slate-50 p-2 rounded-xl">
              <CalendarDays size={20} className="text-slate-400" />
           </div>
           <span className="text-sm font-bold text-slate-600 pr-2">Mei, 2026</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard 
          title="Terdaftar" 
          value={stats.totalBalita} 
          icon={Users} 
          color="bg-medical-500" 
          trend="+2 Baru"
        />
        <DashboardCard 
          title="Total Check" 
          value={stats.totalPemeriksaan} 
          icon={Activity} 
          color="bg-accent-teal" 
        />
        <DashboardCard 
          title="Status Baik" 
          value={stats.kategoriDist.find(d => d.name === 'Gizi Baik')?.value || 0} 
          icon={TrendingUp} 
          color="bg-green-500" 
        />
        <DashboardCard 
          title="Risiko Tinggi" 
          value={(stats.kategoriDist.find(d => d.name === 'Gizi Buruk')?.value || 0) + (stats.kategoriDist.find(d => d.name === 'Gizi Kurang')?.value || 0)} 
          icon={AlertTriangle} 
          color="bg-rose-500" 
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="medical-card p-6 lg:col-span-1">
          <h3 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-wider text-xs">Proporsi Status Gizi</h3>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.kategoriDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.kategoriDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-800">{stats.totalPemeriksaan}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
            {stats.kategoriDist.map((entry, index) => (
              <div key={entry.name} className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 border border-slate-100/50">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-slate-400 uppercase">{entry.name}</span>
                   <span className="text-xs font-black text-slate-700">{entry.value} Balita</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="medical-card p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-wider text-xs">Trend Kategori Terdeteksi</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.kategoriDist} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  fontSize={10} 
                  fontWeight={700} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8' }}
                />
                <YAxis 
                  fontSize={10} 
                  fontWeight={700} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                   dataKey="value" 
                   radius={[10, 10, 0, 0]} 
                   barSize={40}
                >
                   {stats.kategoriDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="medical-card overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Aktivitas Pemeriksaan Terakhir</h3>
          <button className="text-medical-600 font-bold text-xs flex items-center space-x-1 hover:underline">
             <span>Lihat Semua</span>
             <ArrowRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Informasi Balita</th>
                <th className="px-6 py-4">Waktu Check</th>
                <th className="px-6 py-4">Status Nutrisi</th>
                <th className="px-6 py-4">Skor SPK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats.recentPemeriksaan.length > 0 ? (
                stats.recentPemeriksaan.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-medical-100 group-hover:text-medical-600 transition-colors">
                          <Baby size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{p.Balita?.nama}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                            ID: {p.balita_id} • {p.metode || 'WHO'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-xs font-bold text-slate-600">{p.tanggal_pemeriksaan}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm inline-block",
                        p.kategori_gizi === 'Gizi Baik' ? 'bg-green-50 text-green-600 border border-green-100' :
                        p.kategori_gizi === 'Gizi Lebih' ? 'bg-medical-50 text-medical-600 border border-medical-100' :
                        p.kategori_gizi === 'Gizi Kurang' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-rose-50 text-rose-600 border border-rose-100'
                      )}>
                        {p.kategori_gizi}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center space-x-2">
                          {(p.metode || 'WHO') === 'Naive Bayes' ? (
                            <>
                              <div className="flex-1 bg-slate-100 h-1.5 w-16 rounded-full overflow-hidden">
                                 <div className="bg-medical-500 h-full" style={{ width: `${p.hasil_fuzzy}%` }}></div>
                              </div>
                              <span className="text-xs font-black text-slate-700 font-mono" title="Tingkat Keyakinan">{p.hasil_fuzzy.toFixed(1)}%</span>
                            </>
                          ) : (
                            <span className="text-xs font-black text-slate-700 font-mono" title="Z-Score BB/TB">Z: {p.hasil_fuzzy.toFixed(2)}</span>
                          )}
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-medium">Belum ada aktivitas pemeriksaan yang tercatat</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
