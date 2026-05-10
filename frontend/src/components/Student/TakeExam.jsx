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
  const [submitting, setSubmitting] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [timeTracker, setTimeTracker] = useState({});

  useEffect(() => {
    fetchExam();
  }, [id]);

  useEffect(() => {
    if (exam && timeLeft > 0) {
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
  }, [exam, timeLeft]);

  // Track time per question
  useEffect(() => {
    if (exam && !submitting && exam.questions && exam.questions.length > 0) {
      const timer = setInterval(() => {
        const qId = exam.questions[currentQuestion]._id;
        setTimeTracker(prev => ({
          ...prev,
          [qId]: (prev[qId] || 0) + 1
        }));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [exam, currentQuestion, submitting]);

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
      alert('Failed to load exam');
      navigate('/student/exams');
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

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return; // Prevent multiple submissions
    setSubmitting(true);
    try {
      await axios.post(`http://localhost:5000/api/students/submit/${id}`, { 
        answers, 
        timeTracker 
      });
      alert('Exam submitted successfully');
      navigate('/student/results');
    } catch (err) {
      console.error('Failed to submit exam:', err);
      alert('Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViolation = (count, type) => {
    setViolationCount(count);
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

  if (!exam) return <div className="panel"><p>Exam not found.</p></div>;

  const question = exam.questions[currentQuestion];
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <ExamMonitor examId={id} onViolation={handleViolation} />
      <div className="panel">
        <div className="exam-header">
          <h3>{exam.title}</h3>
          <div className="timer">Time Left: {formatTime(timeLeft)}</div>
          <div className="progress">Question {currentQuestion + 1} of {exam.questions.length}</div>
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

        <div className="exam-footer">
          <button
            className="button button--secondary"
            onClick={handlePrev}
            disabled={currentQuestion === 0}
          >
            Previous
          </button>
          {currentQuestion < exam.questions.length - 1 ? (
            <button className="button button--primary" onClick={handleNext}>
              Next
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