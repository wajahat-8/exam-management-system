import { useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', studentId: '', course: '', department: '' });
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(form);
      navigate('/login');
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      alert(message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="student">Student</option>
          <option value="educator">Educator</option>
        </select>
        {form.role === 'student' && (
          <>
            <input name="studentId" placeholder="Student ID" value={form.studentId} onChange={handleChange} />
            <input name="course" placeholder="Course" value={form.course} onChange={handleChange} />
          </>
        )}
        {form.role === 'educator' && (
          <input name="department" placeholder="Department" value={form.department} onChange={handleChange} />
        )}
        <button type="submit">Register</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
};

export default Register;