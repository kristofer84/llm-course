# Course review, foundations, and expansion plan

## Agreed direction

- Keep one coherent course sequence, with selectable depth rather than divergent curricula.
- Integrate additions where their prerequisites are taught; split dense modules if necessary.
- Teach missing foundations thoroughly at first use with worked examples and interactive visuals.
- Implement expansion last, after correctness, assessment, accessibility, and maintenance repairs.
- Preserve the single self-contained offline HTML artifact, Swedish/English parity, stable translation keys, and stored progress where possible.
- All repository prose, comments, and new commit messages are English; course content remains bilingual.

## Phase 1 — Correctness and trust

- [x] Correct row-vector LoRA shapes and the false quality/knowledge limits.
- [x] Correct early KV-cache complexity, graphic semantics, tokens/words, and KiB/KB labels.
- [x] Correct local/global model ratios; distinguish hypothetical examples from model configurations.
- [x] Qualify MoE specialization; orthogonality versus independence; universal transformer and character/token claims.
- [x] Clarify Llama 3/3.1/Instruct examples, long-context arithmetic, and RoPE attribution.
- [x] Synchronize prefill and AdamW summary/cheat-sheet qualifications with their lessons.
- [x] Remove article-dependent phrasing; replace only layout-dependent “to the right” instructions.
- [x] Add evidence-backed version/reference notes without falsely claiming GPU-tested vLLM compatibility.

## Phase 2 — Assessments and one-sequence depth

- [x] Repair module/quiz score mapping and add the missing transformer-block checkpoint.
- [x] Give every question prerequisite/depth metadata; filter questions and summary bullets consistently with lessons.
- [x] Preserve stable question/option identities and migrate existing saved answers before moving banks.
- [x] Improve plausible distractors, comparable specificity/length, and displayed answer-position balance.
- [x] Make first-visit depth consistent with introductory advice while preserving saved preferences.
- [x] Add short prediction/reveal checkpoints between dense mechanisms.
- [x] Make recap/checkpoint promises accurate for every module, including the final module.

## Phase 3 — Accessibility and maintenance

- [x] Make SVG selections and clickable tracer items focusable, named, keyboard-operable, and stateful.
- [x] Prevent deck shortcuts from stealing control activation; retain focus through redraws.
- [x] Test keyboard activation and state, including diagram accessibility-tree semantics.
- [x] Simplify redundant level-label translation and verify bilingual switching.
- [x] Review/baseline the 28 new labels; normalize the malformed padded key.
- [x] Remove dead scripts/backups and obsolete migration tools; retain useful diagnostic scenarios in maintained tests.
- [x] Add code copying, glossary-definition links, and accessible diagram expansion where useful.
- [x] Distinguish viewed-slide progress from assessment mastery; retain persistent overall position.
- [x] Record build provenance and update documentation and metadata counts.

## Phase 4 — Stronger foundations and visual learning

- [x] Explain scalar/vector/matrix/tensor, shape compatibility, units, and weighted sums before use.
- [x] Explain probability, logits, normalization, and nonlinearities with manipulable small examples.
- [x] Explain weights/activations and training/inference distinctions explicitly.
- [x] Explain GPU parallel work, memory capacity/bandwidth, compute, batching, and latency/throughput before systems detail.
- [x] Add visual shape predictions and deliberate consolidation pauses inside attention/MLP material.
- [x] Keep each new visual responsive, keyboard-operable, deterministic where appropriate, and bilingual.

## Phase 5 — Expansion (implemented last)

- [x] Deepen quantization: symmetric/asymmetric, scales and zero points, groups, calibration, weight-only versus activations, error and quality/performance trade-offs; interactive numeric experiment.
- [x] Deepen pretraining, SFT, preferences, RLHF/DPO, LoRA/QLoRA, instruction following, and data/evaluation separation; visual learning/update examples.
- [x] Add evaluation: loss/perplexity, benchmarks versus task suites, factuality/hallucinations, held-out data, regression tests, and quantized-model evaluation; worked visual examples.
- [x] Add tool calling: structured arguments, execution/orchestration loop, validation, permissions, untrusted tool results, and distinction from sampling; interactive loop.
- [x] Add production operation: timeouts/cancellation, admission/rate limiting, autoscaling, failure recovery, tenant isolation, cost per token, tracing/observability; queue/capacity visual.
- [x] Add a practical inference-server capstone with pinned reference commands, concurrent load, observability, configuration changes, TTFT/ITL/throughput, p50/p95/p99, and cost comparisons.
- [x] Keep GPU/server execution optional so the entire explanatory course and simulations work offline.
- [x] Extend module goals, summaries, quizzes, glossary, references, and final assessment to cover expansion.

