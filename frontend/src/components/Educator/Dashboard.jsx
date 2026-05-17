import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext.jsx';
import Profile from './Profile.jsx';
import Questions from './Questions.jsx';
import Exams from './Exams.jsx';
import Reports from './Reports.jsx';
import Monitoring from './Monitoring.jsx';
import Notifications from './Notifications.jsx';

const NAV = [
  { to: '/educator/exams',      icon: '📋', label: 'Exams' },
  { to: '/educator/questions',  icon: '❓', label: 'Question Bank' },
  { to: '/educator/monitoring', icon: '👁️', label: 'Monitoring' },
  { to: '/educator/reports',    icon: '📊', label: 'Reports' },
  { to: '/educator/notifications', icon: '📢', label: 'Notifications' },
  { to: '/educator/profile',    icon: '👤', label: 'Profile' },
];

const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const EducatorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">🎓</div>
            <span className="sidebar-brand-name">Examsphere</span>
          </div>
          <div className="sidebar-user">
            <div className="sidebar-avatar">{getInitials(user?.name)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'Educator'}</div>
              <div className="sidebar-user-role">Educator</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Navigation</div>
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <span className="sidebar-link-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <Routes>
          <Route path="/" element={<EducatorHome user={user} />} />
          <Route path="profile"    element={<Profile />} />
          <Route path="questions"  element={<Questions />} />
          <Route path="exams"      element={<Exams />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="reports"    element={<Reports />} />
          <Route path="notifications" element={<Notifications />} />
        </Routes>
      </main>
    </div>
  );
};

const EducatorHome = ({ user }) => (
  <div className="panel" style={{ animation: 'slideUp 0.4s ease' }}>
    <div className="welcome-banner">
      <h2>Welcome back, {user?.name?.split(' ')[0] || 'Educator'}! 👋</h2>
      <p>Manage your exams, monitor students, and review performance reports.</p>
    </div>

    <div className="stat-cards">
      {[
        { icon: '📋', label: 'Quick Start', value: '→', sub: 'Create an exam' },
        { icon: '❓', label: 'Question Bank', value: '→', sub: 'Add questions' },
        { icon: '👁️', label: 'Monitoring', value: '→', sub: 'Live proctoring' },
        { icon: '📊', label: 'Reports', value: '→', sub: 'View results' },
      ].map(c => (
        <div className="stat-card" key={c.label}>
          <span className="stat-card-icon">{c.icon}</span>
          <div className="stat-card-value" style={{ fontSize: '20px' }}>{c.label}</div>
          <div className="stat-card-label">{c.sub}</div>
        </div>
      ))}
    </div>

    <div className="panel-form">
      <h4>🚀 Getting Started</h4>
      <ol style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '2', fontSize: '14px' }}>
        <li>Go to <strong>Question Bank</strong> to add MCQ questions.</li>
        <li>Go to <strong>Exams</strong> to create an exam group and assign questions.</li>
        <li>Share the Exam Code with your students so they can join.</li>
        <li>Use <strong>Monitoring</strong> to track student behaviour in real time.</li>
        <li>Check <strong>Reports</strong> after the exam for detailed results.</li>
      </ol>
    </div>
  </div>
);

export default EducatorDashboard;