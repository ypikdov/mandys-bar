from playwright.sync_api import sync_playwright
import os
import time

ARTIFACTS_DIR = r"C:\Users\Gerald Villalobos\.gemini\antigravity\brain\365705a0-df3e-46e0-a4c6-17cdfcf5ed54"

def run_tests():
    with sync_playwright() as p:
        # Lanza chromium
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        
        print("Iniciando pruebas E2E visuales para Etapa 5...")
        
        # 1. Prueba de Navbar y carga inicial
        print("[1/4] Cargando Inicio...")
        page.goto('http://localhost:5173')
        page.wait_for_load_state('networkidle')
        page.screenshot(path=os.path.join(ARTIFACTS_DIR, '01_home_navbar.png'))
        
        # 2. Prueba de la página de Reserva de Eventos (5B)
        print("[2/4] Probando Eventos (Sub-Etapa 5B)...")
        page.goto('http://localhost:5173/eventos')
        page.wait_for_load_state('networkidle')
        page.screenshot(path=os.path.join(ARTIFACTS_DIR, '02_events_page.png'))
        
        # 3. Prueba de la página de Perfil (5A)
        print("[3/4] Probando Perfil (Sub-Etapa 5A)...")
        page.goto('http://localhost:5173/perfil')
        page.wait_for_load_state('networkidle')
        page.screenshot(path=os.path.join(ARTIFACTS_DIR, '03_profile_page_unauth.png'))
        
        # Simular llenado de login para ver el intento de red (aunque falle o tenga éxito)
        try:
            page.fill('input[type="email"]', 'cliente@mandys.com')
            page.fill('input[type="password"]', '123456')
            page.click('button[type="submit"]')
            page.wait_for_load_state('networkidle')
            time.sleep(1) # wait for potential toast/dialog
            page.screenshot(path=os.path.join(ARTIFACTS_DIR, '04_profile_post_login.png'))
        except Exception as e:
            print("No se pudo hacer login (posiblemente la UI cambió):", e)
        
        # 4. Prueba de Carrito y Checkout Modal (5C1/5C2)
        print("[4/4] Probando Menú y Checkout (Sub-Etapa 5C)...")
        page.goto('http://localhost:5173/menu/comida')
        page.wait_for_load_state('networkidle')
        
        # Agregar primer item
        try:
            page.locator('button:has-text("Agregar")').first.click()
            time.sleep(1)
            
            # Abrir carrito (buscar un botón que tenga icono de carrito o aria-label de ver carrito)
            # Como es un boton en el Navbar:
            cart_button = page.locator('button.relative:has(svg.lucide-shopping-cart)')
            if cart_button.count() > 0:
                cart_button.first.click()
            else:
                 page.locator('button:has-text("Ver Carrito")').first.click()
            
            time.sleep(1)
            # Click proceder pago
            page.locator('button:has-text("Proceder al Pago")').click()
            time.sleep(1)
            
            # Tomar screenshot del checkout modal
            page.screenshot(path=os.path.join(ARTIFACTS_DIR, '05_checkout_modal.png'))
            
            # Click continuar al paso 2
            page.locator('button:has-text("Continuar al Pago")').click()
            time.sleep(1)
            
            page.screenshot(path=os.path.join(ARTIFACTS_DIR, '06_checkout_step2.png'))
            
        except Exception as e:
            print("No se pudo completar el flujo del checkout:", e)
            
        browser.close()
        print("¡Pruebas terminadas! Evidencia guardada en el directorio Brain del Agente.")

if __name__ == "__main__":
    run_tests()
