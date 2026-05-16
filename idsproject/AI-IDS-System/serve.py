import os
from typing import Dict, Any, List
import json
import csv
import io
import asyncio

import joblib
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, constr
import pandas as pd
import numpy as np

MODEL_PATH = os.getenv('MODEL_PATH', os.path.join('artifacts', 'model.joblib'))

app = FastAPI(title='IDS Server', version='0.2.0')

# CORS setup (allow localhost by default; override via ALLOW_ORIGINS env)
allow_origins_env = os.getenv('ALLOW_ORIGINS')
default_origins: List[str] = ['http://127.0.0.1:8000', 'http://localhost:8000', 'http://127.0.0.1:3000', 'http://localhost:3000']
allow_origins = [o.strip() for o in allow_origins_env.split(',')] if allow_origins_env else default_origins
app.add_middleware(
	CORSMiddleware,
	allow_origins=allow_origins,
	allow_credentials=True,
	allow_methods=['*'],
	allow_headers=['*'],
)

pipeline = None

def load_pipeline() -> None:
	global pipeline
	if os.path.exists(MODEL_PATH):
		pipeline = joblib.load(MODEL_PATH)
	else:
		pipeline = None

# Attempt a single load on startup; prediction will lazy-load if needed
load_pipeline()


class NSLKDDRecord(BaseModel):
	duration: float = Field(ge=0)
	protocol_type: constr(strip_whitespace=True)
	service: constr(strip_whitespace=True)
	flag: constr(strip_whitespace=True)
	src_bytes: float = Field(ge=0)
	dst_bytes: float = Field(ge=0)
	land: float = Field(ge=0)
	wrong_fragment: float = Field(ge=0)
	urgent: float = Field(ge=0)
	hot: float = Field(ge=0)
	num_failed_logins: float = Field(ge=0)
	logged_in: float = Field(ge=0)
	num_compromised: float = Field(ge=0)
	root_shell: float = Field(ge=0)
	su_attempted: float = Field(ge=0)
	num_root: float = Field(ge=0)
	num_file_creations: float = Field(ge=0)
	num_shells: float = Field(ge=0)
	num_access_files: float = Field(ge=0)
	num_outbound_cmds: float = Field(ge=0)
	is_host_login: float = Field(ge=0)
	is_guest_login: float = Field(ge=0)
	count: float = Field(ge=0)
	srv_count: float = Field(ge=0)
	serror_rate: float = Field(ge=0, le=1)
	srv_serror_rate: float = Field(ge=0, le=1)
	rerror_rate: float = Field(ge=0, le=1)
	srv_rerror_rate: float = Field(ge=0, le=1)
	same_srv_rate: float = Field(ge=0, le=1)
	diff_srv_rate: float = Field(ge=0, le=1)
	srv_diff_host_rate: float = Field(ge=0, le=1)
	dst_host_count: float = Field(ge=0)
	dst_host_srv_count: float = Field(ge=0)
	dst_host_same_srv_rate: float = Field(ge=0, le=1)
	dst_host_diff_srv_rate: float = Field(ge=0, le=1)
	dst_host_same_src_port_rate: float = Field(ge=0, le=1)
	dst_host_srv_diff_host_rate: float = Field(ge=0, le=1)
	dst_host_serror_rate: float = Field(ge=0, le=1)
	dst_host_srv_serror_rate: float = Field(ge=0, le=1)
	dst_host_rerror_rate: float = Field(ge=0, le=1)
	dst_host_srv_rerror_rate: float = Field(ge=0, le=1)


@app.get('/health')
async def health() -> Dict[str, Any]:
	return {
		'status': 'ok',
		'model_loaded': bool(pipeline is not None)
	}


