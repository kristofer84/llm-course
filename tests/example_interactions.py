"""Exercise locale-native examples, exact token data and numerical relationships."""
import asyncio
import json
import re
from playwright.async_api import async_playwright, expect
from _common import HTML, LOCALES, prepare, shot
from regressions import reveal


async def no_old_examples(page, locale):
    if locale == 'sv':
        return
    bad = await page.evaluate(r"""() => [...document.querySelectorAll('.slide')].flatMap((slide,i)=>{
      const walker=document.createTreeWalker(slide,NodeFilter.SHOW_TEXT),texts=[];let node;
      while((node=walker.nextNode()))texts.push(node.data);
      texts.push(...[...slide.querySelectorAll('input,textarea')].map(e=>e.value));
      // Joining unrelated nodes can turn “block” + “attention” into a false “katten”.
      const pattern=/(?<![\p{L}\p{N}_])(?:Katten|kattungar|mattan|eftersom|trött|huvudstad|Tyskland|kattensattpå)(?![\p{L}\p{N}_])/giu;
      const old=texts.flatMap(text=>text.match(pattern)||[]);
      return old.length?[{slide:i+1,old:[...new Set(old)]}]:[];
    })""")
    assert not bad, (locale, bad)
    unresolved = await page.evaluate("() => [...document.querySelectorAll('.slide')].some(s=>s.textContent.includes('{{example_'))")
    assert not unresolved, (locale, 'unresolved example variable')


