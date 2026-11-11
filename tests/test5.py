import asyncio
from playwright.async_api import async_playwright
from _common import URL, shot
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={'width':1440,'height':900})
        errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.route('**/fonts.googleapis.com/**',lambda r:r.abort())
        await pg.goto(URL)
        await pg.wait_for_timeout(400)
        titles=await pg.evaluate('[...document.querySelectorAll(".slide")].map(s=>s.dataset.title)')
        want=['Blocket som ett löpande band','Attention i klartext','Attention-formeln bit för bit','MLP i klartext','Attention 1: Q, K och V','MLP med SwiGLU']
        for k,t in enumerate(want):
            i=titles.index(t)
            await pg.evaluate(f'location.hash="#s{i+1}"');await pg.wait_for_timeout(80)
            await pg.screenshot(path=shot(f'v5_{k}.png'))
        i=titles.index(want[0]);await pg.evaluate(f'location.hash="#s{i+1}"');await pg.click('#lb-next');await pg.screenshot(path=shot('v5_6.png'))
        i=titles.index(want[3]);await pg.evaluate(f'location.hash="#s{i+1}"');await pg.click('#mk-next');await pg.click('#mk-next');await pg.screenshot(path=shot('v5_7.png'))
        i=titles.index(want[2]);await pg.evaluate(f'location.hash="#s{i+1}"');await pg.click('#fx-panel .btn');await pg.wait_for_timeout(80)
        print('goto ->',await pg.evaluate('document.querySelector(".slide.active").dataset.title'))
        print('errors',errs,len(titles))
        m=await b.new_page(viewport={'width':390,'height':844})
        await m.route('**/fonts.googleapis.com/**',lambda r:r.abort())
        for t in want[:4]:
            i=titles.index(t);await m.goto(f'{URL}#s{i+1}');await m.wait_for_timeout(150)
            print(t,await m.evaluate('document.documentElement.scrollWidth'))
        await b.close()
asyncio.run(main())
