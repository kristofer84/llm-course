"""Offline contracts for localized tokenizer snapshots and illustrative scenarios."""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKS = {locale: json.loads((ROOT / 'src/examples' / (locale + '.json')).read_text())
         for locale in ('sv', 'en', 'de')}
GOLDEN = {
    'sv': ('Katten satt på', [128000, 42, 14795, 274, 1617, 9292]),
    'en': ('The cat sat on the', [128000, 791, 8415, 7731, 389, 279]),
    'de': ('Die Katze saß auf der', [128000, 18674, 17816, 3059, 829, 8156, 7367, 2761]),
}
variable_keys = set(PACKS['sv']['vars'])
for locale, pack in PACKS.items():
    assert pack['schema'] == 1 and pack['locale'] == locale
    assert set(pack['vars']) == variable_keys
    assert pack['source']['sha256'] == 'e134af98b985517b4f068e3755ae90d4e9cd2d45d328325dc503f1c6b2d06cc7'
    assert pack['source']['officialGitBlob'] == 'b197f72effb9d5ed16ee0f5663e11e4cfac2ba62'
    for label, snapshot in [*pack['tokenizer'].items(), ('cache', pack['cache']), ('speculative prefix', pack['speculative']['prefix'])]:
        if not isinstance(snapshot, dict) or 'ids' not in snapshot:
            continue
        ids, pieces = snapshot['ids'], snapshot['pieces']
        assert len(ids) == len(pieces) == snapshot['count'], (locale, label)
        assert all(isinstance(i, int) and 0 <= i < 128256 for i in ids)
        if ids[0] == 128000:
            assert pieces[0] == '<|begin_of_text|>'
            pieces = pieces[1:]
        assert ''.join(pieces) == snapshot['text'], (locale, label, pieces)
    prompt = pack['tokenizer']['prompt']
    assert (prompt['text'], prompt['ids']) == GOLDEN[locale]
    assert pack['tokenizer']['numbers']['pieces'] == ['123', '456', '7']
    assert pack['cache']['promptLength'] == prompt['count']
    assert pack['cache']['ids'][:prompt['count']] == prompt['ids']
    assert len(pack['sampling']['candidates']) == len(set(pack['sampling']['candidates'])) == 6
    for piece, whole in zip(pack['sampling']['candidates'], pack['sampling']['wholeContinuations']):
        assert whole.startswith(piece), (locale, piece, whole)
    assert pack['walkthrough']['chosen'] == pack['sampling']['candidates'][0]
    training = pack['training']
    assert len(training['inputs']) == len(training['targets'])
    assert training['inputs'][1:] == training['targets'][:-1]
    assert training['inputs'][:prompt['count']] == prompt['pieces']
    assert training['targets'][training['highlight']] == pack['walkthrough']['chosen']
    bpe = pack['bpe']
    tokens = list(bpe['word'])
    assert len(tokens) == bpe['charCount'] and len(bpe['word'].encode()) == bpe['byteCount']
    for left, right in bpe['merges']:
        assert any(tokens[i:i+2] == [left, right] for i in range(len(tokens)-1))
        merged, i = [], 0
        while i < len(tokens):
            if tokens[i:i+2] == [left, right]:
                merged.append(left + right); i += 2
            else:
                merged.append(tokens[i]); i += 1
        tokens = merged
        assert ''.join(tokens) == bpe['word']
    assert tokens == bpe['final']
    scene = pack['scene']
    assert scene['attention'] == ['<bos>'] + scene['context']
    assert scene['context'][-1] == pack['words']['pronoun']
    assert scene['tokens'][scene['roles']['subject']] == pack['words']['subject']
    assert scene['tokens'][scene['roles']['pronoun']] == pack['words']['pronoun']
    assert scene['tokens'][scene['roles']['adjective']] == pack['words']['adjective']
    for role, index in scene['attentionRoles'].items():
        assert index == scene['contextRoles'][role] + 1
    weights = scene['valueWeights']
    assert len(weights) == len(scene['tokens'])
    for i, row in enumerate(weights):
        assert len(row) == len(weights)
        assert math.isclose(sum(row), 1, abs_tol=1e-12)
        assert all(math.isfinite(v) and v >= 0 for v in row)
        assert all(value == 0 for value in row[i+1:]), (locale, i, row)
    pronoun_row = weights[scene['roles']['pronoun']]
    assert max(range(len(pronoun_row)), key=pronoun_row.__getitem__) == scene['roles']['subject']
    if locale == 'de':
        assert pack['words']['conjunction'] == 'denn'
        assert scene['tokens'][scene['roles']['conjunction']-1] == ','
        assert scene['roles']['copula'] == scene['roles']['pronoun'] + 1
    spec = pack['speculative']
    prefix = 0
    while prefix < min(len(spec['draft']), len(spec['target'])) and spec['draft'][prefix] == spec['target'][prefix]:
        prefix += 1
    assert prefix == spec['accepted']
    assert spec['replacement'] == spec['target'][prefix] != spec['draft'][prefix]
    assert spec['committed'] == spec['draft'][:prefix] + [spec['replacement']]
    assert pack['vars']['example_spec_verify_T'] == len(spec['draft']) + 1
    assert pack['vars']['example_packed_starts'] == json.dumps([0, prompt['count'], prompt['count']+1, prompt['count']+2])
    mini = pack['mini']
    assert len(mini['vocab']) == len(set(mini['vocab']))
    assert all(0 <= i < len(mini['vocab']) for i in mini['promptIds'])
    assert mini['maxLength'] == len(mini['promptIds']) + 7
    graph, state, text, units = pack['lm']['states'], pack['lm']['start'], ''.join(pack['lm']['initial']), 0
    for options in graph.values():
        assert 0 < sum(option['p'] for option in options) <= 1.000000000001
        assert all(option['next'] == 'end' or option['next'] in graph for option in options)
    while state != 'end' and units < pack['lm']['maxUnits']:
        option = graph[state][0]
        text += option['text']; state = option['next']; units += 1
    assert state == 'end' and text == pack['tokenizer']['sentence']['text'] + '.', (locale, text)
    if locale != 'sv':
        assert not any(word in json.dumps(pack, ensure_ascii=False) for word in ('Katten', 'kattungar', 'mattan', 'eftersom', 'huvudstad', 'Tyskland'))
    print(f'OK {locale}: verified snapshots, shifts, merges, causal roles, speculation, grammar-state graph')

# Placeholder references are checked separately from translated prose/markup.
import re
for locale, pack in PACKS.items():
    for path in (ROOT / 'src/i18n' / locale).glob('*.json'):
        for key, value in json.loads(path.read_text()).items():
            for name in re.findall(r'\{\{(example_\w+)\}\}', value):
                assert name in pack['vars'], (locale, key, name)
print('OK: locale example variables resolve without network or a tokenizer dependency')
