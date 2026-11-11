import json
import glob
import os
import re
import sys
import unicodedata

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tools"))
import i18n_dom as D  # noqa: E402

OLD = ['p2.html', 'p3.html', 'p4.html', 'p5.html', 'p6.html', 'p7.html', 'p8.html']
NEW = ['n0.html', 'n0b.html', 'n6b.html', 'n8b.html', 'n1.html', 'n3.html', 'n3b.html', 'n3c.html',
       'n3d.html', 'n3e.html', 'n5.html', 'n6.html', 'n8.html', 'n9.html', 'n10.html']

# ---------------------------------------------------------------- catalogs
# key -> value per locale; the Swedish catalog is the source of everything the
# build itself generates (module names, goals, templates).
CAT = {}
for lf in sorted(glob.glob('i18n/*/*.json')):
    loc = os.path.basename(os.path.dirname(lf))
    if loc in ('source', 'sv_source') or os.path.basename(lf).startswith('_'):
        continue
    data = json.load(open(lf, encoding='utf-8'))
    if not isinstance(data, dict):
        print('i18n: skipping', lf)
        continue
    CAT.setdefault(loc, {}).update(data)
SV = CAT.get('sv', {})
LANGS = ['sv'] + sorted(l for l in CAT if l != 'sv')


def s(key):
    if key not in SV:
        raise SystemExit('build: missing Swedish source for key %r' % key)
    return SV[key]


def fmt(key, **vars):
    out = s(key)
    for k, v in vars.items():
        out = out.replace('{{%s}}' % k, str(v))
    return out


def slug(text, limit=28):
    text = unicodedata.normalize('NFKD', text)
    text = ''.join(c for c in text if not unicodedata.combining(c))
    words = [w for w in re.split(r'[^A-Za-z0-9]+', text.lower()) if w]
    out = ''
    for w in words:
        cand = (out + '-' + w) if out else w
        if len(cand) > limit and out:
            break
        out = cand
    return out or 'x'


def numbered(prefix):
    out, i = [], 1
    while '%s.%d' % (prefix, i) in SV:
        out.append(SV['%s.%d' % (prefix, i)])
        i += 1
    return out


# ---------------------------------------------------------------- sections
secs = {}
for fn in OLD + NEW:
    text = open(fn, encoding='utf-8').read()
    for m in re.finditer(r'<section class="slide"[^>]*data-title="([^"]+)"[^>]*>.*?</section>', text, re.S):
        secs[m.group(1)] = m.group(0)

