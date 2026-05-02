import { useState, useEffect } from 'react';
import axios from 'axios';

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    questionText: '',
    subject: '',
    topic: '',
    difficulty: 'medium',
    options: ['', '', '', ''],
    correctAnswer: '',
    isReusable: true,
  });

  useEffect(() => {
    refreshQuestions();
  }, []);

  const refreshQuestions = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/educators/questions');
      setQuestions(res.data);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      alert('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    if (name.startsWith('option')) {
      const index = parseInt(name.split('-')[1], 10);
      const newOptions = [...form.options];
      newOptions[index] = value;
      setForm({ ...form, options: newOptions });
      return;
    }

    if (name === 'isReusable') {
      setForm({ ...form, isReusable: checked });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const resetForm = () => {
    setEditId(null);
    setForm({
      questionText: '',
      subject: '',
      topic: '',
      difficulty: 'medium',
      options: ['', '', '', ''],
      correctAnswer: '',
      isReusable: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await axios.put(`http://localhost:5000/api/educators/questions/${editId}`, form);
      } else {
        await axios.post('http://localhost:5000/api/educators/questions', form);
      }
      resetForm();
      await refreshQuestions();
    } catch (err) {
      console.error('Failed to save question:', err);
      alert('Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (question) => {
    setEditId(question._id);
    setForm({
      questionText: question.questionText || '',
      subject: question.subject || '',
      topic: question.topic || '',
      difficulty: question.difficulty || 'medium',
      options: question.options && question.options.length ? question.options : ['', '', '', ''],
      correctAnswer: question.correctAnswer || '',
      isReusable: question.isReusable !== false,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question from the bank?')) return;
    setLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/educators/questions/${id}`);
      await refreshQuestions();
    } catch (err) {
      console.error('Failed to delete question:', err);
      alert('Failed to delete question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <div className="page-title">
        <h3>Question Bank</h3>
        <p>Manage your MCQ questions</p>
      </div>

      <div className="panel-form">
        <h4>{editId ? 'Edit Question' : 'Add New Question'}</h4>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-row">
              <input name="questionText" placeholder="Question Text" value={form.questionText} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <input name="subject" placeholder="Subject" value={form.subject} onChange={handleChange} />
              <input name="topic" placeholder="Topic" value={form.topic} onChange={handleChange} />
              <select name="difficulty" value={form.difficulty} onChange={handleChange}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <input name="correctAnswer" placeholder="Correct Answer" value={form.correctAnswer} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-grid full-width">
            <div className="form-row">
              <input name="option-0" placeholder="Option 1" value={form.options[0]} onChange={handleChange} />
              <input name="option-1" placeholder="Option 2" value={form.options[1]} onChange={handleChange} />
            </div>
            <div className="form-row">
              <input name="option-2" placeholder="Option 3" value={form.options[2]} onChange={handleChange} />
              <input name="option-3" placeholder="Option 4" value={form.options[3]} onChange={handleChange} />
            </div>
          </div>
          <div className="checkbox-group">
            <label>
              <input name="isReusable" type="checkbox" checked={form.isReusable} onChange={handleChange} />
              Reusable in question bank
            </label>
          </div>
          <div className="form-row">
            <button type="submit" className="button button--primary" disabled={loading}>
              {loading ? 'Saving...' : (editId ? 'Update Question' : 'Add Question')}
            </button>
            {editId && (
              <button type="button" className="button button--secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="panel">
        <h4>Existing Questions ({questions.length})</h4>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="card-list">
            {questions.map(q => (
              <div key={q._id} className="card">
                <h4>{q.questionText}</h4>
                <p>{q.subject || 'No subject'} / {q.topic || 'No topic'} / {q.difficulty}</p>
                <p>Answer: {q.correctAnswer}</p>
                <p>Reusable: {q.isReusable ? 'Yes' : 'No'}</p>
                <div className="card-footer">
                  <button className="button button--secondary" onClick={() => handleEdit(q)}>Edit</button>
                  <button className="button button--danger" onClick={() => handleDelete(q._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Questions;