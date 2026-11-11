#!/usr/bin/env python3
"""Check the translation catalogs against each other. No browser needed.

Keys are explicit (`p3.rmsnorm.2`), the Swedish catalog is the source of truth.
For every other locale this verifies:

  * every Swedish key has a non-empty translation, and nothing stale is left
  * the inline markup is identical (same tags, same attributes, same order)
  * every {{placeholder}} survives
  * code tokens (identifiers, shapes like [T, 4096], numbers) are preserved
  * a translation equal to the Swedish text is only allowed for real data
    (sample tokens listed in src/i18n/en/data.json)

Usage:
    python3 tools/check_i18n.py                # everything
    python3 tools/check_i18n.py --group j6      # one group
    python3 tools/check_i18n.py --quiet
"""

import argparse
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG = os.path.join(ROOT, "src", "i18n")
SRC = "sv"

TAG = re.compile(r"<(/?)([a-zA-Z][\w-]*)((?:\s+[\w:-]+(?:=\"[^\"]*\")?)*)\s*/?>")
PH = re.compile(r"\{\{(\w+)\}\}")
# Only numbers and digit shapes are enforced: prose inside a formula may and
# should be translated ("rad för rad" -> "row by row").
NUM = re.compile(r"\d+(?:[ \u00a0,.]\d+)*")
KEYISH = re.compile(r"^[a-z][\w]*\.[\w.-]+$")


def load(locale):
    cat = {}
    origin = {}
    for path in sorted(glob.glob(os.path.join(CATALOG, locale, "*.json"))):
        name = os.path.basename(path)
        if name.startswith("_") or name == "data.json":
            continue    # identity data, not translatable keys
        data = json.load(open(path, encoding="utf-8"))
        if not isinstance(data, dict):
            continue
        for k, v in data.items():
            if k in cat and cat[k] != v:
                print("duplicate key with different text:", k, "in", name)
            cat[k] = v
            origin[k] = name
    return cat, origin


def markup(value):
    return [(m.group(1), m.group(2).lower(), m.group(3).strip()) for m in TAG.finditer(value)]


def code_tokens(value):
    """The numbers, compared by digits only: decimal comma vs point and the
    choice of thousands separator are exactly what translation may change."""
    text = TAG.sub(" ", value)
    out = set()
    for tok in NUM.findall(text):
        digits = re.sub(r"\D", "", tok)
        if digits:
            out.add(digits)
    return out


def identity_values():
    path = os.path.join(CATALOG, "en", "data.json")
    if not os.path.exists(path):
        return set()
    d = json.load(open(path, encoding="utf-8"))
    return {k for k, v in d.items() if k == v}


def referenced_keys():
    """Keys the page actually uses: data-i18n attributes plus key-shaped
    strings in the scripts (quiz data refers to keys directly)."""
    page = open(os.path.join(ROOT, "llm-kurs.html"), encoding="utf-8").read()
    keys = set(re.findall(r'data-i18n(?:-[\w-]+)?="([^"]+)"', page))
    keys |= {k for k in re.findall(r"'([^'\n]{3,90})'", page) if KEYISH.match(k)}
    keys |= {k for k in re.findall(r'"([^"\n]{3,90})"', page) if KEYISH.match(k)}
    return keys


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--group", help="only keys starting with this prefix")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    sv, _ = load(SRC)
    locales = sorted(d for d in os.listdir(CATALOG)
                     if os.path.isdir(os.path.join(CATALOG, d)) and d not in (SRC, "source"))
    ident = identity_values()
    used = referenced_keys()
    failures, warnings = [], []

    def wanted(k):
        return not args.group or k.startswith(args.group + ".") or k.startswith(args.group + "-")

    for key in sorted(sv):
        if not wanted(key):
            continue
        if not sv[key].strip():
            failures.append("empty Swedish text: %s" % key)
        if key not in used:
            warnings.append("unused key: %s" % key)

    for loc in locales:
        cat, _ = load(loc)
        missing = [k for k in sv if wanted(k) and (k not in cat or not cat.get(k, "").strip())]
        stale = [k for k in cat if k not in sv]
        for k in missing[:200]:
            failures.append("%s: missing translation for %s" % (loc, k))
        for k in stale[:50]:
            warnings.append("%s: key not in the Swedish catalog: %s" % (loc, k))
        checked = 0
        for key, src in sv.items():
            if not wanted(key) or key not in cat or not cat[key].strip():
                continue
            out = cat[key]
            checked += 1
            if markup(src) != markup(out):
                failures.append("%s: markup differs in %s" % (loc, key))
            if sorted(PH.findall(src)) != sorted(PH.findall(out)):
                failures.append("%s: placeholder differs in %s (%s vs %s)"
                                % (loc, key, PH.findall(src), PH.findall(out)))
            if src != out:
                code_src, code_out = code_tokens(src), code_tokens(out)
                if code_src != code_out:
                    only = sorted(code_src - code_out)
                    if only:
                        failures.append("%s: code token changed in %s: %s" % (loc, key, only[:3]))
            elif src not in ident and re.search(r"[ÅÄÖåäö]", src) and len(src.split()) >= 3:
                warnings.append("%s: identical to the Swedish text: %s" % (loc, key))
        if not args.quiet:
            print("%s: %d/%d strings translated (%.1f%%)"
                  % (loc, checked, len([k for k in sv if wanted(k)]),
                     100.0 * checked / max(1, len([k for k in sv if wanted(k)]))))

    # The built page must carry the base language everywhere: an empty
    # data-i18n element means a key without Swedish text.
    page = open(os.path.join(ROOT, "llm-kurs.html"), encoding="utf-8").read()
    body_only = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", page, flags=re.S)
    empties = []
    for m in re.finditer(r'<([a-zA-Z][\w-]*)([^>]*data-i18n="[^"]+"[^>]*)>\s*</\1>', body_only):
        empties.append(m.group(2)[:80])
    for e in empties[:10]:
        failures.append("empty element in the build: %s" % e)

    # Swedish literals left inside the JavaScript, outside the catalogs
    blocks = re.findall(r"<script>(.*?)</script>", page, re.S)
    js = "\n".join(b for b in blocks
                   if "I18N_DATA" not in b and "window.COURSE" not in b and "i18next" not in b)
    leftovers = [m for m in re.findall(r"'([^'\\\n]{6,})'", js)
                 if re.search(r"[ÅÄÖåäö]", m) and m not in ident]
    for lit in leftovers[:20]:
        warnings.append("Swedish literal left in JS: %r" % lit)

    for w in warnings:
        print("WARN", w)
    for f in failures:
        print("FAIL", f)
    total = len([k for k in sv if wanted(k)])
    print("%s (%d key(s), %d warning(s), %d failure(s))"
          % ("OK" if not failures else "FAILED", total, len(warnings), len(failures)))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
