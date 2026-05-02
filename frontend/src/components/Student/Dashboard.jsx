import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext.jsx';
import Profile from './Profile.jsx';
import Exams from './Exams.jsx';
import Results from './Results.jsx';
import TakeExam from './TakeExam.jsx';

const StudentDashboard = () => {
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
          <h2 style={{ margin: '0 0 10px' }}>Student Dashboard</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Welcome, {user?.name}</p>
        </div>
        <ul>
          <li><Link to="/student/profile">Profile</Link></li>
          <li><Link to="/student/exams">Enrolled Exams</Link></li>
          <li><Link to="/student/results">Results</Link></li>
        </ul>
        <div style={{ padding: '20px' }}>
          <button className="button button--danger" onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<div className="panel"><h3>Dashboard Overview</h3><p>Select an option from the sidebar to get started.</p></div>} />
          <Route path="profile" element={<Profile />} />
          <Route path="exams" element={<Exams />} />
          <Route path="results" element={<Results />} />
          <Route path="take-exam/:id" element={<TakeExam />} />
        </Routes>
      </main>
    </div>
  );
};

export default StudentDashboard;