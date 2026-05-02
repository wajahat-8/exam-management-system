import { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = () => {
  const [profile, setProfile] = useState({});
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5000/api/students/profile');
        setProfile(res.data);
        setForm(res.data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        alert('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.put('http://localhost:5000/api/students/profile', form);
      setProfile(res.data);
      setEdit(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="panel"><p>Loading profile...</p></div>;

  return (
    <div className="panel">
      <div className="page-title">
        <h3>Student Profile</h3>
        <p>Manage your personal information</p>
      </div>

      {!edit ? (
        <div className="panel">
          <div className="profile-info">
            <div className="info-item">
              <strong>Name:</strong> {profile.name}
            </div>
            <div className="info-item">
              <strong>Email:</strong> {profile.email}
            </div>
            <div className="info-item">
              <strong>Student ID:</strong> {profile.studentId || 'Not set'}
            </div>
            <div className="info-item">
              <strong>Course:</strong> {profile.course || 'Not set'}
            </div>
            <div className="info-item">
              <strong>Role:</strong> Student
            </div>
          </div>
          <div className="form-row">
            <button className="button button--primary" onClick={() => setEdit(true)}>Edit Profile</button>
          </div>
        </div>
      ) : (
        <div className="panel-form">
          <h4>Edit Profile</h4>
          <form onSubmit={handleUpdate}>
            <div className="form-grid">
              <div className="form-row">
                <input name="name" placeholder="Full Name" value={form.name || ''} onChange={handleChange} required />
              </div>
              <div className="form-row">
                <input name="course" placeholder="Course" value={form.course || ''} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <button type="submit" className="button button--primary" disabled={loading}>
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
              <button type="button" className="button button--secondary" onClick={() => setEdit(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;