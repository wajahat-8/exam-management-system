import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ExamMonitor from './ExamMonitor.jsx';

const TakeExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [timeTracker, setTimeTracker] = useState({});
  const [examStarted, setExamStarted] = useState(false);

  useEffect(() => {
    fetchExam();
  }, [id]);

  useEffect(() => {
    if (exam && timeLeft > 0 && examStarted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [exam, timeLeft, examStarted]);

  // Track time per question
  useEffect(() => {
    if (exam && !submitting && examStarted && exam.questions && exam.questions.length > 0) {
      const timer = setInterval(() => {
        const qId = exam.questions[currentQuestion]._id;
        setTimeTracker(prev => ({
          ...prev,
          [qId]: (prev[qId] || 0) + 1
        }));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [exam, currentQuestion, submitting, examStarted]);

  const fetchExam = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/students/exam/${id}`);
      setExam(res.data);
      setTimeLeft(res.data.duration * 60); // minutes to seconds
      // Initialize answers
      const initialAnswers = {};
      res.data.questions.forEach(q => {
        initialAnswers[q._id] = '';
      });
      setAnswers(initialAnswers);
    } catch (err) {
      console.error('Failed to fetch exam:', err);
      setError(err.response?.data?.message || 'Failed to load exam');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNext = () => {
    if (currentQuestion < exam.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSubmit = async () => {
    if (submitting || submitted) return; // Prevent multiple submissions
    setSubmitting(true);
    try {
      await axios.post(`http://localhost:5000/api/students/submit/${id}`, { 
        answers, 
        timeTracker 
      });
      setSubmitted(true);
      alert('Exam submitted successfully');
      navigate('/student/results');
    } catch (err) {
      console.error('Failed to submit exam:', err);
      alert('Failed to submit exam');
      setSubmitting(false);
    }
  };

  const handleViolation = (count, type) => {
    setViolationCount(count);
    if (submitting || submitted) return; // Don't trigger auto-submit if already submitting or submitted
    
    // Auto-submit only on severe/immediate violations like tab switch, window blur, or camera covered
    if ((type === 'tab_switch' || type === 'screen_blur' || type === 'face_absence') && !submitting) {
      alert(`Violation detected (${type}). Your exam is being automatically submitted.`);
      handleSubmit();
    } else if (count > 5 && !submitting) {
      alert('Too many violations detected. Your exam is being automatically submitted.');
      handleSubmit();
    }
  };

  if (loading) return <div className="panel"><p>Loading exam...</p></div>;

  if (error) {
    return (
      <div className="instructions-container">
        <div className="instructions-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div className="camera-check-icon" style={{ fontSize: '64px', marginBottom: '24px' }}>🛑</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginBottom: '32px' }}>{error}</p>
          <button className="button button--primary" style={{ padding: '12px 32px', fontSize: '16px' }} onClick={() => navigate('/student/exams')}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!exam) return <div className="panel"><p>Exam not found.</p></div>;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!examStarted) {
    return (
      <div className="instructions-container">
        <div className="instructions-card">
          <div className="instructions-header">
            <h2>{exam.title}</h2>
            <div className="badge badge-duration">{exam.duration} Minutes</div>
          </div>
          
          <div className="instructions-content">
            <h3>Exam Rules & Proctoring Guidelines</h3>
            <p className="subtitle">Please read the following instructions carefully. Your session will be monitored to ensure academic integrity.</p>
            
            <ul className="rules-list">
              <li>
                <span className="icon">📷</span>
                <div>
                  <strong>Camera & Face Detection</strong>
                  <p>Your camera must remain on throughout the exam. Ensure your face is clearly visible and well-lit.</p>
                </div>
              </li>
              <li>
                <span className="icon">🛑</span>
                <div>
                  <strong>Do Not Switch Tabs</strong>
                  <p>Navigating away from the exam window or switching tabs is strictly prohibited and will be logged.</p>
                </div>
              </li>
              <li>
                <span className="icon">📍</span>
                <div>
                  <strong>Location Tracking</strong>
                  <p>Your location is verified at the start. Moving significantly during the exam may trigger an alert.</p>
                </div>
              </li>
              <li>
                <span className="icon">⚠️</span>
                <div>
                  <strong>Violations</strong>
                  <p>Severe or multiple violations (e.g., covering camera, opening other apps) will result in automatic submission of your exam.</p>
                </div>
              </li>
            </ul>

            <div className="good-luck-message">
              <h3>Do your best!</h3>
              <p>Take a deep breath and start when you are ready.</p>
            </div>
          </div>

          <div className="instructions-footer">
            <button 
              className="button button--secondary" 
              onClick={() => navigate('/student/exams')}
            >
              Cancel
            </button>
            <button 
              className="button button--primary button--start-exam" 
              onClick={() => setExamStarted(true)}
            >
              Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = exam.questions[currentQuestion];

  return (
    <>
      <ExamMonitor examId={id} onViolation={handleViolation} />
      <div className="panel">
        <div className="exam-header">
          <h3>{exam.title}</h3>
          <div className="timer">Time Left: {formatTime(timeLeft)}</div>
          <div className="progress">Question {currentQuestion + 1} of {exam.questions.length}</div>
          <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '5px', fontWeight: 'bold' }}>
            ⚠️ Forward navigation only. You cannot return to previous questions once you move next.
          </div>
          {violationCount > 0 && (
            <div style={{ color: violationCount > 5 ? '#f44336' : '#ff9800', marginTop: '10px', fontWeight: 'bold' }}>
              ⚠️ Violations Detected: {violationCount}
            </div>
          )}
        </div>

        <div className="question-card">
          <h4>{question.questionText}</h4>
          <div className="options">
            {question.options.map((option, index) => (
              <label key={index} className="option">
                <input
                  type="radio"
                  name={`question-${question._id}`}
                  value={option}
                  checked={answers[question._id] === option}
                  onChange={() => handleAnswerChange(question._id, option)}
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        <div className="exam-footer" style={{ justifyContent: 'flex-end' }}>
          {currentQuestion < exam.questions.length - 1 ? (
            <button className="button button--primary" onClick={handleNext}>
              Next Question
            </button>
          ) : (
            <button
              className="button button--success"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default TakeExam;