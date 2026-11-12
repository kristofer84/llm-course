import json
import glob
import os
import re
import sys
import unicodedata
import hashlib

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tools"))
import i18n_dom as D  # noqa: E402
from leads import level  # noqa: E402

SOURCE_FILES = sorted(fn for fn in glob.glob('*.html') if fn not in ('p1.html', 'p9.html'))

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
    catalog = CAT.setdefault(loc, {})
    duplicate = set(catalog).intersection(data)
    if duplicate:
        raise SystemExit('Duplicate catalog keys in %s: %s' % (lf, sorted(duplicate)))
    catalog.update(data)
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
for fn in SOURCE_FILES:
    text = open(fn, encoding='utf-8').read()
    for m in re.finditer(r'<section class="slide"[^>]*data-title="([^"]+)"[^>]*>.*?</section>', text, re.S):
        if m.group(1) in secs:
            raise SystemExit('Duplicate source slide title: %s' % m.group(1))
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
# Stable catalog identities are independent of displayed module numbers.
for index, module in enumerate(MODS):
    module['id'] = str(index)
    module['time'] = {1: 35, 4: 60, 6: 40, 7: 55, 10: 15}.get(index, module['time'])
ORDER[3].append('@quiz:blocks')
ORDER[11].insert(ORDER[11].index('Slutprov'), '@sum')
SUMMARY_REQUIRES = json.load(open('summary-requirements.json', encoding='utf-8'))
EXERCISE_REQUIRES = json.load(open('exercise-requirements.json', encoding='utf-8'))
# Additions declare first-use insertion points in the original module sequence.
ADDITIONS = [json.load(open(path, encoding='utf-8')) for path in sorted(glob.glob('*-manifest.json'))]
for additions in ADDITIONS:
    for insertion in additions.get('insertions', []):
        target = ORDER[insertion['module']]
        at = target.index(insertion['before'])
        target[at:at] = insertion['titles']
    SUMMARY_REQUIRES.update(additions.get('summary_requires', {}))
# Keep scheduling/memory and execution/operation manageable in one sequence.
split_at = ORDER[9].index('Ett steg i model runner')
execution = ['@open'] + ORDER[9][split_at:]
ORDER[9] = ORDER[9][:split_at] + ['@sum', '@quiz:scheduling']
MODS[9]['summary_keys'] = ['mod.9.key.%d' % n for n in (1, 2, 3, 4)]
MODS[9]['time'] = 35
ORDER.insert(10, execution)
MODS.insert(10, dict(id='serving', time=65, hl=[], engine=True,
                    summary_keys=['mod.serving.key.1', 'mod.9.key.5', 'mod.9.key.6']))
for additions in ADDITIONS:
    for module in additions.get('new_modules', []):
        module = dict(module)
        titles = module.pop('titles')
        before, after = module.pop('before_module', None), module.pop('after_module', None)
        # Explicitly move reused lessons instead of rendering duplicate IDs.
        moved = {t for t in titles if not t.startswith('@')}
        for sequence in ORDER:
            sequence[:] = [t for t in sequence if t not in moved]
        anchor = str(before if before is not None else after)
        at = next(i for i, item in enumerate(MODS) if item['id'] == anchor)
        if after is not None:
            at += 1
        MODS.insert(at, module)
        ORDER.insert(at, titles)
LEVELS = {}
for title, section in secs.items():
    explicit = re.search(r'<section[^>]*data-level="([123])"', section)
    LEVELS[title] = int(explicit[1]) if explicit else level(title, False)
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
    ident = m['id']
    prefix = 'mod.' + ident
    goals = ''.join('<li data-i18n="%s.goal.%d"></li>' % (prefix, j)
                    for j in range(1, len(numbered(prefix + '.goal')) + 1))
    vars_ = json.dumps({'m': i, 'n': NMOD, 't': m['time']})
    note = '<p class="note" data-i18n="learning.vllm.reference"></p>' if ident in ('9', 'serving') else ''
    return ("""<section class="slide" data-level="1" data-mod="%d" data-title="%s" data-i18n-title="title.mod.%s"><div class="si"><div class="opener">
<div><p class="modnum" data-i18n="build.opener.num" data-i18n-vars='%s'></p>
<h1 data-i18n="%s.name"></h1><p class="lead" data-i18n="%s.lead"></p>%s</div>
<div><h3 data-i18n="build.opener.goals"></h3><ul class="goals">%s</ul>%s</div></div></div></section>"""
            % (i, fmt('title.mod.' + ident), ident, vars_, prefix, prefix, note, goals, minimap(i, m)))


