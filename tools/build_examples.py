#!/usr/bin/env python3
"""Reproduce localized lesson datasets from a pinned Llama 3 tokenizer artifact.

Optional developer tool, not a build/browser dependency. Install tokenizers==0.22.2
and pass --tokenizer /path/to/tokenizer.json. Without --write, compare snapshots.
The artifact is byte-identical to Meta's published Git blob (see the source lock).
No model weights or inference are used. Probabilities/attention weights remain toys.
"""
import argparse
import copy
import hashlib
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'src/examples'
SOURCE = {
    'model': 'Meta-Llama-3-8B',
    'officialRevision': '8cde5ca8380496c9a6cc7ef3a8b46a0372a1d920',
    'officialGitBlob': 'b197f72effb9d5ed16ee0f5663e11e4cfac2ba62',
    'mirror': 'NousResearch/Meta-Llama-3-8B',
    'mirrorRevision': '315b20096dc791d381d514deb5f8bd9c8d6d3061',
    'sha256': 'e134af98b985517b4f068e3755ae90d4e9cd2d45d328325dc503f1c6b2d06cc7',
    'bytes': 9085698,
    'library': 'tokenizers==0.22.2',
}

SPECS = {
 'sv': {
  'prompt': 'Katten satt på', 'sentence': 'Katten satt på mattan',
  'cacheSentence': 'Katten satt på mattan och sov gott.',
  'fullWords': ['Katten','satt','på','mattan','eftersom','den','var','trött'],
  'roles': {'subject':0,'verb':1,'preposition':2,'place':3,'conjunction':4,'pronoun':5,'copula':6,'adjective':7},
  'words': {'subject':'Katten','subjectPhrase':'Katten','noun':'katt','verb':'satt','verbLemma':'sitta','preposition':'på','place':'mattan','conjunction':'eftersom','pronoun':'den','copula':'var','adjective':'trött','countryFrance':'Frankrike','countryGermany':'Tyskland','capital':'huvudstad'},
  'bpe': {'word':'kattungar','merges':[['t','t'],['k','a'],['ka','tt'],['u','n'],['un','g'],['a','r']]},
  'candidates':['mattan','golvet','soffan','bordet','taket','månen'],
  'specPrefix':'Katten satt','specDraft':' på mattan och sov','specTarget':' på mattan eftersom',
  'weightInputs':['katt','skatt','7×8'],
  'miniVocab':['katten','satt','på','mattan','och','sov','en','hund','.','den','var','trött'],
  'miniPrompt':['katten','satt','på'],
  'detectors': [['sov','vilade','låg'],['morrhår','kisse','spann'],['kaffe','jobbet','sömnbrist'],['de','dem','alla'],['self','return','('],['inte','aldrig','ingen']],
  'lens': [[' var',' är',',',' inte',' en'],[' inte',' så',' en',' väldigt',' trött'],[' trött',' hungrig',' inte',' så',' sömnig'],[' trött',' sömnig',' hungrig',' lat',' så'],[' trött',' sömnig',' hungrig',' lat',' mätt']],
 },
 'en': {
  'prompt':'The cat sat on the','sentence':'The cat sat on the mat',
  'cacheSentence':'The cat sat on the mat and slept well.',
  'fullWords':['The','cat','sat','on','the','mat','because','it','was','tired'],
  'roles':{'subject':1,'verb':2,'preposition':3,'place':5,'conjunction':6,'pronoun':7,'copula':8,'adjective':9},
  'words':{'subject':'cat','subjectPhrase':'The cat','noun':'cat','verb':'sat','verbLemma':'sit','preposition':'on','place':'mat','conjunction':'because','pronoun':'it','copula':'was','adjective':'tired','countryFrance':'France','countryGermany':'Germany','capital':'capital'},
  'bpe':{'word':'kittens','merges':[['k','i'],['ki','t'],['t','e'],['te','n'],['ten','s']]},
  'candidates':['mat','floor','sofa','table','roof','moon'],
  'specPrefix':'The cat sat','specDraft':' on the mat and slept','specTarget':' on the mat because',
  'weightInputs':['cat','tax','7×8'],
  'miniVocab':['The','cat','sat','on','the','mat','and','slept','a','dog','.','it','was','tired'],
  'miniPrompt':['The','cat','sat','on','the'],
  'detectors':[['slept','rested','lay'],['whiskers','kitty','purred'],['coffee','work','sleep deprivation'],['they','them','all'],['self','return','('],['not','never','none']],
  'lens':[[' was',' is',',',' not',' a'],[' not',' so',' a',' very',' tired'],[' tired',' hungry',' not',' so',' sleepy'],[' tired',' sleepy',' hungry',' lazy',' so'],[' tired',' sleepy',' hungry',' lazy',' full']],
 },
 'de': {
  'prompt':'Die Katze saß auf der','sentence':'Die Katze saß auf der Matte',
  'cacheSentence':'Die Katze saß auf der Matte und schlief gut.',
  'fullWords':['Die','Katze','saß','auf','der','Matte',',','denn','sie','war','müde'],
  'roles':{'subject':1,'verb':2,'preposition':3,'place':5,'conjunction':7,'pronoun':8,'copula':9,'adjective':10},
  'words':{'subject':'Katze','subjectPhrase':'Die Katze','noun':'Katze','verb':'saß','verbLemma':'sitzen','preposition':'auf','place':'Matte','conjunction':'denn','pronoun':'sie','copula':'war','adjective':'müde','countryFrance':'Frankreich','countryGermany':'Deutschland','capital':'Hauptstadt'},
  'bpe':{'word':'Kätzchen','merges':[['K','ä'],['Kä','t'],['c','h'],['ch','e'],['che','n']]},
  'candidates':['Matte','Bank','Couch','Seite','Wiese','Erde'],
  'specPrefix':'Die Katze saß','specDraft':' auf der Matte und schlief','specTarget':' auf der Matte, denn',
  'weightInputs':['Katze','Steuer','7×8'],
  'miniVocab':['Die','Katze','saß','auf','der','Matte','und','schlief','ein','Hund','.','sie','war','müde'],
  'miniPrompt':['Die','Katze','saß','auf','der'],
  'detectors':[['schlief','ruhte','lag'],['Schnurrhaare','Kätzchen','schnurrte'],['Kaffee','Arbeit','Schlafmangel'],['sie','ihnen','alle'],['self','return','('],['nicht','nie','kein']],
  'lens':[[' war',' ist',',',' nicht',' eine'],[' nicht',' so',' eine',' sehr',' müde'],[' müde',' hungrig',' nicht',' so',' schläfrig'],[' müde',' schläfrig',' hungrig',' faul',' so'],[' müde',' schläfrig',' hungrig',' faul',' satt']],
 },
}
PROBS = [[.16,.08,.06,.05,.04],[.12,.10,.08,.06,.04],[.18,.09,.08,.07,.05],[.34,.14,.10,.06,.04],[.46,.12,.09,.05,.03]]


