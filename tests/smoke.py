"""Smoke test for the built course. Exits non-zero on the first failed check.

    python3 tests/smoke.py            # checks <repo>/llm-kurs.html
    COURSE_HTML=... python3 tests/smoke.py

Checks: file exists, slide count, JS errors, horizontal overflow on desktop and
mobile, that every interactive control exists, and that a quiz answers.
"""
import asyncio
import sys

from playwright.async_api import async_playwright

from _common import HTML, URL, prepare

MIN_SLIDES = 100
MIN_BYTES = 100_000

# Interactive controls clicked by tests/test.py (one per visualisation).
INTERACTIVE = [
    "bpe-next", "res-next", "kv-next", "pg-new", "pg-step", "pg-fin",
    "cb-cont", "sd-next", "fl-next", "tr-next", "tr-decode", "smp-draw",
    "ab-abl", "att-soft", "mm-step", "ah-next", "nl-lin", "wa-moe", "mv-rand",
    "mm-tbl", "mm-seq", "ah-tbl", "cp-tbl",
]

failures = []


def check(ok, msg):
    print(("ok   " if ok else "FAIL ") + msg)
    if not ok:
        failures.append(msg)


async def main():
    if not HTML.is_file():
        print(f"FAIL built file missing: {HTML}\nRun: (cd src && python3 build.py)")
        return 1
    check(HTML.stat().st_size > MIN_BYTES, f"{HTML.name} is {HTML.stat().st_size} bytes")

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        errors = await prepare(page, [])
        await page.goto(URL,wait_until="domcontentloaded")
        await page.wait_for_timeout(400)

        titles = await page.evaluate(
            '[...document.querySelectorAll(".slide")].map(s => s.dataset.title)'
        )
        n = len(titles)
        check(n >= MIN_SLIDES, f"{n} slides (>= {MIN_SLIDES})")
        check(all(titles), "every slide has data-title")

        missing = await page.evaluate(
            "ids => ids.filter(id => !document.getElementById(id))", INTERACTIVE
        )
        check(not missing, f"interactive elements present (missing: {missing})")

        # Walk every slide: it must become active and stay inside the viewport.
        bad_hash, overflow = [], []
        for i in range(n):
            await page.evaluate(f'location.hash="#s{i + 1}"')
            await page.wait_for_timeout(40)
            active = await page.evaluate(
                'document.querySelector(".slide.active")?.dataset.title'
            )
            if active != titles[i]:
                bad_hash.append(f"{i + 1}:{active}")
            w = await page.evaluate("document.documentElement.scrollWidth")
            if w > 1441:
                overflow.append(f"s{i + 1}({titles[i]})={w}")
        check(not bad_hash, f"#sN navigation reaches the right slide {bad_hash[:5]}")
        check(not overflow, f"no horizontal overflow at 1440px {overflow[:5]}")

        # Quiz: answering the first option must register a score.
        await page.evaluate('location.hash="#s1"')
        clicked = await page.evaluate(
            '(() => { const o = document.querySelector(".quiz .opt"); '
            'if (!o) return false; o.click(); return true; })()'
        )
        score = await page.evaluate(
            'document.querySelector(".qscore")?.innerText || ""'
        )
        check(clicked and bool(score), f"quiz answers register (score: {score!r})")

        # Level filter.
        lvl = await page.evaluate('document.getElementById("lvl")?.textContent || ""')
        check(bool(lvl), f"level indicator renders ({lvl!r})")
        check(not errors, f"no JS errors on desktop ({errors[:3]})")

        # Mobile: nothing may overflow 390px.
        mobile = await browser.new_page(viewport={"width": 390, "height": 844})
        merrors = await prepare(mobile, [])
        wide = []
        for i in range(n):
            await mobile.goto(f"{URL}#s{i + 1}",wait_until="domcontentloaded")
            await mobile.wait_for_timeout(30)
            w = await mobile.evaluate("document.documentElement.scrollWidth")
            if w > 391:
                wide.append(f"s{i + 1}({titles[i]})={w}")
        check(not wide, f"no horizontal overflow at 390px {wide[:5]}")
        bar = await mobile.evaluate(
            """() => { const t = document.querySelector('.topbar');
                 return { over: t.scrollWidth - t.clientWidth,
                          lang: [...document.querySelectorAll('#langsw .lg')].length }; }"""
        )
        check(bar["over"] <= 0, f"top bar fits at 390px (overflow {bar['over']}px)")
        check(bar["lang"] >= 2, f"language switch present on mobile ({bar['lang']} buttons)")
        check(not merrors, f"no JS errors on mobile ({merrors[:3]})")

        await browser.close()

    print(f"\n{'FAILED' if failures else 'PASSED'}: {len(failures)} failure(s)")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
