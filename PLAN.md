# Course review, foundations, and expansion plan

## Agreed direction

- Keep one coherent course sequence, with selectable depth rather than divergent curricula.
- Integrate additions where their prerequisites are taught; split dense modules if necessary.
- Teach missing foundations thoroughly at first use with worked examples and interactive visuals.
- Implement expansion last, after correctness, assessment, accessibility, and maintenance repairs.
- Preserve the single self-contained offline HTML artifact, Swedish/English parity, stable translation keys, and stored progress where possible.
- All repository prose, comments, and new commit messages are English; course content remains bilingual.

## Phase 1 — Correctness and trust

- [ ] Correct row-vector LoRA shapes and the false quality/knowledge limits.
- [ ] Correct early KV-cache complexity, graphic semantics, tokens/words, and KiB/KB labels.
- [ ] Correct local/global model ratios; distinguish hypothetical examples from model configurations.
- [ ] Qualify MoE specialization; orthogonality versus independence; universal transformer and character/token claims.
- [ ] Clarify Llama 3/3.1/Instruct examples, long-context arithmetic, and RoPE attribution.
- [ ] Synchronize prefill and AdamW summary/cheat-sheet qualifications with their lessons.
- [ ] Remove article-dependent phrasing; replace only layout-dependent “to the right” instructions.
- [ ] Add evidence-backed version/reference notes without falsely claiming GPU-tested vLLM compatibility.

## Phase 2 — Assessments and one-sequence depth

- [ ] Repair module/quiz score mapping and add the missing transformer-block checkpoint.
- [ ] Give every question prerequisite/depth metadata; filter questions and summary bullets consistently with lessons.
- [ ] Preserve stable question/option identities and migrate existing saved answers before moving banks.
- [ ] Improve plausible distractors, comparable specificity/length, and displayed answer-position balance.
- [ ] Make first-visit depth consistent with introductory advice while preserving saved preferences.
- [ ] Add short prediction/reveal checkpoints between dense mechanisms.
- [ ] Make recap/checkpoint promises accurate for every module, including the final module.

## Phase 3 — Accessibility and maintenance

- [ ] Make SVG selections and clickable tracer items focusable, named, keyboard-operable, and stateful.
- [ ] Prevent deck shortcuts from stealing control activation; retain focus through redraws.
- [ ] Test keyboard activation and state, including diagram accessibility-tree semantics.
- [ ] Simplify redundant level-label translation and verify bilingual switching.
- [ ] Review/baseline the 28 new labels; normalize the malformed padded key.
- [ ] Remove dead scripts/backups and obsolete migration tools; retain useful diagnostic scenarios in maintained tests.
- [ ] Add code copying, glossary-definition links, and accessible diagram expansion where useful.
- [ ] Distinguish viewed-slide progress from assessment mastery; retain persistent overall position.
- [ ] Record build provenance and update documentation and metadata counts.

## Phase 4 — Stronger foundations and visual learning

- [ ] Explain scalar/vector/matrix/tensor, shape compatibility, units, and weighted sums before use.
- [ ] Explain probability, logits, normalization, and nonlinearities with manipulable small examples.
- [ ] Explain weights/activations and training/inference distinctions explicitly.
- [ ] Explain GPU parallel work, memory capacity/bandwidth, compute, batching, and latency/throughput before systems detail.
- [ ] Add visual shape predictions and deliberate consolidation pauses inside attention/MLP material.
- [ ] Keep each new visual responsive, keyboard-operable, deterministic where appropriate, and bilingual.

## Phase 5 — Expansion (implemented last)

- [ ] Deepen quantization: symmetric/asymmetric, scales and zero points, groups, calibration, weight-only versus activations, error and quality/performance trade-offs; interactive numeric experiment.
- [ ] Deepen pretraining, SFT, preferences, RLHF/DPO, LoRA/QLoRA, instruction following, and data/evaluation separation; visual learning/update examples.
- [ ] Add evaluation: loss/perplexity, benchmarks versus task suites, factuality/hallucinations, held-out data, regression tests, and quantized-model evaluation; worked visual examples.
- [ ] Add tool calling: structured arguments, execution/orchestration loop, validation, permissions, untrusted tool results, and distinction from sampling; interactive loop.
- [ ] Add production operation: timeouts/cancellation, admission/rate limiting, autoscaling, failure recovery, tenant isolation, cost per token, tracing/observability; queue/capacity visual.
- [ ] Add a practical inference-server capstone with pinned reference commands, concurrent load, observability, configuration changes, TTFT/ITL/throughput, p50/p95/p99, and cost comparisons.
- [ ] Keep GPU/server execution optional so the entire explanatory course and simulations work offline.
- [ ] Extend module goals, summaries, quizzes, glossary, references, and final assessment to cover expansion.

## Acceptance and release

- [ ] Reproducible build; static translation, markup, numeric, placeholder, formula-line, key/reference, duplicate-ID, and uncovered-text checks.
- [ ] Automated checks for quiz prerequisites, per-depth inclusion, stable identity migration, module-score association, position balance, and glossary ordering.
- [ ] Bilingual browser checks for every original/new visual, keyboard controls, slide/hash navigation, level switching, language switching, code copying, and regressions (including ablation and mass-click stepper).
- [ ] Desktop/mobile overflow and offline operation checks. Run one browser worker at a time locally; use CI for the full suite.
- [ ] Independent review of implemented diffs, not merely agent summaries; address actionable findings.
- [ ] Commit, push, run the complete GitHub workflow, deploy, and compare published bytes with the final artifact.
- [ ] Record assumptions, actual validation limits, final slide/module/visual counts, and release results below.

## Assumptions and decisions

- User chose integrated expansion and thorough foundations, and permits splitting modules where necessary.
- New visitors start at Basics; existing saved depth is preserved. The same ordered course is used at every depth.
- External model/server examples have a documented reference release and verification instructions; they are not represented as GPU-tested unless actually executed.
- Optional hardware exercises do not become prerequisites for following the course.

## Completion notes

Implementation and verification results will be recorded here before release.
