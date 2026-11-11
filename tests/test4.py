import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={'width':1440,'height':900})
        errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.route('**/fonts.googleapis.com/**',lambda r:r.abort())
        await pg.goto('file:///mnt/user-data/outputs/llm-kurs.html')
        await pg.wait_for_timeout(400)
        titles=await pg.evaluate('[...document.querySelectorAll(".slide")].map(s=>s.dataset.title)')
        want=['Uppgiften: från vektorer till nästa token','Transformer och decoder-only','Ett block, staplat 32 gånger','Residual stream','Shapen ändras aldrig','Normalisering: varför och var','Hela modellen i en bild']
        for k,t in enumerate(want):
            i=titles.index(t)
            await pg.evaluate(f'location.hash="#s{i+1}"');await pg.wait_for_timeout(80)
            await pg.screenshot(path=f'shots/v4_{k}.png')
        i=titles.index(want[0]);await pg.evaluate(f'location.hash="#s{i+1}"');await pg.click('#tk-1');await pg.screenshot(path='shots/v4_7.png')
        i=titles.index(want[2]);await pg.evaluate(f'location.hash="#s{i+1}"');await pg.evaluate('const r=document.getElementById("st-l");r.value=4;r.dispatchEvent(new Event("input"))');await pg.screenshot(path='shots/v4_8.png')
        i=titles.index(want[4]);await pg.evaluate(f'location.hash="#s{i+1}"')
        for _ in range(7): await pg.click('#sp-next')
        await pg.screenshot(path='shots/v4_9.png')
        i=titles.index(want[5]);await pg.evaluate(f'location.hash="#s{i+1}"');await pg.click('#pn-post');await pg.screenshot(path='shots/v4_10.png')
        print('errors',errs,len(titles))
        m=await b.new_page(viewport={'width':390,'height':844})
        await m.route('**/fonts.googleapis.com/**',lambda r:r.abort())
        for t in want[:6]:
            i=titles.index(t);await m.goto(f'file:///mnt/user-data/outputs/llm-kurs.html#s{i+1}');await m.wait_for_timeout(150)
            print(t,await m.evaluate('document.documentElement.scrollWidth'))
        await b.close()
asyncio.run(main())