@app.get('/', response_class=HTMLResponse)
async def root() -> str:
	return """
	<!doctype html>
	<html lang=\"en\">
	<head>
	  <meta charset=\"utf-8\"/>
	  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/>
	  <title>IDS Server</title>
	  <style>
		body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:40px;line-height:1.5;color:#222}
		.card{max-width:720px;border:1px solid #e5e7eb;border-radius:12px;padding:24px;box-shadow:0 1px 2px rgba(0,0,0,.06)}
		h1{margin:0 0 8px 0;font-size:28px}
		.muted{color:#6b7280}
		.links a{display:inline-block;margin-right:12px;text-decoration:none;color:#2563eb}
		.badge{display:inline-block;background:#e5f0ff;color:#1e40af;border-radius:999px;padding:2px 8px;margin-left:8px;font-size:12px}
		code{background:#f6f8fa;border-radius:6px;padding:2px 6px}
	  </style>
	</head>
	<body>
	  <div class=\"card\">
		<h1>IDS Server <span class=\"badge\">v0.2.0</span></h1>
		<p class=\"muted\">Welcome. Use the links below to explore the API.</p>
		<div class=\"links\">
		  <a href=\"/docs\">OpenAPI Docs</a>
		  <a href=\"/health\">Health</a>
		</div>
		<h3>Quick start</h3>
		<pre><code>POST /predict
Content-Type: application/json
</code></pre>
		<p class=\"muted\">Tip: Use the "Try it out" button in <a href=\"/docs\">/docs</a>.</p>
	  </div>
	</body>
	</html>
	"""


@app.post('/reload')
async def reload_model() -> Dict[str, Any]:
	load_pipeline()
	if pipeline is None:
		raise HTTPException(status_code=503, detail='Model not found at MODEL_PATH')
	return {'status': 'ok', 'model_loaded': True}


@app.post('/predict')
async def predict(item: NSLKDDRecord) -> Dict[str, Any]:
	if pipeline is None:
		load_pipeline()
		if pipeline is None:
			raise HTTPException(status_code=503, detail='Model not loaded. Train first or set MODEL_PATH')
	# Convert to DataFrame so ColumnTransformer can reference columns by name
	df = pd.DataFrame([item.model_dump()])
	pred = pipeline.predict(df)[0]
	# Optional: probability per class if supported
	try:
		proba = pipeline.predict_proba(df)[0]
		classes = list(pipeline.named_steps['clf'].classes_) if hasattr(pipeline.named_steps['clf'], 'classes_') else []
		probabilities = {str(c): float(p) for c, p in zip(classes, proba)}
	except Exception:
		probabilities = None
	return {
		'prediction': pred,
		'probabilities': probabilities
	}

# New endpoints for web application
@app.post('/predict-batch')
async def predict_batch(records: List[NSLKDDRecord]) -> Dict[str, Any]:
	"""Predict multiple records at once"""
	if pipeline is None:
		load_pipeline()
		if pipeline is None:
			raise HTTPException(status_code=503, detail='Model not loaded. Train first or set MODEL_PATH')
	
	if len(records) > 1000:  # Limit batch size to prevent memory issues
		raise HTTPException(status_code=400, detail='Batch size too large. Maximum 1000 records allowed.')
	
	results = []
	try:
		# Process records in smaller chunks to prevent memory issues
		chunk_size = 100
		for i in range(0, len(records), chunk_size):
			chunk = records[i:i + chunk_size]
			chunk_data = [record.model_dump() for record in chunk]
			df = pd.DataFrame(chunk_data)
			
			predictions = pipeline.predict(df)
			
			# Get probabilities if available
			try:
				probabilities = pipeline.predict_proba(df)
				classes = list(pipeline.named_steps['clf'].classes_) if hasattr(pipeline.named_steps['clf'], 'classes_') else []
			except Exception:
				probabilities = None
				classes = []
			
			# Process each prediction in the chunk
			for j, pred in enumerate(predictions):
				prob_dict = None
				if probabilities is not None:
					prob_dict = {str(c): float(p) for c, p in zip(classes, probabilities[j])}
				
				results.append({
					'prediction': pred,
					'probabilities': prob_dict,
					'input': chunk_data[j]
				})
		
		return {'results': results, 'total': len(results)}
		
	except Exception as e:
		raise HTTPException(status_code=500, detail=f'Error processing batch: {str(e)}')

