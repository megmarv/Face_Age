"use client"

import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

const Scanner = () => {
  const webcamRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const startScan = async () => {
    if (!webcamRef.current) {
      setError('Webcam is not accessible. Please allow camera permissions.');
      return;
    }
    setScanning(true);
    setResult(null);
    setError(null);
    const frames = [];
    const interval = setInterval(() => {
      const screenshot = webcamRef.current.getScreenshot();
      if (screenshot) {
        frames.push(screenshot);
      }
    }, 500); // Capture every 0.5 seconds

    setTimeout(async () => {
      clearInterval(interval);
      setScanning(false);
      if (frames.length === 0) {
        setError('No frames captured. Please try again.');
        return;
      }
      // Convert base64 frames to blobs
      const formData = new FormData();
      frames.forEach((frame, index) => {
        const blob = dataURLtoBlob(frame);
        formData.append('files', blob, `frame${index}.jpg`);
      });
      try {
        const response = await axios.post('http://localhost:8000/analyze', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setResult(response.data);
      } catch (error) {
        setError('Failed to analyze images. Please ensure a face is visible.');
      }
    }, 10000); // 10 seconds
  };

  // Helper function to convert base64 to blob
  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>AI Face Scanner</h1>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={640}
        height={480}
        style={{ border: '2px solid #333', marginBottom: '10px' }}
      />
      <br />
      <button
        onClick={startScan}
        disabled={scanning}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: scanning ? '#ccc' : '#0070f3',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: scanning ? 'not-allowed' : 'pointer',
        }}
      >
        {scanning ? 'Scanning...' : 'Start 10-Second Scan'}
      </button>
      {result && (
        <div style={{ marginTop: '20px' }}>
          <h2>Analysis Results</h2>
          {result.error ? (
            <p style={{ color: 'red' }}>{result.error}</p>
          ) : (
            <>
              <p><strong>Estimated Age:</strong> {result.average_age.toFixed(1)} years</p>
              <p><strong>Dominant Emotion:</strong> {result.dominant_emotion}</p>
              <p><strong>Insight:</strong> The detected age suggests a {result.average_age < 30 ? 'younger' : 'mature'} individual, and the {result.dominant_emotion.toLowerCase()} emotion may indicate their current mood or reaction.</p>
            </>
          )}
        </div>
      )}
      {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}
    </div>
  );
};

export default Scanner;