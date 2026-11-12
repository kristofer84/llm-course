# Technical references and example scope

This reference list supports the Phase 1 corrections. It does not expand the curriculum. The sources below are primary papers, model-owner model cards, or release-tagged implementation/documentation sources. External links require a network connection; the explanatory course and its simulations do not.

## Model identity, shapes, and memory units

- Meta's [Llama 3 8B base model card](https://huggingface.co/meta-llama/Meta-Llama-3-8B) and [Llama 3 8B Instruct model card](https://huggingface.co/meta-llama/Meta-Llama-3-8B-Instruct) distinguish pretrained text continuation from instruction-tuned chat. The original Llama 3 context is 8192 tokens. Instruct-specific chat formatting and turn-ending tokens must not be presented as the base model's interface.
- Meta's [Llama 3.1 8B Instruct model card](https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct) is the model identity used by the server command. Its maximum context is 131072 tokens (128K). The shown `--max-model-len 8192` deliberately limits that run. The [Llama 3 report](https://arxiv.org/abs/2407.21783) describes the extended-context training.
- The [Transformers v4.44.2 RoPE implementation](https://github.com/huggingface/transformers/blob/v4.44.2/src/transformers/modeling_rope_utils.py) has distinct `_compute_llama3_parameters` and `_compute_yarn_parameters` functions. Llama 3.1 uses frequency-dependent scaling: low frequencies are divided by the scaling factor, high frequencies are retained, and the intermediate range is smoothly interpolated. Calling this YaRN is not accurate.
- [Meta's Llama 3 tokenizer source](https://github.com/meta-llama/llama3/blob/main/llama/tokenizer.py) documents the byte-level BPE implementation and special tokens. A letter inside a multi-character token is not a separate sequence position; that is not a claim that a model cannot learn spelling.

With the course's 32 layers, 8 KV heads, head dimension 128 and bf16 K/V, cache storage per token is `2 × 32 × 8 × 128 × 2 = 131072 bytes = 128 KiB`. These are unsharded, unquantized logical cache sizes, excluding allocator overhead:

| Tokens in one sequence | KV bytes | Approximate storage |
| --- | ---: | --- |
| 8000 | 1048576000 | 1.05 GB |
| 128000 | 16777216000 | 16.78 GB = 15.625 GiB |
| 131072 (128K) | 17179869184 | 16 GiB |

A GB is 10^9 bytes; a GiB is 2^30 bytes; a KiB is 1024 bytes. A word is not a token. Llama 3 and Llama 3.1 8B share the core shapes used in this arithmetic, not the same context limit or weights. Calculator settings above 8192 tokens are memory estimates, not a claim that the original Llama 3 supports those sequences.

## Caching, attention, and model variants

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762), especially masked decoder attention, supplies the causal dependency argument: adding later tokens does not change an earlier position's K/V. Reusing an unquantized cache is mathematically equivalent to recomputation, but floating-point evaluation order can change logits slightly. [FlashAttention](https://arxiv.org/abs/2205.14135) is an exact-attention algorithm in this mathematical sense, not a promise of bitwise identical GPU outputs.
- Caching removes repeated computation of earlier token representations and K/V. It does **not** make all decode work constant: global attention still reads and compares against the growing context. The early bar chart counts positions whose K/V are computed at each growing-prefix step. Its triangular-versus-linear totals are not totals of all attention operations, FLOPs, memory reads, or elapsed time.
- [Gemma 2 technical report](https://arxiv.org/abs/2408.00118) and [Gemma 3 technical report, section 5.2](https://arxiv.org/html/2503.19786v1#S5.SS2) establish local:global ratios of 1:1 and 5:1 respectively. The [gpt-oss model card](https://arxiv.org/html/2508.10925v1) describes alternating banded-window and dense attention, hence 1:1. These are not all “mostly local” designs.
- The course's 28 local / 4 global layers, with a local window of 4096 and otherwise Llama 3 8B shapes, are **hypothetical**, not a Gemma, gpt-oss, or Llama configuration. At 32000 tokens: all-global KV is 3.90625 GiB; the hypothetical mixture is `(112 KiB × 4096) + (16 KiB × 32000) = 0.92578125 GiB`. Actual physical savings depend on the serving engine's hybrid-cache implementation; quality cannot be inferred from this memory calculation.
- [Mixtral of Experts, section 5](https://arxiv.org/html/2401.04088v1) reports routing patterns with syntactic/positional structure and no obvious topic-based assignment in its sampled layers and datasets. That observation about Mixtral is not a universal prohibition on domain specialization. Load-balancing objectives encourage balance rather than guaranteeing equal usage for every batch.
- Transformers are the focus here, not a universal definition of language models. The [Mamba paper](https://arxiv.org/abs/2312.00752) supplies a non-attention state-space counterexample. Separate attention heads also need not be statistically independent; zero dot product means orthogonality, not statistical independence.

## LoRA and training

- [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) freezes base weights and learns a low-rank update. Its column-vector notation must be transposed consistently for this course's row-vector convention: `W [d_in, d_out]`, `A [d_in, r]`, `B [r, d_out]`, so `y = x W + (α/r) · x A B`. The paper reports downstream quality comparable to or better than full fine-tuning on its evaluated tasks; there is no “never better than the base model” ceiling. Fine-tuning can change factual knowledge and skills as well as style, with results dependent on data, capacity, and training; it is not a reliable database update mechanism.
- The approximately 84 MB adapter example assumes rank 16, bf16 adapter parameters, and all seven attention/MLP projections in every layer of the 8B reference model. Different target modules, rank, dtype, and serialization overhead change the size.
- [Adam](https://arxiv.org/abs/1412.6980) uses first- and second-moment estimates; [Decoupled Weight Decay Regularization (AdamW)](https://arxiv.org/abs/1711.05101) separates weight decay from that update. It is not simply a step opposite to the current raw gradient. The common approximately 16-byte mixed-precision training budget includes weights, gradients, a master copy, and optimizer moments; activation storage is additional, and precision, implementation, sharding, and offloading change the budget.
- The prefill/decode bottleneck descriptions are rules of thumb, not universal classifications. Prefill becomes compute-bound only at sufficient arithmetic intensity; a short prompt can remain memory-bound. Small-batch decode is often bandwidth-bound, while larger batches, long context, kernels, and hardware can change the limiting resource. NVIDIA's [H100 technical specifications](https://www.nvidia.com/en-us/data-center/h100/) list the SXM variant's 80 GB and 3.35 TB/s bandwidth. The listed 1979 bf16 TFLOPS are explicitly with sparsity; the course uses the approximately 990 TFLOPS dense ceiling. These are theoretical hardware ceilings, not measured course performance.

## vLLM reference release: v0.11.0, V1

**This is a release-tagged documentation/source reference, not a GPU-tested compatibility claim, a latest-version recommendation, or a production support promise. No CUDA server, adapter execution, distributed KV transfer, or GPU benchmark was run for these corrections.**

The [v0.11.0 release notes](https://github.com/vllm-project/vllm/releases/tag/v0.11.0) explicitly state that V0 has been removed and V1 is the only engine. This makes it an appropriate documented reference for the shown frontend/EngineCore, V1 cache, metrics, and LoRA examples. Its release notes also warn about incorrect output with `--async-scheduling` in some cases; the course commands do not enable that option. Pinning this historical release documents the example's scope, not its suitability for an exposed production deployment.

Live retrieval of the release and tagged sources was used for the version claims. The tagged sources are preferred below because the rendered versioned documentation URL did not reliably return the requested page during review.

| Example area | Release-tagged primary evidence | What is covered / not covered |
| --- | --- | --- |
| Server CLI | [v0.11.0 argument definitions](https://github.com/vllm-project/vllm/blob/v0.11.0/vllm/engine/arg_utils.py) | `vllm serve`, model length, memory utilization, LoRA and KV-transfer arguments. Not proof that every flag combination works on every GPU. |
| Startup cache log | [V1 KV-cache utilities](https://github.com/vllm-project/vllm/blob/v0.11.0/vllm/v1/core/kv_cache_utils.py), [GPU worker](https://github.com/vllm-project/vllm/blob/v0.11.0/vllm/v1/worker/gpu_worker.py) | Cache capacity/concurrency messages and profiling. The course's 47.50 GiB / 389120 tokens / 47.50x values are constructed arithmetic, not captured logs. |
| Prometheus metrics | [V1 metrics implementation](https://github.com/vllm-project/vllm/blob/v0.11.0/vllm/v1/metrics/loggers.py), [metrics design document](https://github.com/vllm-project/vllm/blob/v0.11.0/docs/design/metrics.md) | The implementation defines `kv_cache_usage_perc`, `inter_token_latency_seconds`, request timings, prefix counters and `iteration_tokens_total`. Prometheus counters expose `_total`; histograms expose `_bucket`, `_sum`, and `_count`. The design document also discusses historical/V0 names, so do not treat every name in it as current V1. |
| Multi-LoRA | [LoRA documentation](https://github.com/vllm-project/vllm/blob/v0.11.0/docs/features/lora.md) | `--enable-lora`, `--lora-modules name=path`, per-request model selection and active adapter limits. The shown local adapter paths are placeholders: adapters must exist and match the exact base checkpoint and supported modules. Runtime adapter loading is separate, opt-in, and has security implications. |
| Prefix caching | [Automatic prefix caching documentation](https://github.com/vllm-project/vllm/blob/v0.11.0/docs/features/automatic_prefix_caching.md) | Reuse of shared prompt computation; it does not remove decode attention over the prefix. |
| Disaggregated prefill | [Disaggregated prefill documentation](https://github.com/vllm-project/vllm/blob/v0.11.0/docs/features/disagg_prefill.md) | Explicitly experimental; requires connector-specific producer/consumer configuration and dependencies. `--kv-transfer-config` alone is not a complete deployment. Transfer overlap, storage, transport, and latency vary by connector; steady ITL is a goal, not a guarantee. |

### Optional verification on a suitable host

1. Record the installed vLLM version (`vllm --version`), GPU model/count, driver, CUDA/runtime, model revision, tokenizer revision, dtype and full arguments. Compare `vllm serve --help` with the pinned argument definitions before adapting the example.
2. Obtain authorized access to the exact model checkpoint. For LoRA, supply real, compatible adapters; do not mistake the illustrative local paths for included assets.
3. Start the reference command with its 8192 limit. Capture the actual cache log and call the local chat endpoint. Check the local `/metrics` output after requests instead of assuming names or sample availability from another release.
4. Check a small deterministic prompt both with and without cache reuse under matching precision/settings. Allow numerical rounding differences rather than claiming bitwise reproducibility. Quantized KV is a separate approximation.
5. Test concurrency, memory pressure, preemption and any connector/adapter features actually needed. Record observed latency and failures separately from the theoretical examples. None of these steps is reported as completed here.

### Keeping the examples current

Update the reference release, source links, CLI examples, metrics, and explanatory caveats together. Re-run the website checks separately from GPU/server validation. The optional [inference lab](INFERENCE-LAB.md) records the environment and measurements needed for an actual hardware check; its instructions are not a report that such a check was performed here.
