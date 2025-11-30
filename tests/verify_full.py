import os
import sys
from playwright.sync_api import sync_playwright

def run_tests():
    cwd = os.getcwd()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # 1. Run Unit Tests
        print("--- Running Unit Tests ---")
        page = browser.new_page()
        unit_test_path = f"file://{cwd}/tests/unit_test.html"
        page.goto(unit_test_path)

        try:
            page.wait_for_selector("#status", timeout=5000)
            status = page.text_content("#status")
            print(f"Unit Test Status: {status}")

            if "ALL PASSED" not in status:
                print("Unit tests failed!")
                log_content = page.inner_html("#log")
                print(f"Log content: {log_content}")
                browser.close()
                sys.exit(1)
        except Exception as e:
            print(f"Unit test timeout or error: {e}")
            browser.close()
            sys.exit(1)

        # 2. Run Simulation Tests
        print("\n--- Running Simulation Tests ---")
        page = browser.new_page()
        sim_test_path = f"file://{cwd}/tests/simulation_test.html"
        page.goto(sim_test_path)

        try:
            page.wait_for_selector("#status", timeout=5000)
            status = page.text_content("#status")
            print(f"Simulation Test Status: {status}")

            if "ALL PASSED" not in status:
                print("Simulation tests failed!")
                log_content = page.inner_html("#log")
                print(f"Log content: {log_content}")
                browser.close()
                sys.exit(1)
        except Exception as e:
            print(f"Simulation test timeout or error: {e}")
            browser.close()
            sys.exit(1)

        # 3. Run E2E Gameplay Tests
        print("\n--- Running E2E Gameplay Tests ---")
        page = browser.new_page()
        game_path = f"file://{cwd}/index.html"
        page.goto(game_path)

        # Check Menu
        print("Checking Main Menu...")
        if page.locator("#main-menu").is_visible():
            print("Main Menu Visible.")
        else:
            print("Main Menu NOT Visible!")
            sys.exit(1)

        # Start Sandbox Level (Index 1)
        # Find button with '沙盒模式' or just the second button
        print("Starting Sandbox Level...")
        buttons = page.locator("#level-list button")
        if buttons.count() < 2:
             print("Not enough level buttons!")
             sys.exit(1)

        buttons.nth(1).click()

        # Wait for game to start (Menu hidden)
        page.wait_for_function("document.getElementById('main-menu').classList.contains('opacity-0')")
        print("Game Started (Menu Hidden).")

        # Check Grid Initialized (Access engine.grid)
        grid_len = page.evaluate("engine.grid.length")
        print(f"Grid Size: {grid_len}")
        if grid_len != 10:
             print("Grid size incorrect!")
             sys.exit(1)

        # Place a Prism (Key 8)
        print("Selecting Prism...")
        page.keyboard.press("8")
        tool_name = page.text_content("#tool-name")
        print(f"Selected Tool: {tool_name}")

        if "分流" not in tool_name and "Prism" not in tool_name:
             print(f"Warning: Prism description mismatch? '{tool_name}'")

        # Place at 5,5
        print("Placing Prism at 5,5...")

        # Get Canvas Box
        box = page.locator("#mainCanvas").bounding_box()
        tile_size = box['width'] / 10
        click_x = box['x'] + 5.5 * tile_size
        click_y = box['y'] + 5.5 * tile_size

        page.mouse.click(click_x, click_y)

        # Verify placement in grid
        cell_type = page.evaluate("engine.grid[5][5] ? engine.grid[5][5].type : 'null'")
        print(f"Cell at 5,5: {cell_type}")

        if cell_type != 'prism':
            print("Failed to place Prism!")
            sys.exit(1)

        print("E2E Test Passed.")

        # Screenshot
        page.screenshot(path="tests/e2e_screenshot.png")
        print("Screenshot saved.")

        browser.close()

if __name__ == "__main__":
    run_tests()
