#!/usr/bin/env python3
"""Check that technical terms are explained before later slides use them.

The registry in src/terms/*.json lists, per term, the slide where it is
introduced and the spellings to look for. The checker walks the built course in
reading order and verifies that no slide uses a term before its introduction
slide, and that the introduction slide really mentions it.

    python3 tools/check_terms.py                 # check
    python3 tools/check_terms.py --write-doc     # also refresh docs/TERMS.md
    python3 tools/check_terms.py --list          # print every slide's terms

Run after (cd src && python3 build.py). Base-language (Swedish) text is used
because build.py fills it statically; the same registry carries localized
spellings for English and German lookup when available.
"""
import argparse
import glob
import html
import json
import os
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "llm-kurs.html"
REGISTRY = ROOT / "src" / "terms"
DOC = ROOT / "docs" / "TERMS.md"


def normalize(text):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", text))).strip()


def slides():
    page = PAGE.read_text(encoding="utf-8")
    page = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", page, flags=re.S)
    out = []
    for match in re.finditer(r'<section class="slide"[^>]*data-title="([^"]+)"[^>]*>(.*?)</section>', page, re.S):
        out.append((match[1], normalize(match[2])))
    return out


def registry():
    terms, errors = [], []
    for path in sorted(glob.glob(str(REGISTRY / "*.json"))):
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        for term in data.get("terms", []):
            term.setdefault("spellings", {})
            if not term.get("id") or not term.get("introduced"):
                errors.append(f"{os.path.basename(path)}: term needs id and introduced: {term}")
            alias = term["spellings"].get("sv") or []
            if not alias:
                errors.append(f"{os.path.basename(path)}: {term.get('id')} has no Swedish spellings")
            terms.append(term)
    ids = [term.get("id") for term in terms]
    duplicates = sorted({value for value in ids if ids.count(value) > 1})
    for value in duplicates:
        errors.append(f"duplicate term id: {value}")
    return terms, errors


PREVIEW = re.compile(r'^(Introduktion|Introduction):\s')


def occurrences(text, aliases):
    for alias in aliases:
        pattern = r"(?<![\w])" + re.escape(alias) + r"(?![\w])"
        if re.search(pattern, text, re.I):
            return True
    return False


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--write-doc", action="store_true", help="refresh docs/TERMS.md")
    parser.add_argument("--list", action="store_true", help="print every slide with introduced terms")
    args = parser.parse_args()

    if not PAGE.exists():
        raise SystemExit("Build first: (cd src && python3 build.py)")
    course = slides()
    positions = {title: index for index, (title, _) in enumerate(course)}
    terms, errors = registry()
    warnings = []
    introduced = {}
    introduced_at = {}

    for term in terms:
        alias = term["spellings"]["sv"]
        title = term["introduced"]
        if title not in positions:
            errors.append(f"{term['id']}: introduction slide not found: {title!r}")
            continue
        index = positions[title]
        if PREVIEW.match(title):
            errors.append(f"{term['id']}: introductions must be a lesson, not the module preview {title!r}")
        introduced_at[term["id"]] = index
        introduced.setdefault(index, []).append(term)
        if not occurrences(course[index][1], alias):
            errors.append(f"{term['id']}: introduction slide {index + 1} ({title}) never mentions it")

    first_use = {}
    for index, (title, text) in enumerate(course):
        if PREVIEW.match(title):
            continue    # a module opener previews topics in its goals; it does not teach them
        for term in terms:
            if term["id"] in first_use:
                continue
            if occurrences(text, term["spellings"]["sv"]):
                first_use[term["id"]] = index

    for term in terms:
        identifier = term["id"]
        if identifier not in introduced_at:
            continue
        if identifier not in first_use:
            warnings.append(f"{identifier}: not used in the course at all")
            continue
        if first_use[identifier] < introduced_at[identifier]:
            slide = course[first_use[identifier]][0]
            errors.append(
                f"{identifier}: used on slide {first_use[identifier] + 1} ({slide}) "
                f"before its introduction on slide {introduced_at[identifier] + 1} ({term['introduced']})")

    by_slide = {}
    for term in terms:
        by_slide.setdefault(introduced_at.get(term["id"], -1), []).append(term)

    if args.list:
        for index, (title, _text) in enumerate(course):
            names = ", ".join(term["id"] for term in by_slide.get(index, []))
            print(f"{index + 1:3d}  {title}" + (f"  [{names}]" if names else ""))

    if args.write_doc:
        lines = [
            "# Terminology by slide",
            "",
            "Generated by `python3 tools/check_terms.py --write-doc`. Each entry is the slide where",
            "the term is explained; `tools/check_terms.py` fails if a later slide’s first use comes",
            "earlier, or if the introduction slide does not actually mention the term.",
            "",
            "| Slide | Terms introduced |",
            "| ---: | --- |",
        ]
        for index, (title, _text) in enumerate(course):
            if by_slide.get(index):
                names = ", ".join(term["id"] for term in by_slide[index])
                lines.append(f"| {index + 1}. {title} | {names} |")
        DOC.write_text("\n".join(lines) + "\n", encoding="utf-8")
        print(f"wrote {DOC.relative_to(ROOT)}")

    for message in warnings:
        print("WARN", message)
    for message in errors:
        print("FAIL", message)
    print(f"{'OK' if not errors else 'FAILED'} ({len(terms)} term(s), "
          f"{len(warnings)} warning(s), {len(errors)} failure(s))")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
