"""Acceptance test for the dual-language build.

    python3 tests/i18n.py            # build first: (cd src && python3 build.py)

Checks that
  1. every Swedish key has an English translation (static, from the catalogs),
  2. the language switch exists and reflects the active language,
  3. <html lang>, <title> and the top bar follow the selected language,
  4. English mode shows no Swedish — neither on load nor after clicking the
     interactive parts of every slide,
  5. switching language keeps the slide and remembers the choice.

Point 4 is a rendering diff per key: the same key is collected in both
languages, and if the English text is identical to the Swedish one *and* looks
Swedish, the translation is missing. Values listed as identity data in
``src/i18n/en/data.json`` (sample tokens like ``katt``) are identical on
purpose and are accepted.
"""
import asyncio
import json
import re
import sys
from pathlib import Path

from playwright.async_api import async_playwright

from _common import HTML, prepare

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


def coverage(sv, en):
    missing = sorted(k for k in sv if k not in en or not str(en[k]).strip())
    check(not missing, f"English catalog covers {len(sv)} keys"
          + (f" — missing {len(missing)}: {missing[:3]}" if missing else ""))


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
  '.slide.active button, .slide.active input[type=range], .slide.active input[type=checkbox], ' +
  '.slide.active select, .slide.active summary'
).length
"""

CLICK = r"""
(j) => {
  const sel = '.slide.active button, .slide.active input[type=range], ' +
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
    await page.close()
    return seen, slides, errors


async def main():
    if not HTML.is_file():
        print(f"FAIL missing build: {HTML}")
        return 1
    sv_cat, en_cat = load_catalog("sv"), load_catalog("en")
    coverage(sv_cat, en_cat)
    ident = identity_values()

    async with async_playwright() as p:
        browser = await p.chromium.launch()

        sv_seen, sv_slides, _ = await render_pass(browser, "sv")
        en_seen, en_slides, errors = await render_pass(browser, "en")
        check(not errors, f"no JS errors in English mode ({errors[:3]})")

        # Slide titles must change with the language.
        same_titles = [i + 1 for i, (st, et) in enumerate(zip(sv_slides, en_slides))
                       if st == et and swedish(st)]
        check(not same_titles, f"slide titles translated (still Swedish: {same_titles[:5]})")

        # Per key: English must not be the Swedish text, unless it is data.
        leftovers = []
        for key, sv_texts in sv_seen.items():
            if key not in en_seen:
                continue
            for text in sorted(en_seen[key]):
                if not text.strip() or text not in sv_texts:
                    continue
                if key in ("doc.title",):
                    continue
                if text in ident or sv_cat.get(key) in ident:
                    continue
                if swedish(text):
                    leftovers.append((key, text))
        leftovers = sorted(set(leftovers))
        check(not leftovers, f"no Swedish left in English mode ({len(leftovers)} string(s))")
        for key, text in leftovers[:40]:
            print("   ", key, "|", repr(text[:90]))

        # Switch UI + document metadata, on a fresh page.
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        await prepare(page, [])
        await page.goto(HTML.as_uri() + "?lang=en", wait_until="domcontentloaded")
        await page.wait_for_timeout(400)
        check(await page.evaluate("document.documentElement.lang") == "en", "html lang is en")
        check("Inuti en LLM" not in await page.title(), f"document title translated ({await page.title()!r})")
        buttons = await page.evaluate(
            "[...document.querySelectorAll('#langsw .lg')].map(b => [b.textContent, b.getAttribute('aria-pressed')])")
        check([b[0] for b in buttons] == ["SV", "EN"], f"language switch rendered ({buttons})")
        check(any(b == ["EN", "true"] for b in buttons), "EN marked active")
        bars = await page.evaluate(
            "[...document.querySelectorAll('.topbar button, .botbar button')].map(b => b.textContent)")
        check("Contents" in bars and "Next" in bars, f"top/bottom bar translated ({bars})")

        # Switching language keeps the slide and stores the choice.
        await page.goto(HTML.as_uri() + "?lang=en#s12", wait_until="domcontentloaded")
        await page.wait_for_timeout(300)
        await page.click("#langsw .lg:nth-child(1)")
        await page.wait_for_timeout(500)
        check(await page.evaluate("document.documentElement.lang") == "sv", "switch reloads into Swedish")
        check(await page.evaluate("document.querySelector('.slide.active').id || location.hash") in ("", "#s12"),
              f"switch keeps the slide ({await page.evaluate('location.hash')})")
        check("sv" in await page.evaluate("localStorage.getItem('llm-kurs-lang') || ''"), "language choice persisted")

        sv = await browser.new_page(viewport={"width": 1440, "height": 900})
        await prepare(sv, [])
        await sv.goto(HTML.as_uri() + "?lang=sv", wait_until="domcontentloaded")
        await sv.wait_for_timeout(400)
        check("Inuti en LLM" in await sv.title(), "Swedish document title intact")
        await browser.close()

    print(f"\n{'FAILED' if failures else 'PASSED'}: {len(failures)} failure(s), {len(en_cat)} translations")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
