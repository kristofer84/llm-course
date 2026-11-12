"""Keyboard regression checks for the selectable diagrams and tensor tracer.

Build first, then run: python3 tests/accessibility.py
COURSE_HTML may point to another built artifact. One browser/page at a time;
no synthetic click() or dispatched keyboard events are used for activation.
"""
import asyncio
import json
import sys

from playwright.async_api import async_playwright, expect

from _common import HTML, ROOT, LOCALES, prepare

# Stable DOM IDs, never slide indexes: integrated lessons may move in the deck.
TARGETS = [
    ("att-svg", "att-out", 7),
    ("pv-svg", "pv-out", 8),
    ("tr-list", "tr-detail", 19),
    ("mv-svg", "mv-out", 6),
    ("ly-svg", "ly-info", 15),
    ("am-svg", "am-out", 6),
    ("lb-svg", "lb-detail", 6),
]


def catalog(lang):
    result = {}
    for path in (ROOT / "src" / "i18n" / lang).glob("*.json"):
        result.update(json.loads(path.read_text(encoding="utf-8")))
    return result


def translated(cat, key, **values):
    text = cat[key]
    for name, value in values.items():
        text = text.replace("{{" + name + "}}", str(value))
    return text


async def show_target(page, root_id):
    await page.evaluate(
        """id => {
          const host = document.getElementById(id).closest('.slide');
          const slides = [...document.querySelectorAll('.slide')];
          location.hash = '#s' + (slides.indexOf(host) + 1);
        }""",
        root_id,
    )
    root = page.locator(f".slide.active #{root_id}")
    await expect(root).to_be_visible()
    return root


async def check_target(page, lang, cat, root_id, output_id, count):
    root = await show_target(page, root_id)
    controls = root.locator('[data-a11y-control]')
    await expect(controls).to_have_count(count)
    identities = await controls.evaluate_all(
        "els => els.map(el => el.dataset.a11yControl)"
    )
    assert len(set(identities)) == count, (lang, root_id, "duplicate identity")
    assert await root.locator('[tabindex="0"]').count() == count, (
        lang, root_id, "overlapping or missing tab stops"
    )
    assert await controls.evaluate_all(
        """els => els.every(el => el.getAttribute('role') === 'button'
          && el.getAttribute('aria-label')?.trim()
          && /^(true|false)$/.test(el.getAttribute('aria-pressed')))"""
    ), (lang, root_id, "unnamed, nonactionable or stateless control")
    if root_id.endswith("-svg"):
        await expect(root).to_have_attribute("role", "group")
        assert await root.get_attribute("aria-label"), (lang, root_id, "unnamed group")
        # The accessibility tree must expose descendants, not an atomic image.
        tree = await root.aria_snapshot()
        assert "button " in tree, (lang, root_id, tree)

    states = await controls.evaluate_all(
        "els => els.map(el => el.getAttribute('aria-pressed'))"
    )
    assert states.count("true") == 1, (lang, root_id, states)
    # Focus a predecessor and really Tab onto an unselected control. Choose one
    # with a successor so the second activation also exercises real tab order.
    index = next(i for i in range(1, count - 1) if states[i] == "false")
    await controls.nth(index - 1).focus()
    await page.keyboard.press("Tab")
    current = controls.nth(index)
    await expect(current).to_be_focused()

    slide_hash = await page.evaluate("location.hash")
    for key, selected_index in (("Enter", index), ("Space", index + 1)):
        if key == "Space":
            await page.keyboard.press("Tab")
        current = root.locator(f'[data-a11y-control="{identities[selected_index]}"]')
        await expect(current).to_be_focused()
        await expect(current).to_have_attribute("aria-pressed", "false")
        label = await current.get_attribute("aria-label")
        # Reuse course translations, and explicitly check the two new labels
        # in both languages (the Swedish example token data stays unchanged).
        if root_id in ("att-svg", "pv-svg", "am-svg"):
            scene = await page.evaluate('window.COURSE_EXAMPLE.scene')
            tokens = scene['attention'] if root_id == 'att-svg' else scene['tokens'] if root_id == 'pv-svg' else scene['context']
            assert label == translated(
                cat, "a11y.query", n=selected_index + 1, token=tokens[selected_index]
            ), (lang, root_id, label)
        elif root_id == "mv-svg":
            assert label == translated(cat, "a11y.output", index=selected_index)
        elif root_id == "tr-list":
            assert label == await current.text_content()
        elif root_id == "lb-svg":
            title_key = ["j6.53", "j6.54", "j6.55", "j6.58", "j6.62", "j6.55"][selected_index]
            assert label == f"{selected_index + 1}. {cat[title_key]}"

        output = page.locator(f"#{output_id}")
        before = await output.text_content()
        old_node = await current.element_handle()
        await page.keyboard.press(key)
        # Re-query by stable identity after the synchronous redraw. The old
        # node must be detached, but focus must be on its replacement now.
        assert not await old_node.evaluate("el => el.isConnected")
        await expect(current).to_be_focused()
        await expect(current).to_have_attribute("aria-pressed", "true")
        assert await output.text_content() != before, (lang, root_id, key, "unchanged output")
        assert await root.locator('[aria-pressed="true"]').count() == 1
        assert await page.evaluate("location.hash") == slide_hash, (
            lang, root_id, key, "deck shortcut stole activation"
        )
        await expect(root).to_be_visible()
        # Role queries and the tree both continue to expose the new control.
        await expect(root.get_by_role("button", name=label, exact=True)).to_be_focused()
        assert label in await root.aria_snapshot()
        await old_node.dispose()
    print(f"ok   {lang} {root_id}: Tab, Enter, Space, state, output, tree and retained focus")


async def main():
    if not HTML.is_file():
        print(f"FAIL built file missing: {HTML}; run (cd src && python3 build.py)")
        return 1
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        try:
            for lang in LOCALES:
                page = await browser.new_page(viewport={"width": 1440, "height": 1000})
                try:
                    errors = await prepare(page, [])
                    await page.goto(HTML.as_uri() + f"?lang={lang}", wait_until="domcontentloaded")
                    await expect(page.locator("html")).to_have_attribute("lang", lang)
                    cat = catalog(lang)
                    scene = await page.evaluate('window.COURSE_EXAMPLE.scene')
                    counts = {'att-svg': len(scene['attention']), 'pv-svg': len(scene['tokens']), 'am-svg': len(scene['context'])}
                    for root_id, output_id, count in TARGETS:
                        await check_target(page, lang, cat, root_id, output_id, counts.get(root_id, count))
                    assert not errors, (lang, errors)
                finally:
                    await page.close()
        finally:
            await browser.close()
    print("PASSED: keyboard accessibility in " + ", ".join(LOCALES) + " (one browser worker)")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
