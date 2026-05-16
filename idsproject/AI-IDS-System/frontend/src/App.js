import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import SinglePrediction from './components/SinglePrediction';
import BatchUpload from './components/BatchUpload';
import RealTimeMonitor from './components/RealTimeMonitor';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const [apiStatus, setApiStatus] = useState(null);

  useEffect(() => {
    // Check API health on startup
    fetch('/health')
      .then(res => res.json())
      .then(data => setApiStatus(data))
      .catch(err => setApiStatus({ status: 'error', model_loaded: false }));
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar apiStatus={apiStatus} />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard apiStatus={apiStatus} />} />
            <Route path="/single" element={<SinglePrediction />} />
            <Route path="/batch" element={<BatchUpload />} />
            <Route path="/monitor" element={<RealTimeMonitor />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
