#!/usr/bin/env python3
"""Extract translatable strings from the built course into translator work files.

Swedish source strings are the message ids, so extraction never touches the
sources. Run from anywhere:

    python3 tools/extract_i18n.py            # uses ../llm-kurs.html
    COURSE_HTML=... python3 tools/extract_i18n.py

Outputs (all generated, safe to delete):
    src/i18n/source.json              full inventory with context per string
    src/i18n/source/<group>.json      [{k, slide, tag, code}] work file per group
    src/i18n/source/<group>.keys.json flat key list for tools/check_i18n.py
"""
import asyncio
import json
import os
import re
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
HTML = Path(os.environ.get("COURSE_HTML") or ROOT / "llm-kurs.html").resolve()
OUT = ROOT / "src" / "i18n" / "source"

JS = r"""
() => {
  const LETTER = /[A-Za-zÅÄÖåäöÆæØø]/;
  const out = [];
  L.collect(document.body).forEach(u => out.push(u));
  ['aria-label','placeholder','alt','title'].forEach(a => {
    document.querySelectorAll('[' + a + ']').forEach(el => {
      const s = L.norm(el.getAttribute(a));
      if (!LETTER.test(s)) return;
      const sl = el.closest('.slide');
      out.push({tag: el.tagName.toLowerCase(), html: s, text: s,
        mod: sl ? (sl.dataset.mod || '') : '', slide: sl ? (sl.dataset.title || '') : '',
        cls: '[' + a + ']'});
    });
  });
  const meta = document.querySelector('meta[name="description"]');
  if (meta) out.push({tag: 'meta', html: L.norm(meta.getAttribute('content')), text: '', mod: '', slide: '', cls: '[description]'});
  const t = L.norm(document.title);
  if (t) out.push({tag: 'title', html: t, text: t, mod: '', slide: '', cls: '[title]'});
  return out;
}
"""

CHROME = "chrome"


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        await page.route("**/fonts.googleapis.com/**", lambda r: r.abort())
        await page.goto(HTML.as_uri() + "?lang=sv")
        await page.wait_for_timeout(500)
        rows = await page.evaluate(JS)
        # Slides render parts of themselves lazily (the course map, for one), so
        # walk the deck and add whatever appears.
        n = await page.evaluate('document.querySelectorAll(".slide").length')
        for i in range(n):
            await page.evaluate(f'location.hash="#s{i + 1}"')
            await page.wait_for_timeout(15)
            rows += await page.evaluate(JS)
        await browser.close()

    # Assign every unique string to exactly one group (the first that shows it).
    groups, inventory, seen = {}, {}, set()
    for r in rows:
        key = r["html"]
        if not key or key.startswith("{{"):
            continue
        code = bool(re.search(r"\n", key)) or r["tag"] == "pre"
        inventory.setdefault(key, {"k": key, "groups": [], "slides": [], "tags": [], "count": 0, "code": code})
        inv = inventory[key]
        inv["count"] += 1
        if r["slide"] and r["slide"] not in inv["slides"]:
            inv["slides"].append(r["slide"])
        if r["tag"] not in inv["tags"]:
            inv["tags"].append(r["tag"])
        if key in seen:
            continue
        seen.add(key)
        g = "m" + str(r["mod"]) if r["mod"] not in ("", None) else CHROME
        inv["groups"].append(g)
        groups.setdefault(g, []).append(
            {"k": key, "slide": r["slide"], "tag": r["tag"], "cls": r["cls"], "code": code}
        )

    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.json"):
        old.unlink()
    order = sorted(groups, key=lambda g: (g == CHROME, int(g[1:]) if g != CHROME else 0))
    for g in order:
        items = sorted(groups[g], key=lambda x: (x["slide"], x["tag"]))
        (OUT / f"{g}.json").write_text(json.dumps(items, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        (OUT / f"{g}.keys.json").write_text(json.dumps([i["k"] for i in items], ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    src = {"groups": {g: len(groups[g]) for g in order},
           "total": len(inventory),
           "strings": sorted(inventory.values(), key=lambda x: -x["count"])}
    (ROOT / "src" / "i18n" / "source.json").write_text(json.dumps(src, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    print(f"{len(inventory)} unique strings, {sum(len(v) for v in groups.values())} grouped")
    for g in order:
        words = sum(len(i["k"].split()) for i in groups[g])
        print(f"  {g:8s} {len(groups[g]):4d} strings {words:5d} words")


if __name__ == "__main__":
    asyncio.run(main())
