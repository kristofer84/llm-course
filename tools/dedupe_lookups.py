#!/usr/bin/env python3
"""Collapse translation lookups that translate the same thing twice.

Two shapes are produced by the migration and are harmless but noisy — they make
``L.missing`` non-empty, which is the invariant we want for adding a language:

    L.t(L.t('j4.2'))        -> L.t('j4.2')     (translate an already translated value)
    L.t('Strömmen kommer in') -> L.t('j4.17')  (a literal that already has a key)

The second form is only rewritten when the literal *is* the value of exactly one
key, so nothing ambiguous is guessed. Run with --report to see counts first.
"""
import argparse
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = ["j0.js", "jd.js", "j1b.js", "j2b.js", "j3.js", "j4.js", "j5.js",
         "j6.js", "j7.js", "j8.js", "jz.js"]
KEYISH = re.compile(r"^[a-z][\w]*\.[\w.-]+$")


def load_sv():
    cat = {}
    for path in sorted(glob.glob(os.path.join(ROOT, "src/i18n/sv/*.json"))):
        cat.update(json.load(open(path, encoding="utf-8")))
    return cat


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", action="store_true")
    args = ap.parse_args()

    sv = load_sv()
    by_value = {}
    for k, v in sv.items():
        by_value.setdefault(v, []).append(k)

    total_double = total_literal = 0
    for name in FILES:
        path = os.path.join(ROOT, "src", name)
        src = open(path, encoding="utf-8").read()
        body, n_double = re.subn(r"L\.t\(L\.t\(('[^']+'|\"[^\"]+\")\)\)", r"L.t(\1)", src)
        n_literal = 0

        def repl(m):
            nonlocal n_literal
            literal = m.group(1)
            if KEYISH.match(literal):
                return m.group(0)
            keys = by_value.get(literal) or []
            if len(keys) != 1:
                return m.group(0)
            n_literal += 1
            return "L.t('%s'" % keys[0]

        body = re.sub(r"L\.t\('((?:[^'\\]|\\.)*)'", repl, body)
        # unescape the literals we matched: the catalog stores decoded text
        if n_double or n_literal:
            print("%-7s double %3d, literal->key %3d" % (name, n_double, n_literal))
        total_double += n_double
        total_literal += n_literal
        if not args.report and (n_double or n_literal):
            open(path, "w", encoding="utf-8").write(body)
    print("total: %d double, %d literal->key" % (total_double, total_literal))
    return 0


if __name__ == "__main__":
    sys.exit(main())
