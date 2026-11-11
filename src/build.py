import re,json,html
from leads import LEADS,level
OLD=['p2.html','p3.html','p4.html','p5.html','p6.html','p7.html','p8.html']
NEW=['n0.html','n0b.html','n6b.html','n8b.html','n1.html','n3.html','n3b.html','n3c.html','n3d.html','n3e.html','n5.html','n6.html','n8.html','n9.html','n10.html']
secs={}
for fn in OLD+NEW:
    s=open(fn).read()
    for m in re.finditer(r'<section class="slide"[^>]*data-title="([^"]+)"[^>]*>.*?</section>',s,re.S):
        secs[m.group(1)]=m.group(0)
MODS=[
 dict(name='Start',time=10),
 dict(name='Grunderna',time=15,hl=[0,1,2,3,4,5],lead='Fyra verktyg som används i varje steg av modellen: vektorer, matrismultiplikation, icke-linjäritet och softmax. Plus den viktigaste distinktionen i kursen.',
  desc='Vektorer, skalärprodukt, matmul, ReLU, softmax samt vikter mot aktiveringar.',
  goals=['läsa en shape som [T, 4096] och säga vad en matmul gör med den','förklara vad en skalärprodukt mäter och var den används','förklara varför modellen behöver icke-linjäritet','skilja på vikter och aktiveringar'],
  keys=['En vektor är en lista tal. Skalärprodukten mäter hur mycket två vektorer pekar åt samma håll.','x @ W: varje utvärde är en skalärprodukt mellan x och en kolumn i W. [T, d_in] @ [d_in, d_out] → [T, d_out], rad för rad.','Utan icke-linjäritet mellan lagren kollapsar hela modellen till en enda matris.','Softmax gör om tal till sannolikheter. Bara skillnaderna mellan logits spelar roll.','Vikter är fasta och används alla, varje gång. Aktiveringar räknas fram per token och är det man studerar.']),
 dict(name='Text → tokens',time=10,hl=[0,1,2],lead='Modellen räknar bara med tal. Här blir text till token-ids, och ids till vektorer.',
  desc='Tokenizer, BPE, chat template och embedding.',
  goals=['förklara varför text delas i subword-tokens','beskriva vad en chat template gör','ange shape före och efter embedding'],
  keys=['Tokenizern gör text till ids med en fast vokabulär: 128 256 tokens i Llama 3.','Antalet tokens, inte ord, styr kostnad, hastighet och hur mycket som ryms i kontexten.','En chat template gör en konversation till en enda sträng med specialtokens för roller.','Embedding är en tabelluppslagning: ids [T] → x [T, 4096].']),
 dict(name='Transformerblocket',time=90,hl=[3],lead='Kärnan i modellen: samma block 32 gånger. Vi går igenom varje tensor som skapas på vägen.',
  desc='Residual stream, RMSNorm, attention, RoPE, GQA, MLP, kod och alla shapes.',
  goals=['förklara vad transformer, decoder-only, block och residual stream betyder','förklara varför shapen är densamma genom alla block och var pre-norm normaliserar','räkna upp vikterna i ett lager och deras shapes','rita ett block med residual stream ur minnet','förklara vad attention och MLP gör och hur de skiljer sig','följa Q, K och V genom attention med rätt shapes','förklara causal mask, RoPE och GQA','räkna parametrarna i ett lager'],
  keys=['En decoder-only transformer är ett block (attention + MLP) upprepat L = 32 gånger, där varje token bara ser tokens före sig. Uppgiften: fylla varje tokens vektor med sammanhang.','Residual stream x är en arbetsyta per token som varje block läser och adderar till. Dess shape [T, 4096] ändras aldrig förrän i LM head.','Pre-norm: blocken läser en normaliserad kopia, strömmen själv får växa och normaliseras bara en gång, före LM head.','Ett lager är hela blocket: 7 viktmatriser (Wq, Wk, Wv, Wo, W_gate, W_up, W_down) och 2 normvikter, cirka 218 M parametrar. Alla 32 lager har samma shapes men olika värden.','Varje lager är två rader: x = x + Attention(RMSNorm(x)) och x = x + MLP(RMSNorm(x)). Normaliseringen görs på en kopia; strömmen själv bara adderas till.','Attention flyttar information mellan tokens (längs T). MLP:n bearbetar varje token för sig (längs d) och fungerar som tusentals detektorer.','Attention är det enda stället där positioner utbyter information: Q [32, T, 128], K och V [8, T, 128], scores [32, T, T].','Causal mask: position i ser bara 0..i. Därför ändras aldrig K och V för gamla positioner.','RoPE roterar Q och K så att bara avståndet mellan positioner spelar roll.','MLP:n arbetar per position: [T, 4096] → [T, 14336] → [T, 4096], och står för 70 % av parametrarna.','Totalt 8,03 B parametrar, ungefär 16 GB i bf16.']),
 dict(name='Logits → text',time=10,hl=[4,5],lead='Sista vektorn blir en sannolikhetsfördelning över nästa token, en token dras, och allt börjar om.',
  desc='LM head, sampling och den autoregressiva loopen.',
  goals=['förklara vad logits är och varför bara sista positionen behövs','beskriva vad temperature, top-k och top-p gör','beskriva loopen och dess stoppvillkor'],
  keys=['LM head: h [4096] @ W_U → logits [128256]. Bara sista positionen behövs vid generering.','Temperature skalar logits, top-k och top-p klipper bort svansen, sedan dras en token.','Generering är autoregressiv: ett forward pass per token tills ett stoppvillkor nås.','Temperature 0 är greedy men inte garanterat deterministiskt i en server.']),
 dict(name='Träning i korthet',time=10,hl=[0,1,2,3,4,5],lead='Var kommer vikterna ifrån? En kort bakgrund som förklarar varför inference ser ut som den gör.',
  desc='Loss, gradienter, minne och träningsfaserna.',
  goals=['förklara next-token loss','säga varför träning är parallell över sekvensen men generering seriell','förklara varför träning kräver åtta gånger mer minne per parameter'],
  keys=['Target är samma sekvens skiftad ett steg. Alla positioner tränas i ett enda forward pass.','Gradienten har samma shape som vikten. AdamW håller extra tillstånd: cirka 16 byte per parameter mot 2 vid inference.','Pretraining, SFT och RL ändrar bara vikterna, aldrig arkitekturen. En resonerande modell körs som vilken annan.']),
 dict(name='Inferens och KV-cache',time=45,hl=[1,2,3,4,5],engine=True,lead='Hur modellen faktiskt körs: två faser med helt olika flaskhalsar, och cachen som gör generering praktiskt möjlig.',
  desc='Prefill, decode, KV-cache, minne, batching, latens och kvantisering.',
  goals=['skilja prefill från decode och säga vad som begränsar vardera','förklara exakt vad KV-cachen sparar och varför det är korrekt','räkna KV-minne för en modell och en last','förklara varför batching ökar genomströmningen'],
  keys=['Prefill kör T rader per viktläsning och är compute-bound. Decode kör en rad och är memory-bound.','KV-cachen sparar K och V per position, lager och KV head: 128 KiB per token i Llama-3-8B. Den är exakt, ingen approximation.','Ett decode-steg är matmuls mot vikterna (delas av hela batchen) plus attention mot cachen (per sekvens, växer med kontexten).','Batching: vikterna läses en gång för B sekvenser, så genomströmningen ökar nästan linjärt.','Vikterna avgör om modellen får plats. KV-minnet avgör hur många samtidiga användare som får plats.','TTFT ≈ kö + prefill. ITL ≈ ett decode-steg.']),
 dict(name='Modellvarianter',time=20,hl=[3],lead='Samma grundidé, olika avvägningar. Vad skiljer modellerna åt, och vad betyder det för den som ska köra dem?',
  desc='MoE, attention-varianter, lång kontext, resonerande och multimodala modeller.',
  goals=['förklara MoE och skillnaden mellan totala och aktiva parametrar','jämföra MHA, GQA, MQA och MLA på cachestorlek','säga vad lång kontext, resonemang och bilder kostar vid inference'],
  keys=['MoE: en router väljer top-k experter per token och lager. Minnet bestäms av alla experter, beräkningen av de aktiva.','Färre KV heads (GQA, MQA) eller en latent cache (MLA) ger mindre KV-cache och därmed fler användare per GPU.','Lång kontext: KV-cachen växer linjärt, attention i prefill kvadratiskt.','Resonerande modeller har samma arkitektur men gör många fler decode-steg.','En bild blir hundratals vanliga positioner i residual stream.']),
 dict(name='vLLM inifrån',time=50,hl=[],engine=True,lead='Motorn runt modellen: hur vLLM tar emot requests, delar på GPU-minnet och fyller varje steg med så mycket nyttigt arbete som möjligt.',
  desc='Arkitektur, PagedAttention, prefix caching, batching, parallellism, loggar och mått.',
  goals=['beskriva vägen från HTTP-request till strömmad token','förklara PagedAttention, prefix caching och continuous batching','läsa startloggen och /metrics','välja rätt flagga för ett symptom'],
  keys=['Frontend (HTTP, text) och EngineCore (ids, GPU) är skilda processer. Motorn går i steg: schedule, execute, update.','KV-minnet är en pool av block om 16 tokens. En block table per sekvens översätter logiska block till fysiska.','Prefix caching: en hashkedja över fulla block gör att gemensamma början av prompter delas.','Continuous batching och chunked prefill: batchen bestäms om i varje steg inom en token-budget.','Batchen plattas ut till [N_tokens, 4096]. Logits räknas bara för sista token i varje request.','Tensor parallelism delar varje matris (två all-reduce per lager). Speculative decoding verifierar flera tokens per pass.']),
 dict(name='Tolkning',time=10,hl=[3],lead='Tillbaka till frågan som startade allt: hur kan man hitta ett beteende inne i modellen och ändra det?',
  desc='Riktningar, steering, ablation och Astra-experimentet.',
  goals=['förklara vad en riktning i residual stream är','skilja på steering, ablation och ändring av vikter','beskriva Astra-ingreppet i termer av tensorer'],
  keys=['Begrepp representeras ungefär som riktningar i residual stream och hittas som skillnaden mellan två gruppers medelaktivering.','x · r̂ mäter, x + α r̂ styr, x − (x · r̂) r̂ tar bort.','Samma ingrepp kan bakas in i de matriser som skriver till strömmen, utan att någon shape ändras.']),
 dict(name='Repetition',time=20,hl=[0,1,2,3,4,5],engine=True,lead='Knyt ihop allt: vanliga missförstånd, en fusklapp med alla formler och ett slutprov.',
  desc='Missförstånd, fusklapp, slutprov och vägen vidare.',
  goals=['reda ut de vanligaste missförstånden','hitta varje formel och siffra på ett ställe','klara slutprovet'],keys=None),
]
ORDER=[
 ['Från prompt till token','Vad är en språkmodell?','Kursens karta','Ett exempel hela vägen','Referensmodellen och notation'],
 ['@open','Vektorer och skalärprodukt','Matris gånger vektor','Varför icke-linjäritet?','Softmax','Vikter och aktiveringar','@sum','@quiz:m1'],
 ['@open','Varför tokens?','Tokenisering i praktiken','Chat template och specialtokens','Embedding: från id till vektor','@sum','Testa dig själv: tokens'],
 ['@open','Uppgiften: från vektorer till nästa token','Transformer och decoder-only','Ett block, staplat 32 gånger','Residual stream','Shapen ändras aldrig','Normalisering: varför och var','Hela modellen i en bild','Vad ett lager innehåller','Så blir det 8 miljarder','Blocket som ett löpande band','Ett lager inifrån','32 lager i en modellfil','Två rader, ett lager','RMSNorm','Attention och MLP: olika jobb','Attention i klartext','Attention-formeln bit för bit','Attention 1: Q, K och V','Attention 2: dela upp i heads','Attention 3: RoPE','Attention 4: scores och causal mask','Attention 5: hämta values','Attention räknat för hand','GQA: delade KV heads','MLP i klartext','MLP med SwiGLU','MLP:n som detektorer','Var parametrarna finns','Lager för lager','Spåra tensorerna genom modellen','Forward pass som kod','@sum','Testa dig själv: transformerblocket'],
 ['@open','LM head: från vektor till logits','Sampling: temperature, top-k, top-p','Den autoregressiva loopen','@sum','Testa dig själv: logits'],
 ['@open','Träning: next-token loss','Gradienter och minne','Från basmodell till assistent','@sum','Testa dig själv: träning'],
 ['@open','Vad är ett grafikkort?','Prefill och decode','KV-cache i klartext','KV-cache steg för steg','KV-cachen på riktigt: en minimodell','Ett decode-steg med shapes','Hur stor blir KV-cachen?','Vad ligger i GPU-minnet?','Varför batching räddar decode','Latensmått','Kapacitetsplanering','Kvantisering','@sum','Testa dig själv: inferens'],
 ['@open','Tät modell eller MoE','Routern','MoE i inferens','Attention-varianter','Lång kontext','Resonerande modeller','Multimodala modeller','Andra arkitekturer','@sum','Testa dig själv: modellvarianter'],
 ['@open','vLLM i klartext','vLLM: arkitekturen','En requests livscykel','Problemet: fragmenterat minne','PagedAttention','Prefix caching','Continuous batching','Chunked prefill och token-budget','Ett steg i model runner','Samplern och structured output','Tensor parallelism','Pipeline, data och expert parallelism','Speculative decoding','Flaggorna och vad de styr','Starta servern och läs loggen','Mät med /metrics','Felsökning: symptom och rattar','Hela flödet','@sum','Testa dig själv: vLLM'],
 ['@open','Riktningar i residual stream','Steering och ablation','Från hook till vikter: Astra','@sum','Testa dig själv: tolkning'],
 ['@open','Vanliga missförstånd','Fusklapp','Slutprov','Vidare härifrån'],
]
QUIZMAP={'Testa dig själv: tokens':'m2','Testa dig själv: transformerblocket':'m3','Testa dig själv: logits':'m4','Testa dig själv: inferens':'m6','Testa dig själv: modellvarianter':'m7','Testa dig själv: vLLM':'m8'}
STAGES=['Text','Tokens','Embedding','32 block','Logits','Sampling']
def minimap(m):
    hl=m.get('hl',[]);eng=m.get('engine',False)
    o=['<svg class="viz" viewBox="0 0 600 136" role="img" aria-label="Var modulen hör hemma i flödet" style="margin-top:18px">']
    o.append('<rect x="4" y="22" width="592" height="100" rx="10" fill="none" style="stroke:var(%s)" stroke-width="%s" stroke-dasharray="5 4"/>'%('--tok' if eng else '--line','2' if eng else '1'))
    o.append('<text x="14" y="14" class="s"%s>inference-motorn runt modellen</text>'%(' style="fill:var(--tok);font-weight:600"' if eng else ''))
    for i,n in enumerate(STAGES):
        x=16+i*96;on=i in hl
        o.append('<rect x="%d" y="52" width="84" height="40" rx="6" class="%s"%s/>'%(x,'bt' if on else 'bg','' if on else ' style="opacity:.7"'))
        o.append('<text x="%d" y="77" text-anchor="middle" class="s"%s>%s</text>'%(x+42,' style="fill:var(--ink);font-weight:600"' if on else '',n))
        if i<5:o.append('<line x1="%d" y1="72" x2="%d" y2="72" class="ln" marker-end="url(#ah)"/>'%(x+84,x+94))
    o.append('</svg>');return ''.join(o)
