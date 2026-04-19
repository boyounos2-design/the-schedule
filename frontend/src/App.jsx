import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import DoctorsPage from './pages/DoctorsPage';
import AdminCalendarPage from './pages/AdminCalendarPage';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorSchedulePage from './pages/DoctorSchedulePage';

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/doctor'} replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/doctor'} replace /> : <LoginPage />}
      />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/doctors" element={<ProtectedRoute role="admin"><DoctorsPage /></ProtectedRoute>} />
      <Route path="/admin/calendar" element={<ProtectedRoute role="admin"><AdminCalendarPage /></ProtectedRoute>} />

      {/* Doctor routes */}
      <Route path="/doctor" element={<ProtectedRoute role="doctor"><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/schedule" element={<ProtectedRoute role="doctor"><DoctorSchedulePage /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              borderRadius: '10px',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
            },
            success: { iconTheme: { primary: '#34d399', secondary: '#0f172a' } },
            error: { iconTheme: { primary: '#f87171', secondary: '#0f172a' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
