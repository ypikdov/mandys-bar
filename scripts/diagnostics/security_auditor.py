import os
import re
import time
import requests
from collections import defaultdict
from datetime import datetime

# Configuración de Endpoints Sensibles y Umbrales
SENSITIVE_ENDPOINTS = ['/api/auth', '/api/orders', '/api/user']
ERROR_THRESHOLD_PER_MINUTE = 15  # Máximo de errores 4xx permitidos por minuto por IP
LOG_FILE = "backend/access.log"
AUDIT_LOG = "audit_findings_log.txt"

# Regex para parsear el formato Custom de Morgan:
# :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]
LOG_PATTERN = r'(?P<ip>[\d\.]+) - (?P<user>\S+) \[(?P<timestamp>.*?)\] "(?P<method>\S+) (?P<url>\S+) HTTP/\S+" (?P<status>\d+) (?P<size>\S+)'

def notify_external_alert(message):
    """Envía la alerta a un canal externo (Slack/n8n/Email)"""
    webhook_url = os.getenv('ALERT_WEBHOOK_URL')
    if webhook_url:
        try:
            requests.post(webhook_url, json={"text": message}, timeout=5)
        except Exception as e:
            print(f"Error enviando alerta externa: {e}")

def log_alert(ip, endpoint, error_count, pattern_type):
    """Registra un hallazgo en la tabla 'shadow' de auditoría y notifica"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = f"[{timestamp}] ALERT: {pattern_type.upper()} detected from {ip} on {endpoint}. Matches: {error_count}\n"
    with open(AUDIT_LOG, "a", encoding="utf-8") as f:
        f.write(entry)
    
    print(entry.strip())
    notify_external_alert(entry.strip())

def analyze_logs():
    target_log = LOG_FILE
    # Priorizar log de prueba si existe
    if os.path.exists("backend/access_test.log"):
        target_log = "backend/access_test.log"

    if not os.path.exists(target_log):
        print(f"Log file {target_log} not found yet.")
        return

    # Estructura: minute_str -> ip -> endpoint -> status_code_count
    stats = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultdict(int))))

    print(f"--- Iniciando Análisis de Logs de Seguridad ({target_log}) ---")
    
    try:
        with open(target_log, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                match = re.search(LOG_PATTERN, line)
                if match:
                    data = match.groupdict()
                    status = int(data['status'])
                    url = data['url']
                    ip = data['ip']
                    
                    try:
                        ts_obj = datetime.strptime(data['timestamp'].split(' ')[0], "%d/%b/%Y:%H:%M:%S")
                        minute_key = ts_obj.strftime("%Y-%m-%d %H:%M")
                    except:
                        continue

                    if status in [401, 403, 429]:
                        stats[minute_key][ip][url][status] += 1

        # Evaluar umbrales
        for minute, ips in stats.items():
            for ip, urls in ips.items():
                for url, codes in urls.items():
                    total_errors = sum(codes.values())
                    is_sensitive = any(endpoint in url for endpoint in SENSITIVE_ENDPOINTS)
                    
                    if is_sensitive and total_errors >= ERROR_THRESHOLD_PER_MINUTE:
                        log_alert(ip, url, total_errors, "brute_force_peak")
                    elif total_errors >= (ERROR_THRESHOLD_PER_MINUTE * 2):
                        log_alert(ip, url, total_errors, "anomalous_error_rate")

    except Exception as e:
        print(f"Error analizando logs: {e}")

if __name__ == "__main__":
    analyze_logs()
