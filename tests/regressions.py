"""Sequential checks for every shipped locale and interactive regression."""
import asyncio
from playwright.async_api import async_playwright
from _common import HTML, LOCALES, prepare, shot


async def reveal(page, selector):
    index = await page.eval_on_selector(selector, "e => [...document.querySelectorAll('.slide')].indexOf(e.closest('.slide'))")
    assert index >= 0, selector
    await page.evaluate("n => { location.hash = '#s' + (n + 1); }", index)
    await page.wait_for_timeout(40)


async def check_filtered_counter(page, depth):
    deck = await page.evaluate("() => [...document.querySelectorAll('.slide')].map(s=>({level:+s.dataset.level,module:+s.dataset.mod}))")
    included = [i for i, slide in enumerate(deck) if slide['level'] <= depth]
    pair = next(((a,b) for a,b in zip(included,included[1:]) if b > a+1), (included[-2],included[-1]))

    async def check_at(index):
        actual = await page.evaluate("() => ({counter:document.getElementById('cnt').textContent,hash:location.hash,bars:[...document.querySelectorAll('#prog button span')].map(e=>parseFloat(e.style.width))})")
        ordinal = included.index(index)+1 if index in included else '—'
        assert actual['counter'] == f'{ordinal} / {len(included)}', (depth, index, actual)
        assert actual['hash'] == f'#s{index+1}', 'Canonical slide hashes must not be renumbered'
        for module, width in enumerate(actual['bars']):
            selected = [i for i in included if deck[i]['module'] == module]
            expected = 100*sum(i <= index for i in selected)/len(selected) if selected else 0
            assert abs(width-expected) < .001, (depth, module, width, expected)

    before, after = pair
    await page.evaluate("i=>{location.hash='#s'+(i+1)}", before)
    await page.wait_for_function("i=>[...document.querySelectorAll('.slide')].indexOf(document.querySelector('.slide.active'))===i", arg=before)
    await check_at(before)
    await page.locator('#nextbtn').click()
    await check_at(after)
    await page.locator('#prevbtn').click()
    await check_at(before)
    excluded = next((i for i, slide in enumerate(deck) if slide['level'] > depth), None)
    if excluded is not None:
        await page.evaluate("i=>{location.hash='#s'+(i+1)}", excluded)
        await page.wait_for_function("i=>[...document.querySelectorAll('.slide')].indexOf(document.querySelector('.slide.active'))===i", arg=excluded)
        await check_at(excluded)
        expected = await page.evaluate("n=>L.t('learning.slide.excluded',{total:n})", len(included))
        assert await page.locator('#cnt').get_attribute('aria-label') == expected


