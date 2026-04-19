import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, Calendar, LogOut,
  Stethoscope, Menu, X, ChevronRight, Hospital
} from 'lucide-react';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/doctors', label: 'Doctors', icon: Users },
  { to: '/admin/calendar', label: 'Master Calendar', icon: Calendar },
];

const doctorLinks = [
  { to: '/doctor', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/doctor/schedule', label: 'My Schedule', icon: Calendar },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = isAdmin ? adminLinks : doctorLinks;

  const isActive = (link) => {
    if (link.exact) return location.pathname === link.to;
    return location.pathname.startsWith(link.to);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const NavContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Stethoscope size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>MedSchedule</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isAdmin ? 'Admin Portal' : 'Doctor Portal'}
            </div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{
          background: 'var(--color-surface-2)',
          borderRadius: 10,
          padding: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34,
              background: isAdmin
                ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                : 'linear-gradient(135deg, #14b8a6, #0d9488)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'white',
              flexShrink: 0,
            }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
              {user?.specialty && (
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.specialty}
                </div>
              )}
              <span style={{
                display: 'inline-block',
                marginTop: 2,
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: isAdmin ? '#a78bfa' : '#14b8a6',
                background: isAdmin ? 'rgba(139,92,246,0.1)' : 'rgba(20,184,166,0.1)',
                padding: '2px 6px',
                borderRadius: 4,
              }}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {links.map((link) => {
          const active = isActive(link);
          const Icon = link.icon;
          return (
            <button
              key={link.to}
              onClick={() => { navigate(link.to); setMobileOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                width: '100%',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                background: active ? 'rgba(20,184,166,0.1)' : 'transparent',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={17} />
              <span style={{ flex: 1 }}>{link.label}</span>
              {active && <ChevronRight size={14} />}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--color-border)' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8,
            border: 'none', width: '100%', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
            color: '#f87171', background: 'rgba(239,68,68,0.08)',
            transition: 'all 0.15s ease',
          }}
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div style={{
        display: 'none',
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 56,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        zIndex: 99,
        padding: '0 16px',
        alignItems: 'center',
        justifyContent: 'space-between',
      }} className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30,
            background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Stethoscope size={16} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>MedSchedule</span>
        </div>
        <button className="hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <NavContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            display: 'none',
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 99,
          }}
          className="mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .mobile-topbar { display: flex !important; }
          .mobile-overlay { display: block !important; }
        }
      `}</style>
    </>
  );
}