def opener(i,m):
    g=''.join('<li>%s</li>'%html.escape(x) for x in m['goals'])
    return ('<section class="slide" data-mod="%d" data-title="Modul %d: %s"><div class="si"><div class="opener"><div><p class="modnum">Modul %d av %d, cirka %d minuter</p><h1>%s</h1><p class="lead">%s</p></div>'
      '<div><h3 style="margin-top:0">När du är klar kan du</h3><ul class="goals">%s</ul>%s</div></div></div></section>')%(i,i,html.escape(m['name']),i,len(MODS)-1,m['time'],html.escape(m['name']),html.escape(m['lead']),g,minimap(m))
def summary(i,m):
    k=''.join('<li>%s</li>'%html.escape(x) for x in m['keys'])
    return '<section class="slide" data-mod="%d" data-title="Sammanfattning: %s"><div class="si"><p class="modnum">Sammanfattning av modul %d</p><h2>Det viktigaste: %s</h2><ol class="keys">%s</ol><p class="note">Kan du förklara varje punkt med egna ord för någon annan? Då är du redo för quizet på nästa slide.</p></div></section>'%(i,html.escape(m['name']),i,html.escape(m['name']),k)
out=[];used=set()
for i,lst in enumerate(ORDER):
    m=MODS[i]
    for t in lst:
        if t=='@open':out.append(opener(i,m).replace('<section class="slide" ','<section class="slide" data-level="1" ',1))
        elif t=='@sum':out.append(summary(i,m).replace('<section class="slide" ','<section class="slide" data-level="1" ',1))
        elif t.startswith('@quiz:'):
            out.append('<section class="slide" data-level="1" data-mod="%d" data-title="Testa dig själv: %s"><div class="si"><h2>Testa dig själv: %s</h2><div class="quiz" data-quiz="%s"></div></div></section>'%(i,m['name'].lower(),m['name'].lower(),t[6:]))
        else:
            s=secs[t];used.add(t)
            s=re.sub(r'<section class="slide"[^>]*>','<section class="slide" data-level="%d" data-mod="%d" data-title="%s">'%(level(t,False),i,t),s,1)
            if t in LEADS and 'class="plain"' not in s and 'class="lead"' not in s:
                s=s.replace('</h2>','</h2>\n  <p class="plain">%s</p>'%LEADS[t],1)
            if t in QUIZMAP:
                s=s.replace('</h2>','</h2>\n  <div class="quiz" data-quiz="%s"></div>\n  <h3>Räkna och resonera</h3>'%QUIZMAP[t],1)
            out.append(s)
unused=set(secs)-used
print('unused:',unused)
course=dict(mods=[m['name'] for m in MODS],desc=[m.get('desc','') for m in MODS],time=[m['time'] for m in MODS])
parts=[open('p1.html').read(),'\n'.join(out),open('p9.html').read(),'<script>window.COURSE=%s;</script>\n'%json.dumps(course,ensure_ascii=False)]
for j in ['j0.js','jd.js','j1b.js','j2b.js','j3.js','j4.js','j5.js','j6.js','j7.js','j8.js','jz.js']:parts.append(open(j).read())
full='\n'.join(parts)
open('../llm-kurs.html','w').write(full)
print('slides',len(out),'bytes',len(full.encode()))
