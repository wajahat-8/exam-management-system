import { useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const loggedUser = await login(email, password);
      navigate(`/${loggedUser.role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f2f8 0%, #eef2ff 100%)', padding: '20px' }}>
      <div className="auth-container">
        <div className="auth-logo">
          <span className="auth-logo-icon">🎓</span>
        </div>
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Sign in to your Examsphere account</p>

        {error && (
          <div className="alert-error" style={{ marginBottom: '16px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            id="login-email"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            id="login-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? '⏳ Signing in…' : '🚀 Sign In'}
          </button>
        </form>

        <p>Don't have an account? <Link to="/register">Create one →</Link></p>
      </div>
    </div>
  );
};

export default Login;