def summary(i, m):
    prefix = 'mod.' + m['id']
    keys = []
    summary_keys = m.get('summary_keys', ['%s.key.%d' % (prefix, j)
                      for j in range(1, len(numbered(prefix + '.key')) + 1)])
    for key in summary_keys:
        required = SUMMARY_REQUIRES.get(key)
        if not required or any(t not in LEVELS for t in required):
            raise SystemExit('Missing summary prerequisite metadata: %s' % key)
        depth = max(LEVELS[t] for t in required)
        keys.append("""<li data-detail-level="%d" data-prerequisites='%s' data-i18n="%s"></li>"""
                    % (depth, json.dumps(required, ensure_ascii=False), key))
    return ("""<section class="slide" data-level="1" data-mod="%d" data-title="%s" data-i18n-title="title.summary.%s"><div class="si">
<p class="modnum" data-i18n="build.summary.num" data-i18n-vars='%s'></p>
<h2 data-i18n="build.summary.title" data-i18n-vars='%s'></h2><ol class="keys">%s</ol>
<p class="note" data-i18n="build.summary.note"></p></div></section>"""
            % (i, fmt('title.summary.' + m['id']), m['id'], json.dumps({'m': i}),
               json.dumps({'name': '#' + prefix + '.name'}), ''.join(keys)))


out = []
used = set()
title_keys = {}


def title_key(title):
    """Stable, unique key per slide title (slug() truncates long titles)."""
    if title not in title_keys:
        base = slug(title)
        key, n = base, 1
        while key in title_keys.values():
            n += 1
            key = "%s-%d" % (base, n)
        title_keys[title] = key
    return title_keys[title]


for i, lst in enumerate(ORDER):
    m = MODS[i]
    for t in lst:
        if t == '@open':
            out.append(opener(i, m))
        elif t == '@sum':
            out.append(summary(i, m))
        elif t.startswith('@quiz:'):
            out.append("""<section class="slide" data-level="1" data-mod="%d" data-title="%s" data-i18n-title="title.quiz.%s"><div class="si"><h2 data-i18n="build.quiz.title" data-i18n-vars='%s'></h2><div class="quiz" data-quiz="%s"></div></div></section>"""
                       % (i, fmt('title.quiz.' + m['id']), m['id'],
                          json.dumps({'name': '#mod.' + m['id'] + '.quizname'}), t[6:]))
        else:
            sec = secs[t]
            used.add(t)
            lvl = LEVELS[t]
            sec = re.sub(r'<section class="slide"[^>]*>',
                         '<section class="slide" data-level="%d" data-mod="%d" data-title="%s" data-i18n-title="title.%s">'
                         % (lvl, i, t, title_key(t)), sec, count=1)
            if slug(t) in LEADS and 'class="plain"' not in sec and 'class="lead"' not in sec:
                sec = sec.replace('</h2>', '</h2>\n  <p class="plain" data-i18n="lead.%s"></p>' % slug(t), 1)
            def annotate_exercise(match):
                key = match[1]
                required = EXERCISE_REQUIRES.get(key)
                if not required or any(title not in LEVELS for title in required):
                    raise SystemExit('Missing exercise prerequisite metadata: %s' % key)
                depth = max(LEVELS[title] for title in required)
                return ("""<details class="q" data-detail-level="%d" data-prerequisites='%s'><summary data-i18n="%s">"""
                        % (depth, json.dumps(required, ensure_ascii=False), key))
            sec = re.sub(r'<details class="q"><summary data-i18n="([^"]+)">', annotate_exercise, sec)
            if t in QUIZMAP:
                depths = [int(value) for value in re.findall(r'<details class="q" data-detail-level="([123])"', sec)]
                minimum = min(depths) if depths else 1
                sec = sec.replace('</h2>', '</h2>\n  <div class="quiz" data-quiz="%s"></div>\n  <h3 data-detail-level="%d" data-i18n="build.calc"></h3>' % (QUIZMAP[t], minimum), 1)
            out.append(sec)

