import { useState, useEffect } from 'react';
import axios from 'axios';

const Results = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

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

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="panel">
      <div className="page-title">
        <h3>Exam Results & Feedback</h3>
        <p>Review your detailed performance question-by-question</p>
      </div>

      <div className="panel">
        <h4>Your Past Exams ({results.length})</h4>
        {loading ? (
          <p>Loading...</p>
        ) : results.length === 0 ? (
          <p>No results yet.</p>
        ) : (
          <div className="results-list">
            {results.map(result => (
              <div key={result._id} className="result-card">
                <div className="result-card-header">
                  <div>
                    <h4 style={{ margin: '0 0 5px' }}>{result.exam.title}</h4>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                      Submitted: {new Date(result.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="result-score-badge">
                    <div className="score-text">{((result.score / result.totalQuestions) * 100).toFixed(0)}%</div>
                    <div className="score-subtext">{result.score}/{result.totalQuestions}</div>
                  </div>
                </div>

                <div className="result-card-actions">
                  <button 
                    className="button button--secondary button--full-width"
                    onClick={() => toggleExpand(result._id)}
                  >
                    {expandedId === result._id ? 'Hide Details ▲' : 'View Detailed Breakdown ▼'}
                  </button>
                </div>

                {expandedId === result._id && (
                  <div className="result-details-panel">
                    <h5 style={{ marginTop: 0, marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                      Question Breakdown
                    </h5>
                    
                    {result.answers && result.answers.length > 0 ? (
                      <div className="question-breakdown-list">
                        {result.answers.map((ans, idx) => {
                          const isCorrect = ans.answer === ans.question.correctAnswer;
                          return (
                            <div key={idx} className={`question-breakdown-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                              <div className="qb-header">
                                <span className="qb-number">Q{idx + 1}</span>
                                <span className="qb-icon">{isCorrect ? '✅' : '❌'}</span>
                              </div>
                              <div className="qb-content">
                                <p className="qb-text">{ans.question.questionText}</p>
                                
                                <div className="qb-answers">
                                  <div className={`qb-answer-row ${isCorrect ? 'correct-text' : 'incorrect-text'}`}>
                                    <strong>Your Answer:</strong> {ans.answer || <em>(No answer)</em>}
                                  </div>
                                  
                                  {!isCorrect && (
                                    <div className="qb-answer-row correct-text">
                                      <strong>Correct Answer:</strong> {ans.question.correctAnswer}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p>No detailed question data available for this exam.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;