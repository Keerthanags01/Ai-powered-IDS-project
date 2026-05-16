import argparse
import json
import os
from typing import List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import HistGradientBoostingClassifier


NSL_KDD_COLUMNS: List[str] = [
	'duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes', 'land',
	'wrong_fragment', 'urgent', 'hot', 'num_failed_logins', 'logged_in',
	'num_compromised', 'root_shell', 'su_attempted', 'num_root', 'num_file_creations',
	'num_shells', 'num_access_files', 'num_outbound_cmds', 'is_host_login',
	'is_guest_login', 'count', 'srv_count', 'serror_rate', 'srv_serror_rate',
	'rerror_rate', 'srv_rerror_rate', 'same_srv_rate', 'diff_srv_rate',
	'srv_diff_host_rate', 'dst_host_count', 'dst_host_srv_count',
	'dst_host_same_srv_rate', 'dst_host_diff_srv_rate',
	'dst_host_same_src_port_rate', 'dst_host_srv_diff_host_rate',
	'dst_host_serror_rate', 'dst_host_srv_serror_rate', 'dst_host_rerror_rate',
	'dst_host_srv_rerror_rate', 'label', 'difficulty'
]

ATTACK_TO_CATEGORY = {
	'normal': 'Normal',
	# DoS
	'back': 'DoS', 'land': 'DoS', 'neptune': 'DoS', 'pod': 'DoS', 'smurf': 'DoS',
	'teardrop': 'DoS', 'apache2': 'DoS', 'udpstorm': 'DoS', 'processtable': 'DoS', 'worm': 'DoS', 'mailbomb': 'DoS',
	# Probe
	'satan': 'Probe', 'ipsweep': 'Probe', 'nmap': 'Probe', 'portsweep': 'Probe', 'mscan': 'Probe', 'saint': 'Probe',
	# R2L
	'guess_passwd': 'R2L', 'ftp_write': 'R2L', 'imap': 'R2L', 'phf': 'R2L', 'multihop': 'R2L',
	'warezmaster': 'R2L', 'warezclient': 'R2L', 'spy': 'R2L', 'xlock': 'R2L', 'xsnoop': 'R2L',
	'snmpguess': 'R2L', 'snmpgetattack': 'R2L', 'httptunnel': 'R2L', 'sendmail': 'R2L',
	'named': 'R2L', 'xterm': 'R2L', 'worm_r2l': 'R2L',
	# U2R
	'buffer_overflow': 'U2R', 'loadmodule': 'U2R', 'perl': 'U2R', 'rootkit': 'U2R',
	'ps': 'U2R', 'sqlattack': 'U2R', 'xterm_u2r': 'U2R'
}

CATEGORY_ORDER = ['Normal', 'DoS', 'Probe', 'R2L', 'U2R']


def read_nsl_kdd(file_path: str) -> pd.DataFrame:
	df = pd.read_csv(file_path, header=None, names=NSL_KDD_COLUMNS)
	return df


def map_labels_to_5class(labels: pd.Series) -> pd.Series:
	normalized = labels.str.rstrip('.') .str.lower()
	mapped = normalized.map(ATTACK_TO_CATEGORY)
	if mapped.isna().any():
		unknown = sorted(set(normalized[mapped.isna()].tolist()))
		raise ValueError(f"Unknown attack label(s) encountered: {unknown}. Update ATTACK_TO_CATEGORY to proceed.")
	return mapped


