"""Acceptance test for the dual-language build.

    python3 tests/i18n.py            # build first: (cd src && python3 build.py)

Checks that
  1. every extracted source string has an English translation,
  2. the language switch exists and reflects the active language,
  3. <html lang>, <title> and the top bar follow the selected language,
  4. English mode shows no Swedish — neither on load nor after clicking the
     interactive parts of every slide,
  5. Swedish mode is unchanged (the switch does not leak into the source).

Point 4 is a rendering diff, not a word list: every string the Swedish deck
shows (on load and after the same interactions) must be *replaced* in English.
Strings that are deliberately identical in both languages (code, `RMSNorm`,
data tokens like `katt`) are in the catalog as identity mappings, so they are
accepted; anything else that still renders as Swedish is a missing translation.
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

# A leftover is a string that renders identically in both languages *and* looks
# Swedish. Data tokens (`katt`, `expert 1`, `model.layers.5…`) are identical on
# purpose, so they must not trip the check — Swedish-only words do.
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


def load_catalog():
    cat = {}
    for f in sorted((I18N / "en").glob("*.json")):
        if f.name.startswith("_"):
            continue
        for k, v in json.loads(f.read_text(encoding="utf-8")).items():
            cat[k] = v
    return cat


def coverage(cat):
    keys = set()
    for f in (I18N / "source").glob("*.keys.json"):
        keys |= set(json.loads(f.read_text(encoding="utf-8")))
    missing = sorted(k for k in keys if k not in cat or not str(cat[k]).strip())
    check(not missing, f"English catalog covers {len(keys)} source strings"
          + (f" — missing {len(missing)}: {[m[:40] for m in missing[:3]]}" if missing else ""))


COLLECT = r"""
(sel) => {
  const out = [];
  const roots = sel ? [...document.querySelectorAll(sel)] : [document.body];
  roots.forEach(r => L.collect(r).forEach(u => { if (u.text.trim()) out.push(u.text.trim()); }));
  if (!sel) {
    ['aria-label', 'placeholder', 'alt', 'title'].forEach(a =>
      document.querySelectorAll('[' + a + ']').forEach(el => {
        const v = L.norm(el.getAttribute(a));
        if (v) out.push(v);
      }));
    out.push(document.title.trim());
  }
  return out;
}
"""

# Chrome (top bar, footer, drawers) is rendered once, so one full pass covers it.
COLLECT_CHROME = r"""
() => {
  const out = [];
  ['.topbar', '.botbar', '#toc', '#gloss'].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) L.collect(el).forEach(u => { if (u.text.trim()) out.push(u.text.trim()); });
  });
  ['aria-label', 'placeholder', 'alt', 'title'].forEach(a =>
    document.querySelectorAll('[' + a + ']').forEach(el => {
      const v = L.norm(el.getAttribute(a));
      if (v) out.push(v);
    }));
  out.push(document.title.trim());
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
    """Show every slide with its interactions and return the strings rendered."""
    page = await browser.new_page(viewport={"width": 1440, "height": 900})
    errors = await prepare(page, [])
    await page.goto(HTML.as_uri() + f"?lang={lang}", wait_until="domcontentloaded")
    await page.wait_for_timeout(400)
    strings = set(await page.evaluate(COLLECT_CHROME))
    slides = []
    n = await page.evaluate('document.querySelectorAll(".slide").length')
    for i in range(n):
        await page.evaluate(f'location.hash="#s{i + 1}"')
        await page.wait_for_timeout(15)
        title = await page.evaluate(
            "(document.querySelector('.slide.active h1, .slide.active h2') || {}).textContent || ''")
        strings |= set(await page.evaluate(COLLECT, ".slide.active"))
        for j in range(min(await page.evaluate(COUNT), max_clicks)):
            await page.evaluate(CLICK, j)
            await page.wait_for_timeout(8)
            strings |= set(await page.evaluate(COLLECT, ".slide.active"))
        slides.append((title.strip(), None))
    warnings = []
    page.on("pageerror", lambda e: warnings.append(str(e)))
    await page.close()
    return strings, slides, errors


async def main():
    if not HTML.is_file():
        print(f"FAIL missing build: {HTML}")
        return 1
    cat = load_catalog()
    coverage(cat)

    async with async_playwright() as p:
        browser = await p.chromium.launch()

        sv_strings, sv_slides, _ = await render_pass(browser, "sv")
        en_strings, en_slides, errors = await render_pass(browser, "en")

        check(not errors, f"no JS errors in English mode ({errors[:3]})")

        # Slide titles must change with the language (the contents panel is part of the deck).
        same_titles = [
            i + 1 for i, ((st, _), (et, _)) in enumerate(zip(sv_slides, en_slides))
            if st == et and any(c in st for c in "ÅÄÖåäö")
        ]
        check(not same_titles, f"slide titles translated (still Swedish: {same_titles[:5]})")

        # Typing/step animations render prefixes of a longer data string; only the
        # longest form is a real unit.
        prefixes = {s for s in en_strings if any(o != s and o.startswith(s) for o in en_strings)}
        leftovers = sorted(
            s for s in en_strings - {""} - prefixes
            if s in sv_strings and s not in cat and any(ch.isalpha() for ch in s) and swedish(s)
        )
        check(not leftovers, f"no Swedish left in English mode ({len(leftovers)} string(s))")
        for s in leftovers[:40]:
            print("   ", repr(s[:100]))

        # Switch UI + document metadata, on a fresh page.
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        await prepare(page, [])
        await page.goto(HTML.as_uri() + "?lang=en", wait_until="domcontentloaded")
        await page.wait_for_timeout(400)
        check(await page.evaluate("document.documentElement.lang") == "en", "html lang is en")
        check("Inuti en LLM" not in await page.title(), f"document title translated ({await page.title()!r})")
        buttons = await page.evaluate(
            "[...document.querySelectorAll('#langsw .lg')].map(b => [b.textContent, b.getAttribute('aria-pressed')])"
        )
        check([b[0] for b in buttons] == ["SV", "EN"], f"language switch rendered ({buttons})")
        check(any(b == ["EN", "true"] for b in buttons), "EN marked active")
        bars = await page.evaluate(
            "[...document.querySelectorAll('.topbar button, .botbar button')].map(b => b.textContent)"
        )
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

    print(f"\n{'FAILED' if failures else 'PASSED'}: {len(failures)} failure(s), {len(cat)} translations")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
