import asyncio
from playwright.async_api import async_playwright
from _common import URL, shot
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={'width':390,'height':844},color_scheme='dark')
        await pg.route('**/fonts.googleapis.com/**',lambda r:r.abort())
        await pg.goto(URL + '#s32',wait_until="domcontentloaded")
        await pg.wait_for_timeout(300)
        await pg.screenshot(path=shot('m32.png'))
        await pg.evaluate('location.hash="#s15"');await pg.wait_for_timeout(100)
        await pg.screenshot(path=shot('m15.png'))
        w=await pg.evaluate('document.documentElement.scrollWidth')
        print('scrollWidth',w)
        await b.close()
asyncio.run(main())
