#!/usr/bin/env python3
"""Validate translation catalogs against the extracted source lists.

    python3 tools/check_i18n.py                 # all groups, language en
    python3 tools/check_i18n.py --group m3a     # one translator's file
    python3 tools/check_i18n.py --lang en --verbose

Checks per group:
  * every source key is translated (and nothing else is invented)
  * no empty values
  * inline markup is preserved: same tags, same attributes, same order
  * code blocks keep every identifier, flag and number (comments may change)

Exit code 1 on any error. Regenerate the source lists with
`python3 tools/extract_i18n.py` after changing the course content.
"""
import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
I18N = ROOT / "src" / "i18n"
SOURCE = I18N / "source"
TAG = re.compile(r"<[^>]+>")
TOKEN = re.compile(r"[A-Za-z_][A-Za-z0-9_]*|\d+(?:[.,]\d+)?")


def load_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        raise SystemExit(f"{path}: {exc}")


def tags(s):
    return TAG.findall(s)


def code_tokens(s):
    out = []
    for line in s.split("\n"):
        cut = len(line)
        for marker in ("#", "//"):
            i = line.find(marker)
            if i >= 0:
                cut = min(cut, i)
        out.extend(TOKEN.findall(line[:cut]))
    return Counter(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--group", action="append", help="only this group (repeatable)")
    ap.add_argument("--from-json", action="append",
                    help="validate a slice: a source-style [{k,code}] list (repeatable)")
    ap.add_argument("--lang", default="en")
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    slices = [load_json(Path(f)) for f in (args.from_json or [])]
    groups = sorted(p.name for p in SOURCE.glob("*.keys.json"))
    if not groups and not slices:
        raise SystemExit("no source lists found — run tools/extract_i18n.py first")
    wanted = {g.split(".")[0] for g in groups}
    if args.group:
        missing = set(args.group) - wanted
        if missing:
            raise SystemExit(f"unknown group(s): {sorted(missing)}")
        wanted &= set(args.group)

    catalog, origin = {}, {}
    for f in sorted((I18N / args.lang).glob("*.json")):
        if f.name.startswith("_"):
            continue
        data = load_json(f)
        if not isinstance(data, dict):
            print(f"{f.name}: not an object, ignored")
            continue
        for k, v in data.items():
            if k in catalog and catalog[k] != v:
                print(f"{f.name}: conflicting translation for {k[:50]!r}")
            catalog[k] = v
            origin.setdefault(k, f.name)

    errors, empties, markup, code = [], [], [], []
    total = done = 0
    work = [(g, load_json(SOURCE / f"{g}.json"), load_json(SOURCE / f"{g}.keys.json"))
            for g in sorted(wanted)]
    work += [(f"slice-{i + 1}", items, [x["k"] for x in items]) for i, items in enumerate(slices)]
    for g, items, keys in work:
        missing = [k for k in keys if k not in catalog]
        total += len(keys)
        done += len(keys) - len(missing)
        if missing:
            errors.append(f"{g}: {len(missing)} untranslated, e.g. {missing[0][:70]!r}")
            for k in missing[:5]:
                errors.append(f"    missing in {args.lang}/: {k[:90]!r}")
        for item in items:
            k = item["k"]
            v = catalog.get(k)
            if v is None:
                continue
            if not v.strip():
                empties.append(f"{g}: empty value for {k[:70]!r}")
            if tags(k) != tags(v):
                markup.append(f"{g}: markup differs for {k[:70]!r}\n      src {tags(k)}\n      got {tags(v)}")
            elif item.get("code") and code_tokens(k) != code_tokens(v):
                diff = (code_tokens(k) - code_tokens(v)) + (code_tokens(v) - code_tokens(k))
                code.append(f"{g}: code changed in {k[:60]!r}: {dict(diff)}")

    extra = [k for k in catalog if k not in set().union(*[set(keys) for _, _, keys in work])]
    if extra and not args.group:
        print(f"note: {len(extra)} translated strings no longer in the sources (stale, e.g. {extra[0][:60]!r})")

    for bucket in (errors, empties, markup, code):
        for line in bucket:
            print(("ERROR " if bucket is not code else "WARN  ") + line)
    pct = (done / total * 100) if total else 100.0
    print(f"\n{args.lang}: {done}/{total} strings translated ({pct:.1f}%)")
    hard = errors or empties or markup
    if args.verbose:
        print(f"files: {sorted({origin[k] for k in catalog})}")
    if hard:
        print(f"FAILED: {len(errors)} coverage, {len(empties)} empty, {len(markup)} markup problem(s)")
        return 1
    print("OK" + (f" ({len(code)} code warning(s))" if code else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
