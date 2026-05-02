import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import pandas as pd

# Cargar variables de entorno del backend
# Cargar variables de entorno del backend
load_dotenv('backend/.env')

# Princio de Menor Privilegio: Priorizar URL de Solo Lectura
DATABASE_URL = os.getenv('READONLY_URL') or os.getenv('DATABASE_URL')
if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

def check_db_health():
    if not DATABASE_URL:
        print("Error: DATABASE_URL no encontrada.")
        return

    try:
        engine = create_engine(DATABASE_URL)
        
        print("--- Iniciando Auditoría de Salud de Base de Datos ---")
        
        with engine.connect() as conn:
            # 1. Verificar Integridad: Pedidos sin items (Anomalía)
            query_orphans = """
                SELECT id, consecutivo_anual FROM orders 
                WHERE id NOT IN (SELECT DISTINCT order_id FROM order_items)
                AND deleted_at IS NULL
            """
            orphans = pd.read_sql(query_orphans, conn)
            
            # 2. Verificar Pedidos con discrepancia de Total
            query_mismatch = """
                SELECT o.id, o.total, SUM(oi.total_linea) as sum_items
                FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                WHERE o.deleted_at IS NULL
                GROUP BY o.id, o.total
                HAVING ABS(o.total - SUM(oi.total_linea)) > 0.01
            """
            mismatches = pd.read_sql(query_mismatch, conn)

            # 3. Reporte de Salud
            report = {
                "orphan_orders_count": len(orphans),
                "total_mismatch_count": len(mismatches),
                "status": "HEALTHY" if len(orphans) == 0 and len(mismatches) == 0 else "WARNING"
            }
            
            print("\nRESULTADOS DE AUDITORÍA:")
            print(f"- Pedidos huérfanos detectados: {len(orphans)}")
            print(f"- Discrepancias de total detectadas: {len(mismatches)}")
            print(f"- Estado General: {report['status']}")

            # Guardar hallazgos en tabla shadow shadow_audit_findings
            findings_path = "db_health_shadow_report.json"
            import json
            with open(findings_path, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2)
            
            if report["status"] == "WARNING":
                print(f"[!] Se recomienda revisar los detalles en {findings_path}")

    except Exception as e:
        print(f"Error en auditoría de DB: {e}")

if __name__ == "__main__":
    check_db_health()
