import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Stethoscope, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // In the new Firebase setup, login handles the username@hospital.com conversion
      await login(username, password);
      toast.success(`Welcome back!`);
      // Navigation will be handled by the protected route or we can just redirect to root
      // Since AuthProvider provides the 'user' state which updates once Firestore is ready.
      navigate('/'); 
    } catch (err) {
      console.error('Login error:', err);
      let msg = 'Login failed. Check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid username or password.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (role) => {
    if (role === 'admin') { setUsername('admin'); setPassword('admin123'); }
    else { setUsername('dr.ahmed'); setPassword('doctor123'); }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute',
        top: '20%', left: '50%',
        transform: 'translateX(-50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%', right: '10%',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }} className="fade-in">
        {/* Logo / Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64,
            background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
            borderRadius: 18,
            boxShadow: '0 8px 32px rgba(20,184,166,0.35)',
            marginBottom: 16,
          }}>
            <Stethoscope size={32} color="white" />
          </div>
          <h1 style={{
            fontSize: 28, fontWeight: 800,
            background: 'linear-gradient(135deg, #f1f5f9 30%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            MedSchedule
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
            Hospital Doctor Scheduling System
          </p>
        </div>

        {/* Login card */}
        <div className="card" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Sign In</h2>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
            }}>
              <AlertCircle size={15} style={{ color: '#f87171', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#f87171' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="label">Username</label>
              <input
                id="login-username"
                type="text"
                className="input"
                placeholder="e.g. dr.ahmed"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  className="input"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block',
                  }} />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Quick demo buttons */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: 10 }}>
              QUICK DEMO LOGIN
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                id="demo-admin"
                className="btn btn-secondary btn-sm"
                onClick={() => quickFill('admin')}
                style={{ justifyContent: 'center', fontSize: 12 }}
              >
                👑 Admin
              </button>
              <button
                id="demo-doctor"
                className="btn btn-secondary btn-sm"
                onClick={() => quickFill('doctor')}
                style={{ justifyContent: 'center', fontSize: 12 }}
              >
                👨‍⚕️ Doctor
              </button>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)', marginTop: 20 }}>
          © 2026 Hospital Scheduling System
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
