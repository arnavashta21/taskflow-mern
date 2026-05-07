import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Icons } from '../ui/Icons';
import toast from 'react-hot-toast';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    navigate('/login');
  };

  return (
    <div className="page-wrapper">
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Icons.logo />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.125rem',
              background: 'linear-gradient(135deg, var(--accent-2), var(--blue))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>
              TaskFlow
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 10px', flex: 1 }}>
          <div style={{ marginBottom: 4 }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)',
              textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 8px', marginBottom: 4 }}>
              Main
            </p>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icons.dashboard /><span>Dashboard</span>
            </NavLink>
            <NavLink to="/my-tasks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icons.tasks /><span>My Tasks</span>
            </NavLink>
            <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icons.projects /><span>Projects</span>
            </NavLink>
          </div>
        </nav>

        {/* User */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2" style={{ padding: '8px', borderRadius: 'var(--radius)', marginBottom: 4 }}>
            <img src={user?.avatar} alt={user?.name} className="avatar" width={32} height={32} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p className="truncate" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{user?.name}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="nav-item" style={{ color: 'var(--text-3)', width: '100%' }}>
            <Icons.logout /><span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}