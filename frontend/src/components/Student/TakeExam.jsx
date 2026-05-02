import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TakeExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
    try {
      await axios.post(`http://localhost:5000/api/students/submit/${id}`, { answers });
      alert('Exam submitted successfully');
      navigate('/student/results');
    } catch (err) {
      console.error('Failed to submit exam:', err);
      alert('Failed to submit exam');
    } finally {
      setSubmitting(false);
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
    <div className="panel">
      <div className="exam-header">
        <h3>{exam.title}</h3>
        <div className="timer">Time Left: {formatTime(timeLeft)}</div>
        <div className="progress">Question {currentQuestion + 1} of {exam.questions.length}</div>
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
  );
};

export default TakeExam;