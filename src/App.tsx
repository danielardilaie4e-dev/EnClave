import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/useAuth';
import { Toaster } from 'sonner';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Jobs from './pages/Jobs';
import Onboarding from './pages/Onboarding';
import Auth from './pages/Auth';
import JobDetail from './pages/JobDetail';
import ArtistProfile from './pages/ArtistProfile';
import { hasOnboardingIntent } from './lib/onboardingIntent';

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:jobId" element={<JobDetail />} />
          <Route path="/artists/:uid" element={user ? <ArtistProfile /> : <Navigate to="/auth" replace />} />
          <Route
            path="/auth"
            element={
              user
                ? <Navigate to={profile || !hasOnboardingIntent(user.uid) ? '/dashboard' : '/onboarding'} replace />
                : <Auth />
            }
          />
          <Route
            path="/onboarding"
            element={
              user
                ? (profile ? <Navigate to="/dashboard" replace /> : <Onboarding />)
                : <Navigate to="/" replace />
            }
          />
          <Route 
            path="/dashboard" 
            element={
              user
                ? (profile ? <Dashboard /> : <Navigate to="/onboarding" replace />)
                : <Navigate to="/" replace />
            }
          />
          <Route 
            path="/profile" 
            element={
              user
                ? (profile ? <Profile /> : <Navigate to="/onboarding" replace />)
                : <Navigate to="/" replace />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster position="top-center" />
      </Router>
    </AuthProvider>
  );
}
