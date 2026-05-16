# AI-Powered Intrusion Detection System (NSL-KDD)

A comprehensive end-to-end Intrusion Detection System with a modern web interface. Trains a 5-class classifier (Normal, DoS, Probe, R2L, U2R) and provides real-time threat detection through an interactive dashboard.

## 🚀 Features

- **Machine Learning Model**: 79.91% accuracy on test data
- **Interactive Web Dashboard**: Real-time visualizations and monitoring
- **Single Prediction**: Test individual network records
- **Batch Processing**: Upload CSV files for bulk analysis
- **Real-time Monitoring**: Live threat detection simulation
- **Advanced Visualizations**: Bar charts, pie charts, confusion matrix, timeline graphs
- **RESTful API**: Complete backend with Swagger documentation

## 📋 Prerequisites

- **Python**: 3.11 (64-bit) - recommended, also works with 3.12
- **Node.js**: 16+ (for frontend)
- **Data Files**: `KDDTrain+.txt` and `KDDTest+.txt` (included)

## 🛠️ Setup & Installation

### 1. Clone and Navigate to Project
```powershell
cd "your-project-folder"
```

### 2. Backend Setup

#### Create Virtual Environment
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

#### Install Dependencies
```powershell
pip install -r requirements-web.txt
```

#### Train the Model (First Time Only)
```powershell
python train.py --train KDDTrain+.txt --test KDDTest+.txt --artifacts artifacts
```

This creates:
- `artifacts/model.joblib`: Trained ML pipeline
- `artifacts/metrics.json`: Model performance metrics

### 3. Frontend Setup

#### Navigate to Frontend Directory
```powershell
cd frontend
```

#### Install Node.js Dependencies
```powershell
npm install
```

## 🚀 Running the Application

### Method 1: VS Code (Recommended)

1. **Open project in VS Code**
2. **Open Terminal 1** (Backend):
   ```powershell
   .\.venv\Scripts\Activate.ps1
   uvicorn serve:app --reload --port 8000
   ```
3. **Open Terminal 2** (Frontend):
   ```powershell
   cd frontend
   npm start
   ```

### Method 2: Command Line

#### Terminal 1 - Backend Server
```powershell
# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Start API server
uvicorn serve:app --reload --port 8000
```

#### Terminal 2 - Frontend Server
```powershell
# Navigate to frontend
cd frontend

# Start React development server
npm start
```

## 🌐 Access the Application

- **Web Dashboard**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **API Health Check**: http://localhost:8000/health

## 📊 Web Application Features

### Dashboard
- **Real-time Statistics**: Total predictions, threats detected, accuracy rate
- **Interactive Charts**: 
  - Bar Chart: Normal vs Attack detection
  - Pie Chart: Attack type distribution
  - Confusion Matrix: Model performance visualization
  - Timeline: 24-hour attack patterns
- **Model Status**: Live model health monitoring

### Single Prediction
- **Manual Input**: Test individual network traffic records
- **Sample Data**: Pre-loaded attack examples (DoS, Probe, Normal)
- **Real-time Analysis**: Instant threat classification with confidence levels
- **Visual Indicators**: Color-coded threat severity

### Batch Upload
- **CSV File Upload**: Drag & drop interface with validation
- **Progress Tracking**: Real-time processing feedback
- **Error Handling**: Detailed error reporting and validation
- **Results Summary**: Statistics and detailed analysis table
- **File Size Limit**: 10MB maximum, 1000 records per batch

### Real-time Monitor
- **Live Simulation**: Continuous threat detection simulation
- **Interactive Controls**: Start, pause, stop monitoring
- **Real-time Charts**: Live activity timeline and threat distribution
- **Recent Predictions**: Live feed of detection results

## 🔧 API Endpoints

### Core Endpoints
- `GET /` - Homepage with API information
- `GET /health` - Health check and model status
- `POST /predict` - Single record prediction
- `POST /predict-batch` - Batch prediction
- `POST /upload-csv` - CSV file upload and processing

