# Introductory training/inference demo

This replaces the old current-input training interaction on “Vad ändras vid inferens?”. The user
chose guided training followed by inference and asked for substantially clearer control explanations.

- Forward model: `y = x × w`, one learned scalar weight, initialized to 1.
- Fixed training pairs: `(1, 2), (2, 4), (3, 6)`; they do not change with the test-input slider.
- Batch objective: mean `0.5 × (xw − target)^2` across these three examples.
- Gradient: mean `x × (xw − target)`; fixed learning rate `η = 0.1`.
- Each explicit training click performs one batch gradient step. The illustrated sequence is capped
  at eight steps so every step remains legible and completion is explicit, not silently rounded away.
- First update: `w: 1 → 1.466666…`, mean loss `2.333333… → 0.663703…`.
- After eight: `w ≈ 1.99345379`, mean loss `≈ 0.00009998997` (not exactly zero).
- Training mode locks the probe slider at `x = 2`; the table and gradient still use all three pairs.
- Inference unlocks the probe `x ∈ [1, 5]` in 0.5 steps and freezes w. Moving x changes y, the teaching
  reference `2x`, and the probe error, never w, the training pairs, or the fixed-batch loss.
- The reference answer is displayed for teaching/checking; it is not an input to forward prediction.
- Input values 4 and 5 were not training examples. This constructed linear rule illustrates transfer,
  not a promise of generalization, factuality or real-model quality.
- Switching modes preserves learning; reset returns to training, w=1, input=2, zero steps/history.
- Explain the slider immediately next to it. A mode hint, table, weight/activation boxes, function
  plot, latest update, progress meter and optional numerical detail must reinforce the same distinction.
- Retain the caveat that fixed weights do not make an inference server stateless (KV caches etc.).
- All prose/controls/ARIA are Swedish, English and informal German; technical identifiers remain exact.

Validation covers all eight monotonic toy updates, final/initial reset, fixed data, immutable inference
weights, input/reference changes, training-only controls, exact before/after numbers, progress,
keyboard controls, mode transitions, and desktop/mobile rendering in all three languages.
