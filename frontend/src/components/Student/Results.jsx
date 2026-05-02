import { useState, useEffect } from 'react';
import axios from 'axios';

const Results = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5000/api/students/results');
        setResults(res.data);
      } catch (err) {
        console.error('Failed to fetch results:', err);
        alert('Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  return (
    <div className="panel">
      <div className="page-title">
        <h3>Exam Results</h3>
        <p>View your exam scores and performance</p>
      </div>

      <div className="panel">
        <h4>Your Results ({results.length})</h4>
        {loading ? (
          <p>Loading...</p>
        ) : results.length === 0 ? (
          <p>No results yet.</p>
        ) : (
          <div className="card-list">
            {results.map(result => (
              <div key={result._id} className="card">
                <h4>{result.exam.title}</h4>
                <p><strong>Score:</strong> {result.score}/{result.totalQuestions}</p>
                <p><strong>Percentage:</strong> {((result.score / result.totalQuestions) * 100).toFixed(2)}%</p>
                <p><strong>Submitted:</strong> {new Date(result.submittedAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;