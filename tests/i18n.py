"""Multilingual rendering, switching and glossary acceptance checks.

Build first: (cd src && python3 build.py), then python3 tests/i18n.py.
Every shipped locale is rendered slide by slide with interactive controls.
Check catalog coverage, translated keyed DOM, document metadata, switch order,
locale numbers, glossary collation, browser detection and persisted/hash-safe
switching. Swedish sample tokens are deliberate data (en/data.json), not leaks.
German shares umlauts with Swedish, so runtime leak checks compare catalog
values rather than treating German letters as evidence of Swedish.
"""
import asyncio
import json
import re
import sys
from pathlib import Path

from playwright.async_api import async_playwright

from _common import HTML, LOCALES, prepare

ROOT = Path(__file__).resolve().parent.parent
I18N = ROOT / "src" / "i18n"

SV_LETTERS = re.compile(r"[ÅÄÖåäö]")
SV_WORDS = re.compile(
    r"\b(och|att|är|för|som|inte|till|från|men|eller|så|när|kan|blir|vara|har|"
    r"alla|inga|bara|också|här|där|din|ditt|denna|detta|eftersom|mellan|utan|efter|"
    r"före|under|över|vid|varje|samma|många|mycket|rätt|fel|steg|svar|fråga|kvar|"
    r"totalt|visa|nästa|föregående|stäng|öppna|välj|klicka|beräkna|resultat|summa|"
    r"vikter|aktivering|lager|ström|blått|prickar|raden|kolumn)\b",
    re.IGNORECASE,
)
failures = []


def swedish(s):
    return bool(SV_LETTERS.search(s) or SV_WORDS.search(s))


def check(ok, msg):
    print(("ok   " if ok else "FAIL ") + msg)
    if not ok:
        failures.append(msg)


def load_catalog(locale="en"):
    cat = {}
    for f in sorted((I18N / locale).glob("*.json")):
        if f.name.startswith("_") or f.name == "data.json":
            continue
        cat.update(json.loads(f.read_text(encoding="utf-8")))
    return cat


def identity_values():
    path = I18N / "en" / "data.json"
    if not path.exists():
        return set()
    d = json.loads(path.read_text(encoding="utf-8"))
    return {k for k, v in d.items() if k == v}


def coverage(sv, target, locale):
    missing = sorted(k for k in sv if k not in target or not str(target[k]).strip())
    check(not missing, f"{locale} catalog covers {len(sv)} keys"
          + (f" — missing {len(missing)}: {missing[:3]}" if missing else ""))


GLOSSARY_SORTED = r"""
() => {
  const terms = [...document.querySelectorAll('#gloss dt')].map(e => e.textContent.trim()).filter(Boolean);
  const sorted = [...terms].sort((a, b) => a.localeCompare(b, document.documentElement.lang, { sensitivity: 'base' }));
  const wrong = terms.map((v, i) => [i, v, sorted[i]]).filter(([, v, s]) => v !== s);
  return { n: terms.length, wrong: wrong.slice(0, 3) };
}
"""


COLLECT = r"""
(sel) => {
  const out = [];
  const roots = sel ? [...document.querySelectorAll(sel)] : [document.body];
  roots.forEach(r => L.collect(r).forEach(u => out.push([u.key, u.html])));
  return out;
}
"""

COUNT = r"""
() => document.querySelectorAll(
  '.slide.active button:not(.study-tool), .slide.active input[type=range], .slide.active input[type=checkbox], ' +
  '.slide.active select, .slide.active summary'
).length
"""

CLICK = r"""
(j) => {
  const sel = '.slide.active button:not(.study-tool), .slide.active input[type=range], ' +
              '.slide.active input[type=checkbox], .slide.active select, .slide.active summary';
  const el = [...document.querySelectorAll(sel)][j];
  if (!el) return false;
  if (el.tagName === 'INPUT' && el.type === 'range') {
    el.value = String(el.max ? Number(el.max) : el.value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  } else el.click();
  return true;
}
"""


async def render_pass(browser, lang, max_clicks=8):
    """Show every slide with its interactions; return key -> [rendered texts]."""
    page = await browser.new_page(viewport={"width": 1440, "height": 900})
    errors = await prepare(page, [])
    await page.goto(HTML.as_uri() + f"?lang={lang}", wait_until="domcontentloaded")
    await page.wait_for_timeout(400)

    seen = {}

    def collect(pairs):
        for key, text in pairs:
            seen.setdefault(key, set()).add(text)

    collect(await page.evaluate(COLLECT, ""))
    slides = []
    n = await page.evaluate('document.querySelectorAll(".slide").length')
    for i in range(n):
        await page.evaluate(f'location.hash="#s{i + 1}"')
        await page.wait_for_timeout(15)
        title = await page.evaluate(
            "(document.querySelector('.slide.active h1, .slide.active h2') || {}).textContent || ''")
        collect(await page.evaluate(COLLECT, ".slide.active"))
        for j in range(min(await page.evaluate(COUNT), max_clicks)):
            await page.evaluate(CLICK, j)
            await page.wait_for_timeout(8)
            collect(await page.evaluate(COLLECT, ".slide.active"))
        slides.append(title.strip())
    if lang != 'sv':
        missing = await page.evaluate('L.missing')
        ident = identity_values()
        source_values, target_values = set(load_catalog('sv').values()), set(load_catalog(lang).values())
        # German shares umlauts with Swedish: letter heuristics alone are invalid.
        suspicious = [value for value in missing if value not in ident and
                      (swedish(value) if lang == 'en' else value in source_values and value not in target_values)]
        check(not suspicious, f'no unresolved Swedish runtime lookups in {lang} ({suspicious[:5]})')
        print(f'{lang} lookup diagnostics: {len(missing)} unresolved literal/key calls')
    await page.close()
    return seen, slides, errors