def join_words(words):
    return ' '.join(words).replace(' ,', ',').replace(' .', '.')


def value_weights(tokens, roles):
    """Causal hand-picked word-level weights, not measured model Attention."""
    rows = []
    for i in range(len(tokens)):
        row = [0.0] * len(tokens)
        if i == 0:
            row[0] = 1.0
        else:
            row[i] = .4
            row[i-1] = .6
        rows.append(row)
    patterns = {
      'subject':[('subject',1)],
      'verb':[('subject',.7),('verb',.3)],
      'preposition':[('verb',.5),('preposition',.3),('subject',.2)],
      'place':[('preposition',.55),('place',.25),('verb',.1),('subject',.1)],
      'conjunction':[('verb',.35),('conjunction',.3),('place',.15),('subject',.2)],
      'pronoun':[('subject',.62),('place',.18),('pronoun',.12),('conjunction',.08)],
      'copula':[('pronoun',.55),('copula',.25),('subject',.2)],
      'adjective':[('subject',.45),('pronoun',.3),('copula',.15),('adjective',.1)],
    }
    for role, pairs in patterns.items():
        i = roles[role]
        rows[i] = [0.0] * len(tokens)
        for target, weight in pairs:
            rows[i][roles[target]] = weight
    return rows


def markov(locale, words):
    """Language-specific grammar states; surface words are never graph keys."""
    surface = {
      'sv': {'initial':['Katten'],'verbs':[' satt',' sov',' åt',' jamade'],'sat':[' på',' i',' still',' vid'],
             'places':[' mattan',' soffan',' golvet',' bordet'],'inside':[' soffan',' solen',' fönstret',' korgen'],
             'slept':[' i',' på',' hela',' gott'],'ate':[' sin',' långsamt',' fisk',' mat'],
             'food':[' mat',' fisk',' frukost',' middag'],'meow':[' högt',' och','.',' igen'],
             'time':[' dagen',' natten',' eftermiddagen',' tiden'],'and':' och','cause':' eftersom','was':' var','tired':' trött'},
      'en': {'initial':['The',' cat'],'verbs':[' sat',' slept',' ate',' meowed'],'sat':[' on',' in',' quietly',' beside'],
             'places':[' mat',' sofa',' floor',' table'],'inside':[' sofa',' sun',' window',' basket'],
             'slept':[' in',' on',' all',' well'],'ate':[' its',' slowly',' fish',' food'],
             'food':[' food',' fish',' breakfast',' dinner'],'meow':[' loudly',' and','.',' again'],
             'time':[' day',' night',' afternoon',' time'],'and':' and','cause':' because','was':' was','tired':' tired'},
      'de': {'initial':['Die',' Katze'],'verbs':[' saß',' schlief',' aß',' miaute'],'sat':[' auf',' in',' still',' neben'],
             'places':[' Matte',' Bank',' Couch',' Seite'],'inside':[' Sonne',' Küche',' Wohnung',' Hütte'],
             'slept':[' in',' auf',' lange',' gut'],'ate':[' ihr',' langsam',' Fisch',' Futter'],
             'food':[' Futter',' Frühstück',' Abendessen',' Essen'],'meow':[' laut',' und','.',' erneut'],
             'time':[' lange',' nachts',' tagsüber',' kurz'],'and':' und','cause':',','was':' war','tired':' müde'},
    }[locale]
    graph = {}
    def add(state, pieces, probabilities, targets):
        graph[state] = [{'text': t, 'p': p, 'next': n} for t,p,n in zip(pieces, probabilities, targets)]
    add('subject',surface['verbs'],[.38,.24,.14,.08],['sat','slept','ate','meowed'])
    add('sat',surface['sat'],[.52,.21,.12,.06],['on','in','tail','on'])
    if locale == 'sv':
        add('on',surface['places'],[.41,.22,.17,.10],['tail']*4)
        add('in',surface['inside'],[.30,.28,.20,.12],['tail']*4)
    else:
        add('on',[' the' if locale=='en' else ' der'],[1],['on_noun'])
        add('in',[' the' if locale=='en' else ' der'],[1],['in_noun'])
        add('on_noun',surface['places'],[.41,.22,.17,.10],['tail']*4)
        add('in_noun',surface['inside'],[.30,.28,.20,.12],['tail']*4)
    add('slept',surface['slept'],[.35,.28,.18,.11],['in','on','time' if locale!='de' else 'tail','tail'])
    add('ate',surface['ate'],[.33,.22,.18,.12],['food','tail','tail','tail'])
    add('food',surface['food'],[.45,.30,.15,.05],['tail']*4)
    add('meowed',surface['meow'],[.40,.20,.20,.10],['tail','subject','end','tail'])
    add('time',surface['time'],[.62,.25,.08,.03],['tail']*4)
    add('tail',['.',surface['and'],surface['cause']],[.6,.2,.1],['end','subject','denn' if locale=='de' else 'pronoun'])
    if locale=='de':
        add('denn',[' denn'],[1],['pronoun'])
    add('pronoun',[' '+words['pronoun']],[.95],['copula'])
    add('copula',[surface['was']],[.95],['adjective'])
    add('adjective',[surface['tired']],[.8],['tail'])
    return {'initial':surface['initial'],'start':'subject','states':graph,'maxUnits':18}