print('unused:', set(secs) - used)
quiz_for_module = {}
for section in out:
    mod = re.search(r'data-mod="(\d+)"', section)
    quiz = re.search(r'data-quiz="([^"]+)"', section)
    if mod and quiz:
        quiz_for_module[int(mod[1])] = quiz[1]
lesson_positions = {re.search(r'data-title="([^"]+)"', section)[1]: index for index, section in enumerate(out)}
quiz_positions = {re.search(r'data-quiz="([^"]+)"', section)[1]: index
                  for index, section in enumerate(out) if 'data-quiz=' in section}
course = dict(quizForModule=quiz_for_module, slideLevels=LEVELS,
              lessonPositions=lesson_positions, quizPositions=quiz_positions,
              legacyQuiz=json.load(open('quiz-legacy.json', encoding='utf-8')),
              mods=['mod.' + m['id'] + '.name' for m in MODS],
              desc=['mod.' + m['id'] + '.desc' for m in MODS],
              time=[m['time'] for m in MODS])

# ---------------------------------------------------------------- assemble
parts = [open('p1.html', encoding='utf-8').read(), '\n'.join(out), open('p9.html', encoding='utf-8').read(),
         '<script>window.COURSE=%s;</script>\n' % json.dumps(course, ensure_ascii=False),
         '<script>window.I18N_DATA=%s;</script>' % json.dumps(CAT, ensure_ascii=False),
         '<script>\n' + open('vendor/i18next.min.js', encoding='utf-8').read() + '\n</script>',
         open('i18n/engine.js', encoding='utf-8').read()]
SCRIPTS = ['j0.js', 'jd.js', 'quiz-groups.js', 'learning.js', 'a11y.js', 'j1b.js', 'j2b.js', 'j3.js',
           'j4.js', 'j5.js', 'j6.js', 'j7.js', 'j8.js', 'foundations.js',
           'training-lab.js', 'operations-lab.js', 'course-ui.js', 'jz.js']
for j in SCRIPTS:
    if os.path.exists(j):
        parts.append(open(j, encoding='utf-8').read())
    elif j not in ('a11y.js', 'foundations.js', 'training-lab.js', 'operations-lab.js'):
        raise SystemExit('Missing runtime: %s' % j)
full = '\n'.join(parts)
# A content fingerprint is reproducible and avoids a self-referential Git SHA
# in a committed generated artifact. It is useful when diagnosing stale caches.
inputs = sorted(set(SOURCE_FILES + [j for j in SCRIPTS if os.path.exists(j)] +
                    glob.glob('*-manifest.json') + glob.glob('i18n/*/*.json') +
                    ['build.py', 'leads.py', 'p1.html', 'p9.html', 'i18n/engine.js',
                     'vendor/i18next.min.js', 'summary-requirements.json', 'exercise-requirements.json', 'quiz-legacy.json']))
fingerprint = hashlib.sha256()
for path in inputs:
    fingerprint.update(path.encode())
    fingerprint.update(open(path, 'rb').read())
full = full.replace('</head>', '<meta name="course-revision" content="%s">\n</head>' % fingerprint.hexdigest()[:12], 1)


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
                v = str(v)
                if v.startswith('#') and v[1:] in sv:
                    v = sv[v[1:]]
                val = val.replace('{{%s}}' % k, v)
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
