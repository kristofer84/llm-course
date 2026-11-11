"""Shared DOM walker for the i18n pipeline.

Mirrors the unit rule in ``src/i18n/engine.js``:

  * an element whose children are all inline-level and which holds letters is
    one *unit* (a whole sentence, with its inline markup as part of the value);
  * an element with no element children is a unit if it holds letters;
  * an element with block children is not a unit; we descend instead.

Everything here works on source text with byte offsets, so callers can splice
the source without reformatting anything else.
"""

import re
from html.parser import HTMLParser

INLINE = {
    t.upper()
    for t in "span b i em strong code kbd sup sub a br small mark u s tspan abbr time "
    "var samp cite q ins del wbr".split()
}
SKIP = {"SCRIPT", "STYLE", "NOSCRIPT"}
ATTRS = ("aria-label", "placeholder", "alt", "title")
VOID = {"AREA", "BASE", "BR", "COL", "EMBED", "HR", "IMG", "INPUT", "LINK", "META", "PARAM", "SOURCE", "TRACK", "WBR"}
LETTER = re.compile(r"[A-Za-zÅÄÖåäöÆæØø]")


def norm(html_text):
    """Whitespace-normalised form used as the unit value (same as JS norm())."""
    return re.sub(r"\s+", " ", html_text).strip()


class Node:
    __slots__ = ("tag", "attrs", "start", "inner_start", "inner_end", "end", "children", "parent", "text")

    def __init__(self, tag, attrs, start, parent):
        self.tag = tag.upper()
        self.attrs = attrs
        self.start = start
        self.inner_start = None
        self.inner_end = None
        self.end = None
        self.children = []
        self.parent = parent
        self.text = []

    def text_content(self):
        out = list(self.text)
        for c in self.children:
            out.append(c.text_content())
        return "".join(out)

    def inner_html(self, src):
        return src[self.inner_start:self.inner_end]

    def path(self):
        """Positional path among element children, root excluded."""
        parts, n = [], self
        while n.parent is not None and n.parent.parent is not None:
            parts.append(str(n.parent.children.index(n)))
            n = n.parent
        return parts[::-1]


class _Walker(HTMLParser):
    def __init__(self, src):
        super().__init__(convert_charrefs=False)
        self.src = src
        self.line_starts = [0]
        for line in src.splitlines(True):
            self.line_starts.append(self.line_starts[-1] + len(line))
        self.root = Node("#root", {}, 0, None)
        self.root.inner_start = 0
        self.stack = [self.root]

    def at(self):
        line, col = self.getpos()
        return self.line_starts[line - 1] + col

    def handle_starttag(self, tag, attrs):
        start = self.at()
        raw = self.get_starttag_text() or ""
        node = Node(tag, dict(attrs), start, self.stack[-1])
        node.inner_start = start + len(raw)
        self.stack[-1].children.append(node)
        if tag.upper() not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        start = self.at()
        raw = self.get_starttag_text() or ""
        node = Node(tag, dict(attrs), start, self.stack[-1])
        node.inner_start = node.inner_end = start + len(raw)
        node.end = start + len(raw)
        self.stack[-1].children.append(node)

    def handle_endtag(self, tag):
        start = self.at()
        if len(self.stack) > 1 and self.stack[-1].tag == tag.upper():
            node = self.stack.pop()
            node.inner_end = start
            node.end = start + len(tag) + 3  # </tag>
        elif tag.upper() in INLINE:
            self.stack[-1].text.append(self.src[start:start + len(tag) + 3])

    def handle_data(self, data):
        self.stack[-1].text.append(data)

    def handle_entityref(self, name):
        self.stack[-1].text.append("&%s;" % name)

    def handle_charref(self, name):
        self.stack[-1].text.append("&#%s;" % name)

    def handle_comment(self, data):
        pass

    def handle_decl(self, decl):
        pass


def parse(src):
    w = _Walker(src)
    w.feed(src)
    w.close()
    w.root.inner_end = len(src)
    return w.root


def _is_unit(node):
    if node.tag in SKIP:
        return False
    if not LETTER.search(node.text_content()):
        return False
    if not node.children:
        return True
    return all(c.tag in INLINE for c in node.children)


def units(root, src):
    """Units in document order: list of Node."""
    out = []

    def visit(node):
        if node.tag in SKIP:
            return
        if _is_unit(node):
            out.append(node)
            return
        for c in node.children:
            visit(c)

    for c in root.children:
        visit(c)
    return out


def attr_units(root):
    """Elements carrying translatable attributes: list of (Node, attr)."""
    out = []

    def visit(node):
        for a in ATTRS:
            v = node.attrs.get(a)
            if v and LETTER.search(v):
                out.append((node, a))
        for c in node.children:
            visit(c)

    visit(root)
    return out


def splice(src, edits):
    """Apply (start, end, replacement) edits to src, back to front."""
    for start, end, rep in sorted(edits, key=lambda e: e[0], reverse=True):
        src = src[:start] + rep + src[end:]
    return src


def escape_text(fragment):
    """Escape &, < and > outside of tags, so a DOM-derived value is source-safe."""
    out, i = [], 0
    for m in re.finditer(r"<[^>]+>", fragment):
        out.append(_esc(fragment[i:m.start()]))
        out.append(m.group(0))
        i = m.end()
    out.append(_esc(fragment[i:]))
    return "".join(out)


def _esc(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
