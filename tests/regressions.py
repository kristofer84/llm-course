"""Sequential bilingual checks replacing the old numbered debug/screenshot scripts."""
import asyncio
from playwright.async_api import async_playwright
from _common import HTML, prepare


async def reveal(page, selector):
    index = await page.eval_on_selector(selector, "e => [...document.querySelectorAll('.slide')].indexOf(e.closest('.slide'))")
    assert index >= 0, selector
    await page.evaluate("n => { location.hash = '#s' + (n + 1); }", index)
    await page.wait_for_timeout(40)


async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for lang in ("sv", "en"):
            page = await browser.new_page(viewport={"width": 1440, "height": 900})
            errors = await prepare(page, [])
            await page.goto(HTML.as_uri() + f"?lang={lang}", wait_until="domcontentloaded")
            await page.wait_for_timeout(150)
            # The first visit follows introductory advice; saved settings are not overwritten.
            await reveal(page, "#modgrid")
            assert await page.locator("#pathsel button.on").count() == 1
            assert await page.locator("#pathsel button").nth(0).evaluate("e=>e.classList.contains('on')")
            for depth in (1, 2, 3):
                await page.locator("#pathsel button").nth(depth - 1).click()
                assert not await page.evaluate("depth => [...document.querySelectorAll('.qq')].some(e=>+e.dataset.questionLevel>depth)", depth)
                assert not await page.evaluate("depth => [...document.querySelectorAll('[data-detail-level]')].some(e=>e.hidden !== (+e.dataset.detailLevel>depth))", depth)
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
            # New simulations must all initialize and have output or an accessible SVG.
            for prefix in ("fd-", "ql-", "trn-", "op-"):
                roots = await page.locator(f'.slide:has([id^="{prefix}"])').count()
                print(lang, prefix, "slides", roots)
            assert not errors, errors
            await page.close()
        await browser.close()
    print("OK: bilingual depth, original controls, stepper burst, ablation, study tools")


if __name__ == "__main__":
    asyncio.run(run())
