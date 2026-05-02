import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [examCode, setExamCode] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/students/exams');
      setExams(res.data);
    } catch (err) {
      console.error('Failed to fetch exams:', err);
      alert('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/students/join', { examCode });
      setExamCode('');
      fetchExams();
      alert('Joined exam successfully');
    } catch (err) {
      console.error('Join failed:', err);
      alert(err.response?.data?.message || 'Failed to join exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <div className="page-title">
        <h3>Enrolled Exams</h3>
        <p>View and take your enrolled exams</p>
      </div>

      <div className="panel-form">
        <h4>Join New Exam</h4>
        <form onSubmit={handleJoin}>
          <div className="form-row">
            <input
              name="examCode"
              placeholder="Enter exam code"
              value={examCode}
              onChange={(e) => setExamCode(e.target.value)}
              required
            />
            <button type="submit" className="button button--primary" disabled={loading}>
              {loading ? 'Joining...' : 'Join Exam'}
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h4>Your Exams ({exams.length})</h4>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="card-list">
            {exams.map(exam => (
              <div key={exam._id} className="card">
                <h4>{exam.title}</h4>
                {exam.examCode && <p><strong>Exam Code:</strong> {exam.examCode}</p>}
                <p>{exam.description}</p>
                <p><strong>Scheduled:</strong> {new Date(exam.scheduledDate).toLocaleString()}</p>
                <p><strong>Duration:</strong> {exam.duration} minutes</p>
                <p><strong>Teacher:</strong> {exam.educator?.name || 'Unknown'}</p>
                <div className="card-footer">
                  <Link to={`/student/take-exam/${exam._id}`} className="button button--primary">Take Exam</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Exams;