def make_pack(locale, spec, tokenizer):
    def encode(text, bos=False):
        ids = tokenizer.encode(text, add_special_tokens=False).ids
        pieces = [tokenizer.decode([i], skip_special_tokens=False) for i in ids]
        assert ''.join(pieces) == text, ('Token-byte reconstruction', text, pieces)
        if bos:
            ids, pieces = [128000] + ids, ['<|begin_of_text|>'] + pieces
        return {'text':text,'ids':ids,'pieces':pieces,'count':len(ids)}
    result = {'schema':1,'locale':locale,'source':SOURCE,'words':copy.deepcopy(spec['words'])}
    result['bpe'] = copy.deepcopy(spec['bpe'])
    tokens = list(result['bpe']['word'])
    for a,b in result['bpe']['merges']:
        assert any(tokens[i:i+2]==[a,b] for i in range(len(tokens)-1)), (locale,a,b,tokens)
        out=[];i=0
        while i<len(tokens):
            if tokens[i:i+2]==[a,b]:out.append(a+b);i+=2
            else:out.append(tokens[i]);i+=1
        tokens=out
    result['bpe'].update(initial=list(spec['bpe']['word']),final=tokens,charCount=len(spec['bpe']['word']),byteCount=len(spec['bpe']['word'].encode()))
    result['tokenizer'] = {'prompt':encode(spec['prompt'],True),'sentence':encode(spec['sentence']),
                           'numbers':encode('1234567'),'vocabSize':128256,'bosId':128000}
    prompt=result['tokenizer']['prompt']
    result['sampling']={'prefix':spec['prompt'],'candidates':[encode(' '+word)['pieces'][0] for word in spec['candidates']],
                        'wholeContinuations':[' '+word for word in spec['candidates']],'logits':[5.1,4.3,4.0,3.2,1.5,.2]}
    assert len(set(result['sampling']['candidates']))==6
    result['sampling']['ids']=[encode(piece)['ids'][0] for piece in result['sampling']['candidates']]
    assert all(encode(piece)['count']==1 for piece in result['sampling']['candidates'])
    result['walkthrough']={'prompt':prompt,'candidates':result['sampling']['candidates'][:5],'logits':[5.1,4.3,4.0,3.2,1.5],
                           'chosen':result['sampling']['candidates'][0]}
    training=encode(spec['sentence'],True)
    result['training']={'inputs':training['pieces'],'targets':encode(spec['sentence']+'.')['pieces'], 'highlight':prompt['count']-1}
    result['cache']=encode(spec['cacheSentence'],True)
    result['cache']['promptLength']=prompt['count']
    assert result['cache']['ids'][:prompt['count']]==prompt['ids']
    prefix=encode(spec['specPrefix'],True)
    draft=encode(spec['specPrefix']+spec['specDraft'])
    target=encode(spec['specPrefix']+spec['specTarget'])
    prefix_n=prefix['count']-1
    assert draft['ids'][:prefix_n]==prefix['ids'][1:]==target['ids'][:prefix_n]
    dp,tp=draft['pieces'][prefix_n:],target['pieces'][prefix_n:]
    accepted=0
    while accepted<min(len(dp),len(tp)) and dp[accepted]==tp[accepted]:accepted+=1
    assert accepted<len(dp) and accepted<len(tp)
    result['speculative']={'prefix':prefix,'draft':dp,'target':tp,'accepted':accepted,'replacement':tp[accepted],
                           'committed':dp[:accepted]+[tp[accepted]]}
    full=spec['fullWords'];roles=spec['roles'];context=full[:roles['pronoun']+1]
    context_roles={k:v for k,v in roles.items() if v<len(context)}
    result['scene']={'tokens':full,'roles':roles,'context':context,'contextRoles':context_roles,
                     'attention':['<bos>']+context,'attentionRoles':{k:v+1 for k,v in context_roles.items()},
                     'valueWeights':value_weights(full,roles),'lensPrompt':join_words(full[:roles['adjective']]),
                     'fullText':join_words(full)}
    result['workedAttention']={'tokens':[spec['words']['subject'],spec['words']['verb'],spec['words']['pronoun']],
                              'keys':[[2,0],[0,1],[1,1]],'values':[[1,0],[0,1],[.5,.5]],'query':[1.5,.5]}
    result['weightInputs']=spec['weightInputs']
    result['mini']={'vocab':spec['miniVocab'],'promptIds':[spec['miniVocab'].index(w) for w in spec['miniPrompt']],
                    'maxLength':len(spec['miniPrompt'])+7}
    result['detectors']=spec['detectors']
    result['lens']=[[[word,p] for word,p in zip(words,prob)] for words,prob in zip(spec['lens'],PROBS)]
    result['lm']=markov(locale,spec['words'])
    def chips(pieces):return ''.join('<span class="chip t">'+html.escape(t)+'</span>' for t in pieces)
    words=spec['words'];chosen=result['walkthrough']['chosen']
    result['vars']={
      'example_prompt':spec['prompt'],'example_sentence':spec['sentence'],'example_full_sentence':result['scene']['fullText'],
      'example_after_one':spec['prompt']+chosen,'example_subject':words['subject'],'example_subject_phrase':words['subjectPhrase'],
      'example_verb':words['verb'],'example_preposition':words['preposition'],'example_place':words['place'],
      'example_conjunction':words['conjunction'],'example_pronoun':words['pronoun'],'example_copula':words['copula'],
      'example_adjective':words['adjective'],'example_lens_prompt':result['scene']['lensPrompt'],
      'example_sampled_token':chosen.strip(),'example_prompt_T':prompt['count'],'example_prompt_chars':len(spec['prompt']),
      'example_prompt_ids':json.dumps(prompt['ids']),'example_prompt_positions':', '.join(str(i) for i in range(prompt['count'])),
      'example_prompt_shape':'[%d, 4096]'%prompt['count'],'example_prompt_id_shape':'[1, %d]'%prompt['count'],
      'example_bpe_word':result['bpe']['word'],'example_bpe_chars':result['bpe']['charCount'],'example_bpe_bytes':result['bpe']['byteCount'],
      'example_bpe_steps':len(result['bpe']['merges']),'example_bpe_final_count':len(result['bpe']['final']),
      'example_bpe_final':' | '.join(result['bpe']['final']),'example_bpe_first':result['bpe']['final'][0],
      'example_mini_prompt_T':len(result['mini']['promptIds']),'example_mini_max_T':result['mini']['maxLength'],
      'example_spec_draft_T':len(dp),'example_spec_verify_T':len(dp)+1,'example_spec_accepted_T':accepted,
      'example_spec_committed_T':accepted+1,'example_spec_mismatch':dp[accepted].strip(),'example_spec_replacement':tp[accepted].strip(),
      'example_spec_output':''.join(prefix['pieces'][1:]+result['speculative']['committed']),
      'example_packed_T':prompt['count']+2,'example_packed_prefill_T':prompt['count'],
      'example_packed_starts':json.dumps([0,prompt['count'],prompt['count']+1,prompt['count']+2]),
      'example_packed_logits':json.dumps([prompt['count']-1,prompt['count'],prompt['count']+1]),
      'example_word_context_T':len(context),'example_word_full_T':len(full),'example_attention_T':len(context)+1,
      'example_weight_a':spec['weightInputs'][0],'example_weight_b':spec['weightInputs'][1],
      'example_primary_chips':chips(result['tokenizer']['sentence']['pieces']),
      'example_primary_count':result['tokenizer']['sentence']['count'],
    }
    return result