async def run():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        for locale in LOCALES:
            page = await browser.new_page(viewport={'width': 1440, 'height': 1000})
            errors = await prepare(page, [])
            await page.goto(HTML.as_uri() + '?lang=' + locale, wait_until='domcontentloaded')
            pack = await page.evaluate('window.COURSE_EXAMPLE')
            assert pack['locale'] == locale
            await no_old_examples(page, locale)

            # Each language has a real merge sequence, rather than relabeled old chips.
            await reveal(page, '#bpe-next')
            await page.locator('#bpe-reset').click()
            assert await page.locator('#bpe-chips .chip').all_text_contents() == pack['bpe']['initial']
            for _ in pack['bpe']['merges']:
                await page.locator('#bpe-next').click()
            assert await page.locator('#bpe-chips .chip').all_text_contents() == pack['bpe']['final']
            await page.locator('#bpe-next').click()
            await no_old_examples(page, locale)

            await reveal(page, '#emb-rows')
            labels = await page.locator('#emb-rows text').all_text_contents()
            assert all(piece in labels for piece in pack['tokenizer']['prompt']['pieces']), (locale, labels)
            assert all(str(token) in labels for token in pack['tokenizer']['prompt']['ids'])

            await reveal(page, '#ex-stages')
            await page.locator('#ex-stages button').nth(1).click()
            assert await page.locator('#ex-view .chip').all_text_contents() == pack['tokenizer']['prompt']['pieces']
            await page.locator('#ex-stages button').last.click()
            assert await page.locator('#ex-view .chip').all_text_contents() == pack['tokenizer']['prompt']['pieces'] + [pack['walkthrough']['chosen']]
            await no_old_examples(page, locale)

            # The pronoun selects the noun, not a newly inserted English/German article.
            scene = pack['scene']
            for root, tokens, roles, selected in [
                ('att-svg', scene['attention'], scene['attentionRoles'], scene['attentionRoles']['pronoun']),
                ('pv-svg', scene['tokens'], scene['roles'], scene['roles']['pronoun']),
                ('am-svg', scene['context'], scene['contextRoles'], scene['contextRoles']['pronoun']),
            ]:
                await reveal(page, '#' + root)
                controls = page.locator('#' + root + ' [data-a11y-control]')
                assert await controls.count() == len(tokens), (locale, root)
                assert await controls.nth(selected).get_attribute('aria-pressed') == 'true'
                assert scene['tokens'][scene['roles']['subject']] == pack['words']['subject']
                # End-row selection remains keyboard reachable even beyond the horizontal viewport.
                await controls.nth(len(tokens)-1).focus()
                await page.keyboard.press('Enter')
                assert await controls.nth(len(tokens)-1).get_attribute('aria-pressed') == 'true'
            await no_old_examples(page, locale)

            # Shifted training targets come from the same actual tokenizer snapshot.
            await reveal(page, '#shift-g')
            text = await page.locator('#shift-g text').all_text_contents()
            assert text[:2*len(pack['training']['inputs']):2] == pack['training']['inputs']
            assert text[1:2*len(pack['training']['inputs']):2] == pack['training']['targets']

            await reveal(page, '#flat-tbl')
            rows = await page.locator('#flat-tbl').evaluate("e=>Object.fromEntries([...e.rows].map(r=>[r.cells[0].textContent,[...r.cells].slice(1).map(c=>c.textContent)]))")
            count = pack['tokenizer']['prompt']['count']
            assert len(rows['input_ids']) == count + 2
            assert [int(value) for value in rows['input_ids'][:count]] == pack['tokenizer']['prompt']['ids']
            assert json.loads(rows['query_start_loc'][0]) == [0,count,count+1,count+2]
            assert json.loads(rows['seq_lens'][0]) == [count,38,13]
            assert [int(value) for value in rows['slot_mapping']] == list(range(48,48+count)) + [149,76]

            await reveal(page, '#sd-next')
            await page.locator('#sd-reset').click()
            for _ in range(4):
                await page.locator('#sd-next').click()
            final = page.locator('#sd-view .chips').last
            assert await final.locator('.chip').all_text_contents() == pack['speculative']['prefix']['pieces'] + pack['speculative']['committed']
            assert await final.locator('.chip.ok').count() == pack['speculative']['accepted']
            assert await final.locator('.chip.s').count() == 1
            await no_old_examples(page, locale)

            await reveal(page, '#mm-step')
            await page.locator('#mm-reset').click()
            mini = pack['mini']
            assert await page.locator('#mm-seq .chip').all_text_contents() == [mini['vocab'][i] for i in mini['promptIds']]
            for _ in range(mini['maxLength'] - len(mini['promptIds'])):
                await page.locator('#mm-step').click()
            assert await page.locator('#mm-step').is_disabled()
            assert await page.locator('#mm-seq .chip').count() == mini['maxLength']
            values = await page.locator('#mm-tbl').evaluate("e=>[...e.rows].slice(1,-1).map(r=>Number(r.cells[4].textContent))")
            assert len(values) == 8 and all(0 <= delta <= 1e-10 for delta in values), (locale, values)
            await no_old_examples(page, locale)

            # Follow the natural causal continuation, including German comma + denn.
            await reveal(page, '#lm-auto')
            await page.locator('#lm-reset').click()
            graph = pack['lm']['states']
            state, visited = pack['lm']['start'], set()
            while state != 'end':
                options = graph[state]
                # Choose the cause once, then terminate after its adjective.
                index = 2 if state == 'tail' and 'adjective' not in visited else 0
                visited.add(state)
                await page.locator('#lm-opts button').nth(index).click()
                state = options[index]['next']
            joined = ''.join(await page.locator('#lm-text .chip').all_text_contents())
            assert joined == scene['fullText'] + '.', (locale, joined, scene['fullText'])
            await no_old_examples(page, locale)

            # Scrollable SVG regions retain useful labels and never steal deck navigation.
            await reveal(page, '#kv-svg')
            region = page.locator('.slide.active .example-scroll').first
            old_hash = await page.evaluate('location.hash')
            await region.focus()
            await page.keyboard.press('ArrowRight')
            assert await page.evaluate('location.hash') == old_hash
            await page.locator('.slide.active .viz-actions button').first.click()
            assert await page.locator('dialog[open] #kv-svg').count() == 1
            await page.keyboard.press('Escape')
            await expect(page.locator('.slide.active .example-scroll #kv-svg')).to_have_count(1)
            await page.screenshot(path=shot(locale + '_localized-cache.png'))
            for selector, name in [('#att-svg','attention'),('#pv-svg','values'),('#ex-stages','walkthrough')]:
                await reveal(page, selector)
                await page.screenshot(path=shot(locale + '_localized-' + name + '.png'))
            assert not errors, (locale, errors)
            await page.close()
            print('OK', locale, 'native examples, counts, roles, shifts, slots, speculation, cached logits and grammar')
        await browser.close()


if __name__ == '__main__':
    asyncio.run(run())