### Data Endpoints
- `GET /sample-data` - Sample threat data for testing
- `GET /stats` - Model statistics and performance metrics
- `GET /chart-data` - Dashboard visualization data
- `POST /reload` - Reload model from disk

## 📁 Project Structure

```
mini project 2025/
├── .venv/                    # Python virtual environment
├── artifacts/                # Model artifacts
│   ├── model.joblib         # Trained ML pipeline
│   └── metrics.json         # Model performance metrics
├── frontend/                 # React web application
│   ├── public/              # Static assets
│   ├── src/                 # React source code
│   │   ├── components/      # React components
│   │   ├── App.js          # Main app component
│   │   └── index.js        # Entry point
│   ├── package.json        # Node.js dependencies
│   └── tailwind.config.js  # Tailwind CSS config
├── .vscode/                 # VS Code settings (optional)
├── serve.py                 # FastAPI backend server
├── train.py                 # Model training script
├── stream_sim.py           # Stream simulator
├── requirements-web.txt    # Python dependencies
├── sample_data.csv         # Sample test data
├── sample_threats.json     # Sample threat examples
├── KDDTrain+.txt          # Training dataset
├── KDDTest+.txt           # Test dataset
└── README.md              # This file
```

## 🧪 Testing the Application

### 1. Test Single Prediction
1. Go to http://localhost:3000
2. Click "Single Test" tab
3. Click "Load Sample Data" → "Normal Traffic"
4. Click "Analyze Network Traffic"
5. View prediction results

### 2. Test Batch Upload
1. Go to "Batch Upload" tab
2. Drag and drop `sample_data.csv`
3. Click "Analyze File"
4. View processing results and statistics

### 3. Test Real-time Monitor
1. Go to "Live Monitor" tab
2. Click "Start" to begin simulation
3. Watch real-time charts and predictions
4. Click "Stop" to end simulation

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
```powershell
# Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

#### Uvicorn Not Found
```powershell
# Install dependencies
pip install -r requirements-web.txt

# Or use Python module syntax
python -m uvicorn serve:app --reload --port 8000
```

#### Model Not Found
```powershell
# Train the model first
python train.py --train KDDTrain+.txt --test KDDTest+.txt --artifacts artifacts
```

#### Node.js Issues
```powershell
# Check Node.js version
node --version
npm --version

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### File Upload Issues
- **File too large**: Maximum 10MB allowed
- **Invalid format**: Must be CSV with required columns
- **Missing columns**: Check CSV has all 41 required fields
- **Processing timeout**: Reduce file size or complexity

## 📈 Model Performance

### Test Set Results
- **Overall Accuracy**: 79.91%
- **Normal Traffic F1-Score**: 82.02%
- **DoS Attacks F1-Score**: 86.82%
- **Probe Attacks F1-Score**: 81.65%
- **R2L Attacks F1-Score**: 39.69%
- **U2R Attacks F1-Score**: 32.26%

### Attack Categories
- **Normal**: Legitimate network traffic
- **DoS**: Denial of Service attacks (neptune, back, teardrop, etc.)
- **Probe**: Network reconnaissance (nmap, satan, ipsweep, etc.)
- **R2L**: Remote-to-Local attacks (password guessing, unauthorized access)
- **U2R**: User-to-Root attacks (privilege escalation, buffer overflows)

## 🚀 Production Deployment

### Build Frontend
```powershell
cd frontend
npm run build
```

### Production Server
```powershell
pip install gunicorn
gunicorn serve:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 📝 Notes

- **Model Path**: Set `MODEL_PATH` environment variable to use different model
- **CORS**: Localhost origins allowed by default, override with `ALLOW_ORIGINS` env var
- **File Limits**: 10MB max file size, 1000 records per batch
- **Memory**: Chunked processing prevents memory issues with large files
- **Real-time Data**: Dashboard uses real model metrics, timeline is simulated for demo

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational and research purposes.

---

**Ready to detect threats? Start the application and explore the interactive dashboard!** 🛡️
