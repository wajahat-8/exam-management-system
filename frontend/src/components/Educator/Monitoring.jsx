import { useState, useEffect } from 'react';
import axios from 'axios';

const Monitoring = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/educators/exams', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setExams(res.data);
    } catch (err) {
      console.error('Failed to fetch exams:', err);
      alert('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExam = async (examId) => {
    setSelectedExam(examId);
    setSelectedSession(null);
    setDetailsLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/monitoring/exam/${examId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to fetch monitoring data:', err);
      alert('Failed to load monitoring data');
    } finally {
      setDetailsLoading(false);
    }
  };

  const getViolationColor = (count) => {
    if (count === 0) return '#4caf50';
    if (count <= 2) return '#ff9800';
    return '#f44336';
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: '#2196f3',
      completed: '#4caf50',
      flagged: '#f44336'
    };
    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 8px',
        borderRadius: '4px',
        background: colors[status] || '#999',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="panel">
      <div className="page-title">
        <h3>Exam Proctoring Monitoring</h3>
        <p>View student behavior monitoring data and violations during exams</p>
      </div>

      <div className="panel-form">
        <h4>Select Exam to Monitor</h4>
        <div style={{ marginBottom: '12px' }}>
          {loading ? (
            <p>Loading exams...</p>
          ) : exams.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No exams found</p>
          ) : (
            <select
              value={selectedExam || ''}
              onChange={(e) => handleSelectExam(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                fontSize: '14px'
              }}
            >
              <option value="">-- Select Exam --</option>
              {exams.map(exam => (
                <option key={exam._id} value={exam._id}>
                  {exam.title} ({new Date(exam.scheduledDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {selectedExam && (
        <>
          <div className="panel">
            <h4>Student Monitoring Sessions ({sessions.length})</h4>
            {detailsLoading ? (
              <p>Loading monitoring data...</p>
            ) : sessions.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No monitoring data available for this exam</p>
            ) : (
              <div className="card-list">
                {sessions.map(session => (
                  <div
                    key={session._id}
                    className="card"
                    style={{
                      borderLeft: `4px solid ${getViolationColor(session.totalViolations)}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px' }}>{session.student?.name || 'Unknown'}</h4>
                        <p style={{ margin: '0', color: 'var(--text-secondary)', fontSize: '12px' }}>
                          {session.student?.email}
                        </p>
                      </div>
                      {getStatusBadge(session.status)}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <p style={{ margin: '0', fontSize: '12px' }}>
                        <strong>Start:</strong> {new Date(session.startTime).toLocaleTimeString()}
                      </p>
                      <p style={{ margin: '0', fontSize: '12px' }}>
                        <strong>Duration:</strong> {session.endTime
                          ? `${Math.round((new Date(session.endTime) - new Date(session.startTime)) / 60000)} mins`
                          : 'In progress'}
                      </p>
                    </div>

                    <div style={{
                      background: '#f5f5f5',
                      padding: '8px',
                      borderRadius: '4px',
                      marginBottom: '10px'
                    }}>
                      <p style={{ margin: '3px 0', fontSize: '12px' }}>
                        🚫 <strong>Tab Switches:</strong> <span style={{ color: '#f44336' }}>{session.tabSwitches}</span>
                      </p>
                      <p style={{ margin: '3px 0', fontSize: '12px' }}>
                        📍 <strong>Location Changes:</strong> <span style={{ color: '#f44336' }}>{session.locationChanges}</span>
                      </p>
                      <p style={{ margin: '3px 0', fontSize: '12px' }}>
                        ⚫ <strong>Screen Blurs:</strong> <span style={{ color: '#f44336' }}>{session.screenBlurs}</span>
                      </p>
                      <p style={{ margin: '3px 0', fontSize: '12px' }}>
                        👤 <strong>Face Absences:</strong> <span style={{ color: '#f44336' }}>{session.faceAbsences || 0}</span>
                      </p>
                      <p style={{ margin: '3px 0', fontSize: '12px' }}>
                        <strong style={{ color: getViolationColor(session.totalViolations) }}>
                          Total Violations: {session.totalViolations}
                        </strong>
                      </p>
                    </div>

                    <button
                      className="button button--secondary"
                      onClick={() => setSelectedSession(selectedSession === session._id ? null : session._id)}
                      style={{ width: '100%' }}
                    >
                      {selectedSession === session._id ? 'Hide Details' : 'View Details'}
                    </button>

                    {selectedSession === session._id && (
                      <div style={{
                        marginTop: '10px',
                        paddingTop: '10px',
                        borderTop: '1px solid var(--border)'
                      }}>
                        <h5 style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 'bold' }}>Violation Timeline</h5>
                        {session.violations && session.violations.length > 0 ? (
                          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {session.violations.map((violation, idx) => (
                              <div
                                key={idx}
                                style={{
                                  padding: '8px',
                                  background: '#fff3cd',
                                  borderLeft: '3px solid #ff9800',
                                  marginBottom: '8px',
                                  borderRadius: '2px',
                                  fontSize: '12px'
                                }}
                              >
                                <p style={{ margin: '2px 0' }}>
                                  <strong>{violation.type.replace('_', ' ').toUpperCase()}</strong>
                                </p>
                                <p style={{ margin: '2px 0', color: '#666' }}>
                                  {new Date(violation.timestamp).toLocaleTimeString()}
                                </p>
                                {violation.details && (
                                  <p style={{ margin: '2px 0', fontSize: '11px', color: '#555' }}>
                                    {violation.details.message || JSON.stringify(violation.details)}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No violations recorded</p>
                        )}

                        {session.initialLocation && (
                          <div style={{
                            marginTop: '10px',
                            padding: '8px',
                            background: '#e3f2fd',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            <p style={{ margin: '0 0 5px' }}>
                              <strong>📍 Initial Location:</strong>
                            </p>
                            <p style={{ margin: '2px 0' }}>
                              Latitude: {session.initialLocation.latitude?.toFixed(6)}
                            </p>
                            <p style={{ margin: '2px 0' }}>
                              Longitude: {session.initialLocation.longitude?.toFixed(6)}
                            </p>
                            <p style={{ margin: '2px 0' }}>
                              Accuracy: ±{session.initialLocation.accuracy?.toFixed(0)}m
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Monitoring;
