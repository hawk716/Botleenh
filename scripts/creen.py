import asyncio
import os
import time
import random
import argparse
import subprocess
from playwright.async_api import async_playwright, TimeoutError

class CreenAIAutomation:
    def __init__(self, prompt, proxy=None, output_dir="outputs", use_tor=False):
        self.prompt = prompt
        self.proxy = proxy
        self.use_tor = use_tor
        self.output_dir = output_dir
        self.base_url = "https://www.creen.ai/create"
        
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)

    async def start_tor(self):
        """تشغيل خدمة Tor وتغيير الـ IP"""
        print("🧅 محاولة تشغيل خدمة Tor لتغيير الـ IP...")
        try:
            subprocess.Popen(["sudo", "tor"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print("⏳ الانتظار قليلاً حتى استقرار اتصال Tor...")
            await asyncio.sleep(15)
            self.proxy = "socks5://127.0.0.1:9050"
            print("✅ تم تفعيل Tor كبروكسي: 127.0.0.1:9050")
        except Exception as e:
            print(f"❌ فشل تشغيل Tor: {e}")

    def get_browser_args(self):
        """إعدادات المتصفح لتقليل البصمة الرقمية وتجاوز الحماية"""
        args = [
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-infobars",
            "--window-position=0,0",
            "--ignore-certificate-errors",
            "--ignore-certificate-errors-spki-list",
            f"--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{random.randint(120, 125)}.0.0.0 Safari/537.36"
        ]
        return args

    async def run(self, mode="image"):
        if self.use_tor:
            await self.start_tor()

        async with async_playwright() as p:
            browser_config = {
                "headless": True,
                "args": self.get_browser_args()
            }
            if self.proxy:
                proxy_server = self.proxy.replace("socks5://", "socks5://")
                browser_config["proxy"] = {"server": proxy_server}
                print(f"🌐 باستخدام البروكسي: {self.proxy}")

            browser = await p.chromium.launch(**browser_config)
            context = await browser.new_context(viewport={"width": 1920, "height": 1080})
            await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            page = await context.new_page()
            
            try:
                print(f"🚀 البدء في مهمة: {mode.upper()}")
                await page.goto(self.base_url, wait_until="networkidle", timeout=60000)
                
                try:
                    credits = await page.locator("img[src*='credit.png']").locator("xpath=..").inner_text()
                    print(f"💰 الرصيد المكتشف: {credits.strip()}")
                except:
                    pass

                if mode == "video":
                    print("🎬 الانتقال لوضع الفيديو...")
                    video_tab = page.locator("button:has-text('AI Video')")
                    await video_tab.click()
                    await asyncio.sleep(1)

                print(f"✍️ كتابة الوصف: {self.prompt}")
                textarea = page.locator("textarea[placeholder*='Describe']")
                await textarea.fill(self.prompt)
                
                print("⚡ ضغط زر الإنشاء...")
                submit_btn = page.locator("button").filter(has=page.locator("svg")).last
                await submit_btn.click()

                print("⏳ في انتظار المعالجة (تتبع ذكي)...")
                start_wait = time.time()
                
                found_result = False
                timeout_limit = 180 if mode == "video" else 90
                
                existing_srcs = set()
                initial_images = await page.locator("img[src*='cdn.creen.ai/prod/ai_']").all()
                for img in initial_images:
                    src = await img.get_attribute("src")
                    if src: existing_srcs.add(src)

                while time.time() - start_wait < timeout_limit:
                    results = await page.locator("img[src*='cdn.creen.ai/prod/ai_']").all()
                    
                    new_img = None
                    for img in reversed(results):
                        src = await img.get_attribute("src")
                        if src and src not in existing_srcs and ("ai_image" in src or "ai_video" in src):
                            new_img = img
                            break
                    
                    if new_img:
                        src = await new_img.get_attribute("src")
                        print(f"✅ تم اكتشاف نتيجة جديدة! الرابط: {src[:50]}...")
                        
                        file_ext = "mp4" if mode == "video" else "png"
                        filename = f"creen_{mode}_{int(time.time())}.{file_ext}"
                        save_path = os.path.join(self.output_dir, filename)
                        
                        try:
                            parent_link = new_img.locator("xpath=./parent::a")
                            if await parent_link.count() > 0:
                                href = await parent_link.get_attribute("href")
                                if href and "cdn.creen.ai" in href:
                                    print(f"🔗 وجدنا رابط تحميل مباشر: {href[:50]}...")
                        except: pass

                        await new_img.screenshot(path=save_path)
                        print(f"💾 تم الحفظ بنجاح: {save_path}")
                        found_result = True
                        break
                    
                    if await page.locator("text='Insufficient credits'").is_visible():
                        print("❌ خطأ: الرصيد غير كافٍ. يرجى تغيير الـ IP.")
                        break
                        
                    await asyncio.sleep(3)
                
                if not found_result:
                    print("⚠️ انتهى وقت الانتظار دون العثور على نتيجة واضحة.")
                    fallback_path = os.path.join(self.output_dir, f"error_state_{int(time.time())}.png")
                    await page.screenshot(path=fallback_path)
                    print(f"📸 تم حفظ لقطة شاشة للحالة الحالية: {fallback_path}")

            except Exception as e:
                print(f"❌ حدث خطأ غير متوقع: {e}")
            finally:
                await browser.close()
                print("🏁 إغلاق المتصفح.")

async def main():
    parser = argparse.ArgumentParser(description="Creen.ai Pro Automation Tool")
    parser.add_argument("prompt", help="الوصف المراد إنشاؤه")
    parser.add_argument("--mode", choices=["image", "video"], default="image", help="نوع الإنشاء")
    parser.add_argument("--proxy", help="عنوان البروكسي (مثال: http://user:pass@host:port)")
    parser.add_argument("--tor", action="store_true", help="استخدام Tor لتغيير الـ IP تلقائياً")
    parser.add_argument("--output", default="outputs", help="مجلد الحفظ")
    
    args = parser.parse_args()
    
    automation = CreenAIAutomation(args.prompt, args.proxy, args.output, use_tor=args.tor)
    await automation.run(args.mode)

if __name__ == "__main__":
    asyncio.run(main())
