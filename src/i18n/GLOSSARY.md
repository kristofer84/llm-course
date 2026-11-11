# Translation guide (sv → en)

The Swedish string **is** the message id. Every Swedish string in
`src/i18n/source/<group>.json` must appear as a key in
`src/i18n/en/<group>.json`, with the English text as the value. Missing keys fall
back to Swedish at runtime, so gaps are visible but wrong.

## Hard rules

1. **Key = source string, byte for byte.** Never "fix" the key: it is
   whitespace-normalised (runs of whitespace → one space, trimmed) but otherwise
   exactly the rendered Swedish string.
2. **Preserve inline markup exactly.** Values may contain `<b>`, `<i>`,
   `<code class="mk">`, `<span class="sh a">`, `<br>`, `<a …>`. Same tags, same
   attributes, same order, same count — only the words inside change.
3. **Never translate code or data.** Identifiers, formulas, shapes
   (`[T, 4096]`), file paths, flags, model names, API calls, CLI output and JSON
   stay verbatim. Inside `<pre>` blocks translate only human-language comments and
   prose strings — never code, identifiers, flags or numeric literals.
4. **Swedish example words are data.** Tokens such as `katt`, `kattens`, `satt`,
   `på`, `trött` are the tokenizer/attention examples the diagrams are built from.
   Keep them in Swedish; translate only the prose around them.
5. **Numbers.** Swedish decimal comma becomes a decimal point (`8,03` → `8.03`),
   thousands spacing becomes a comma (`128 256` → `128,256`) only in prose —
   never inside formulas, shapes, code or existing `<code>` spans.
6. **Quotes.** Swedish `”…”` becomes English `“…”`; `’` stays. No straight quotes.
7. **Tone.** Idiomatic technical English, second person (“you”), present tense,
   same register as the Swedish: direct, concrete, no filler, no marketing.
   Match sentence function, not sentence length: headings stay headings, list
   items stay short.
8. **Identity is allowed.** If a string is code, a term, a number or already
   English (`RMSNorm`, `x [T, 4096]`, `Attention`), map it to itself. It still has
   to be present in the JSON.

## Terminology (use consistently)

| Swedish | English |
| --- | --- |
| vikter / viktmatris | weights / weight matrix |
| aktivering(ar) | activation(s) |
| lager | layer |
| block | block |
| residual stream, strömmen | residual stream, the stream |
| shape | shape |
| vektor, matris | vector, matrix |
| skalärprodukt | dot product |
| matrismultiplikation, matmul | matrix multiplication, matmul |
| icke-linjäritet | non-linearity |
| normalisering, RMSNorm | normalization, RMSNorm |
| attention, head, KV head | attention, head, KV head |
| causal mask | causal mask |
| logits | logits |
| sannolikhet, fördelning | probability, distribution |
| sampling, temperature, top-k, top-p | sampling, temperature, top-k, top-p |
| token, tokenisering, tokenizer | token, tokenization, tokenizer |
| embedding, tabelluppslagning | embedding, table lookup |
| chat template, specialtoken | chat template, special token |
| prefill, decode | prefill, decode |
| KV-cache, KV-minne | KV cache, KV memory |
| batch, batching, genomströmning | batch, batching, throughput |
| latens, TTFT, ITL | latency, TTFT, ITL |
| kvantisering | quantization |
| parametrar | parameters |
| träning, next-token loss, gradient | training, next-token loss, gradient |
| slutprov | final exam |
| fusklapp | cheat sheet |
| ordlista | glossary |
| innehåll | contents |
| missförstånd | misconceptions |
| modul, slide, nivå | module, slide, level |
| grund / fördjupning / expert | basic / advanced / expert |
| riktning | direction |
| styrning, ablation, ingrepp | steering, ablation, intervention |
| modellvariant, tät modell, MoE | model variant, dense model, MoE |
| router, expert(er) | router, expert(s) |
| lång kontext, kontextfönster | long context, context window |
| resonerande modell | reasoning model |
| multimodala modeller | multimodal models |
| grafikkort, GPU | GPU |
| minne, minnesbunden | memory, memory-bound |
| beräkningsbunden | compute-bound |
| sekvens, position | sequence, position |
| prompt, svar, generering | prompt, response, generation |
| inference-motor, motor | inference engine, engine |
| schemaläggning, steg | scheduling, step |
| blocktabell, sidtabell, PagedAttention | block table, page table, PagedAttention |
| prefix caching | prefix caching |
| continuous batching, chunked prefill | continuous batching, chunked prefill |
| tensor parallelism, pipeline parallelism | tensor parallelism, pipeline parallelism |
| speculative decoding | speculative decoding |
| flöde | flow |
| felsökning | troubleshooting |
| rattar | knobs |
| kapacitetsplanering | capacity planning |