def generate(tokenizer_path):
    raw=Path(tokenizer_path).read_bytes()
    assert hashlib.sha256(raw).hexdigest()==SOURCE['sha256'], 'Unexpected tokenizer artifact'
    assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==SOURCE['officialGitBlob']
    from tokenizers import Tokenizer
    tokenizer=Tokenizer.from_file(str(tokenizer_path))
    assert tokenizer.get_vocab_size()==128256 and tokenizer.token_to_id('<|begin_of_text|>')==128000
    packs={locale:make_pack(locale,spec,tokenizer) for locale,spec in SPECS.items()}
    for locale,pack in packs.items():
        other='en' if locale!='en' else 'de'
        secondary=packs[other]['tokenizer']['sentence']
        pack['comparison']={'locale':other,'snapshot':secondary}
        pack['vars'].update(example_secondary_chips=''.join('<span class="chip t">'+html.escape(t)+'</span>' for t in secondary['pieces']),
                            example_secondary_count=secondary['count'])
    return packs


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--tokenizer',required=True)
    parser.add_argument('--write',action='store_true')
    args=parser.parse_args()
    for locale,data in generate(args.tokenizer).items():
        path=DEST/(locale+'.json')
        encoded=json.dumps(data,ensure_ascii=False,indent=1)+'\n'
        if args.write:
            path.parent.mkdir(parents=True,exist_ok=True);path.write_text(encoded,encoding='utf-8')
        else:assert path.read_text(encoding='utf-8')==encoded, 'Snapshot differs: '+str(path)
        print(locale,'prompt T',data['tokenizer']['prompt']['count'],'sentence T',data['tokenizer']['sentence']['count'],
              'word context',len(data['scene']['context']),'draft',len(data['speculative']['draft']),'accepted',data['speculative']['accepted'])


if __name__=='__main__':main()