async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for lang in LOCALES:
            page = await browser.new_page(viewport={"width": 1440, "height": 900})
            errors = await prepare(page, [])
            await page.goto(HTML.as_uri() + f"?lang={lang}", wait_until="domcontentloaded")
            await page.wait_for_timeout(150)
            # The first visit follows introductory advice; saved settings are not overwritten.
            await reveal(page, "#modgrid")
            assert await page.locator("#pathsel button.on").count() == 1
            assert await page.locator("#pathsel button").nth(0).evaluate("e=>e.classList.contains('on')")
            for depth in (1, 2, 3):
                await reveal(page, '#modgrid')
                await page.locator("#pathsel button").nth(depth - 1).click()
                assert not await page.evaluate("depth => [...document.querySelectorAll('.qq')].some(e=>+e.dataset.questionLevel>depth)", depth)
                assert not await page.evaluate("depth => [...document.querySelectorAll('[data-detail-level]')].some(e=>e.hidden !== (+e.dataset.detailLevel>depth))", depth)
                await check_filtered_counter(page, depth)
            # Controls formerly covered only by ad-hoc screenshots now have assertions.
            for selector in ("#tl-next", "#am-mlp", "#ly-ckpt", "#tk-1", "#sp-next", "#pn-post", "#lb-next", "#mk-next", "#lm-auto", "#gp-64", "#bn-next"):
                await reveal(page, selector)
                await page.locator(selector).click()
                assert await page.locator(".slide.active").count() == 1
            # A burst against detached controls must not overrun the example stages.
            await reveal(page, "#ex-stages")
            await page.evaluate("""() => { for(let n=0;n<80;n++) {
              const buttons=[...document.querySelectorAll('#ex-stages button,#ex-text button')];
              buttons.forEach(b=>{if(!b.dataset.gomod)b.click();});
            }}""")
            assert await page.locator("#ex-view").inner_text()
            # Both previously colliding SVGs render, and ablation cannot paint into the stack.
            await reveal(page, "#ab-abl")
            original = await page.locator("#st-svg").inner_html()
            before = await page.locator("#ab-out").inner_text()
            assert await page.locator("#ab-svg > *").count() >= 10
            await page.locator("#ab-abl").click()
            assert await page.locator("#ab-out").inner_text() != before
            assert await page.locator("#st-svg").inner_html() == original
            assert not await page.evaluate("() => {const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return ids.length!==new Set(ids).size;}")
            # The block-stack parameter split must add up and grow with L only
            # inside the blocks; the two token tables never change size.
            await reveal(page, '#st-l')
            for count in (1, 8, 32):
                await page.locator('#st-l').evaluate("(e,n)=>{e.value=n;e.dispatchEvent(new Event('input',{bubbles:true}))}", count)
                data = await page.locator('#st-svg').evaluate("e=>({...e.dataset})")
                inside, outside, total = (float(data[key]) for key in ('inside', 'outside', 'total'))
                assert abs(inside - .218*count) < 1e-9 and abs(outside - 1.05) < 1e-9, (lang, count, data)
                assert abs(inside + outside - total) < 1e-9, (lang, count, data)
                assert 0 < inside/(inside+outside) < 1, 'share must be a real fraction, never 100%'
            assert await page.locator('#st-out').inner_text()

            # Attention cost: computed pairs and matrix memory follow the formulas.
            await reveal(page, '#ac-n')
            for index, expected_n in ((0, 1024), (3, 8192), (7, 131072)):
                await page.locator('#ac-n').evaluate("(e,i)=>{e.value=i;e.dispatchEvent(new Event('input',{bubbles:true}))}", index)
                for causal in (True, False):
                    await page.locator('#ac-causal').set_checked(causal)
                    data = await page.locator('#ac-svg').evaluate("e=>({...e.dataset})")
                    n = int(data['n'])
                    assert n == expected_n, (lang, data)
                    pairs = n*(n+1)//2 if causal else n*n
                    assert int(data['pairs']) == pairs, (lang, causal, data)
                    assert int(data['total']) == pairs*32*32, (lang, causal, data)
                    assert int(data['matrix']) == 2*n*n, (lang, data)
                    assert 'NaN' not in await page.locator('#ac-out').inner_text()
            await page.locator('#ac-causal').set_checked(True)

            # Expanded diagrams move rather than clone, preserving controls and unique ids.
            expand = page.locator(".slide.active .viz-actions button").first
            await expand.click()
            assert await page.locator("dialog[open] svg").count() == 1
            await page.keyboard.press("Escape")
            assert await page.locator("dialog[open]").count() == 0
            assert await page.locator("#ab-svg").count() == 1
            # Definition links open the glossary already filtered to the chosen term.
            link = page.locator(".slide.active .context-glossary button").first
            term = await link.inner_text()
            await link.click()
            assert await page.locator("#gloss-search").input_value() == term
            assert await page.locator("#gloss dt:visible").count() >= 1
            await page.keyboard.press("Escape")
            # Test copying without depending on operating-system clipboard permissions.
            await page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__courseCopied=text;}}})")
            block = page.locator(".copy-tools").first
            await reveal(page, ".copy-tools")
            await block.locator("button").click()
            assert await page.evaluate("Boolean(window.__courseCopied)")
            assert await block.locator("[role=status]").inner_text()
            # Stored answers/depth survive reload; resume uses translated lesson titles.
            await reveal(page, '.quiz')
            first_option = page.locator('.quiz .opt').first
            chosen = await first_option.get_attribute('data-option')
            await first_option.click()
            await page.evaluate("""() => { const s=JSON.parse(localStorage.getItem('llm-kurs-v2'));
              s.last='Vektorer och skalärprodukt'; localStorage.setItem('llm-kurs-v2',JSON.stringify(s)); }""")
            await page.goto(HTML.as_uri() + f'?lang={lang}', wait_until='domcontentloaded')
            await reveal(page, '#modgrid')
            assert await page.locator('#pathsel button').nth(2).evaluate("e=>e.classList.contains('on')")
            expected = await page.locator('.slide[data-title="Vektorer och skalärprodukt"] h2').inner_text()
            actual_resume = await page.locator('#resume-t').inner_text()
            assert actual_resume == expected, (lang, actual_resume, expected)
            assert await page.locator('.quiz .opt[data-option="' + chosen + '"]').first.is_disabled()
            # Exercise every newly added simulation at control boundaries, not just its opener.
            for prefix in ("fd-", "ql-", "trn-", "op-"):
                indices = await page.evaluate("prefix => [...document.querySelectorAll('.slide')].flatMap((s,i)=>s.querySelector('[id^=\"'+prefix+'\"]')?[i]:[])", prefix)
                assert indices, f"No integrated simulations: {prefix}"
                for number, index in enumerate(indices):
                    await page.evaluate("i=>{location.hash='#s'+(i+1)}", index)
                    await page.wait_for_timeout(25)
                    controls = page.locator('.slide.active button:not(.study-tool),.slide.active input,.slide.active select,.slide.active summary')
                    for control in await controls.all():
                        if not await control.is_visible() or not await control.is_enabled():
                            continue
                        await control.evaluate("""e=>{
                          if(e.tagName==='INPUT'){
                            if(e.type==='checkbox')e.checked=!e.checked;
                            else e.value=e.max||e.value;
                            e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));
                          }else if(e.tagName==='SELECT'){
                            e.selectedIndex=e.options.length-1;e.dispatchEvent(new Event('change',{bubbles:true}));
                          }else e.click();
                        }""")
                    text = await page.locator('.slide.active').inner_text()
                    assert 'NaN' not in text and 'Infinity' not in text, (prefix, index, text)
                    assert await page.locator('.slide.active svg.viz').count() > 0 or await page.locator('.slide.active pre').count() > 0
                    if number == 0:
                        await page.screenshot(path=shot(f'{lang}_{prefix}first.png'))
                print(lang, prefix, "simulations checked", len(indices))
            await page.set_viewport_size({"width": 360, "height": 800})
            count = await page.locator('.slide').count()
            for index in range(count):
                await page.evaluate("i=>{location.hash='#s'+(i+1)}", index)
                await page.wait_for_timeout(15)
                width = await page.evaluate('document.documentElement.scrollWidth')
                assert width <= 361, (lang, index + 1, width)
            assert not errors, errors
            await page.close()
        await browser.close()
    print("OK: depth, simulations, stepper, ablation and study tools in " + ", ".join(LOCALES))


if __name__ == "__main__":
    asyncio.run(run())
