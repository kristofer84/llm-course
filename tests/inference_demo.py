"""Guided training/inference behavior, control explanations and state transitions."""
import asyncio
import math
from playwright.async_api import async_playwright
from _common import HTML, LOCALES, prepare, shot
from regressions import reveal


async def snapshot(page):
    return await page.locator('#fd-state-svg').evaluate("e=>({mode:e.dataset.mode,...Object.fromEntries(['weight','input','prediction','reference','steps','trainingLoss'].map(k=>[k,Number(e.dataset[k])]))})")


def check_state(state, weight, steps, input_value=2):
    assert math.isclose(state['weight'], weight, abs_tol=1e-12), state
    assert state['steps'] == steps and state['input'] == input_value, state
    assert math.isclose(state['prediction'], weight*input_value, abs_tol=1e-12)
    assert state['reference'] == 2*input_value
    assert math.isclose(state['trainingLoss'], 7/3*(weight-2)**2, abs_tol=1e-12)


async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        for locale in LOCALES:
            page = await browser.new_page(viewport={'width':1440,'height':1000})
            errors = await prepare(page, [])
            await page.goto(HTML.as_uri()+'?lang='+locale, wait_until='domcontentloaded')
            await reveal(page, '#fd-state-svg')
            original_hash = await page.evaluate('location.hash')
            state = await snapshot(page)
            check_state(state, 1, 0)
            assert state['mode'] == 'training'
            assert await page.locator('#fd-state-x').is_disabled()
            assert await page.locator('#fd-state-update').is_enabled()
            assert await page.locator('#fd-state-training').is_visible()
            assert await page.locator('#fd-state-x').get_attribute('aria-describedby') == 'fd-state-slider-help'
            assert await page.locator('#fd-state-slider-help').inner_text()
            rows = await page.locator('#fd-state-rows').evaluate("e=>[...e.rows].map(r=>[...r.cells].map(c=>c.textContent))")
            assert [row[:2] for row in rows] == [['1','2'],['2','4'],['3','6']]
            # A disabled probe cannot secretly select different training examples.
            await page.locator('#fd-state-x').evaluate("e=>{e.value=5;e.dispatchEvent(new Event('input',{bubbles:true}));}")
            check_state(await snapshot(page),1,0)
            await page.locator('#fd-state-update').focus()
            await page.keyboard.press('Enter')
            first_weight = 22/15
            check_state(await snapshot(page),first_weight,1)
            assert '→' in await page.locator('#fd-state-change').inner_text()
            assert await page.locator('#fd-state-progress').evaluate('e=>e.value') == 1
            # Freezing does not reset or automatically perfect the learned weight.
            await page.locator('#fd-state-test').click()
            assert await page.locator('#fd-state-mode').input_value() == 'inference'
            assert await page.locator('#fd-state-x').is_enabled()
            assert await page.locator('#fd-state-update').is_disabled()
            assert not await page.locator('#fd-state-training').is_visible()
            await page.locator('#fd-state-x').focus()
            await page.keyboard.press('ArrowRight')
            check_state(await snapshot(page),first_weight,1,2.5)
            assert await page.evaluate('location.hash') == original_hash
            for value in (1,3,4,5):
                await page.locator('#fd-state-x').evaluate("(e,value)=>{e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));}", value)
                check_state(await snapshot(page),first_weight,1,value)
            expected = await page.evaluate("L.t('fd.state.probeNew')")
            assert await page.locator('#fd-state-probe').inner_text() == expected
            await page.locator('#fd-state-update').evaluate("e=>e.dispatchEvent(new Event('click',{bubbles:true}))")
            check_state(await snapshot(page),first_weight,1,5)
            # Resume the same learned state, then finish all guided updates.
            await page.locator('#fd-state-mode').select_option('training')
            check_state(await snapshot(page),first_weight,1,2)
            previous_loss = (await snapshot(page))['trainingLoss']
            for step in range(2,9):
                await page.locator('#fd-state-update').click()
                state = await snapshot(page)
                check_state(state,2-(8/15)**step,step)
                assert state['trainingLoss'] < previous_loss
                previous_loss = state['trainingLoss']
            assert await page.locator('#fd-state-update').is_disabled()
            assert await page.locator('#fd-state-progress').evaluate('e=>[e.value,e.max]') == [8,8]
            final_weight = 2-(8/15)**8
            await page.locator('#fd-state-update').evaluate("e=>e.dispatchEvent(new Event('click',{bubbles:true}))")
            check_state(await snapshot(page),final_weight,8)
            await page.screenshot(path=shot(locale+'_guided-training.png'))
            await page.locator('#fd-state-test').click()
            await page.locator('#fd-state-x').evaluate("e=>{e.value=5;e.dispatchEvent(new Event('input',{bubbles:true}));}")
            state = await snapshot(page)
            check_state(state,final_weight,8,5)
            assert state['prediction'] < state['reference'] and state['trainingLoss'] > 0
            await page.screenshot(path=shot(locale+'_guided-inference.png'))
            # Reset is a real restart, not merely clearing a displayed score.
            await page.locator('#fd-state-reset').click()
            state = await snapshot(page)
            check_state(state,1,0,2)
            assert state['mode'] == 'training' and await page.locator('#fd-state-x').is_disabled()
            assert await page.locator('#fd-state-progress').evaluate('e=>e.value') == 0
            assert await page.locator('#fd-state-change').inner_text() == await page.evaluate("L.t('fd.state.noTraining')")
            # No reload/phase transition may move the deck to another slide.
            assert await page.evaluate('location.hash') == original_hash
            await page.set_viewport_size({'width':360,'height':800})
            assert await page.evaluate('document.documentElement.scrollWidth') <= 361
            assert not errors, (locale,errors)
            await page.close()
            print('OK',locale,'guided steps, fixed batch, frozen input testing, reset and keyboard controls')
        await browser.close()


if __name__=='__main__':
    asyncio.run(main())
