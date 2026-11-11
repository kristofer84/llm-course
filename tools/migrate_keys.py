"""One-shot migration: Swedish-string-as-key  ->  explicit i18n keys.

Reads the current catalogs (key = Swedish string, value = English), walks the
HTML sources with the same unit rule the runtime uses, assigns a stable key to
every unit, writes ``src/i18n/sv/<group>.json`` + ``src/i18n/en/<group>.json``
and rewrites the sources to carry ``data-i18n`` placeholders instead of text.

Run with ``--dry`` to print the plan and a coverage report without touching
anything; ``--file p3.html`` limits the run to one source file.
"""

import argparse
import glob
import json
import os
import re
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import i18n_dom as D  # noqa: E402

SRC_FILES = [
    "p1.html", "p9.html", "p2.html", "p3.html", "p4.html", "p5.html", "p6.html", "p7.html", "p8.html",
    "n0.html", "n0b.html", "n6b.html", "n8b.html", "n1.html", "n3.html", "n3b.html",
    "n3c.html", "n3d.html", "n3e.html", "n5.html", "n6.html", "n8.html", "n9.html", "n10.html",
]
PRE_CTX = {"PRE", "CODE"}


def slug(text, limit=28):
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    words = [w for w in re.split(r"[^A-Za-z0-9]+", text.lower()) if w]
    out = ""
    for w in words:
        cand = (out + "-" + w) if out else w
        if len(cand) > limit and out:
            break
        out = cand
    return out or "x"


def group_of(filename):
    return filename[:-5]  # p3.html -> p3


def slide_slug(node, src):
    """Slug of the enclosing slide, else of the enclosing element with a class."""
    n = node
    while n is not None:
        title = n.attrs.get("data-title")
        if title:
            return slug(title)
        n = n.parent
    n = node.parent
    while n is not None and n.parent is not None:
        cls = (n.attrs.get("class") or "").split()
        if cls:
            return slug(cls[0])
        n = n.parent
    return "page"


def unique(base, seen):
    if base not in seen:
        seen.add(base)
        return base
    i = 2
    while "%s-%d" % (base, i) in seen:
        i += 1
    key = "%s-%d" % (base, i)
    seen.add(key)
    return key


def is_pre_context(node):
    n = node
    while n is not None:
        if n.tag in PRE_CTX:
            return True
        cls = n.attrs.get("class") or ""
        if "eq" in cls.split() or "log" in cls.split():
            return True
        n = n.parent
    return False


def in_code_block(node):
    """Shell/log blocks: code, not prose. Left out of the catalogs."""
    n = node
    while n is not None:
        if n.tag == "PRE" and "log" in (n.attrs.get("class") or "").split():
            return True
        n = n.parent
    return False


def load_old_catalogs(root):
    cat = {}
    for path in sorted(glob.glob(os.path.join(root, "src/i18n/en/*.json"))):
        cat.update(json.load(open(path, encoding="utf-8")))
    return cat


def plan_file(path, old_cat, dry):
    src = open(path, encoding="utf-8").read()
    root = D.parse(src)
    stem = os.path.basename(path)[:-5]
    seen = set()
    sv, en, report = {}, {}, {"missing": [], "pre": [], "attrs": 0, "units": 0, "code": 0}
    node_keys = {}    # id(node) -> key
    node_attrs = {}   # id(node) -> [(attr, key)]
    counters = {}

    for node in D.units(root, src):
        if node.tag == "TITLE":
            continue
        if in_code_block(node):
            report["code"] += 1
            continue
        raw = node.inner_html(src)
        key_src = D.norm(raw)
        slug_ = slide_slug(node, src)
        n = counters.get(slug_, 0) + 1
        counters[slug_] = n
        key = unique("%s.%s.%d" % (stem, slug_, n), seen)
        sv[key] = raw
        node_keys[id(node)] = key
        if key_src in old_cat:
            en[key] = old_cat[key_src]
        else:
            en[key] = ""
            report["missing"].append((key, key_src[:90]))
        if is_pre_context(node) and "\n" in raw.strip():
            report["pre"].append((key, raw.count("\n")))
        report["units"] += 1

    for node, attr in D.attr_units(root):
        val = node.attrs[attr]
        key = unique("%s.%s.%s" % (stem, slide_slug(node, src), attr.replace("-", "")), seen)
        sv[key] = val
        node_attrs.setdefault(id(node), []).append((attr, key))
        if val in old_cat:
            en[key] = old_cat[val]
        else:
            en[key] = ""
            report["missing"].append((key, val[:90]))
        report["attrs"] += 1

    edits = []
    for node in D.units(root, src) + [n for n, _ in D.attr_units(root)]:
        keys = node_keys.get(id(node))
        attrs = node_attrs.get(id(node))
        if not keys and not attrs:
            continue
        tag = src[node.start:node.inner_start]
        newtag = tag
        for attr, key in attrs or []:
            newtag = re.sub(r'(\s%s=)(["\'])(.*?)\2' % re.escape(attr),
                            lambda m, k=key: m.group(1) + m.group(2) + m.group(2) +
                            ' data-i18n-%s="%s"' % (attr, k),
                            newtag, count=1, flags=re.S)
        if keys:
            newtag = newtag[:-1] + ' data-i18n="%s">' % keys
        if newtag != tag:
            edits.append((node.start, node.inner_start, newtag))
        if keys:
            edits.append((node.inner_start, node.inner_end, ""))
    # one edit per span, attribute edits never overlap inner spans
    dedup = {}
    for s, e, rep in edits:
        dedup[(s, e)] = rep
    out = D.splice(src, [(s, e, r) for (s, e), r in dedup.items()])
    return out, sv, en, report


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--file")
    ap.add_argument("--root", default=".")
    args = ap.parse_args()

    old_cat = load_old_catalogs(args.root)
    print("old catalog entries:", len(old_cat))
    files = [args.file] if args.file else SRC_FILES
    tot = {"units": 0, "attrs": 0}
    missing = []
    pre = []
    outdir = "/tmp/migrated" if args.dry else os.path.join(args.root, "src")
    for fn in files:
        path = os.path.join(args.root, "src", fn)
        out, sv, en, rep = plan_file(path, old_cat, args.dry)
        tot["units"] += rep["units"]
        tot["attrs"] += rep["attrs"]
        missing += rep["missing"]
        pre += rep["pre"]
        if args.dry:
            os.makedirs(outdir, exist_ok=True)
            open(os.path.join(outdir, fn), "w", encoding="utf-8").write(out)
        else:
            open(path, "w", encoding="utf-8").write(out)
            g = group_of(fn)
            os.makedirs(os.path.join(args.root, "src/i18n/sv"), exist_ok=True)
            json.dump(sv, open(os.path.join(args.root, "src/i18n/sv/%s.json" % g), "w", encoding="utf-8"),
                      ensure_ascii=False, indent=1)
            json.dump(en, open(os.path.join(args.root, "src/i18n/en/%s.json" % g), "w", encoding="utf-8"),
                      ensure_ascii=False, indent=1)
        print("%-10s units %4d attrs %3d missing %3d" % (fn, rep["units"], rep["attrs"], len(rep["missing"])))
    print("TOTAL units %d attrs %d missing %d pre-block units %d"
          % (tot["units"], tot["attrs"], len(missing), len(pre)))
    for k, v in missing[:15]:
        print("  MISS", k, "|", v)
    for k, n in pre[:15]:
        print("  PRE ", k, "newlines", n)


if __name__ == "__main__":
    main()