async def main():
    if not HTML.is_file():
        print(f"FAIL missing build: {HTML}")
        return 1
    catalogs = {locale: load_catalog(locale) for locale in LOCALES}
    sv_cat, ident = catalogs['sv'], identity_values()
    for locale in LOCALES[1:]:
        coverage(sv_cat, catalogs[locale], locale)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        sv_seen, sv_slides, errors = await render_pass(browser, 'sv')
        check(not errors, f'no JS errors in sv ({errors[:3]})')
        for locale in LOCALES[1:]:
            target_seen, target_slides, errors = await render_pass(browser, locale)
            check(not errors, f'no JS errors in {locale} ({errors[:3]})')
            same_titles = [i + 1 for i, (source, target) in enumerate(zip(sv_slides, target_slides))
                           if source == target and swedish(source)]
            check(not same_titles, f'{locale} slide titles translated ({same_titles[:5]})')
            leftovers = []
            for key, source_texts in sv_seen.items():
                for text in target_seen.get(key, set()):
                    if not text.strip() or text not in source_texts or key == 'doc.title':
                        continue
                    if text in ident or sv_cat.get(key) in ident:
                        continue
                    if swedish(text):
                        leftovers.append((key, text))
            leftovers = sorted(set(leftovers))
            check(not leftovers, f'no Swedish left in {locale} ({len(leftovers)} strings)')
            for key, text in leftovers[:30]:
                print('   ', key, '|', repr(text[:100]))

        for index, locale in enumerate(LOCALES):
            page = await browser.new_page(viewport={'width': 1440, 'height': 900})
            await prepare(page, [])
            await page.goto(HTML.as_uri() + f'?lang={locale}#s12', wait_until='domcontentloaded')
            await page.wait_for_timeout(200)
            check(await page.evaluate('document.documentElement.lang') == locale, f'html lang is {locale}')
            check(await page.title() == catalogs[locale]['doc.title'], f'document title localized in {locale}')
            check(await page.locator('meta[name=description]').get_attribute('content') == catalogs[locale]['doc.description'],
                  f'description localized in {locale}')
            buttons = await page.evaluate("[...document.querySelectorAll('#langsw .lg')].map(b=>[b.textContent,b.getAttribute('aria-pressed')])")
            check([b[0] for b in buttons] == [code.upper() for code in LOCALES], f'language switch order ({locale}: {buttons})')
            check(any(b == [locale.upper(), 'true'] for b in buttons), f'{locale} marked active')
            check(await page.locator('#glossbtn').inner_text() == catalogs[locale]['p1.topbar.2'], f'glossary button localized in {locale}')
            if locale == 'de':
                check(await page.evaluate('L.num(1234.5,1)') == '1.234,5', 'German numbers use decimal comma and grouping')
            await page.locator('#glossbtn').click()
            result = await page.evaluate(GLOSSARY_SORTED)
            check(result['n'] > 50 and not result['wrong'], f'glossary alphabetical in {locale}: {result}')
            await page.keyboard.press('Escape')
            target = LOCALES[(index + 1) % len(LOCALES)]
            await page.locator('#langsw .lg').nth(LOCALES.index(target)).click()
            await page.wait_for_function('lang => document.documentElement.lang === lang', arg=target)
            check(await page.evaluate('location.hash') == '#s12', f'{locale} -> {target} keeps hash')
            check(await page.evaluate("localStorage.getItem('llm-kurs-lang')") == target, f'{target} choice persisted')
            await page.close()

        # Real browser locale, saved choice, and URL precedence (no query means auto-detect).
        for browser_locale, expected in [('de-DE', 'de'), ('de-AT', 'de'), ('sv-SE', 'sv'), ('fr-FR', 'en')]:
            context = await browser.new_context(locale=browser_locale)
            page = await context.new_page()
            await prepare(page, [])
            await page.goto(HTML.as_uri(), wait_until='domcontentloaded')
            check(await page.evaluate('L.lang') == expected, f'{browser_locale} browser selects {expected}')
            await context.close()
        context = await browser.new_context(locale='de-DE')
        await context.add_init_script("localStorage.setItem('llm-kurs-lang','en')")
        page = await context.new_page()
        await prepare(page, [])
        await page.goto(HTML.as_uri(), wait_until='domcontentloaded')
        check(await page.evaluate('L.lang') == 'en', 'saved English overrides German browser')
        await page.goto(HTML.as_uri() + '?lang=sv', wait_until='domcontentloaded')
        check(await page.evaluate('L.lang') == 'sv', 'URL overrides saved choice and German browser')
        await context.close()
        await browser.close()

    print(f"\n{'FAILED' if failures else 'PASSED'}: {len(failures)} failures; languages {', '.join(LOCALES)}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
