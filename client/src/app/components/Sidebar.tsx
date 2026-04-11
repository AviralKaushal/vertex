import { Link, useLocation } from 'react-router';
import { Home, Landmark, History, ArrowLeftRight, Link2, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  
  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/accounts', label: 'My Banks', icon: Landmark },
    { path: '/transactions', label: 'Transaction History', icon: History },
    { path: '/transfer', label: 'Transfer Funds', icon: ArrowLeftRight },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/connect', label: 'Connect Bank', icon: Link2 },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-20">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-sm flex items-center justify-center">
            <div className="w-3 h-3 border-2 border-white rounded-sm"></div>
          </div>
          <span className="text-xl font-bold text-slate-900">Vertex</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-200 mt-auto">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-colors text-slate-600 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}