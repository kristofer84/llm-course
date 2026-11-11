import asyncio,os
from playwright.async_api import async_playwright
from _common import URL, shot, shots_dir
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={'width':1440,'height':900})
        errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.on('console',lambda m:errs.append('console:'+m.text) if m.type=='error' and 'ERR_FAILED' not in m.text else None)
        await pg.route('**/fonts.googleapis.com/**',lambda r:r.abort())
        await pg.goto(URL)
        await pg.wait_for_timeout(400)
        n=await pg.evaluate('document.querySelectorAll(".slide").length')
        titles=await pg.evaluate('[...document.querySelectorAll(".slide")].map(s=>s.dataset.title)')
        over=[]
        for i in range(n):
            await pg.evaluate(f'location.hash="#s{i+1}"')
            await pg.wait_for_timeout(50)
            await pg.screenshot(path=shot(f's{i+1:03d}.png'))
        for bid in ['bpe-next','res-next','kv-next','kv-next','pg-new','pg-step','pg-fin','cb-cont','sd-next','fl-next','tr-next','tr-decode','smp-draw','st-abl','att-soft','mm-step','mm-step','mm-step','mm-step','ah-next','ah-next','ah-next','ah-next','ah-next','nl-lin','wa-moe','mv-rand']:
            await pg.evaluate(f'document.getElementById("{bid}").click()')
        print(await pg.evaluate('document.getElementById("mm-tbl").innerText'))
        print(await pg.evaluate('document.getElementById("mm-seq").innerText.replace(/\\n/g," ")'))
        print(await pg.evaluate('document.getElementById("ah-tbl").innerText'))
        print(await pg.evaluate('document.getElementById("cp-tbl").innerText'))
        # quiz click
        await pg.evaluate('document.querySelector(".quiz .opt").click()')
        print('quiz score:',await pg.evaluate('document.querySelector(".qscore").innerText'))
        print('errors:',errs); print(n); 
        open(shot('titles.txt'),'w').write('\n'.join(f'{i+1} {t}' for i,t in enumerate(titles)))
        await b.close()
shots_dir()
asyncio.run(main())
