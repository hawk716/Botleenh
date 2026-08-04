import asyncio
import os
import sys
import argparse
from playwright.async_api import async_playwright

async def run(text, voice, output_path):
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process',
            ]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        async def block_aggressively(route):
            if route.request.resource_type in ["image", "font", "media", "stylesheet"]:
                await route.abort()
            else:
                await route.continue_()

        await page.route("**/*", block_aggressively)

        await page.goto("https://speechgen.io/ar/", wait_until="domcontentloaded", timeout=30000)

        # Select voice if provided
        if voice:
            try:
                await page.click("div[hint='[!!!] Choose voice']", timeout=5000)
                await asyncio.sleep(0.5)
                await page.fill("#voicesSearch", voice, timeout=3000)
                await page.press("#voicesSearch", "Enter", timeout=3000)
                await asyncio.sleep(0.3)
                voice_option = page.locator(f"text='{voice}'").first
                if await voice_option.count() > 0:
                    await voice_option.click(timeout=3000)
                else:
                    # Try partial match
                    page.locator(f"div.voice-item:has-text('{voice}')").first.click(timeout=3000)
            except Exception as e:
                print(f"Voice selection warning: {e}", file=sys.stderr)

        # Enter text
        textarea = page.locator("#mytextarea")
        await textarea.fill("", timeout=5000)
        await asyncio.sleep(0.2)
        await textarea.type(text, delay=10)

        # Click generate
        await page.click("#start", timeout=5000)

        # Wait for download button
        try:
            download_btn = page.locator("a:has-text('تحميل')")
            await download_btn.wait_for(state="visible", timeout=120000)

            async with page.expect_download() as download_info:
                await download_btn.click()

            download = await download_info.value
            await download.save_as(output_path)
            print(f"OK:{output_path}")
        except Exception as e:
            print(f"ERROR: {e}", file=sys.stderr)
            sys.exit(1)
        finally:
            await browser.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--text", required=True)
    parser.add_argument("--voice", default=None)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    asyncio.run(run(args.text, args.voice, args.output))
