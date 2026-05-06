import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Baby, 
  ClipboardList, 
  FileText, 
  Users, 
  LogOut,
  Menu,
  X,
  User,
  Heart,
  Settings,
  Cpu,
  FileBarChart
} from 'lucide-react';
import { cn } from '../utils/cn';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed on mobile

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Data Balita', href: '/balita', icon: Baby },
    { name: 'Pemeriksaan', href: '/pemeriksaan', icon: ClipboardList },
    { name: 'Laporan', href: '/laporan', icon: FileBarChart },
    { name: 'Simulasi Perhitungan', href: '/simulation', icon: Cpu },
  ];

  if (user?.role === 'admin' || user?.role === 'kader') {
    navigation.push({ name: 'Pengguna', href: '/users', icon: Users });
    navigation.push({ name: 'Pengaturan', href: '/settings', icon: Settings });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 h-16 px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-2 text-medical-600">
          <Heart size={24} fill="currentColor" />
          <span className="font-bold text-slate-800">SPK Gizi</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar Overlay (Mobile Only) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white border-r border-slate-200 w-72 flex-shrink-0 fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col h-screen",
          !isSidebarOpen && "-translate-x-full"
        )}
      >
        <div className="p-6 hidden md:flex items-center space-x-3 border-b border-slate-50">
          <div className="bg-medical-500 p-2 rounded-xl text-white shadow-lg shadow-medical-100">
            <Heart size={24} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Posyandu</h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Sari Kemuning</p>
          </div>
        </div>
        
        <nav className="mt-6 px-4 space-y-1.5 flex-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Menu Utama</p>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-xl transition-all group",
                  isActive 
                    ? "bg-medical-50 text-medical-600 shadow-sm border border-medical-100/50" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <item.icon size={20} className={cn("transition-transform group-hover:scale-110", isActive ? "text-medical-600" : "text-slate-400")} />
                <span className="font-semibold text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-50 mt-auto">
          <div className="bg-slate-50 rounded-2xl p-4 mb-3">
            <div className="flex items-center justify-between space-x-3">
              <div className="flex items-center space-x-3 truncate">
                <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-medical-600 shadow-sm flex-shrink-0">
                  <User size={20} />
                </div>
                <div className="truncate">
                  <p className="font-bold text-sm text-slate-800 truncate">{user?.nama}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{user?.role}</p>
                </div>
              </div>
              <Link 
                to="/profile" 
                className="p-2 text-slate-400 hover:text-medical-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100"
                title="Edit Profil"
              >
                <Settings size={18} />
              </Link>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl text-red-500 hover:bg-red-50 font-bold text-sm transition-all"
          >
            <LogOut size={18} />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-72">
        <header className="hidden md:flex bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 items-center px-8 sticky top-0 z-30">
          <h2 className="text-xl font-bold text-slate-800">
            {navigation.find(n => n.href === location.pathname)?.name || 'Detail'}
          </h2>
          <div className="ml-auto flex items-center space-x-4">
             {/* Search or other top actions can go here */}
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full page-enter">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