# MODS keeps structure only: prose comes from the catalog (i18n/sv/build.json).
MODS = [
    dict(time=10),
    dict(time=15, hl=[0, 1, 2, 3, 4, 5]),
    dict(time=10, hl=[0, 1, 2]),
    dict(time=40, hl=[3]),
    dict(time=50, hl=[3]),
    dict(time=10, hl=[4, 5]),
    dict(time=10, hl=[0, 1, 2, 3, 4, 5]),
    dict(time=45, hl=[1, 2, 3, 4, 5], engine=True),
    dict(time=20, hl=[3]),
    dict(time=50, hl=[], engine=True),
    dict(time=10, hl=[3]),
    dict(time=20, hl=[0, 1, 2, 3, 4, 5], engine=True),
]
ORDER = [
    ['Från prompt till token', 'Vad är en språkmodell?', 'Kursens karta', 'Ett exempel hela vägen', 'Referensmodellen och notation'],
    ['@open', 'Vektorer och skalärprodukt', 'Matris gånger vektor', 'Varför icke-linjäritet?', 'Softmax', 'Vikter och aktiveringar', '@sum', '@quiz:m1'],
    ['@open', 'Varför tokens?', 'Tokenisering i praktiken', 'Chat template och specialtokens', 'Embedding: från id till vektor', '@sum', 'Testa dig själv: tokens'],
    ['@open', 'Uppgiften: från vektorer till nästa token', 'Transformer och decoder-only', 'Ett block, staplat 32 gånger',
     'Residual stream', 'Shapen ändras aldrig', 'Normalisering: varför och var', 'Hela modellen i en bild',
     'Vad ett lager innehåller', 'Så blir det 8 miljarder', 'Blocket som ett löpande band', 'Ett lager inifrån',
     '32 lager i en modellfil', 'Två rader, ett lager', 'RMSNorm', '@sum'],
    ['@open', 'Attention och MLP: olika jobb', 'Attention i klartext',
     'Attention-formeln bit för bit', 'Attention 1: Q, K och V', 'Attention 2: dela upp i heads', 'Attention 3: RoPE',
     'Attention 4: scores och causal mask', 'Attention 5: hämta values', 'Attention räknat för hand',
     'GQA: delade KV heads', 'MLP i klartext', 'MLP med SwiGLU', 'MLP:n som detektorer', 'Var parametrarna finns',
     'Lager för lager', 'Spåra tensorerna genom modellen', 'Forward pass som kod', '@sum', 'Testa dig själv: transformerblocket'],
    ['@open', 'LM head: från vektor till logits', 'Sampling: temperature, top-k, top-p', 'Den autoregressiva loopen', '@sum', 'Testa dig själv: logits'],
    ['@open', 'Träning: next-token loss', 'Gradienter och minne', 'Från basmodell till assistent', '@sum', 'Testa dig själv: träning'],
    ['@open', 'Vad är ett grafikkort?', 'Prefill och decode', 'KV-cache i klartext', 'KV-cache steg för steg',
     'KV-cachen på riktigt: en minimodell', 'Ett decode-steg med shapes', 'Hur stor blir KV-cachen?',
     'Vad ligger i GPU-minnet?', 'Varför batching räddar decode', 'Latensmått', 'Kapacitetsplanering', 'Kvantisering',
     '@sum', 'Testa dig själv: inferens'],
    ['@open', 'Tät modell eller MoE', 'Routern', 'MoE i inferens', 'Attention-varianter',
     'Attention sinks och lokal attention', 'Lång kontext',
     'Resonerande modeller', 'Multimodala modeller', 'Andra arkitekturer', '@sum', 'Testa dig själv: modellvarianter'],
    ['@open', 'vLLM i klartext', 'vLLM: arkitekturen', 'En requests livscykel', 'Problemet: fragmenterat minne',
     'PagedAttention', 'Prefix caching', 'Continuous batching', 'Chunked prefill och token-budget', 'Disaggregerad prefill och decode',
     'Ett steg i model runner', 'Samplern och structured output', 'Tensor parallelism',
     'Pipeline, data och expert parallelism', 'Speculative decoding',
     'Multi-LoRA: många modeller på en GPU', 'Flaggorna och vad de styr',
     'Starta servern och läs loggen', 'Mät med /metrics', 'Felsökning: symptom och rattar', 'Hela flödet',
     '@sum', 'Testa dig själv: vLLM'],
    ['@open', 'Riktningar i residual stream', 'Steering och ablation', 'Baka in ablation i vikterna', '@sum', 'Testa dig själv: tolkning'],
    ['@open', 'Vanliga missförstånd', 'Fusklapp', 'Slutprov', 'Vidare härifrån'],
]
QUIZMAP = {'Testa dig själv: tokens': 'm2', 'Testa dig själv: transformerblocket': 'm3',
           'Testa dig själv: logits': 'm4', 'Testa dig själv: inferens': 'm6',
           'Testa dig själv: modellvarianter': 'm7', 'Testa dig själv: vLLM': 'm8'}
STAGES = ['Text', 'Tokens', 'Embedding', '32 block', 'Logits', 'Sampling']
NMOD = len(MODS) - 1

# text handed to the source slides that carry no lead of their own
LEADS = {k[len('lead.'):]: v for k, v in SV.items() if k.startswith('lead.')}


