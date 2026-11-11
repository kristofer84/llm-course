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
        want=['Vad är en språkmodell?','Kursens karta','Vad är ett grafikkort?','KV-cache i klartext','vLLM i klartext','Embedding: från id till vektor','PagedAttention','Tensor parallelism']
        for k,t in enumerate(want):
            i=titles.index(t)
            await pg.evaluate(f'location.hash="#s{i+1}"');await pg.wait_for_timeout(80)
            await pg.screenshot(path=shot(f'v6_{k}.png'))
        # interactions
        i=titles.index('Vad är en språkmodell?');await pg.evaluate(f'location.hash="#s{i+1}"')
        for _ in range(4): await pg.click('#lm-auto')
        print('lm:',await pg.evaluate('document.getElementById("lm-text").innerText.replace(/\\n/g,"|")'))
        i=titles.index('Vad är ett grafikkort?');await pg.evaluate(f'location.hash="#s{i+1}"');await pg.click('#gp-64');await pg.screenshot(path=shot('v6_8.png'))
        # path filter: grund only, then step through from map
        i=titles.index('Kursens karta');await pg.evaluate(f'location.hash="#s{i+1}"')
        await pg.click('#pathsel button:nth-child(1)')
        seq=[]
        for _ in range(12):
            await pg.click('#nextbtn');seq.append(await pg.evaluate('document.querySelector(".slide.active").dataset.title+" ["+document.getElementById("lvl").textContent+"]"'))
        print('grund path:',seq)
        await pg.screenshot(path=shot('v6_9.png'))
        print('errors',errs,len(titles))
        await b.close()
asyncio.run(main())
