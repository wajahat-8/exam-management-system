import { useState, useEffect } from 'react';
import axios from 'axios';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('group');
  const [group, setGroup] = useState({ groupId: '', groupName: '', groupDescription: '', subject: '' });
  const [variantForm, setVariantForm] = useState({ title: '', description: '', scheduledDate: '', duration: '', questions: [] });
  const [questionForm, setQuestionForm] = useState({ questionText: '', subject: '', topic: '', difficulty: 'medium', options: ['', '', '', ''], correctAnswer: '' });
  const [questionLoading, setQuestionLoading] = useState(false);
  const [editQuestionId, setEditQuestionId] = useState(null);
  const [lastSavedVariant, setLastSavedVariant] = useState(null);
  const [variantCount, setVariantCount] = useState(0);

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

  const handleGroupChange = (e) => {
    const { name, value } = e.target;
    setGroup({ ...group, [name]: value });
  };

  const handleVariantChange = (e) => {
    const { name, value } = e.target;
    setVariantForm({ ...variantForm, [name]: value });
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
    setVariantForm((prev) => ({
      ...prev,
      questions: prev.questions.includes(id) ? prev.questions.filter((qid) => qid !== id) : [...prev.questions, id],
    }));
  };

  const startQuestionCreation = (e) => {
    e.preventDefault();
    if (!group.groupId.trim()) {
      return alert('Exam Group ID is required to continue.');
    }
    setStep('variant');
  };

  const resetVariantForm = () => {
    setVariantForm({ title: '', description: '', scheduledDate: '', duration: '', questions: [] });
  };

  const resetGroupFlow = () => {
    setGroup({ groupId: '', groupName: '', groupDescription: '', subject: '' });
    resetVariantForm();
    setLastSavedVariant(null);
    setVariantCount(0);
    setStep('group');
  };

  const saveQuestion = async (e) => {
    e.preventDefault();
    if (!questionForm.questionText || !questionForm.correctAnswer) {
      return alert('Question text and correct answer are required.');
    }
    setQuestionLoading(true);
    try {
      if (editQuestionId) {
        await axios.put(`http://localhost:5000/api/educators/questions/${editQuestionId}`, questionForm);
      } else {
        await axios.post('http://localhost:5000/api/educators/questions', questionForm);
      }
      setQuestionForm({ questionText: '', subject: '', topic: '', difficulty: 'medium', options: ['', '', '', ''], correctAnswer: '' });
      setEditQuestionId(null);
      await refreshData();
    } catch (err) {
      console.error('Failed to save question:', err);
      alert('Failed to save question');
    } finally {
      setQuestionLoading(false);
    }
  };

  const editQuestion = (question) => {
    setEditQuestionId(question._id);
    setQuestionForm({
      questionText: question.questionText || '',
      subject: question.subject || '',
      topic: question.topic || '',
      difficulty: question.difficulty || 'medium',
      options: question.options?.length === 4 ? question.options : ['', '', '', ''],
      correctAnswer: question.correctAnswer || '',
    });
  };

  const deleteQuestion = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    setQuestionLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/educators/questions/${id}`);
      if (variantForm.questions.includes(id)) {
        setVariantForm((prev) => ({
          ...prev,
          questions: prev.questions.filter((qid) => qid !== id),
        }));
      }
      await refreshData();
    } catch (err) {
      console.error('Failed to delete question:', err);
      alert('Failed to delete question');
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!variantForm.title || !variantForm.scheduledDate || !variantForm.duration || variantForm.questions.length === 0) {
      return alert('Please complete variant details and select at least one question.');
    }
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/educators/exams', {
        ...variantForm,
        groupId: group.groupId,
        groupName: group.groupName,
        groupDescription: group.groupDescription,
        subject: group.subject,
      });
      setLastSavedVariant(response.data);
      setVariantCount((count) => count + 1);
      resetVariantForm();
      await refreshData();
    } catch (err) {
      console.error('Failed to create variant:', err);
      alert(err.response?.data?.message || 'Failed to create exam variant');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnotherVariant = () => {
    setLastSavedVariant(null);
    setStep('variant');
  };

  const handleDoneSetup = () => {
    resetGroupFlow();
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
        <h3>Exam Group & Variant Builder</h3>
        <p>
          Step 1: create an Exam Group ID. Step 2: build one variant, then choose whether to add another variant or finish.
        </p>
      </div>

      {step === 'group' ? (
        <div className="panel-form">
          <h4>Enter Exam Group Details</h4>
          <form onSubmit={startQuestionCreation}>
            <div className="form-grid">
              <div className="form-row">
                <input name="groupId" placeholder="Exam Group ID" value={group.groupId} onChange={handleGroupChange} required />
                <input name="groupName" placeholder="Group Name (optional)" value={group.groupName} onChange={handleGroupChange} />
              </div>
              <div className="form-row">
                <input name="subject" placeholder="Subject (optional)" value={group.subject} onChange={handleGroupChange} />
              </div>
              <div className="form-row">
                <textarea
                  rows="3"
                  name="groupDescription"
                  placeholder="Group description (optional)"
                  value={group.groupDescription}
                  onChange={handleGroupChange}
                />
              </div>
            </div>
            <div className="form-row">
              <button type="submit" className="button button--primary">
                Start Question Creation
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="panel-form">
          <h4>Group: {group.groupId}</h4>
          <p><strong>Name:</strong> {group.groupName || '—'}</p>
          <p><strong>Subject:</strong> {group.subject || '—'}</p>
          <p><strong>Description:</strong> {group.groupDescription || '—'}</p>
          <p><strong>Variants created:</strong> {variantCount}</p>
          <button className="button button--secondary" onClick={handleDoneSetup} style={{ marginTop: '12px' }}>
            Cancel / Close Group Setup
          </button>
        </div>
      )}

      {step !== 'group' && (
        <>
          <div className="panel-form">
            <h4>Add or Edit Question</h4>
            <form onSubmit={saveQuestion}>
              <div className="form-grid">
                <div className="form-row">
                  <input
                    name="questionText"
                    placeholder="Question text"
                    value={questionForm.questionText}
                    onChange={handleQuestionChange}
                    required
                  />
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
                  <input
                    name="correctAnswer"
                    placeholder="Correct answer"
                    value={questionForm.correctAnswer}
                    onChange={handleQuestionChange}
                    required
                  />
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
                  {questionLoading ? 'Saving...' : editQuestionId ? 'Update Question' : 'Save Question'}
                </button>
                {editQuestionId && (
                  <button
                    type="button"
                    className="button button--tertiary"
                    onClick={() => {
                      setEditQuestionId(null);
                      setQuestionForm({ questionText: '', subject: '', topic: '', difficulty: 'medium', options: ['', '', '', ''], correctAnswer: '' });
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="panel-form">
            <h4>Select Questions for Variant</h4>
            <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
              Selected questions: {variantForm.questions.length}
            </p>
            <div className="question-selector">
              {questions.length === 0 ? (
                <p style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                  No questions found in the bank yet. Add questions first, then select them here.
                </p>
              ) : (
                questions.map((q) => (
                  <label key={q._id} className="question-item">
                    <input type="checkbox" checked={variantForm.questions.includes(q._id)} onChange={() => toggleQuestionSelect(q._id)} />
                    <span>{q.questionText}</span>
                    <div className="question-actions">
                      <button type="button" className="button button--secondary" onClick={() => editQuestion(q)}>
                        Edit
                      </button>
                      <button type="button" className="button button--danger" onClick={() => deleteQuestion(q._id)}>
                        Delete
                      </button>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="panel-form">
            <h4>Create Exam Variant</h4>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-row">
                  <input name="title" placeholder="Variant title" value={variantForm.title} onChange={handleVariantChange} required />
                  <input name="scheduledDate" type="datetime-local" value={variantForm.scheduledDate} onChange={handleVariantChange} required />
                </div>
                <div className="form-row">
                  <input
                    name="duration"
                    type="number"
                    min="10"
                    placeholder="Duration (minutes)"
                    value={variantForm.duration}
                    onChange={handleVariantChange}
                    required
                  />
                  <input name="description" placeholder="Variant notes" value={variantForm.description} onChange={handleVariantChange} />
                </div>
              </div>
              <div className="form-row">
                <button type="submit" className="button button--primary" disabled={loading}>
                  {loading ? 'Finishing exam...' : 'Finish Exam'}
                </button>
              </div>
            </form>
          </div>

          {lastSavedVariant && (
            <div className="panel-form">
              <h4>Variant Saved</h4>
              <p>The exam variant <strong>{lastSavedVariant.title}</strong> was saved under group <strong>{group.groupId}</strong>.</p>
              <div className="form-row">
                <button className="button button--primary" onClick={handleCreateAnotherVariant}>
                  Create Another Variant in This Group
                </button>
                <button className="button button--success" onClick={handleDoneSetup}>
                  Done (Close Group Setup)
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="panel">
        <h4>Existing Exams ({exams.length})</h4>
        {loading ? (
          <p>Loading...</p>
        ) : exams.length === 0 ? (
          <p style={{ padding: '12px', color: 'var(--text-secondary)' }}>
            No exams have been saved yet. Create a group and finish the first variant to see exams here.
          </p>
        ) : (
          <div className="card-list">
            {exams.map((exam) => (
              <div key={exam._id} className="card">
                <h4>{exam.title}</h4>
                <p><strong>Group ID:</strong> {exam.groupId}</p>
                <p><strong>Group Name:</strong> {exam.groupName || '—'}</p>
                <p><strong>Subject:</strong> {exam.subject || '—'}</p>
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
