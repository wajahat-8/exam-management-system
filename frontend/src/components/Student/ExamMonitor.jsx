import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as faceapi from '@vladmandic/face-api';
import '../../theme/theme.css';

const ExamMonitor = ({ examId, onViolation }) => {
  const [violations, setViolations] = useState([]);
  const [locationWarning, setLocationWarning] = useState(null);
  const [tabSwitchWarning, setTabSwitchWarning] = useState(false);
  const [windowBlurWarning, setWindowBlurWarning] = useState(false);
  const [initialLocation, setInitialLocation] = useState(null);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [faceDetected, setFaceDetected] = useState(true);
  const [faceModelsLoaded, setFaceModelsLoaded] = useState(false);

  const tabSwitchCountRef = useRef(0);
  const blurCountRef = useRef(0);
  const faceAbsenceCountRef = useRef(0);
  const watchIdRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const videoRef = useRef(null);
  const isLoggingViolationRef = useRef(false);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Start monitoring
  useEffect(() => {
    const startMonitoring = async () => {
      try {
        const activateSession = async (location = null) => {
          try {
            const res = await axios.post(
              'http://localhost:5000/api/monitoring/start',
              { examId, location },
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            setSessionId(res.data._id);
          } catch (err) {
            console.error('Failed to start monitoring session on backend:', err);
          } finally {
            // Always activate monitoring locally so camera starts
            setMonitoringActive(true);
          }
        };

        // Get initial location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
              };
              setInitialLocation(location);
              await activateSession(location);

              // Watch location changes
              watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                  const currentLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                  };

                  const distance = calculateDistance(
                    location.latitude,
                    location.longitude,
                    currentLocation.latitude,
                    currentLocation.longitude
                  );

                  // Alert if moved more than 10 meters
                  if (distance > 10) {
                    logLocationViolation(currentLocation, distance);
                  }
                },
                (error) => console.error('Geolocation error:', error),
                { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
              );
            },
            async (error) => {
              console.error('Failed to get initial location:', error);
              await activateSession(null);
            },
            { timeout: 5000 } // Timeout added here to prevent hanging!
          );
        } else {
          await activateSession(null);
        }
      } catch (err) {
        console.error('Failed to start monitoring:', err);
        setMonitoringActive(true); // Fallback
      }
    };

    startMonitoring();

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      // End backend session when student leaves the exam
      axios.post(
        'http://localhost:5000/api/monitoring/end',
        { examId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      ).catch((err) => console.error('Failed to end monitoring on unmount:', err));
    };
  }, [examId]);

  // Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCountRef.current += 1;
        setTabSwitchWarning(true);
        logTabViolation();
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = setTimeout(() => setTabSwitchWarning(false), 3000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [examId]);

  // Window blur detection
  useEffect(() => {
    const handleWindowBlur = () => {
      blurCountRef.current += 1;
      setWindowBlurWarning(true);
      logBlurViolation();
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = setTimeout(() => setWindowBlurWarning(false), 3000);
    };

    window.addEventListener('blur', handleWindowBlur);
    return () => window.removeEventListener('blur', handleWindowBlur);
  }, [examId]);

  // Prevent copy-paste, right-click, etc.
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Log tab switch violation
  const logTabViolation = async () => {
    if (isLoggingViolationRef.current) return;
    isLoggingViolationRef.current = true;
    try {
      const res = await axios.post(
        'http://localhost:5000/api/monitoring/tab-switch',
        { examId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setViolations(prev => [...prev, { type: 'tab_switch', timestamp: new Date() }]);
      if (onViolation) onViolation(res.data.totalViolations, 'tab_switch');
    } catch (err) {
      console.error('Failed to log tab violation:', err);
    } finally {
      setTimeout(() => { isLoggingViolationRef.current = false; }, 1000);
    }
  };

  // Log location change violation
  const logLocationViolation = async (currentLocation, distance) => {
    if (isLoggingViolationRef.current) return;
    isLoggingViolationRef.current = true;
    try {
      const res = await axios.post(
        'http://localhost:5000/api/monitoring/location-change',
        { examId, currentLocation, distance },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setLocationWarning(`Moved ${distance.toFixed(0)}m from exam location`);
      setViolations(prev => [...prev, { type: 'location_change', distance, timestamp: new Date() }]);
      if (onViolation) onViolation(res.data.totalViolations, 'location_change');
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = setTimeout(() => setLocationWarning(null), 4000);
    } catch (err) {
      console.error('Failed to log location violation:', err);
    } finally {
      setTimeout(() => { isLoggingViolationRef.current = false; }, 1000);
    }
  };

  // Log screen blur violation
  const logBlurViolation = async () => {
    if (isLoggingViolationRef.current) return;
    isLoggingViolationRef.current = true;
    try {
      const res = await axios.post(
        'http://localhost:5000/api/monitoring/screen-blur',
        { examId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setViolations(prev => [...prev, { type: 'screen_blur', timestamp: new Date() }]);
      if (onViolation) onViolation(res.data.totalViolations, 'screen_blur');
    } catch (err) {
      console.error('Failed to log blur violation:', err);
    } finally {
      setTimeout(() => { isLoggingViolationRef.current = false; }, 1000);
    }
  };

  // Log face absence violation
  const logFaceAbsenceViolation = async () => {
    if (isLoggingViolationRef.current) return;
    isLoggingViolationRef.current = true;
    try {
      const res = await axios.post(
        'http://localhost:5000/api/monitoring/face-absence',
        { examId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setViolations(prev => [...prev, { type: 'face_absence', timestamp: new Date() }]);
      if (onViolation) onViolation(res.data.totalViolations, 'face_absence');
    } catch (err) {
      console.error('Failed to log face absence violation:', err);
    } finally {
      setTimeout(() => { isLoggingViolationRef.current = false; }, 1000);
    }
  };

  // Stop monitoring
  const stopMonitoring = async () => {
    try {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      await axios.post(
        'http://localhost:5000/api/monitoring/end',
        { examId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setMonitoringActive(false);
    } catch (err) {
      console.error('Failed to end monitoring:', err);
    }
  };

  // Load models and start webcam
  useEffect(() => {
    const loadModelsAndStartWebcam = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        setFaceModelsLoaded(true);

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Face API or webcam error:', err);
      }
    };

    if (monitoringActive) {
      loadModelsAndStartWebcam();
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [monitoringActive]);

  // Face detection loop
  useEffect(() => {
    let intervalId;
    if (monitoringActive && faceModelsLoaded && videoRef.current) {
      intervalId = setInterval(async () => {
        if (videoRef.current.readyState === 4) {
          const detections = await faceapi.detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          );

          if (detections.length === 0) {
            faceAbsenceCountRef.current += 1;
            
            // Trigger warning and violation after 1 consecutive interval (2 seconds)
            if (faceAbsenceCountRef.current >= 1) {
              setFaceDetected(false);
              // Log violation immediately on the 1st interval
              if (faceAbsenceCountRef.current === 1) {
                logFaceAbsenceViolation();
              }
            }
          } else {
            faceAbsenceCountRef.current = 0;
            setFaceDetected(true);
          }
        }
      }, 2000);
    }
    return () => clearInterval(intervalId);
  }, [monitoringActive, faceModelsLoaded]);

  return (
    <div className="monitor-panel" style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '12px',
      zIndex: 1000,
      minWidth: '280px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 'bold' }}>Exam Proctoring</h4>

      {/* Webcam Feed (Miniature) */}
      <div style={{ marginBottom: '10px', textAlign: 'center' }}>
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline
          style={{ 
            width: '100%', 
            maxWidth: '120px', 
            borderRadius: '4px', 
            border: faceDetected ? '2px solid #4caf50' : '2px solid #f44336' 
          }} 
        />
        {!faceDetected && (
          <p style={{ color: '#f44336', margin: '5px 0 0', fontSize: '11px', fontWeight: 'bold' }}>
            🚨 Face not detected!
          </p>
        )}
      </div>

      {/* Location Status */}
      <div style={{ marginBottom: '10px', fontSize: '12px' }}>
        <p style={{ margin: '5px 0' }}>
          📍 Location: <span style={{ color: initialLocation ? '#4caf50' : '#f44336' }}>
            {initialLocation ? 'Verified' : 'Checking...'}
          </span>
        </p>
        {locationWarning && (
          <p style={{ margin: '5px 0', color: '#ff9800', fontWeight: 'bold' }}>
            ⚠️ {locationWarning}
          </p>
        )}
      </div>

      {/* Warnings */}
      {tabSwitchWarning && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          color: '#856404',
          padding: '8px',
          borderRadius: '4px',
          marginBottom: '10px',
          fontSize: '12px'
        }}>
          ⚠️ Do not switch tabs during exam!
        </div>
      )}

      {windowBlurWarning && (
        <div style={{
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          color: '#721c24',
          padding: '8px',
          borderRadius: '4px',
          marginBottom: '10px',
          fontSize: '12px'
        }}>
          ⚠️ Keep window focused!
        </div>
      )}

      {/* Violation Count */}
      <div style={{ fontSize: '12px', marginBottom: '10px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
        <p style={{ margin: '3px 0' }}>Tab Switches: <strong>{tabSwitchCountRef.current}</strong></p>
        <p style={{ margin: '3px 0' }}>Window Blurs: <strong>{blurCountRef.current}</strong></p>
        <p style={{ margin: '3px 0' }}>Total Violations: <strong style={{ color: violations.length > 5 ? '#f44336' : '#333' }}>{violations.length}</strong></p>
      </div>

      {violations.length > 5 && (
        <div style={{
          background: '#ffebee',
          border: '2px solid #f44336',
          color: '#c62828',
          padding: '8px',
          borderRadius: '4px',
          marginBottom: '10px',
          fontSize: '11px',
          fontWeight: 'bold'
        }}>
          🚨 Too many violations! Exam may be flagged.
        </div>
      )}

      {/* Status */}
      <p style={{ margin: '10px 0 0', fontSize: '11px', color: '#666' }}>
        Status: <span style={{ color: monitoringActive ? '#4caf50' : '#f44336' }}>
          {monitoringActive ? '● Active' : '● Inactive'}
        </span>
      </p>
    </div>
  );
};

export default ExamMonitor;