def minimap(i, m):
    hl = m.get('hl', [])
    eng = m.get('engine', False)
    o = ['<svg class="viz" viewBox="0 0 600 136" role="img" aria-label="" data-i18n-aria-label="build.minimap.aria" style="margin-top:18px">']
    o.append('<rect x="4" y="22" width="592" height="100" rx="10" fill="none" style="stroke:var(%s)" stroke-width="%s" stroke-dasharray="5 4"/>'
             % ('--tok' if eng else '--line', '2' if eng else '1'))
    o.append('<text x="14" y="14" class="s" data-i18n="build.minimap.label"%s></text>'
             % (' style="fill:var(--tok);font-weight:600"' if eng else ''))
    for k, name in enumerate(STAGES):
        x = 16 + k * 96
        on = k in hl
        o.append('<rect x="%d" y="52" width="84" height="40" rx="6" class="%s"%s/>' % (x, 'bt' if on else 'bg', '' if on else ' style="opacity:.7"'))
        o.append('<text x="%d" y="77" text-anchor="middle" class="s" data-i18n="build.stage.%d"%s></text>'
                 % (x + 42, k, ' style="fill:var(--ink);font-weight:600"' if on else ''))
        if k < 5:
            o.append('<line x1="%d" y1="72" x2="%d" y2="72" class="ln" marker-end="url(#ah)"/>' % (x + 84, x + 94))
    o.append('</svg>')
    return ''.join(o)


def sec_attrs(i, kind, title_key):
    return ('<section class="slide" data-level="1" data-mod="%d" data-title="%s" data-i18n-title="%s">'
            % (i, s(title_key if kind == 'plain' else title_key), title_key))


def opener(i, m):
    goals = ''.join('<li data-i18n="mod.%d.goal.%d"></li>' % (i, j) for j in range(1, len(numbered('mod.%d.goal' % i)) + 1))
    vars_ = json.dumps({'m': i, 'n': NMOD, 't': m['time']})
    return ('<section class="slide" data-level="1" data-mod="%d" data-title="%s" data-i18n-title="title.mod.%d"><div class="si"><div class="opener">'
            '<div><p class="modnum" data-i18n="build.opener.num" data-i18n-vars=\'%s\'></p>'
            '<h1 data-i18n="mod.%d.name"></h1><p class="lead" data-i18n="mod.%d.lead"></p></div>'
            '<div><h3 style="margin-top:0" data-i18n="build.opener.goals"></h3><ul class="goals">%s</ul>%s</div></div></div></section>'
            % (i, fmt('title.mod.%d' % i), i, vars_, i, i, goals, minimap(i, m)))


def summary(i, m):
    keys = ''.join('<li data-i18n="mod.%d.key.%d"></li>' % (i, j) for j in range(1, len(numbered('mod.%d.key' % i)) + 1))
    return ('<section class="slide" data-level="1" data-mod="%d" data-title="%s" data-i18n-title="title.summary.%d"><div class="si">'
            '<p class="modnum" data-i18n="build.summary.num" data-i18n-vars=\'%s\'></p>'
            '<h2 data-i18n="build.summary.title" data-i18n-vars=\'%s\'></h2><ol class="keys">%s</ol>'
            '<p class="note" data-i18n="build.summary.note"></p></div></section>'
            % (i, fmt('title.summary.%d' % i), i,
               json.dumps({'m': i}),
               json.dumps({'name': s('mod.%d.name' % i)}), keys))


out = []
used = set()
for i, lst in enumerate(ORDER):
    m = MODS[i]
    for t in lst:
        if t == '@open':
            out.append(opener(i, m))
        elif t == '@sum':
            out.append(summary(i, m))
        elif t.startswith('@quiz:'):
            out.append('<section class="slide" data-level="1" data-mod="%d" data-title="%s" data-i18n-title="title.quiz.%d">'
                       '<div class="si"><h2 data-i18n="build.quiz.title" data-i18n-vars=\'%s\'></h2>'
                       '<div class="quiz" data-quiz="%s"></div></div></section>'
                       % (i, fmt('title.quiz.%d' % i), i,
                          json.dumps({'name': s('mod.%d.quizname' % i)}), t[6:]))
        else:
            sec = secs[t]
            used.add(t)
            lvl = 1 if slug(t) in LEADS or 'data-level' in sec else 0
            sec = re.sub(r'<section class="slide"[^>]*>',
                         '<section class="slide" data-level="%d" data-mod="%d" data-title="%s" data-i18n-title="title.%s">'
                         % (lvl, i, t, slug(t)), sec, 1)
            if slug(t) in LEADS and 'class="plain"' not in sec and 'class="lead"' not in sec:
                sec = sec.replace('</h2>', '</h2>\n  <p class="plain" data-i18n="lead.%s"></p>' % slug(t), 1)
            if t in QUIZMAP:
                sec = sec.replace('</h2>', '</h2>\n  <div class="quiz" data-quiz="%s"></div>\n  <h3 data-i18n="build.calc"></h3>' % QUIZMAP[t], 1)
            out.append(sec)

