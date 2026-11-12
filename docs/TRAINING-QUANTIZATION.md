# Training and quantization expansion

## Scope and integration contract

This addition is a deterministic offline teaching lab, not a training framework or a GPU benchmark. It adds nine slides, five interactive SVG views, four training questions, six quantization questions and fifteen glossary terms. There are no model downloads, network calls, timers, random samples or GPU dependencies at runtime.

Owned sources:

- `src/training-lab.html`: nine bilingual-keyed slides; seven at level 1 and LoRA/QLoRA at level 2.
- `src/training-lab.js`: registrations followed by pure numerical helpers and visual initialization, to be included inside the existing shared script closure. Load after `jd.js` defines `QUIZ` and `GLOSS`, but before glossary/quiz initialization in `jz.js`. There are no script tags or additional outer closure.
- `src/training-manifest.json`: insert the five training lessons in original module 6 before `@sum`; add `quantization` after original module 7. Move the existing `Kvantisering` lesson there, retaining its level 2. The four new quantization lessons are level 1 and independently support all new summary bullets and core questions.
- `src/i18n/{sv,en}/training-lab.json`: matching catalogs, including all new module metadata, titles, accessible descriptions, controls, formulas and questions.

The `/* CONTRACT DATA START */` / `/* CONTRACT DATA END */` block is executable without a DOM when provided `QUIZ = {m5: []}` and `GLOSS = []`. It intentionally contains only registrations. Numerical functions before `/* INTERACTIVE VISUALS START` are also DOM-independent.

No build-system edits or generated artifacts are included. The integrating change must consume `new_modules` and `summary_requires`, include the JS before initialization and retain explicit source `data-level` values.

## Sequence and title-key mapping

All identifiers below are stable Swedish prerequisites, not alternate learning paths. Level 2 adds detail within the same sequence.

| Module / order | Swedish identifier | Level | `title.` suffix using build's whole-word 28-character slug |
| --- | --- | --- | --- |
| 6, before summary, 1 | Träning: ett synligt viktsteg | 1 | `traning-ett-synligt-viktsteg` |
| 6, before summary, 2 | Förträning och SFT: olika data | 1 | `fortraning-och-sft-olika` |
| 6, before summary, 3 | Preferenser: RLHF och DPO | 1 | `preferenser-rlhf-och-dpo` |
| 6, before summary, 4 | LoRA: frusen bas och låg rang | 2 | `lora-frusen-bas-och-lag-rang` |
| 6, before summary, 5 | QLoRA: vad har vilken precision? | 2 | `qlora-vad-har-vilken` |
| quantization, after existing lesson | Skala, nollpunkt och avrundning | 1 | `skala-nollpunkt-och` |
| quantization, next | Grupper, utliggare och fel | 1 | `grupper-utliggare-och-fel` |
| quantization, next | Kalibrering utan dataläckage | 1 | `kalibrering-utan-datalackage` |
| quantization, next | Vikter, aktiveringar och mätning | 1 | `vikter-aktiveringar-och` |

The catalog also supplies `mod.quantization.{name,desc,lead,goal.1..3,key.1..3,quizname}` and `title.{mod,summary,quiz}.quantization`.

## Numerical conventions and worked checks

### Gradient update — `trn-update-svg`

`trn-rate` selects a single SGD learning rate, always from the same starting weight. The toy loss is `L(w) = (w − 3)^2 / 2`, not a claim about real neural-network curvature.

- At `w = 1`, `g = −2` and `L = 2`.
- `w′ = w − ηg = 1 + 2η`.
- At `η = 0.5`, `w′ = 2`, `L = 0.5`.
- At `η = 1`, `w′ = 3`, `L = 0`.
- At `η = 2`, `w′ = 5`, `L = 2`; at `η = 2.5`, `w′ = 6`, `L = 4.5`.

The curve, points and text use the same `trnStep` result. SFT and pretraining still use next-token prediction; loss masks choose target positions, not necessarily the input context. Data partitions precede fitting and recipe selection.

### Preference margin — `trn-pref-svg`

`trn-margin` changes the reference-adjusted sequence log-ratio difference `m`; `trn-beta` changes `β`. The display computes `p = sigmoid(βm)` and `L_DPO = −ln p = softplus(−βm)` with a numerically stable softplus. This `p` is the pairwise preference model's probability, not the response's token-generation probability.

- `m = 0`: `p = 0.5`, `L = ln 2 ≈ 0.693147` for all selected positive β.
- `m = 1`, `β = 1`: `p ≈ 0.731059`, `L ≈ 0.313262`.
- `m = −1`, `β = 1`: `p ≈ 0.268941`, `L ≈ 1.313262`.

The reference policy, sequence-probability interpretation and relationship to KL-regularized policy optimization are explicit. A fixed-margin β sweep is not a simulation of trained-policy KL drift. Preference improvement does not certify truth or remove annotator bias.

### Low-rank shape — `trn-lora-svg`

`trn-rank` changes `r` from 1 to 4. With row-vector convention, `x [1,6]`, `W [6,4]`, `A [6,r]`, `B [r,4]` yield `xW + (α/r)xAB [1,4]`. We choose `α = r` to isolate shape and parameter counts. The base has 24 frozen parameters; A and B have `6r + 4r = 10r` trainable parameters. At r = 4 the adapter has 40 parameters, deliberately demonstrating that small examples need not save parameters. Rank limits the update's matrix rank, not learnable knowledge categories.

