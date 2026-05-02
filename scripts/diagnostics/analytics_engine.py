import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Cargar variables de entorno del backend
load_dotenv('backend/.env')

DATABASE_URL = os.getenv('DATABASE_URL')
# SQLAlchemy requiere el prefijo postgresql:// (Supabase suele darlo bien)
if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

def run_analytics():
    if not DATABASE_URL:
        print("Error: DATABASE_URL no encontrada en .env")
        return

    try:
        engine = create_engine(DATABASE_URL)
        
        print("--- Iniciando Motor de Analítica (Modo Read-Only) ---")
        
        # 1. Analizar Ventas por Día
        query_orders = "SELECT fecha::date as dia, total FROM orders WHERE deleted_at IS NULL"
        df_orders = pd.read_sql(query_orders, engine)
        
        sales_by_day = df_orders.groupby('dia')['total'].sum().reset_index()
        
        # 2. Top Productos Vendidos
        query_items = """
            SELECT p.nombre, SUM(oi.cantidad) as total_vendido 
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            GROUP BY p.nombre
            ORDER BY total_vendido DESC
            LIMIT 10
        """
        df_top_products = pd.read_sql(query_items, engine)

        # 3. Guardar Reportes Shadow (Archivos locales para n8n o Email)
        report_path = "analytics_shadow_report.json"
        report_data = {
            "last_run": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_revenue": float(df_orders['total'].sum()),
            "top_products": df_top_products.to_dict(orient='records'),
            "sales_trend": sales_by_day.tail(7).to_dict(orient='records')
        }
        
        import json
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)
            
        print(f"Reporte generado exitosamente en {report_path}")

    except Exception as e:
        print(f"Error en el motor de analítica: {e}")

if __name__ == "__main__":
    run_analytics()
