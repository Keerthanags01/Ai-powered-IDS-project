import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const SinglePrediction = () => {
  const [formData, setFormData] = useState({
    duration: 0,
    protocol_type: 'tcp',
    service: 'http',
    flag: 'SF',
    src_bytes: 0,
    dst_bytes: 0,
    land: 0,
    wrong_fragment: 0,
    urgent: 0,
    hot: 0,
    num_failed_logins: 0,
    logged_in: 0,
    num_compromised: 0,
    root_shell: 0,
    su_attempted: 0,
    num_root: 0,
    num_file_creations: 0,
    num_shells: 0,
    num_access_files: 0,
    num_outbound_cmds: 0,
    is_host_login: 0,
    is_guest_login: 0,
    count: 0,
    srv_count: 0,
    serror_rate: 0,
    srv_serror_rate: 0,
    rerror_rate: 0,
    srv_rerror_rate: 0,
    same_srv_rate: 0,
    diff_srv_rate: 0,
    srv_diff_host_rate: 0,
    dst_host_count: 0,
    dst_host_srv_count: 0,
    dst_host_same_srv_rate: 0,
    dst_host_diff_srv_rate: 0,
    dst_host_same_src_port_rate: 0,
    dst_host_srv_diff_host_rate: 0,
    dst_host_serror_rate: 0,
    dst_host_srv_serror_rate: 0,
    dst_host_rerror_rate: 0,
    dst_host_srv_rerror_rate: 0
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('rate') ? parseFloat(value) : 
              ['protocol_type', 'service', 'flag'].includes(name) ? value : 
              parseFloat(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: 'Failed to get prediction' });
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = async (type) => {
    try {
      const response = await fetch('/sample-data');
      const samples = await response.json();
      const sample = samples.find(s => s.name.toLowerCase().includes(type.toLowerCase()));
      if (sample) {
        setFormData(sample.record);
      }
    } catch (error) {
      console.error('Error loading sample data:', error);
    }
  };

  const getThreatColor = (prediction) => {
    switch (prediction) {
      case 'Normal': return 'text-green-600 bg-green-100';
      case 'DoS': return 'text-red-600 bg-red-100';
      case 'Probe': return 'text-yellow-600 bg-yellow-100';
      case 'R2L': return 'text-purple-600 bg-purple-100';
      case 'U2R': return 'text-pink-600 bg-pink-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getThreatIcon = (prediction) => {
    switch (prediction) {
      case 'Normal': return <CheckCircle className="w-6 h-6" />;
      case 'DoS': return <XCircle className="w-6 h-6" />;
      case 'Probe': return <AlertTriangle className="w-6 h-6" />;
      case 'R2L': return <AlertTriangle className="w-6 h-6" />;
      case 'U2R': return <AlertTriangle className="w-6 h-6" />;
      default: return <AlertTriangle className="w-6 h-6" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Single Record Prediction</h1>
        
        {/* Sample Data Buttons */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Load Sample Data:</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadSampleData('normal')}
              className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
            >
              Normal Traffic
            </button>
            <button
              onClick={() => loadSampleData('dos')}
              className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
            >
              DoS Attack
            </button>
            <button
              onClick={() => loadSampleData('probe')}
              className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
            >
              Probe Attack
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Connection Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Protocol Type</label>
              <select
                name="protocol_type"
                value={formData.protocol_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
                <option value="icmp">ICMP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
              <input
                type="text"
                name="service"
                value={formData.service}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Flag</label>
              <select
                name="flag"
                value={formData.flag}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SF">SF</option>
                <option value="S0">S0</option>
                <option value="REJ">REJ</option>
                <option value="RSTR">RSTR</option>
                <option value="RSTO">RSTO</option>
                <option value="SH">SH</option>
                <option value="S1">S1</option>
                <option value="S2">S2</option>
                <option value="RSTOS0">RSTOS0</option>
                <option value="S3">S3</option>
                <option value="SHR">SHR</option>
                <option value="OTH">OTH</option>
              </select>
            </div>
          </div>

          {/* Bytes and Counts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source Bytes</label>
              <input
                type="number"
                name="src_bytes"
                value={formData.src_bytes}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination Bytes</label>
              <input
                type="number"
                name="dst_bytes"
                value={formData.dst_bytes}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Count</label>
              <input
                type="number"
                name="count"
                value={formData.count}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Count</label>
              <input
                type="number"
                name="srv_count"
                value={formData.srv_count}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Error Rates */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source Error Rate</label>
              <input
                type="number"
                name="serror_rate"
                value={formData.serror_rate}
                onChange={handleInputChange}
                min="0"
                max="1"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Error Rate</label>
              <input
                type="number"
                name="srv_serror_rate"
                value={formData.srv_serror_rate}
                onChange={handleInputChange}
                min="0"
                max="1"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reply Error Rate</label>
              <input
                type="number"
                name="rerror_rate"
                value={formData.rerror_rate}
                onChange={handleInputChange}
                min="0"
                max="1"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Reply Error Rate</label>
              <input
                type="number"
                name="srv_rerror_rate"
                value={formData.srv_rerror_rate}
                onChange={handleInputChange}
                min="0"
                max="1"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analyzing...' : 'Analyze Network Traffic'}
          </button>
        </form>

        {/* Results */}
        {result && (
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h3>
            
            {result.error ? (
              <div className="text-red-600">{result.error}</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className={`px-4 py-2 rounded-lg ${getThreatColor(result.prediction)}`}>
                    <div className="flex items-center space-x-2">
                      {getThreatIcon(result.prediction)}
                      <span className="font-semibold">{result.prediction}</span>
                    </div>
                  </div>
                </div>

                {result.probabilities && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Confidence Levels:</h4>
                    <div className="space-y-2">
                      {Object.entries(result.probabilities).map(([threat, confidence]) => (
                        <div key={threat} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{threat}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getThreatColor(threat).split(' ')[0].replace('text-', 'bg-')}`}
                                style={{ width: `${confidence * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-12 text-right">
                              {(confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SinglePrediction;
