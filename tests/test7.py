import asyncio
from playwright.async_api import async_playwright
from _common import URL, shot
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={'width':1440,'height':900})
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.route('**/fonts.googleapis.com/**',lambda r:r.abort())
        await pg.goto(URL,wait_until="domcontentloaded");await pg.wait_for_timeout(300)
        titles=await pg.evaluate('[...document.querySelectorAll(".slide")].map(s=>s.dataset.title)')
        for k,t in enumerate(['Vad ett lager innehåller','Så blir det 8 miljarder']):
            i=titles.index(t);await pg.evaluate(f'location.hash="#s{i+1}"');await pg.wait_for_timeout(80);await pg.screenshot(path=shot(f'v7_{k}.png'))
        for _ in range(3): await pg.click('#bn-next')
        await pg.screenshot(path=shot('v7_2.png'))
        lv=await pg.evaluate('document.getElementById("lvl").textContent');print('level',lv,'errors',errs,len(titles))
        await b.close()
asyncio.run(main())
