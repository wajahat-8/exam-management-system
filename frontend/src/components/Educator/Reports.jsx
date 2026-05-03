import { useState, useEffect } from 'react';
import axios from 'axios';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5000/api/educators/reports');
        setReports(res.data);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
        alert('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  return (
    <div className="panel">
      <div className="page-title">
        <h3>Reports</h3>
        <p>Review exam summary and individual student performance for each variant.</p>
      </div>

      {loading ? (
        <p>Loading reports...</p>
      ) : reports.length === 0 ? (
        <p>No reports available yet. Publish exams and have students submit answers to generate reports.</p>
      ) : (
        reports.map((report) => (
          <div key={report.examId} className="panel-form">
            <h4>{report.examTitle}</h4>
            <p><strong>Average Score:</strong> {report.averageScore.toFixed(2)}%</p>
            <p><strong>Total Students:</strong> {report.totalStudents}</p>

            {report.results.length === 0 ? (
              <p style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                No student results recorded for this exam yet.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Score</th>
                      <th>Percentage</th>
                      <th>Submitted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.results.map((result) => (
                      <tr key={result.resultId}>
                        <td>{result.studentId || 'N/A'}</td>
                        <td>{result.studentName}</td>
                        <td>{result.score}/{result.totalQuestions}</td>
                        <td>{result.percentage?.toFixed(2)}%</td>
                        <td>{new Date(result.submittedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Reports;
