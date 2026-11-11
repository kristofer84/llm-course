"""Move the Swedish text of the JS modules into the catalogs.

Two shapes are handled:

  * ``src/jd.js`` — pure data (``QUIZ`` and ``GLOSS``). Parsed into Python,
    re-emitted with keys, values into ``i18n/sv/jd.json``.
  * every other module — ``L.t('svensk text')`` call sites get a generated key
    (``j6.12``), the literal moves to ``i18n/sv/j6.json``.

English comes from the existing catalogs, where the Swedish literal was the
key. ``--report`` only prints what would happen.
"""

import argparse
import glob
import json
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS_FILES = ["j0.js", "j1b.js", "j2b.js", "j3.js", "j4.js", "j5.js", "j6.js", "j7.js", "j8.js", "jz.js"]

ESCAPES = {"n": "\n", "t": "\t", "r": "\r", "\\": "\\", "'": "'", '"': '"', "`": "`", "b": "\b", "f": "\f"}


class Tok:
    __slots__ = ("kind", "value", "start", "end", "raw")

    def __init__(self, kind, value, start, end, raw):
        self.kind, self.value, self.start, self.end, self.raw = kind, value, start, end, raw


def tokenize(src):
    """Tokens for a JS data literal file: strings, numbers, punctuation, idents."""
    out, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if c in " \t\r\n":
            i += 1
            continue
        if src.startswith("//", i):
            j = src.find("\n", i)
            i = n if j < 0 else j + 1
            continue
        if src.startswith("/*", i):
            j = src.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        if c in "'\"":
            j, buf = i + 1, []
            while j < n:
                ch = src[j]
                if ch == "\\":
                    esc = src[j + 1]
                    buf.append(ESCAPES.get(esc, esc))
                    j += 2
                    continue
                if ch == c:
                    break
                buf.append(ch)
                j += 1
            out.append(Tok("str", "".join(buf), i, j + 1, src[i:j + 1]))
            i = j + 1
            continue
        m = re.match(r"-?\d+(?:\.\d+)?", src[i:])
        if m:
            out.append(Tok("num", m.group(0), i, i + len(m.group(0)), m.group(0)))
            i += len(m.group(0))
            continue
        m = re.match(r"[A-Za-z_$][\w$]*", src[i:])
        if m:
            out.append(Tok("id", m.group(0), i, i + len(m.group(0)), m.group(0)))
            i += len(m.group(0))
            continue
        out.append(Tok("punct", c, i, i + 1, c))
        i += 1
    return out


def js_quote(value):
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n") + "'"


def load_identity():
    """Sample tokens and prompts that are data, not interface text."""
    path = os.path.join(REPO, "src/i18n/en/data.json")
    if not os.path.exists(path):
        return set()
    d = json.load(open(path, encoding="utf-8"))
    return {k for k, v in d.items() if k == v}


def load_old_en():
    cat = {}
    for f in sorted(glob.glob(os.path.join(REPO, "src/i18n/en/*.json"))):
        base = os.path.basename(f)
        if base.startswith("_") or "/sv/" in f:
            continue
        cat.update(json.load(open(f, encoding="utf-8")))
    return cat


# ---------------------------------------------------------------- jd.js data
def migrate_jd(src, old_en, report):
    """QUIZ and GLOSS: parse, key, re-emit."""
    toks = tokenize(src)
    sv, en = {}, {}

    # --- QUIZ: { m1: [ {q,o,a,e}, ... ], ... }
    start = src.index("const QUIZ=")
    i = next(k for k, t in enumerate(toks) if t.value == "{" and t.start > start) + 1
    quiz = {}
    while toks[i].kind == "id":
        qid = toks[i].value
        assert toks[i + 1].value == ":" and toks[i + 2].value == "["
        i += 3
        entries = []
        while toks[i].value == "{":
            i += 1
            entry = {}
            while toks[i].value != "}":
                field = toks[i].value
                assert toks[i + 1].value == ":"
                i += 2
                if toks[i].value == "[":
                    i += 1
                    vals = []
                    while toks[i].value != "]":
                        if toks[i].kind == "str":
                            vals.append(toks[i].value)
                        i += 1
                    i += 1
                    entry[field] = vals
                elif toks[i].kind == "str":
                    entry[field] = toks[i].value
                    i += 1
                else:
                    entry[field] = int(toks[i].value)
                    i += 1
                if toks[i].value == ",":
                    i += 1
            i += 1
            entries.append(entry)
            if toks[i].value == ",":
                i += 1
        i += 1
        quiz[qid] = entries
        if toks[i].value == ",":
            i += 1

    # --- GLOSS: [ ['term', 'definition'], ... ]
    gstart = src.index("const GLOSS=")
    j = next(k for k, t in enumerate(toks) if t.value == "[" and t.start > gstart) + 1
    gloss = []
    while toks[j].value == "[":
        gloss.append([toks[j + 1].value, toks[j + 3].value])
        j += 5
        if toks[j].value == ",":
            j += 1

    def look(value, n=None):
        """English for a stored literal: plain key, numbered key, else identity
        when the string carries no letters (shapes, numbers)."""
        for cand in (value, ("%d. %s" % (n, value)) if n else None):
            if cand and cand in old_en and old_en[cand]:
                return old_en[cand]
        return value if not re.search(r"[A-Za-zÅÄÖåäö]", value) else ""

    lines = ["const QUIZ={"]
    for qid, entries in quiz.items():
        lines.append("%s:[" % qid)
        for n, e in enumerate(entries, 1):
            base = "jd.%s.%d" % (qid, n)
            qk, ek = base + ".q", base + ".e"
            sv[qk], sv[ek] = e["q"], e["e"]
            en[qk] = look(e["q"], n)
            en[ek] = look(e["e"], n)
            opts = []
            for k, o in enumerate(e["o"], 1):
                ok = "%s.o%d" % (base, k)
                sv[ok] = o
                en[ok] = look(o, n)
                opts.append(js_quote(ok))
            lines.append(" {q:%s,o:[%s],a:%d,e:%s}," % (js_quote(qk), ",".join(opts), e["a"], js_quote(ek)))
        lines.append("],")
    lines.append("};")
    lines.append("const GLOSS=[")
    for n, (term, definition) in enumerate(gloss, 1):
        tk, dk = "jd.gloss.%d.term" % n, "jd.gloss.%d.def" % n
        sv[tk], sv[dk] = term, definition
        en[tk] = look(term)
        en[dk] = look(definition)
        lines.append("[%s,%s]," % (js_quote(tk), js_quote(dk)))
    lines.append("];")

    quiz_at = src.index("const QUIZ=")
    gloss_at = src.index("const GLOSS=")
    gloss_end = src.index("];", gloss_at) + 2
    body = src[:quiz_at] + "\n".join(lines) + src[gloss_end:]
    report["jd_quiz"] = sum(len(v) for v in quiz.values())
    report["jd_gloss"] = len(gloss)
    return body, sv, en


