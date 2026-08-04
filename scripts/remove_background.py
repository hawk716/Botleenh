import asyncio
import os
import argparse
import sys
from playwright.async_api import async_playwright

async def remove_background(input_path, output_path=None):
    """
    Remove background from image using retoucher.online
    """
    if not os.path.exists(input_path):
        print(f"Error: File {input_path} not found.", file=sys.stderr)
        return None

    if output_path is None:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_no_bg.png"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        async def block_unnecessary(route):
            if route.request.resource_type in ["font", "media"]:
                await route.abort()
            else:
                await route.continue_()
        await page.route("**/*", block_unnecessary)

        try:
            await page.goto("https://retoucher.online/upload", wait_until="domcontentloaded", timeout=60000)

            # Set file directly to hidden input (Playwright can handle hidden inputs)
            await page.set_input_files("input[type='file']", input_path)

            # Wait for processing: a download button appears after processing
            download_selector = "button:has-text('Download'), a:has-text('Download')"
            download_btn = page.locator(download_selector).first
            await download_btn.wait_for(state="visible", timeout=90000)

            async with page.expect_download() as download_info:
                await download_btn.click()

            download = await download_info.value
            await download.save_as(output_path)

            return output_path

        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            await page.screenshot(path="/tmp/removebg_debug.png")
            return None
        finally:
            await browser.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Remove image background using Retoucher.online")
    parser.add_argument("input", help="Input image path")
    parser.add_argument("-o", "--output", help="Output image path", default=None)

    args = parser.parse_args()
    result = asyncio.run(remove_background(args.input, args.output))
    if result:
        print(result)
        sys.exit(0)
    else:
        sys.exit(1)
