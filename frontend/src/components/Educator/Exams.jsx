import { useState, useEffect } from 'react';
import axios from 'axios';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', scheduledDate: '', duration: '', examCode: '', questions: [] });
  const [questionForm, setQuestionForm] = useState({ questionText: '', subject: '', topic: '', difficulty: 'medium', options: ['', '', '', ''], correctAnswer: '' });
  const [questionLoading, setQuestionLoading] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [examsRes, questionsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/educators/exams'),
        axios.get('http://localhost:5000/api/educators/questions'),
      ]);
      setExams(examsRes.data);
      setQuestions(questionsRes.data);
    } catch (err) {
      console.error('Failed to fetch exams or questions:', err);
      alert('Failed to load exams or questions');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('option-')) {
      const index = Number(name.split('-')[1]);
      const options = [...questionForm.options];
      options[index] = value;
      setQuestionForm({ ...questionForm, options });
      return;
    }
    setQuestionForm({ ...questionForm, [name]: value });
  };

  const toggleQuestionSelect = (id) => {
    setForm({
      ...form,
      questions: form.questions.includes(id) ? form.questions.filter((qid) => qid !== id) : [...form.questions, id],
    });
  };

  const saveQuestion = async (e) => {
    e.preventDefault();
    if (!questionForm.questionText || !questionForm.correctAnswer) {
      return alert('Question text and correct answer are required.');
    }
    setQuestionLoading(true);
    try {
      await axios.post('http://localhost:5000/api/educators/questions', questionForm);
      setQuestionForm({ questionText: '', subject: '', topic: '', difficulty: 'medium', options: ['', '', '', ''], correctAnswer: '' });
      await refreshData();
    } catch (err) {
      console.error('Failed to save question:', err);
      alert('Failed to save question');
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.scheduledDate || !form.duration || form.questions.length === 0) {
      return alert('Please fill all exam fields and select at least one question.');
    }
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/educators/exams', form);
      setForm({ title: '', description: '', scheduledDate: '', duration: '', examCode: '', questions: [] });
      await refreshData();
    } catch (err) {
      console.error('Failed to create exam:', err);
      alert(err.response?.data?.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (id) => {
    if (!window.confirm('Delete this exam?')) return;
    setLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/educators/exams/${id}`);
      await refreshData();
    } catch (err) {
      console.error('Failed to delete exam:', err);
      alert('Failed to delete exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <div className="page-title">
        <h3>Exam Management</h3>
        <p>Create an exam and add questions directly to it.</p>
      </div>

      <div className="panel-form">
        <h4>Create Exam</h4>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-row">
              <input name="title" placeholder="Exam Title" value={form.title} onChange={handleFormChange} required />
              <input name="examCode" placeholder="Exam ID / Code (optional)" value={form.examCode} onChange={handleFormChange} />
            </div>
            <div className="form-row">
              <input name="description" placeholder="Description" value={form.description} onChange={handleFormChange} />
            </div>
            <div className="form-row">
              <input name="scheduledDate" type="datetime-local" value={form.scheduledDate} onChange={handleFormChange} required />
              <input name="duration" type="number" placeholder="Duration (minutes)" value={form.duration} onChange={handleFormChange} required />
            </div>
          </div>
          <div className="form-row">
            <button type="submit" className="button button--primary" disabled={loading || form.questions.length === 0}>
              {loading ? 'Creating...' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>

      <div className="panel-form">
        <h4>Add Question</h4>
        <form onSubmit={saveQuestion}>
          <div className="form-grid">
            <div className="form-row">
              <input name="questionText" placeholder="Question text" value={questionForm.questionText} onChange={handleQuestionChange} required />
            </div>
            <div className="form-row">
              <input name="subject" placeholder="Subject" value={questionForm.subject} onChange={handleQuestionChange} />
              <input name="topic" placeholder="Topic" value={questionForm.topic} onChange={handleQuestionChange} />
            </div>
            <div className="form-row">
              <select name="difficulty" value={questionForm.difficulty} onChange={handleQuestionChange}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <input name="correctAnswer" placeholder="Correct answer" value={questionForm.correctAnswer} onChange={handleQuestionChange} required />
            </div>
            <div className="form-row">
              <input name="option-0" placeholder="Option 1" value={questionForm.options[0]} onChange={handleQuestionChange} />
              <input name="option-1" placeholder="Option 2" value={questionForm.options[1]} onChange={handleQuestionChange} />
            </div>
            <div className="form-row">
              <input name="option-2" placeholder="Option 3" value={questionForm.options[2]} onChange={handleQuestionChange} />
              <input name="option-3" placeholder="Option 4" value={questionForm.options[3]} onChange={handleQuestionChange} />
            </div>
          </div>
          <div className="form-row">
            <button type="submit" className="button button--secondary" disabled={questionLoading}>
              {questionLoading ? 'Saving...' : 'Save Question'}
            </button>
          </div>
        </form>
      </div>

      <div className="panel-form">
        <h4>Select Questions for Exam</h4>
        <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
          Selected questions: {form.questions.length}
        </p>
        <div className="question-selector">
          {questions.map((q) => (
            <label key={q._id} className="question-item">
              <input type="checkbox" checked={form.questions.includes(q._id)} onChange={() => toggleQuestionSelect(q._id)} />
              <span>{q.questionText}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="panel">
        <h4>Existing Exams ({exams.length})</h4>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="card-list">
            {exams.map((exam) => (
              <div key={exam._id} className="card">
                <h4>{exam.title}</h4>
                {exam.examCode && <p><strong>Exam Code:</strong> {exam.examCode}</p>}
                <p>{exam.description}</p>
                <p><strong>Scheduled:</strong> {new Date(exam.scheduledDate).toLocaleString()}</p>
                <p><strong>Duration:</strong> {exam.duration} minutes</p>
                <p><strong>Questions:</strong> {exam.questions.length}</p>
                <div className="card-footer">
                  <button className="button button--danger" onClick={() => handleDeleteExam(exam._id)}>Delete Exam</button>
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