QLoRA's frozen low-bit base is distinguished from adapter precision, computation, activations and optimizer state. NF4 uses a nonuniform codebook; it is not the later uniform-integer demonstration. Gradients can traverse computations with frozen base weights to reach trainable adapters.

### Quantize/dequantize — `ql-scale-svg`

`ql-bits`, `ql-mode` and `ql-value` drive `qlEncode`. All rounding uses nearest integer with half-way ties toward positive infinity, matching JavaScript `Math.round`. Real kernels can use different rules.

- Symmetric narrow signed range: `Q = 2^(b−1) − 1`, `s = 2/Q`, `z = 0`, `q = clamp(round(x/s), −Q, Q)`. The most negative signed code is unused: 2-bit therefore uses only three levels.
- Affine unsigned range: `Q = 2^b − 1`, calibration endpoints `l = −1`, `u = 3`, `s = 4/Q`, `z = clamp(round(−l/s), 0, Q)`, `q = clamp(round(x/s) + z, 0, Q)`.
- Both reconstruct `x̂ = s(q − z)` and report signed error `x̂ − x`. The rounded affine zero point can shift representable endpoints; the range is not silently assumed to stay exactly `[−1, 3]`.
- Symmetric 4-bit at `x = 1.25`: `s = 2/7`, raw code 4, q = 4, `x̂ = 8/7 ≈ 1.142857`, error ≈ −0.107143.
- Affine 4-bit at the same x: `s = 4/15`, z = 4, raw code 9, q = 9, `x̂ = 4/3`, error ≈ 0.083333. At x = 4 the raw code is 19, clamped q = 15, `x̂ = 44/15`.

The diagram draws every used reconstruction level and the source/reconstruction positions; the output explicitly reports integer clamping.

### Group size and outliers — `ql-groups-svg`

`ql-group` and `ql-outlier` drive symmetric 4-bit quantization of `[0.12, −0.18, 0.24, −0.30, 0.15, −0.21, 0.27, o]`. Each group uses `max(abs(values))/7`; all current groups have nonzero scales. With o = 6:

- Group size 8: scale `6/7`; all seven small values round to zero; MSE = 0.0417375.
- Group size 4: scales `0.3/7` and `6/7`; the first group retains detail.
- Group size 2: four independent scales isolate more small values from the outlier.
- Storage accounting: 32 payload bits plus 16 bits per scale gives 96 / 64 / 48 total bits for group sizes 2 / 4 / 8. This excludes additional packing, padding and metadata; the 16-bit baseline is 128 bits.

The bar chart is explicitly zoomed to small values; the outlier is marked and its bar is capped, not passed off as a linear full-range chart. MSE comes from all eight uncapped values. MSE alone is not a model-quality score.

## Accessibility and verification limits

Every interaction uses persistent native labeled range/select controls. Redraws only replace SVG children, never the focused control. Each SVG has a translated accessible name and a neighboring live textual numerical output. Range values receive localized `aria-valuetext`. Charts have no pointer-only selection or animation. Mathematical symbols and numeric punctuation are not English prose.

Source-level validation covers Node syntax, DOM-free registration execution, key/placeholder/numeric parity, title slugs, markup structure and IDs, quiz prerequisites/depth and numerical edge/default cases. The integrating change must still run the built artifact's bilingual keyboard, layout/mobile, depth and navigation checks. No browser or GPU validation is claimed here.

## Primary sources and interpretation boundaries

- Ouyang et al., **Training language models to follow instructions with human feedback** (2022), [arXiv:2203.02155](https://arxiv.org/abs/2203.02155): SFT demonstrations, preference comparisons and the RLHF pipeline. This is one influential recipe, not a definition of every alignment method.
- Rafailov et al., **Direct Preference Optimization: Your Language Model is Secretly a Reward Model** (2023), [arXiv:2305.18290](https://arxiv.org/abs/2305.18290), especially the reference-policy log ratios and DPO objective. The course does not generalize reported empirical wins into universal truth or quality guarantees.
- Hu et al., **LoRA: Low-Rank Adaptation of Large Language Models** (2021), [arXiv:2106.09685](https://arxiv.org/abs/2106.09685): frozen base and trainable rank-decomposition updates. Our matrix order is transposed to the course's row-vector convention.
- Dettmers et al., **QLoRA: Efficient Finetuning of Quantized LLMs** (2023), [arXiv:2305.14314](https://arxiv.org/abs/2305.14314): backpropagation through a frozen quantized base into LoRA, NF4, double quantization and paged optimizers. The lab does not reproduce its hardware results.
- Jacob et al., **Quantization and Training of Neural Networks for Efficient Integer-Arithmetic-Only Inference** (2017/2018), [arXiv:1712.05877](https://arxiv.org/abs/1712.05877): affine integer quantization with scale and zero point. The lab states its own exact range and tie-breaking conventions rather than implying all deployment kernels are identical.
- Frantar et al., **GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers** (2022/2023), [arXiv:2210.17323](https://arxiv.org/abs/2210.17323): data-dependent post-training weight quantization.
- Xiao et al., **SmoothQuant: Accurate and Efficient Post-Training Quantization for Large Language Models** (2022/2023), [arXiv:2211.10438](https://arxiv.org/abs/2211.10438): activation outliers, calibration and weight/activation trade-offs.

These sources support mechanisms, not unsupported speed, memory or quality guarantees for an unspecified deployment. Runtime format support and actual gains require measurement of a pinned implementation on the target workload.
