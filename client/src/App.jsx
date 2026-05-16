import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import NotesPage from './pages/NotesPage'
import EditorPage from './pages/EditorPage'
import SharedPage from './pages/SharedPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="auth-page"><div className="skeleton" style={{width:200,height:40}} /></div>
  if (!user) return <Navigate to="/login" />
  return children
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="auth-page"><div className="skeleton" style={{width:200,height:40}} /></div>
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <SignupPage />} />
      <Route path="/shared/:shareId" element={<SharedPage />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <div className="app-layout">
            <Sidebar />
            <div className="main-content">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/notes" element={<NotesPage />} />
                <Route path="/notes/:id" element={<EditorPage />} />
                <Route path="/archive" element={<NotesPage archived />} />
              </Routes>
            </div>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  )
}
