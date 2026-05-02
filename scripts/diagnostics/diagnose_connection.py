from playwright.sync_api import sync_playwright

BACKEND_HEALTH = "http://localhost:3000/api/health"
FRONTEND_URL = "http://localhost:5173"

def diagnose():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # --- Backend ---
        backend_ctx = browser.new_context()
        backend_page = backend_ctx.new_page()
        print(f"Checking Backend ({BACKEND_HEALTH})...")
        try:
            resp = backend_page.goto(BACKEND_HEALTH, timeout=5000)
            if resp is None:
                print("Backend Status: No response (resp is None)")
            else:
                print(f"Backend Status: {resp.status}")
                print(f"Backend Body (first 200): {(resp.text() or '')[:200]}")
        except Exception as e:
            print(f"Backend Error: {e}")
        finally:
            backend_ctx.close()

        # --- Frontend ---
        frontend_ctx = browser.new_context()
        frontend_page = frontend_ctx.new_page()

        print(f"\nChecking Frontend ({FRONTEND_URL})...")
        frontend_page.on("console", lambda msg: print(f"FRONTEND CONSOLE: {msg.type}: {msg.text}"))
        frontend_page.on("pageerror", lambda exc: print(f"FRONTEND PAGE ERROR: {exc}"))

        try:
            resp = frontend_page.goto(FRONTEND_URL, timeout=15000)
            if resp is None:
                print("Frontend Status: No response (resp is None)")
            else:
                print(f"Frontend Status: {resp.status}")

            frontend_page.wait_for_load_state("networkidle", timeout=15000)
            frontend_page.screenshot(path="frontend_diagnostic.png", full_page=True)
            print("Frontend screenshot saved to frontend_diagnostic.png")
            print(f"Frontend Title: {frontend_page.title()}")

            # Validación simple (ajusta a tu app)
            # frontend_page.wait_for_selector('[data-testid="app"]', timeout=5000)

        except Exception as e:
            print(f"Frontend Error: {e}")
            try:
                frontend_page.screenshot(path="frontend_diagnostic_error.png", full_page=True)
                print("Error screenshot saved to frontend_diagnostic_error.png")
            except:
                pass
        finally:
            frontend_ctx.close()

        browser.close()

if __name__ == "__main__":
    diagnose()