@app.post('/upload-csv')
async def upload_csv(file: UploadFile = File(...)):
	"""Upload CSV file and return predictions"""
	try:
		# Validate file
		if not file.filename or not file.filename.lower().endswith('.csv'):
			raise HTTPException(status_code=400, detail='File must be CSV format')
		
		# Check file size (limit to 10MB)
		content = await file.read()
		if len(content) > 10 * 1024 * 1024:  # 10MB limit
			raise HTTPException(status_code=400, detail='File too large. Maximum 10MB allowed.')
		
		csv_content = content.decode('utf-8')
		
		# Parse CSV with better error handling
		csv_reader = csv.DictReader(io.StringIO(csv_content))
		records = []
		errors = []
		
		# Required fields for NSL-KDD
		required_fields = [
			'duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes',
			'land', 'wrong_fragment', 'urgent', 'hot', 'num_failed_logins', 'logged_in',
			'num_compromised', 'root_shell', 'su_attempted', 'num_root', 'num_file_creations',
			'num_shells', 'num_access_files', 'num_outbound_cmds', 'is_host_login',
			'is_guest_login', 'count', 'srv_count', 'serror_rate', 'srv_serror_rate',
			'rerror_rate', 'srv_rerror_rate', 'same_srv_rate', 'diff_srv_rate',
			'srv_diff_host_rate', 'dst_host_count', 'dst_host_srv_count',
			'dst_host_same_srv_rate', 'dst_host_diff_srv_rate',
			'dst_host_same_src_port_rate', 'dst_host_srv_diff_host_rate',
			'dst_host_serror_rate', 'dst_host_srv_serror_rate', 'dst_host_rerror_rate',
			'dst_host_srv_rerror_rate'
		]
		
		row_count = 0
		for row in csv_reader:
			row_count += 1
			try:
				# Check if all required fields are present
				missing_fields = [field for field in required_fields if field not in row]
				if missing_fields:
					errors.append(f'Row {row_count}: Missing fields: {missing_fields}')
					continue
				
				# Convert string values to appropriate types
				record = {}
				for key in required_fields:
					value = row[key].strip() if row[key] else '0'
					
					if key in ['protocol_type', 'service', 'flag']:
						record[key] = str(value)
					else:
						try:
							# Handle empty values and convert to float
							if value == '' or value.lower() in ['null', 'none', 'nan']:
								record[key] = 0.0
							else:
								record[key] = float(value)
						except (ValueError, TypeError):
							errors.append(f'Row {row_count}: Invalid value for {key}: {value}')
							record[key] = 0.0
				
				# Validate the record
				validated_record = NSLKDDRecord(**record)
				records.append(validated_record)
				
				# Limit processing to prevent memory issues
				if len(records) >= 1000:
					errors.append(f'Processing limited to first 1000 records. {row_count - 1000} rows skipped.')
					break
					
			except Exception as e:
				errors.append(f'Row {row_count}: {str(e)}')
				continue
		
		if not records:
			raise HTTPException(status_code=400, detail=f'No valid records found. Errors: {errors[:5]}')
		
		# Get predictions with timeout
		try:
			batch_result = await asyncio.wait_for(predict_batch(records), timeout=60.0)
			batch_result['errors'] = errors[:10]  # Include first 10 errors
			batch_result['total_rows_processed'] = row_count
			return batch_result
		except asyncio.TimeoutError:
			raise HTTPException(status_code=408, detail='Processing timeout. File too large or complex.')
		except Exception as e:
			raise HTTPException(status_code=500, detail=f'Error during prediction: {str(e)}')
			
	except Exception as e:
		raise HTTPException(status_code=500, detail=f'Error processing file: {str(e)}')

@app.get('/sample-data')
async def get_sample_data():
	"""Get sample threat data for testing"""
	try:
		with open('sample_threats.json', 'r') as f:
			return json.load(f)
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail='Sample data file not found')
	except Exception as e:
		raise HTTPException(status_code=500, detail=f'Error loading sample data: {str(e)}')

@app.get('/stats')
async def get_stats():
	"""Get model statistics and performance metrics"""
	try:
		if not os.path.exists(os.path.join('artifacts', 'metrics.json')):
			raise HTTPException(status_code=404, detail='Model metrics not found')
		
		with open(os.path.join('artifacts', 'metrics.json'), 'r') as f:
			metrics = json.load(f)
		
		return {
			'model_loaded': bool(pipeline is not None),
			'metrics': metrics,
			'model_path': MODEL_PATH
		}
	except Exception as e:
		raise HTTPException(status_code=500, detail=f'Error loading stats: {str(e)}')