def build_preprocess_pipeline(df: pd.DataFrame) -> Tuple[Pipeline, List[str], List[str]]:
	numeric_features = [
		' duration', 'src_bytes', 'dst_bytes', 'wrong_fragment', 'urgent', 'hot',
		'num_failed_logins', 'logged_in', 'num_compromised', 'root_shell', 'su_attempted',
		'num_root', 'num_file_creations', 'num_shells', 'num_access_files',
		'num_outbound_cmds', 'is_host_login', 'is_guest_login', 'count', 'srv_count',
		'serror_rate', 'srv_serror_rate', 'rerror_rate', 'srv_rerror_rate',
		'same_srv_rate', 'diff_srv_rate', 'srv_diff_host_rate', 'dst_host_count',
		'dst_host_srv_count', 'dst_host_same_srv_rate', 'dst_host_diff_srv_rate',
		'dst_host_same_src_port_rate', 'dst_host_srv_diff_host_rate',
		'dst_host_serror_rate', 'dst_host_srv_serror_rate', 'dst_host_rerror_rate',
		'dst_host_srv_rerror_rate'
	]
	# Fix potential leading space typo for 'duration'
	numeric_features = [f.strip() for f in numeric_features]

	categorical_features = ['protocol_type', 'service', 'flag']

	# Dense outputs for downstream classifier
	numeric_transformer = StandardScaler(with_mean=True)
	categorical_transformer = OneHotEncoder(handle_unknown='ignore', sparse_output=False)

	preprocessor = ColumnTransformer(
		transformers=[
			('num', numeric_transformer, numeric_features),
			('cat', categorical_transformer, categorical_features)
		],
		remainder='drop'
	)

	return preprocessor, numeric_features, categorical_features


def build_model_pipeline(preprocessor: ColumnTransformer) -> Pipeline:
	classifier = HistGradientBoostingClassifier(
		learning_rate=0.1,
		max_depth=None,
		max_leaf_nodes=31,
		min_samples_leaf=20,
		l2_regularization=0.0,
		class_weight='balanced',
		random_state=42
	)
	pipeline = Pipeline(steps=[('prep', preprocessor), ('clf', classifier)])
	return pipeline


def train_and_evaluate(train_file: str, test_file: str, artifacts_dir: str) -> None:
	os.makedirs(artifacts_dir, exist_ok=True)

	train_df = read_nsl_kdd(train_file)
	test_df = read_nsl_kdd(test_file)

	# Drop difficulty if present and map labels
	for df in (train_df, test_df):
		if 'difficulty' in df.columns:
			df.drop(columns=['difficulty'], inplace=True)

	train_df['label5'] = map_labels_to_5class(train_df['label'])
	test_df['label5'] = map_labels_to_5class(test_df['label'])

	X = train_df.drop(columns=['label', 'label5'])
	y = train_df['label5']

	X_train, X_val, y_train, y_val = train_test_split(
		X, y, test_size=0.2, random_state=42, stratify=y
	)

	preprocessor, _, _ = build_preprocess_pipeline(train_df)
	pipeline = build_model_pipeline(preprocessor)

	pipeline.fit(X_train, y_train)

	def evaluate_split(X_split, y_split, split_name: str):
		pred = pipeline.predict(X_split)
		rep = classification_report(y_split, pred, labels=CATEGORY_ORDER, output_dict=True, zero_division=0)
		cm = confusion_matrix(y_split, pred, labels=CATEGORY_ORDER).tolist()
		return { 'classification_report': rep, 'confusion_matrix': cm, 'labels': CATEGORY_ORDER, 'split': split_name }

	metrics = {
		'val': evaluate_split(X_val, y_val, 'val'),
		'test': evaluate_split(test_df.drop(columns=['label', 'label5']), test_df['label5'], 'test')
	}

	joblib.dump(pipeline, os.path.join(artifacts_dir, 'model.joblib'))
	with open(os.path.join(artifacts_dir, 'metrics.json'), 'w') as f:
		json.dump(metrics, f, indent=2)

	print('Saved artifacts to', artifacts_dir)
	print('Validation macro F1:', metrics['val']['classification_report']['macro avg']['f1-score'])
	print('Test macro F1:', metrics['test']['classification_report']['macro avg']['f1-score'])


def parse_args() -> argparse.Namespace:
	parser = argparse.ArgumentParser(description='Train IDS on NSL-KDD dataset')
	parser.add_argument('--train', type=str, default='KDDTrain+.txt', help='Path to training .txt')
	parser.add_argument('--test', type=str, default='KDDTest+.txt', help='Path to test .txt')
	parser.add_argument('--artifacts', type=str, default='artifacts', help='Directory to save model and metrics')
	return parser.parse_args()


if __name__ == '__main__':
	args = parse_args()
	train_and_evaluate(args.train, args.test, args.artifacts)
