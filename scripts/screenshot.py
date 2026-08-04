import sys
import asyncio
from playwright.async_api import async_playwright

async def screenshot(url, output_path):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 720})
        try:
            await page.goto(url, wait_until="networkidle", timeout=30000)
            await page.screenshot(path=output_path, full_page=False)
            return True
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            return False
        finally:
            await browser.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 screenshot.py <url> <output_path>", file=sys.stderr)
        sys.exit(1)
    url = sys.argv[1]
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    output_path = sys.argv[2]
    success = asyncio.run(screenshot(url, output_path))
    sys.exit(0 if success else 1)
