import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const RealTimeMonitor = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    normal: 0,
    threats: 0,
    lastUpdate: null
  });

  useEffect(() => {
    let interval;
    if (isMonitoring) {
      interval = setInterval(() => {
        // Simulate real-time data - in production, this would connect to WebSocket or polling
        simulateRealTimeData();
      }, 2000); // Update every 2 seconds
    }
    return () => clearInterval(interval);
  }, [isMonitoring]);

  const simulateRealTimeData = async () => {
    try {
      // Simulate getting a random sample from the test data
      const response = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generateRandomRecord())
      });
      
      const data = await response.json();
      const newPrediction = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        prediction: data.prediction,
        probabilities: data.probabilities,
        isThreat: data.prediction !== 'Normal'
      };

      setPredictions(prev => [newPrediction, ...prev.slice(0, 49)]); // Keep last 50
      updateStats(newPrediction);
    } catch (error) {
      console.error('Error simulating data:', error);
    }
  };

  const generateRandomRecord = () => {
    const protocols = ['tcp', 'udp', 'icmp'];
    const services = ['http', 'ftp', 'smtp', 'private', 'telnet'];
    const flags = ['SF', 'S0', 'REJ', 'RSTR'];
    
    return {
      duration: Math.random() * 100,
      protocol_type: protocols[Math.floor(Math.random() * protocols.length)],
      service: services[Math.floor(Math.random() * services.length)],
      flag: flags[Math.floor(Math.random() * flags.length)],
      src_bytes: Math.floor(Math.random() * 10000),
      dst_bytes: Math.floor(Math.random() * 10000),
      land: 0,
      wrong_fragment: 0,
      urgent: 0,
      hot: Math.floor(Math.random() * 10),
      num_failed_logins: Math.floor(Math.random() * 5),
      logged_in: Math.random() > 0.5 ? 1 : 0,
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
      count: Math.floor(Math.random() * 100),
      srv_count: Math.floor(Math.random() * 50),
      serror_rate: Math.random(),
      srv_serror_rate: Math.random(),
      rerror_rate: Math.random(),
      srv_rerror_rate: Math.random(),
      same_srv_rate: Math.random(),
      diff_srv_rate: Math.random(),
      srv_diff_host_rate: Math.random(),
      dst_host_count: Math.floor(Math.random() * 255),
      dst_host_srv_count: Math.floor(Math.random() * 50),
      dst_host_same_srv_rate: Math.random(),
      dst_host_diff_srv_rate: Math.random(),
      dst_host_same_src_port_rate: Math.random(),
      dst_host_srv_diff_host_rate: Math.random(),
      dst_host_serror_rate: Math.random(),
      dst_host_srv_serror_rate: Math.random(),
      dst_host_rerror_rate: Math.random(),
      dst_host_srv_rerror_rate: Math.random()
    };
  };

  const updateStats = (prediction) => {
    setStats(prev => ({
      total: prev.total + 1,
      normal: prediction.prediction === 'Normal' ? prev.normal + 1 : prev.normal,
      threats: prediction.isThreat ? prev.threats + 1 : prev.threats,
      lastUpdate: new Date().toLocaleTimeString()
    }));
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
      case 'Normal': return <CheckCircle className="w-4 h-4" />;
      case 'DoS': return <AlertTriangle className="w-4 h-4" />;
      case 'Probe': return <AlertTriangle className="w-4 h-4" />;
      case 'R2L': return <AlertTriangle className="w-4 h-4" />;
      case 'U2R': return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getChartData = () => {
    // Group predictions by minute for the chart
    const chartData = {};
    predictions.forEach(pred => {
      const minute = pred.timestamp.split(':')[0] + ':' + pred.timestamp.split(':')[1];
      if (!chartData[minute]) {
        chartData[minute] = { time: minute, normal: 0, threats: 0 };
      }
      if (pred.isThreat) {
        chartData[minute].threats++;
      } else {
        chartData[minute].normal++;
      }
    });
    
    return Object.values(chartData).slice(-20); // Last 20 minutes
  };

  const getThreatDistribution = () => {
    const distribution = {};
    predictions.forEach(pred => {
      distribution[pred.prediction] = (distribution[pred.prediction] || 0) + 1;
    });
    return Object.entries(distribution).map(([type, count]) => ({
      type,
      count,
      color: type === 'Normal' ? '#10B981' : 
             type === 'DoS' ? '#EF4444' :
             type === 'Probe' ? '#F59E0B' :
             type === 'R2L' ? '#8B5CF6' : '#EC4899'
    }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Real-time Threat Monitoring</h1>
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-full ${isMonitoring ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              <Activity className="w-5 h-5 inline mr-2" />
              {isMonitoring ? 'Monitoring Active' : 'Monitoring Stopped'}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsMonitoring(true)}
                disabled={isMonitoring}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Play className="w-4 h-4 mr-2" />
                Start
              </button>
              <button
                onClick={() => setIsMonitoring(false)}
                disabled={!isMonitoring}
                className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </button>
              <button
                onClick={() => {
                  setIsMonitoring(false);
                  setPredictions([]);
                  setStats({ total: 0, normal: 0, threats: 0, lastUpdate: null });
                }}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Square className="w-4 h-4 mr-2" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-600">Total Processed</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-600">Normal Traffic</p>
                <p className="text-2xl font-bold text-green-900">{stats.normal}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-600">Threats Detected</p>
                <p className="text-2xl font-bold text-red-900">{stats.threats}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-gray-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Last Update</p>
                <p className="text-sm font-bold text-gray-900">{stats.lastUpdate || 'Never'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Real-time Timeline */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Activity Timeline</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'normal' ? 'Normal' : 'Threats']}
                  labelStyle={{ color: '#374151' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="normal" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="normal"
                />
                <Line 
                  type="monotone" 
                  dataKey="threats" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="threats"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Threat Distribution */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Threat Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getThreatDistribution()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Count']} />
                <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Predictions */}
        <div className="bg-white border rounded-lg">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Recent Predictions</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {predictions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No predictions yet. Start monitoring to see real-time data.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {predictions.map((prediction) => (
                  <div key={prediction.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getThreatColor(prediction.prediction)}`}>
                          <div className="flex items-center space-x-1">
                            {getThreatIcon(prediction.prediction)}
                            <span>{prediction.prediction}</span>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{prediction.timestamp}</span>
                      </div>
                      <div className="text-right">
                        {prediction.probabilities && prediction.probabilities[prediction.prediction] && (
                          <span className="text-sm text-gray-600">
                            {(prediction.probabilities[prediction.prediction] * 100).toFixed(1)}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeMonitor;