print('unused:', set(secs) - used)
course = dict(mods=['mod.%d.name' % i for i in range(len(MODS))],
              desc=['mod.%d.desc' % i for i in range(len(MODS))],
              time=[m['time'] for m in MODS])

# ---------------------------------------------------------------- assemble
parts = [open('p1.html', encoding='utf-8').read(), '\n'.join(out), open('p9.html', encoding='utf-8').read(),
         '<script>window.COURSE=%s;</script>\n' % json.dumps(course, ensure_ascii=False),
         '<script>window.I18N_DATA=%s;</script>' % json.dumps(CAT, ensure_ascii=False),
         '<script>\n' + open('vendor/i18next.min.js', encoding='utf-8').read() + '\n</script>',
         open('i18n/engine.js', encoding='utf-8').read()]
for j in ['j0.js', 'jd.js', 'j1b.js', 'j2b.js', 'j3.js', 'j4.js', 'j5.js', 'j6.js', 'j7.js', 'j8.js', 'jz.js']:
    parts.append(open(j, encoding='utf-8').read())
full = '\n'.join(parts)


# ------------------------------------------------- base language, statically
def fill(page, sv):
    """Write the base language into the markup, so the artifact is readable
    without JavaScript and a missing translation leaves Swedish, not a hole."""
    root = D.parse(page)
    edits = []
    for el in [n for n in _walk(root) if n.attrs.get('data-i18n')]:
        key = el.attrs['data-i18n']
        if key not in sv:
            raise SystemExit('build: no Swedish text for %r' % key)
        val = sv[key]
        raw = el.attrs.get('data-i18n-vars')
        if raw:
            vs = json.loads(raw)
            for k, v in vs.items():
                val = val.replace('{{%s}}' % k, str(v))
        edits.append((el.inner_start, el.inner_end, val))
    for el in [n for n in _walk(root) if any(a.startswith('data-i18n-') and a != 'data-i18n-vars' for a in n.attrs)]:
        for a in [a for a in el.attrs if a.startswith('data-i18n-') and a != 'data-i18n-vars']:
            key = el.attrs[a]
            attr = a[len('data-i18n-'):]
            if key not in sv:
                raise SystemExit('build: no Swedish text for %r' % key)
            tag = page[el.start:el.inner_start]
            tag2 = re.sub(r'(\s%s=)(["\'])([^"\']*)\3' % re.escape(attr),
                          lambda mm, v=sv[key]: mm.group(1) + mm.group(2) + v + mm.group(2),
                          tag, count=1, flags=re.S)
            edits.append((el.start, el.inner_start, tag2))
            break
    return D.splice(page, edits)


def _walk(node):
    for c in node.children:
        yield c
        for d in _walk(c):
            yield d


full = fill(full, SV)
full = re.sub(r'<title[^>]*>.*?</title>', '<title>%s</title>' % SV['doc.title'], full, count=1, flags=re.S)
full = re.sub(r'(<meta name="description" content=")[^"]*(")', r'\g<1>' + SV['doc.description'] + r'\g<2>', full, count=1)
full = full.replace('<html lang="sv"', '<html lang="sv"', 1)

open('../llm-kurs.html', 'w', encoding='utf-8').write(full)
missing = sorted(k for lang in LANGS[1:] for k in SV if k not in CAT[lang] or not CAT[lang][k])
print('slides', len(out), 'bytes', len(full.encode()), 'languages', LANGS,
      'catalogued', {l: len(CAT[l]) for l in LANGS}, 'untranslated', len(missing))
if missing:
    print('  e.g.', missing[:6])
