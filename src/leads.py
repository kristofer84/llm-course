# Slide difficulty levels. Titles are the Swedish identifiers used in the
# sources (data-title) and in ORDER in build.py; they are not display text,
# so they stay Swedish and never enter the catalogs.
L3={'Forward pass som kod','32 lager i en modellfil','Spåra tensorerna genom modellen','Ett decode-steg med shapes','Chunked prefill och token-budget','Ett steg i model runner','Samplern och structured output','Tensor parallelism','Pipeline, data och expert parallelism','Flaggorna och vad de styr','Mät med /metrics','Felsökning: symptom och rattar'}
L1={'Från prompt till token','Vad är en språkmodell?','Kursens karta','Ett exempel hela vägen','Vektorer och skalärprodukt','Matris gånger vektor','Varför icke-linjäritet?','Softmax','Vikter och aktiveringar','Varför tokens?','Tokenisering i praktiken','Embedding: från id till vektor','Uppgiften: från vektorer till nästa token','Transformer och decoder-only','Ett block, staplat 32 gånger','Residual stream','Normalisering: varför och var','Hela modellen i en bild','Vad ett lager innehåller','Så blir det 8 miljarder','Blocket som ett löpande band','Attention och MLP: olika jobb','Attention i klartext','MLP i klartext','Lager för lager','Sampling: temperature, top-k, top-p','Den autoregressiva loopen','Träning: next-token loss','Från basmodell till assistent','Vad är ett grafikkort?','Prefill och decode','KV-cache i klartext','KV-cache steg för steg','Varför batching räddar decode','Latensmått','Tät modell eller MoE','Resonerande modeller','Multimodala modeller','vLLM i klartext','Continuous batching','PagedAttention','Riktningar i residual stream','Vanliga missförstånd','Fusklapp','Slutprov','Vidare härifrån'}
def level(title,generated):
    if generated or title.startswith('Testa dig själv') or title.startswith('Sammanfattning'):return 1
    if title in L3:return 3
    if title in L1:return 1
    return 2