# --------------------------------------------------- literals -> keys, all of them
SWEDISH = re.compile(r"[ÅÄÖåäö]")
NO_KEY_BEFORE = {".", "==", "===", "!=", "!==", "case"}
NO_KEY_ARGS = {"indexOf", "includes", "startsWith", "endsWith", "split", "replace", "match",
               "getElementById", "querySelector", "querySelectorAll", "getAttribute",
               "setAttribute", "classList", "add", "remove", "toggle", "querySelectorAll"}


def migrate_literals(src, name, old_en, identity, report):
    """Every Swedish literal becomes a key; identity data (sample tokens) stays."""
    toks = tokenize(src)
    sv, en, by_value = {}, {}, {}
    edits = []

    for k, tok in enumerate(toks):
        if tok.kind != "str":
            continue
        value = tok.value
        if not SWEDISH.search(value) or not value.strip():
            continue
        if value in identity or len(value.strip()) < 3:
            continue
        prev = toks[k - 1] if k else None
        nxt = toks[k + 1] if k + 1 < len(toks) else None
        if prev and prev.value in NO_KEY_BEFORE:
            continue
        if prev and prev.value in NO_KEY_ARGS:
            continue
        if nxt and nxt.value == ":" and prev and prev.value in ("{", ","):
            continue
        in_call = (prev is not None and prev.value == "(" and k >= 4
                   and toks[k - 2].value == "t" and toks[k - 3].value == "." and toks[k - 4].value == "L")
        if value in by_value:
            key = by_value[value]
        else:
            key = "%s.%d" % (name[:-3], len(by_value) + 1)
            by_value[value] = key
            sv[key] = value
            en[key] = old_en.get(value, "")
        if in_call:
            edits.append((tok.start, tok.end, js_quote(key)))
        else:
            edits.append((tok.start, tok.end, "L.t(%s)" % js_quote(key)))
    body = src
    for start, end, rep in sorted(edits, key=lambda e: e[0], reverse=True):
        body = body[:start] + rep + body[end:]
    report[name] = len(sv)
    return body, sv, en


IDENTITY_G = set()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", action="store_true")
    args = ap.parse_args()
    old_en = load_old_en()
    global IDENTITY_G
    IDENTITY_G = load_identity()
    report = {}
    for name in JS_FILES + ["jd.js"]:
        path = os.path.join(REPO, "src", name)
        src = open(path, encoding="utf-8").read()
        if name == "jd.js":
            body, sv, en = migrate_jd(src, old_en, report)
        else:
            body, sv, en = migrate_literals(src, name, old_en, IDENTITY_G, report)
        blank = [k for k, v in en.items() if not v]
        print("%-7s keys %4d untranslated %3d" % (name, len(sv), len(blank)))
        if args.report:
            for b in blank[:3]:
                print("    MISS", b, "|", sv[b][:70])
            continue
        open(path, "w", encoding="utf-8").write(body)
        group = name[:-3]
        json.dump(sv, open(os.path.join(REPO, "src/i18n/sv/%s.json" % group), "w", encoding="utf-8"),
                  ensure_ascii=False, indent=1)
        if not os.path.exists(os.path.join(REPO, "src/i18n/en/%s.json" % group)):
            json.dump(en, open(os.path.join(REPO, "src/i18n/en/%s.json" % group), "w", encoding="utf-8"),
                      ensure_ascii=False, indent=1)
    print(json.dumps({k: v for k, v in report.items() if isinstance(v, int)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
