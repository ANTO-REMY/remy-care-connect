import re
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # Go directly to Register Mother page
            page.goto("http://localhost:8081/register/mother")
            print("Navigated to Register Mother page.")

            # Open Date Picker (DOB)
            # Look for button with text "Select date of birth"
            page.wait_for_selector("button:has-text('Select date of birth')")
            page.click("button:has-text('Select date of birth')")
            print("Opened Date Picker.")

            # Wait for calendar to appear
            page.wait_for_selector(".rdp")

            # Check for dropdowns
            # We look for 'select' elements inside .rdp
            dropdowns = page.locator(".rdp select").all()
            print(f"Found {len(dropdowns)} dropdowns in the calendar.")

            if len(dropdowns) >= 2:
                print("SUCCESS: Year and Month dropdowns found.")
            else:
                print("WARN: Less than 2 dropdowns found.")
                # print(page.inner_html(".rdp"))

            page.screenshot(path="verification/register_mother_date_dropdowns_direct.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_direct.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
