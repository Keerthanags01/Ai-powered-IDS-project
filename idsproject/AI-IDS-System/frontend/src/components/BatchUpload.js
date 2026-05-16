import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, AlertCircle } from 'lucide-react';

const BatchUpload = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    setUploadedFile(file);
    setResults(null);
    setError(null);
    setProgress(0);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB limit
  });

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setLoading(true);
    setError(null);
    setProgress(0);
    setResults(null);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/upload-csv', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Failed to process file');
      setResults({ error: error.message || 'Failed to process file' });
    } finally {
      setLoading(false);
      setProgress(0);
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
      case 'Normal': return <CheckCircle className="w-4 h-4" />;
      case 'DoS': return <XCircle className="w-4 h-4" />;
      case 'Probe': return <AlertTriangle className="w-4 h-4" />;
      case 'R2L': return <AlertTriangle className="w-4 h-4" />;
      case 'U2R': return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getSummaryStats = () => {
    if (!results?.results) return null;

    const summary = results.results.reduce((acc, result) => {
      const prediction = result.prediction;
      acc[prediction] = (acc[prediction] || 0) + 1;
      return acc;
    }, {});

    return summary;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Batch File Upload</h1>
        
        {/* Upload Area */}
        <div className="mb-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-lg text-blue-600">Drop the CSV file here...</p>
            ) : (
              <div>
                <p className="text-lg text-gray-600 mb-2">
                  Drag & drop a CSV file here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supported format: CSV files with network traffic data (Max 10MB)
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Required columns: duration, protocol_type, service, flag, src_bytes, dst_bytes, etc.
                </p>
              </div>
            )}
          </div>

          {uploadedFile && (
            <div className="mt-4 flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900">{uploadedFile.name}</span>
                <span className="text-sm text-gray-500">
                  ({(uploadedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Analyze File'}
              </button>
            </div>
          )}

          {/* Progress Bar */}
          {loading && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Processing file...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Upload Error</h4>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {results.error ? (
              <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>{results.error}</span>
                </div>
              </div>
            ) : (
              <>
                {/* Processing Info */}
                {results.total_rows_processed && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Processing Summary</h4>
                    <p className="text-sm text-blue-700">
                      Processed {results.total_rows_processed} rows from CSV file
                    </p>
                    {results.errors && results.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-blue-700">
                          {results.errors.length} rows had errors and were skipped
                        </p>
                        <details className="mt-2">
                          <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                            View errors ({results.errors.length})
                          </summary>
                          <div className="mt-2 text-xs text-blue-600 bg-blue-100 p-2 rounded max-h-32 overflow-y-auto">
                            {results.errors.map((error, index) => (
                              <div key={index} className="mb-1">{error}</div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                )}

                {/* Summary Stats */}
                {getSummaryStats() && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(getSummaryStats()).map(([threat, count]) => (
                        <div key={threat} className="text-center">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full ${getThreatColor(threat)}`}>
                            {getThreatIcon(threat)}
                            <span className="ml-2 font-medium">{threat}</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 mt-2">{count}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-lg text-gray-600">
                        Total Records: <span className="font-bold text-gray-900">{results.total}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Detailed Results */}
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-3 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Detailed Results</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Record #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Prediction
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Confidence
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Protocol
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Service
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {results.results.slice(0, 50).map((result, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getThreatColor(result.prediction)}`}>
                                {getThreatIcon(result.prediction)}
                                <span className="ml-1">{result.prediction}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {result.probabilities && result.probabilities[result.prediction]
                                ? `${(result.probabilities[result.prediction] * 100).toFixed(1)}%`
                                : 'N/A'
                              }
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {result.input.protocol_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {result.input.service}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {results.results.length > 50 && (
                      <div className="px-6 py-3 bg-gray-50 text-center text-sm text-gray-500">
                        Showing first 50 results of {results.total} total records
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchUpload;