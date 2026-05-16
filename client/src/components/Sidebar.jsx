import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login'); }

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <span>✦ OnlyNotes</span>
      </div>

      <div className="sidebar-nav">
        <div className="sidebar-section-label">Main</div>
        <NavLink to="/" end className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="icon">📊</span> Dashboard
        </NavLink>
        <NavLink to="/notes" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="icon">📝</span> Notes
        </NavLink>
        <NavLink to="/archive" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="icon">📦</span> Archive
        </NavLink>

        <div className="sidebar-section-label">Settings</div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? '🌙' : '☀️'} {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
        <button className="nav-item" onClick={handleLogout}>
          <span className="icon">🚪</span> Logout
        </button>
      </div>

      {user && (
        <div className="sidebar-user">
          <div className="avatar">{user.name?.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
          </div>
        </div>
      )}
    </nav>
  )
}
