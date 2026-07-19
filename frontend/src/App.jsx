import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminLoginPage from './pages/AdminLoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import VerifyOtpPage from './pages/VerifyOtpPage'
import TherapyPage from './pages/TherapyPage'
import UserDashboard from './pages/UserDashboard'
import TrainingPage from './pages/TrainingPage'
import AssessmentPage from './pages/AssessmentPage'
import LetterLearningPage from './pages/LetterLearningPage'
import VideosPage from './pages/VideosPage'
import SpeechAnalysisPage from './pages/SpeechAnalysisPage'
import TongueTrackingPage from './pages/TongueTrackingPage'
import GamesPage from './pages/GamesPage'
import ProgressPage from './pages/ProgressPage'
import ReportsPage from './pages/ReportsPage'
import AchievementsPage from './pages/AchievementsPage'
import RewardsPage from './pages/RewardsPage'
import CalendarPage from './pages/CalendarPage'
import NotificationsPage from './pages/NotificationsPage'
import AppointmentsPage from './pages/AppointmentsPage'
import ParentDashboard from './pages/ParentDashboard'
import TherapistDashboard from './pages/TherapistDashboard'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import HelpPage from './pages/HelpPage'
import FeedbackPage from './pages/FeedbackPage'
import AboutPage from './pages/AboutPage'
import AdminPage from './pages/AdminPage'
import NotFound from './pages/NotFound'
import { useAuthStore } from './store/authStore'
import { useSettingsStore } from './store/settingsStore'

function App() {
  const initTheme = useSettingsStore((s) => s.initTheme)

  // Re-apply the persisted theme to <html> on first paint
  useEffect(() => {
    initTheme()
  }, [initTheme])

  // Authenticated pages that all share the DashboardLayout shell
  const protectedRoutes = [
    { path: '/dashboard', element: <UserDashboard /> },
    { path: '/training', element: <TrainingPage /> },
    { path: '/assessment', element: <AssessmentPage /> },
    { path: '/letter-learning', element: <LetterLearningPage /> },
    { path: '/videos', element: <VideosPage /> },
    { path: '/speech-analysis', element: <SpeechAnalysisPage /> },
    { path: '/tongue-tracking', element: <TongueTrackingPage /> },
    { path: '/games', element: <GamesPage /> },
    { path: '/progress', element: <ProgressPage /> },
    { path: '/reports', element: <ReportsPage /> },
    { path: '/achievements', element: <AchievementsPage /> },
    { path: '/rewards', element: <RewardsPage /> },
    { path: '/calendar', element: <CalendarPage /> },
    { path: '/notifications', element: <NotificationsPage /> },
    { path: '/appointments', element: <AppointmentsPage /> },
    { path: '/parent', element: <ParentDashboard /> },
    { path: '/therapist', element: <TherapistDashboard /> },
    { path: '/profile', element: <ProfilePage /> },
    { path: '/settings', element: <SettingsPage /> },
    { path: '/help', element: <HelpPage /> },
    { path: '/feedback', element: <FeedbackPage /> },
    { path: '/about', element: <AboutPage /> },
  ]

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />

        {/* Therapy session (dynamic) */}
        <Route
          path="/therapy/:lessonId"
          element={
            <ProtectedRoute>
              <TherapyPage />
            </ProtectedRoute>
          }
        />

        {/* Authenticated app pages */}
        {protectedRoutes.map(({ path, element }) => (
          <Route
            key={path}
            path={path}
            element={<ProtectedRoute>{element}</ProtectedRoute>}
          />
        ))}

        {/* Admin — restricted to the admin role */}
        <Route
          path="/admin"
          element={
            <RoleRoute allow={['admin']}>
              <AdminPage />
            </RoleRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

// Protected route for authenticated users
function ProtectedRoute({ children }) {
  const { user, isAuthenticated, token } = useAuthStore()

  if (!isAuthenticated || !user || !token) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Role-gated route. `allow` is a list of roles permitted to view the page.
// Note: the backend currently defines only "user" (default) and "admin" roles,
// so parent/therapist hubs are intentionally open to any authenticated user.
function RoleRoute({ children, allow }) {
  const { user, isAuthenticated, token } = useAuthStore()

  if (!isAuthenticated || !user || !token) {
    return <Navigate to="/login" replace />
  }
  if (allow && !allow.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default App
