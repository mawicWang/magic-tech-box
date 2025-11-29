import os
from playwright.sync_api import sync_playwright

def verify_game():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Listen for console messages
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"Page Error: {exc}"))

        # Get absolute path to index.html
        cwd = os.getcwd()
        file_path = f"file://{cwd}/index.html"
        print(f"Navigating to: {file_path}")

        page.goto(file_path)

        # Wait a bit
        page.wait_for_timeout(2000)

        # Check if mainCanvas exists
        if page.locator("#mainCanvas").count() > 0:
            print("Canvas found.")
        else:
            print("Canvas NOT found.")

        # Check if the grid global variable is initialized
        try:
            grid_type = page.evaluate("typeof window.grid")
            print(f"window.grid type: {grid_type}")

            if grid_type != 'undefined':
                 grid_length = page.evaluate("window.grid ? window.grid.length : 'null'")
                 print(f"Grid length: {grid_length}")
        except Exception as e:
            print(f"Error checking grid: {e}")

        # Take a screenshot
        screenshot_path = "/home/jules/verification/game_screenshot.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    verify_game()