@app.get('/chart-data')
async def get_chart_data():
	"""Get data for various charts and visualizations"""
	try:
		# Load real model metrics for accurate visualizations
		if not os.path.exists(os.path.join('artifacts', 'metrics.json')):
			raise HTTPException(status_code=404, detail='Model metrics not found')
		
		with open(os.path.join('artifacts', 'metrics.json'), 'r') as f:
			metrics = json.load(f)
		
		# Extract real confusion matrix data
		test_cm = metrics['test']['confusion_matrix']
		test_labels = metrics['test']['labels']
		
		# Calculate real attack distribution from confusion matrix
		total_normal = sum(test_cm[0])  # First row = actual Normal
		total_dos = sum(test_cm[1])    # Second row = actual DoS
		total_probe = sum(test_cm[2])  # Third row = actual Probe
		total_r2l = sum(test_cm[3])    # Fourth row = actual R2L
		total_u2r = sum(test_cm[4])    # Fifth row = actual U2R
		total_attacks = total_dos + total_probe + total_r2l + total_u2r
		total_all = total_normal + total_attacks
		
		# Real data based on actual test set performance
		chart_data = {
			'real_stats': {
				'total_predictions': total_all,
				'threats_detected': total_attacks,
				'accuracy_rate': round(metrics['test']['classification_report']['accuracy'] * 100, 2),
				'response_time': '12ms'  # Estimated response time
			},
			'normal_vs_attack': [
				{'category': 'Normal', 'count': total_normal, 'color': '#10B981'},
				{'category': 'Attack', 'count': total_attacks, 'color': '#EF4444'}
			],
			'attack_distribution': [
				{'type': 'Normal', 'count': total_normal, 'percentage': round((total_normal/total_all)*100, 1), 'color': '#10B981'},
				{'type': 'DoS', 'count': total_dos, 'percentage': round((total_dos/total_all)*100, 1), 'color': '#EF4444'},
				{'type': 'Probe', 'count': total_probe, 'percentage': round((total_probe/total_all)*100, 1), 'color': '#F59E0B'},
				{'type': 'R2L', 'count': total_r2l, 'percentage': round((total_r2l/total_all)*100, 1), 'color': '#8B5CF6'},
				{'type': 'U2R', 'count': total_u2r, 'percentage': round((total_u2r/total_all)*100, 1), 'color': '#EC4899'}
			],
			'confusion_matrix': {
				'labels': test_labels,
				'matrix': test_cm
			},
			'model_accuracy': {
				'overall_accuracy': round(metrics['test']['classification_report']['accuracy'] * 100, 2),
				'normal_f1': round(metrics['test']['classification_report']['Normal']['f1-score'] * 100, 2),
				'dos_f1': round(metrics['test']['classification_report']['DoS']['f1-score'] * 100, 2),
				'probe_f1': round(metrics['test']['classification_report']['Probe']['f1-score'] * 100, 2),
				'r2l_f1': round(metrics['test']['classification_report']['R2L']['f1-score'] * 100, 2),
				'u2r_f1': round(metrics['test']['classification_report']['U2R']['f1-score'] * 100, 2)
			},
			# Simulated timeline for demonstration (in production, this would be real-time data)
			'timeline_data': [
				{'time': '00:00', 'normal': 45, 'attacks': 2},
				{'time': '01:00', 'normal': 38, 'attacks': 1},
				{'time': '02:00', 'normal': 42, 'attacks': 0},
				{'time': '03:00', 'normal': 35, 'attacks': 1},
				{'time': '04:00', 'normal': 40, 'attacks': 3},
				{'time': '05:00', 'normal': 48, 'attacks': 2},
				{'time': '06:00', 'normal': 55, 'attacks': 1},
				{'time': '07:00', 'normal': 62, 'attacks': 4},
				{'time': '08:00', 'normal': 70, 'attacks': 2},
				{'time': '09:00', 'normal': 68, 'attacks': 5},
				{'time': '10:00', 'normal': 75, 'attacks': 3},
				{'time': '11:00', 'normal': 80, 'attacks': 6},
				{'time': '12:00', 'normal': 85, 'attacks': 4},
				{'time': '13:00', 'normal': 78, 'attacks': 7},
				{'time': '14:00', 'normal': 82, 'attacks': 5},
				{'time': '15:00', 'normal': 88, 'attacks': 8},
				{'time': '16:00', 'normal': 92, 'attacks': 6},
				{'time': '17:00', 'normal': 95, 'attacks': 9},
				{'time': '18:00', 'normal': 88, 'attacks': 7},
				{'time': '19:00', 'normal': 82, 'attacks': 5},
				{'time': '20:00', 'normal': 75, 'attacks': 4},
				{'time': '21:00', 'normal': 68, 'attacks': 3},
				{'time': '22:00', 'normal': 58, 'attacks': 2},
				{'time': '23:00', 'normal': 52, 'attacks': 1}
			]
		}
		
		return chart_data
	except Exception as e:
		raise HTTPException(status_code=500, detail=f'Error loading chart data: {str(e)}')