## Acceptance and release

- [x] Reproducible build; static translation, markup, numeric, placeholder, formula-line, key/reference, duplicate-ID, and uncovered-text checks.
- [x] Automated checks for quiz prerequisites, per-depth inclusion, stable identity migration, module-score association, position balance, and glossary ordering.
- [x] Bilingual browser checks for every original/new visual, keyboard controls, slide/hash navigation, level switching, language switching, code copying, and regressions (including ablation and mass-click stepper).
- [x] Desktop/mobile overflow and offline operation checks. Run one browser worker at a time locally; use CI for the full suite.
- [x] Independent review of implemented diffs, not merely agent summaries; address actionable findings.
- [x] Commit, push, run the complete GitHub workflow, deploy, and compare published bytes with the final artifact.
- [x] Record assumptions, actual validation limits, final slide/module/visual counts, and release results below.

## Assumptions and decisions

- User chose integrated expansion and thorough foundations, and permits splitting modules where necessary.
- New visitors start at Basics; existing saved depth is preserved. The same ordered course is used at every depth.
- External model/server examples have a documented reference release and verification instructions; they are not represented as GPU-tested unless actually executed.
- Optional hardware exercises do not become prerequisites for following the course.

## Completion notes

- Implemented 178 slides: 35 new teaching slides plus the restored checkpoint, final recap, and scaffolding for adjacent modules. There are 15 numbered modules plus Start, 88 questions, and 3,574 bilingual keys.
- Added 20 interactive visualizations and one static HTTP/client/server boundary diagram. The HTML contains 106 SVGs including module maps and hidden definitions.
- Split vLLM memory/scheduling from execution/operation; added adjacent quantization, evaluation, and tools/lab modules. No alternate curriculum was introduced.
- Independent reviews identified and resolved source-map override precedence, glossary matching before translation, a missing fixed-beta DPO condition, and missing truncation/request-setting evidence in the capstone. Screenshot review also led to whole-term glossary matching and a more compact HTTP diagram.
- Extended depth filtering to all 31 legacy reveal exercises/FAQ entries, not just scored questions and recap bullets. Moved the quantization exercise after its actual prerequisites.
- Fixed the previously broken resume behavior and localized resume title; corrected overview-stage module links after the original split.
- Legacy answer identities are migrated; credit for the substantially changed SFT question is reset. New visitors default to Basics, and existing saved depth is preserved.
- Full CI passed at a45b068: bilingual render/interaction, all new simulation boundaries, actual SVG keyboard activation/focus, 360px bilingual and 390px layout, study controls, ablation, and simultaneous stepper clicks. Final PR CI 43191227367 passed on 6161fa9 with stricter provenance, resume, glossary-boundary and migration assertions. Both capstone clients also passed mocked executions with token limits 1 and 64; completion/truncation evidence was preserved. The complete English lab guide is embedded offline, and quality fixtures/scoring code are included in the bilingual lesson.
- No local browser fan-out, CUDA model execution, real vLLM server, or GPU benchmark was run. Browser verification uses one sequential worker on GitHub runners. Lab commands are documentation-referenced and syntax/mock checked, not presented as hardware-validated results.
- Optional server work requires a suitable Linux/NVIDIA host, network/model downloads, and permission to use that hardware. The explanatory course and all simulations remain offline and hardware-independent.
- Released through PR #2 (https://github.com/kristofer84/llm-course/pull/2), merge b0ce9fd. Main workflow 43191789690 passed test, build and Pages deployment. Canonical live page and downloadable HTML both returned HTTP 200 and matched the artifact byte-for-byte: 1,345,498 bytes; SHA-256 ad936b016291ea15bc89f5675fdf06671b3773e15d14a3647b09ce8179531f43; content revision 34cd3c47b807.
- Final translation state: 3,574 keys; zero missing, behind or unreviewed translations; static checker zero warnings/failures. Browser audit found no unresolved Swedish runtime lookups. There are 88 questions across 15 banks; uniquely-longest correct choices are 25/88 English and 28/88 Swedish, versus 47/60 before rewriting; final exam 3/15 and 4/15 respectively. Visible positions are balanced independently at each depth.
- Remaining validation limits: no claim of universal assistive-technology compatibility, real-server compatibility, measured GPU performance, or representative model quality follows from website/browser tests or mocked clients. The optional lab describes how to collect those results on the reader’s own host. No promised implementation work remains unchecked above.
