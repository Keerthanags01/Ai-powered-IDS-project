import argparse
import csv
import time
from typing import Dict

import requests


def stream_file(file_path: str, url: str, delay_ms: int, limit: int | None) -> None:
	with open(file_path, 'r') as f:
		reader = csv.reader(f)
		count = 0
		for row in reader:
			# NSL-KDD has 42 columns: 41 features + label [+ difficulty optional]
			if len(row) < 42:
				continue
			record = {
				"duration": float(row[0]),
				"protocol_type": row[1],
				"service": row[2],
				"flag": row[3],
				"src_bytes": float(row[4]),
				"dst_bytes": float(row[5]),
				"land": float(row[6]),
				"wrong_fragment": float(row[7]),
				"urgent": float(row[8]),
				"hot": float(row[9]),
				"num_failed_logins": float(row[10]),
				"logged_in": float(row[11]),
				"num_compromised": float(row[12]),
				"root_shell": float(row[13]),
				"su_attempted": float(row[14]),
				"num_root": float(row[15]),
				"num_file_creations": float(row[16]),
				"num_shells": float(row[17]),
				"num_access_files": float(row[18]),
				"num_outbound_cmds": float(row[19]),
				"is_host_login": float(row[20]),
				"is_guest_login": float(row[21]),
				"count": float(row[22]),
				"srv_count": float(row[23]),
				"serror_rate": float(row[24]),
				"srv_serror_rate": float(row[25]),
				"rerror_rate": float(row[26]),
				"srv_rerror_rate": float(row[27]),
				"same_srv_rate": float(row[28]),
				"diff_srv_rate": float(row[29]),
				"srv_diff_host_rate": float(row[30]),
				"dst_host_count": float(row[31]),
				"dst_host_srv_count": float(row[32]),
				"dst_host_same_srv_rate": float(row[33]),
				"dst_host_diff_srv_rate": float(row[34]),
				"dst_host_same_src_port_rate": float(row[35]),
				"dst_host_srv_diff_host_rate": float(row[36]),
				"dst_host_serror_rate": float(row[37]),
				"dst_host_srv_serror_rate": float(row[38]),
				"dst_host_rerror_rate": float(row[39]),
				"dst_host_srv_rerror_rate": float(row[40])
			}
			resp = requests.post(url, json=record, timeout=10)
			print(count, resp.status_code, resp.text[:200])
			count += 1
			if limit and count >= limit:
				break
			time.sleep(max(0, delay_ms) / 1000.0)


if __name__ == '__main__':
	parser = argparse.ArgumentParser()
	parser.add_argument('--file', type=str, default='KDDTest+.txt')
	parser.add_argument('--url', type=str, default='http://127.0.0.1:8000/predict')
	parser.add_argument('--delay-ms', type=int, default=50)
	parser.add_argument('--limit', type=int, default=100)
	args = parser.parse_args()
	stream_file(args.file, args.url, args.delay_ms, args.limit)
