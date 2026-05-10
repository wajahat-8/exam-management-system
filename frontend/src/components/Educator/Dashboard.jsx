import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext.jsx';
import Profile from './Profile.jsx';
import Questions from './Questions.jsx';
import Exams from './Exams.jsx';
import Reports from './Reports.jsx';
import Monitoring from './Monitoring.jsx';

const EducatorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <nav>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: '0 0 10px' }}>Educator Dashboard</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Welcome, {user?.name}</p>
        </div>
        <ul>
          <li><Link to="/educator/profile">Profile</Link></li>
          <li><Link to="/educator/questions">Questions</Link></li>
          <li><Link to="/educator/exams">Exams</Link></li>
          <li><Link to="/educator/monitoring">Monitoring</Link></li>
          <li><Link to="/educator/reports">Reports</Link></li>
        </ul>
        <div style={{ padding: '20px' }}>
          <button className="button button--danger" onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<div className="panel"><h3>Dashboard Overview</h3><p>Select an option from the sidebar to get started.</p></div>} />
          <Route path="profile" element={<Profile />} />
          <Route path="questions" element={<Questions />} />
          <Route path="exams" element={<Exams />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  );
};

export default EducatorDashboard;