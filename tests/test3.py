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
        want=['Modul 3: Transformerblocket','Ett lager inifrån','32 lager i en modellfil','Två rader, ett lager','Attention och MLP: olika jobb','MLP:n som detektorer','Lager för lager','Sammanfattning: Transformerblocket']
        for t in want:
            i=titles.index(t)
            await pg.evaluate(f'location.hash="#s{i+1}"');await pg.wait_for_timeout(80)
            await pg.screenshot(path=f'shots/new_{want.index(t)}.png')
        # interactions
        i=titles.index('Två rader, ett lager');await pg.evaluate(f'location.hash="#s{i+1}"')
        for _ in range(3): await pg.click('#tl-next')
        await pg.screenshot(path='shots/new_tl3.png')
        i=titles.index('Attention och MLP: olika jobb');await pg.evaluate(f'location.hash="#s{i+1}"');await pg.click('#am-mlp');await pg.screenshot(path='shots/new_mlp.png')
        i=titles.index('Lager för lager');await pg.evaluate(f'location.hash="#s{i+1}"');await pg.evaluate('const r=document.getElementById("ll-k");r.value=3;r.dispatchEvent(new Event("input"))');await pg.screenshot(path='shots/new_ll.png')
        i=titles.index('Ett lager inifrån');await pg.evaluate(f'location.hash="#s{i+1}"');await pg.click('#ly-ckpt');await pg.screenshot(path='shots/new_ly2.png')
        print('errors',errs,len(titles))
        # mobile
        m=await b.new_page(viewport={'width':390,'height':844})
        await m.route('**/fonts.googleapis.com/**',lambda r:r.abort())
        for t in ['Ett lager inifrån','Två rader, ett lager','Attention och MLP: olika jobb']:
            i=titles.index(t);await m.goto(f'file:///mnt/user-data/outputs/llm-kurs.html#s{i+1}');await m.wait_for_timeout(200)
            print(t,await m.evaluate('document.documentElement.scrollWidth'))
        await b.close()
asyncio.run(main())
