import os
from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()
        page.on("dialog", lambda dialog: dialog.accept())

        try:
            print("Navegando a la home...")
            page.goto('http://localhost:5173')
            page.wait_for_load_state('networkidle')
            
            print("Verificando Navbar...")
            page.wait_for_selector('nav')
            menu_btn = page.get_by_role("link", name="MENU", exact=True).first
            if menu_btn.is_visible():
                print("✓ Navbar del cliente renderizada")

            print("Haciendo login...")
            page.get_by_title("Mi Cuenta").click()
            page.wait_for_selector('input[type="email"]')
            
            # Asumimos que hay un boton o tabs para iniciar sesion
            page.fill('input[type="email"]', 'admin@test.com')
            page.fill('input[type="password"]', 'admin123')
            page.get_by_role("button", name="Iniciar Sesión").click()
            
            page.wait_for_timeout(2000) # Wait for login
            
            print("Navegando al Admin...")
            page.goto('http://localhost:5173/admin')
            page.wait_for_load_state('networkidle')
            
            admin_title = page.get_by_text("Panel Administrativo")
            if admin_title.is_visible():
                print("✓ Layout del Admin renderizado")

            print("Probando Tabs de Admin...")
            # Click on Clientes tab
            page.get_by_role("tab", name="Clientes").click()
            page.wait_for_timeout(1000)
            
            # Click on Pedidos tab
            page.get_by_role("tab", name="Pedidos").click()
            page.wait_for_timeout(2000)

            print("Probando Búsqueda y Filtros en Pedidos...")
            search_input = page.get_by_placeholder("Buscar...")
            if search_input.is_visible():
               search_input.fill("test")
               page.wait_for_timeout(1000)
               search_input.fill("")
               print("✓ Búsqueda renderizada")

            print("Buscando botón de Aprobar (SINPE)...")
            # Encontramos la primera fila que tenga el botón
            sinpe_btn = page.locator("button[title='Verificar Pago SINPE']").first
            
            if sinpe_btn.is_visible():
                print("Haciendo click en Aprobar Pago SINPE...")
                # We changed it to onPointerDown!
                sinpe_btn.dispatchEvent('pointerdown')
                
                # Check for dialog or toast
                page.wait_for_timeout(1000)
                page.screenshot(path='/tmp/sinpe_click_result.png')
                print("✓ Click ejecutado, screenshot guardado en /tmp/sinpe_click_result.png")
            else:
                print("⚠ No se encontró botón de SINPE para probar, posiblemente no hay pedidos pendientes.")

        except Exception as e:
            print(f"Error durante el test: {e}")
            page.screenshot(path='/tmp/error_test.png')
            print("Screenshot de error en /tmp/error_test.png")
        finally:
            browser.close()

if __name__ == '__main__':
    main()
