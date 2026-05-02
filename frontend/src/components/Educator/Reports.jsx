import { useState, useEffect } from 'react';
import axios from 'axios';

const Reports = () => {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/educators/reports');
        setReports(res.data);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
        alert('Failed to load reports');
      }
    };
    fetchReports();
  }, []);

  return (
    <div>
      <h3>Reports</h3>
      <ul>
        {reports.map(report => (
          <li key={report.exam}>
            <h4>{report.exam}</h4>
            <p>Average Score: {report.averageScore.toFixed(2)}%</p>
            <p>Total Students: {report.totalStudents}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Reports;