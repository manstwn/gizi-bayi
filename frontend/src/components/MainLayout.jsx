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
  FileBarChart,
  Brain,
  Sparkles,
  FlaskConical
} from 'lucide-react';
import { cn } from '../utils/cn';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close menus on path change
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isAdmin = user?.role === 'admin';

  // Define navigations
  const mainNav = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Data Balita', href: '/balita', icon: Baby },
    { name: 'Pemeriksaan', href: '/pemeriksaan', icon: ClipboardList },
    { name: 'Laporan', href: '/laporan', icon: FileBarChart },
    { name: 'Simulasi Perhitungan', href: '/simulation', icon: Cpu },
  ];

  const nbNav = [
    { name: 'NB — Training', href: '/naive-bayes/train', icon: Brain },
    { name: 'NB — Prediksi', href: '/naive-bayes/predict', icon: Sparkles },
    { name: 'NB — Data Dummy', href: '/naive-bayes/dummy', icon: FlaskConical },
  ];

  const adminNav = [
    { name: 'Pengguna', href: '/users', icon: Users },
    { name: 'Pengaturan', href: '/settings', icon: Settings },
  ];

  const allAdminNav = [...mainNav, ...nbNav, ...adminNav];

  // ─── KADER LAYOUT (TOP NAV BAR) ─────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              {/* Logo and Brand */}
              <div className="flex items-center space-x-3">
                <div className="bg-medical-500 p-2 rounded-xl text-white shadow-md shadow-medical-100 flex-shrink-0">
                  <Heart size={20} fill="currentColor" />
                </div>
                <div>
                  <h1 className="text-sm font-black text-slate-800 leading-none">Posyandu</h1>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Sari Kemuning</p>
                </div>
              </div>

              {/* Desktop Menu */}
              <nav className="hidden md:flex space-x-1 items-center">
                {mainNav.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "flex items-center space-x-2 px-3 py-2 rounded-xl transition-all font-bold text-xs uppercase tracking-wide",
                        isActive
                          ? "bg-medical-50 text-medical-600 border border-medical-100/50"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      )}
                    >
                      <item.icon size={15} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* User Profile & Logout */}
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <User size={14} className="text-slate-400" />
                  <span className="text-xs font-black text-slate-700">{user?.nama}</span>
                  <span className="text-[9px] bg-slate-200 text-slate-500 font-extrabold px-1.5 py-0.5 rounded uppercase">Kader</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 font-black text-xs uppercase tracking-wide transition-all"
                >
                  <LogOut size={16} />
                  <span>Keluar</span>
                </button>
              </div>

              {/* Mobile Menu Button */}
              <div className="flex items-center md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-inner animate-in slide-in-from-top duration-200">
              {mainNav.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-xl transition-all font-bold text-sm",
                      isActive
                        ? "bg-medical-50 text-medical-600 shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    )}
                  >
                    <item.icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <hr className="my-2 border-slate-100" />
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center space-x-2 truncate">
                  <User size={16} className="text-slate-400" />
                  <span className="text-xs font-black text-slate-700 truncate">{user?.nama}</span>
                </div>
                <span className="text-[8px] bg-slate-200 text-slate-500 font-extrabold px-1.5 py-0.5 rounded uppercase">Kader</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 p-3 text-red-500 hover:bg-red-50 font-bold text-sm rounded-xl transition-all"
              >
                <LogOut size={16} />
                <span>Keluar Sistem</span>
              </button>
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full page-enter">
          {children}
        </main>
      </div>
    );
  }

  // ─── ADMIN LAYOUT (LEFT SIDEBAR) ───────────────────────────────────────────
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
          {mainNav.map((item) => {
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

          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 mb-2">Naive Bayes</p>
          {nbNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-xl transition-all group",
                  isActive 
                    ? "bg-violet-50 text-violet-600 shadow-sm border border-violet-100/50" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <item.icon size={20} className={cn("transition-transform group-hover:scale-110", isActive ? "text-violet-600" : "text-slate-400")} />
                <span className="font-semibold text-sm">{item.name}</span>
              </Link>
            );
          })}

          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 mb-2">Sistem</p>
          {adminNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-xl transition-all group",
                  isActive 
                    ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-100/50" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <item.icon size={20} className={cn("transition-transform group-hover:scale-110", isActive ? "text-blue-600" : "text-slate-400")} />
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
            {allAdminNav.find(n => n.href === location.pathname)?.name || 'Detail'}
          </h2>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full page-enter">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
