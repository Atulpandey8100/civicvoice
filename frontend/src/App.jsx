import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import IssueDetailPage from './pages/IssueDetailPage';
import CreateIssuePage from './pages/CreateIssuePage';
import EditIssuePage from './pages/EditIssuePage';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import ReportIssuePage from './pages/ReportIssuePage';
import ExploreIssuesPage from './pages/ExploreIssuesPage';
import CommunityMapPage from './pages/CommunityMapPage';
import DashboardPage from './pages/DashboardPage';
import AboutPage from './pages/AboutPage';
import HowItWorksPage from './pages/HowItWorksPage';
import PrivacyPage from './pages/PrivacyPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';
import LandingPage from './pages/LandingPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/auth" />;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="flex min-h-screen flex-col bg-bg">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="/community" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/issues/:id" element={<IssueDetailPage />} />
                <Route path="/issues/:id/edit" element={<PrivateRoute><EditIssuePage /></PrivateRoute>} />
                <Route path="/create" element={<PrivateRoute><CreateIssuePage /></PrivateRoute>} />
                <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
                <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
                <Route path="/report" element={<ReportIssuePage />} />
                <Route path="/issues" element={<ExploreIssuesPage />} />
                <Route path="/map" element={<CommunityMapPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <div className="h-8 sm:h-12" aria-hidden="true" />
            <Footer />
          </div>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
