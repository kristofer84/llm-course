"""Shared helpers for the Playwright checks.

All paths are resolved relative to this file, so the scripts can be run from
any working directory:

    python3 tests/smoke.py
    COURSE_HTML=/tmp/other.html python3 tests/smoke.py

COURSE_HTML overrides the built file (default: <repo>/llm-kurs.html),
COURSE_SHOTS overrides where screenshots are written (default: <repo>/shots).
"""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML = Path(os.environ.get("COURSE_HTML") or ROOT / "llm-kurs.html").resolve()
SHOTS = Path(os.environ.get("COURSE_SHOTS") or ROOT / "shots").resolve()
URL = HTML.as_uri() + "?lang=sv"          # tests assert Swedish content
URL_EN = HTML.as_uri() + "?lang=en"
CATALOG_ROOT = ROOT / 'src/i18n'
EXTRA_LOCALES = sorted(p.name for p in CATALOG_ROOT.iterdir()
                       if p.is_dir() and p.name not in ('sv', 'en', 'edit', 'source') and not p.name.startswith('.'))
LOCALES = ('sv', 'en', *EXTRA_LOCALES)

# Errors that come from the deliberately blocked Google Fonts request.
IGNORED = ("ERR_FAILED", "Failed to load resource", "net::ERR_ABORTED")


def shots_dir() -> Path:
    SHOTS.mkdir(parents=True, exist_ok=True)
    return SHOTS


def shot(name: str) -> str:
    """Absolute path for a screenshot file."""
    return str(shots_dir() / name)


async def prepare(page, errors=None):
    """Block external fonts and record JS/console errors on `page`."""
    await page.route("**/fonts.googleapis.com/**", lambda r: r.abort())
    if errors is None:
        errors = []
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.on(
        "console",
        lambda m: errors.append("console: " + m.text)
        if m.type == "error" and not any(s in m.text for s in IGNORED)
        else None,
    )
    return errors
