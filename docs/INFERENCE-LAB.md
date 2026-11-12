# Inference lab: one model, one shared sequence

This is an optional **manual execution** lab following the course's common sequence:
start locally → make one request → apply concurrent load → observe → compare quality.
Opening the course HTML never downloads weights, executes these commands, or starts a service.

**Status:** vLLM `0.11.0` is a release-tagged documentation reference, not a latest-release recommendation, a security/support promise, or a GPU-tested compatibility claim. No model download, CUDA service, GPU benchmark, native tool-call execution or throughput result was run to produce this lab. All course charts are constructed examples. Use the historical pin only on an isolated lab host; assess a maintained release before a real deployment and rerun compatibility/quality tests.

## 1. Model, license and host checklist

- Model: [Qwen/Qwen2.5-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct), a small public, ungated instruction model. Its [Apache-2.0 license](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct/blob/main/LICENSE) permits use subject to its terms; preserve required license/notices if redistributing. Public model availability is not a factuality or safety guarantee. Review the actual model revision, license and model card yourself.
- This is **not** Llama 3/3.1 8B, and the course's 32-layer Llama weight/KV arithmetic does not describe this Qwen model. Roughly 0.5 billion FP16 parameters occupy about 1 GB before runtime, allocator, activations and KV cache. Do not infer sufficient VRAM from weight size alone.
- Reference environment: Linux, Python **3.11**, a supported NVIDIA GPU and a driver/runtime compatible with the pinned vLLM wheel. Check the release's [GPU installation requirements](https://github.com/vllm-project/vllm/blob/v0.11.0/docs/getting_started/installation/gpu.md). Some GPUs/dtypes/platforms require different packages or are unsupported. This is not a CPU tutorial. Installation and startup may fail on an unsuitable machine.
- Use an idle GPU; check free VRAM and disk. Python/CUDA packages require several GB of disk in addition to model weights/cache. `--gpu-memory-utilization 0.5` is a budget setting, not a promise that 50% is sufficient or that the rest of a shared GPU is safe from contention. Never stop another user's process.
- Network access is required for the package index and dependencies, Hugging Face metadata/weights, and any redirected CDN/storage endpoints. The ungated model ordinarily needs no Hugging Face token; obey network policy and rate limits. No external account or paid API is required by the exercise. A disconnected host needs a separately prepared and verified local checkpoint and compatible wheels, outside this walkthrough.
- Keep the listener at **127.0.0.1:8000**. Do not expose it to a LAN/public address, open firewall ports or tunnel it publicly. This example has no production authentication or tenant gateway. Localhost can still be accessed by other local users/processes; use an isolated trusted host and synthetic inputs only.
- For vLLM flags, V1 behavior and metrics evidence, see [REFERENCES.md](REFERENCES.md#vllm-reference-release-v0110-v1), especially the tagged argument definitions and V1 metrics implementation. The reference release has only V1; no optional experimental async scheduling or distributed KV-transfer feature is enabled here.

## 2. Create an environment and record provenance

Run these yourself in a disposable lab directory, not from the course HTML:

```sh
python3.11 -m venv .venv-inference
. .venv-inference/bin/activate
python -m pip install "vllm==0.11.0"
vllm --version
python --version
python -m pip freeze > requirements-run.txt
nvidia-smi > gpu-run.txt
```

Installation may download large GPU dependencies. Do not override system Python/CUDA packages to force a conflicting install. Resolve compatibility using the release documentation or use another suitable host; do not silently change the version and report it as the same run.

For a repeatable checkpoint, resolve its immutable revision **explicitly** before starting the server. This manual command makes a network request for model metadata; it is not invoked by the course:

```sh
export MODEL_ID=Qwen/Qwen2.5-0.5B-Instruct
export MODEL_REV=$(python -c 'import json,urllib.request; print(json.load(urllib.request.urlopen("https://huggingface.co/api/models/Qwen/Qwen2.5-0.5B-Instruct", timeout=30))["sha"])')
printf '%s\n' "$MODEL_ID" "$MODEL_REV" > model-run.txt
```

Check that MODEL_REV is a nonempty commit SHA. Do not proceed after an API error. Record the exact tokenizer revision too; this lab uses the same checkpoint revision. Preserve the full command, hardware model/count, driver/CUDA information, OS, dtype, context limit, sampling settings, test-file hash, warmup policy and cache state with each result. A moving `main` revision is not enough for a later comparison.

## 3. Start the local server (terminal A)

With the environment and variables above active:

```sh
vllm serve "$MODEL_ID" \
  --revision "$MODEL_REV" --tokenizer-revision "$MODEL_REV" \
  --host 127.0.0.1 --port 8000 \
  --dtype half --max-model-len 2048 --gpu-memory-utilization 0.5 \
  2>&1 | tee server-run.log
```

The slide's shorter command omits the revision flags for readability; use the pinned form here for recorded comparisons. First startup downloads weights if they are not cached. Read the actual startup log for dtype, cache capacity and errors; no fabricated log is an observation. `--max-model-len 2048` is this run's prompt-plus-output budget, not the checkpoint's maximum supported context. `--dtype half` selects FP16; it is not INT4 quantization. A lower cache budget can reduce capacity or prevent startup. Do not enable `trust_remote_code`, adapters or arbitrary executable repositories for this exercise.

Keep terminal A open in the foreground. In terminal B, wait for readiness:

```sh
curl --fail --max-time 10 http://127.0.0.1:8000/health
curl --fail --max-time 10 http://127.0.0.1:8000/v1/models
curl --fail --max-time 10 http://127.0.0.1:8000/metrics > metrics-before.txt
```

A connection refusal during initialization is not a measurement. Inspect the server log and wait, rather than creating an unbounded retry loop. Do not proceed if another service already occupies port 8000. Confirm that `/v1/models` lists the expected model.

## 4. One non-streaming request

```sh
curl --fail --max-time 60 http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"Qwen/Qwen2.5-0.5B-Instruct","messages":[{"role":"user","content":"2 + 3 = ?"}],"max_tokens":32,"temperature":0,"stream":false}'
```

Inspect content, `finish_reason` and `usage`. A valid HTTP/JSON response does not demonstrate correct arithmetic. Chat input lets the server apply the checkpoint's chat template. Temperature 0 reduces sampling variation; kernels, batching and floating-point order can still prevent bit-identical output.

This request returns **one complete JSON object**. Timing it measures client end-to-end completion latency. It does **not** expose TTFT or ITL:

- **TTFT:** request submission to first actual generated content token. Use a correctly parsed streaming response or server instrumentation, not time to headers, a role-only event or the first byte of a completed JSON response.
- **ITL:** intervals between generated output tokens after the first. SSE events/chunks can contain multiple tokens and network/proxy buffering changes arrival times. One network chunk is not necessarily one token. Dividing total latency by token count is not measured ITL.
- **Total latency:** includes request/response transport, admission/queueing, tokenization, prefill, decode and serialization as seen by the client. Tool execution can add further application latency in a real system.

The course's tool-loop visual is a separate application simulation. This Qwen text-serving recipe does not assert verified native tool-call parser support, automatic permission checks or actual tool execution in vLLM. The model proposes structured arguments; a separate orchestrator validates, authorizes and executes. Keep tool output untrusted, limit retries and require approval/durable idempotency for sensitive side effects.

## 5. Concurrent load using only Python's standard library

Save the following as `lab-load.py`. No requests/aiohttp package is required. Start with the small, bounded workload; do not point this at another person's service. It performs one warmup outside the measured interval, then 40 non-streaming calls. Each worker uses a 60-second socket timeout and makes no automatic retry. The warmup is deliberately excluded; check the one-request exercise succeeded first.

```python
import concurrent.futures as cf, json, math, os, sys, time
from urllib.request import Request, urlopen
C, N = int(sys.argv[1]), 40
MAX_TOKENS = int(os.environ.get("LAB_MAX_TOKENS", "64"))
URL = "http://127.0.0.1:8000/v1/chat/completions"
payload = json.dumps({"model":"Qwen/Qwen2.5-0.5B-Instruct",
    "messages":[{"role":"user","content":"2 + 3 = ?"}],
    "max_tokens":MAX_TOKENS,"temperature":0,"stream":False}).encode()
def one(_):
    start = time.perf_counter()
    try:
        req = Request(URL, payload, {"Content-Type":"application/json"})
        with urlopen(req, timeout=60) as r: data = json.load(r)
        tokens = int(data["usage"]["completion_tokens"])
        answer = data["choices"][0]["message"]["content"]
        return time.perf_counter()-start, tokens, answer, None, data["choices"][0]["finish_reason"]
    except Exception as e:
        return time.perf_counter()-start, 0, None, type(e).__name__, None
one(0)
start = time.perf_counter()
with cf.ThreadPoolExecutor(max_workers=C) as pool:
    rows = list(pool.map(one, range(N)))
wall = time.perf_counter()-start
ok = sorted(r[0] for r in rows if r[3] is None)
def pct(q): return ok[math.ceil(q*len(ok))-1] if ok else None
print(json.dumps({"concurrency":C,"requests":N,"seconds":wall,
    "success":len(ok),"errors":N-len(ok),"max_tokens":MAX_TOKENS,
    "truncated":sum(r[4]=="length" for r in rows),
    "mean_s":sum(ok)/len(ok) if ok else None,
    "p50_s":pct(.50),"p95_s":pct(.95),"p99_s":pct(.99),
    "successful_output_tokens_s":sum(r[1] for r in rows)/wall,
    "results":rows}, ensure_ascii=False))
```

Run sequentially from the same activated environment:

```sh
python lab-load.py 1 > run-c1.json
python lab-load.py 4 > run-c4.json
python lab-load.py 8 > run-c8.json
curl --fail --max-time 10 http://127.0.0.1:8000/metrics > metrics-after.txt
```

Use a positive integer concurrency; only 1, 4 and 8 are needed. Increase the sample count only after checking capacity and rate limits. Client concurrency is the number of worker threads, **not** a specified server batch size or guaranteed running-sequence count.

### Interpret the result honestly

- The latency clock starts **inside the worker immediately before constructing/sending HTTP**. Waiting in the local ThreadPoolExecutor's task queue is excluded. Server queueing is included.
- This is a **closed-loop**, bounded-thread driver: a worker sends the next request only after the previous one returns. It is not a fixed-arrival-rate overload benchmark and can understate tails seen by independent arrivals. Do not infer arbitrary arrival-rate capacity from it.
- Every attempted request is represented in `results` as `[elapsed_seconds, successful_completion_tokens, answer, error_type, finish_reason]`. Errors have zero successful tokens. No retries are hidden. Review all errors and raw answers; a parsing error also counts as failure. A malformed or absent usage object is not estimated as success.
- The mean and nearest-rank percentiles include **successful requests only**, so report the success/error counts beside them. Otherwise a configuration dropping slow requests can look deceptively fast. Record error types/statuses and timeout policy in a serious benchmark.
- Aggregate throughput is **successful completion tokens divided by total measured wall time**, including time spent on failed requests. It is not the mean of per-request token rates and not input-plus-output tokens/s.
- **40 requests are insufficient for a stable p99**: nearest-rank p99 is the maximum at this size. Repeat at least three times, then use larger representative samples to estimate tails and uncertainty. Do not combine unlike runs into a single percentile without describing how.
- The single repeated prompt is a smoke workload, not a representative quality benchmark. Repetition can warm prefix caches; record cache settings/state and repeat with realistic prompt/output-length distributions before drawing capacity conclusions.
- More concurrency can improve batching/throughput while increasing individual latency. Record whether clients or CPU/network become bottlenecks. Socket timeouts are not guaranteed whole-request deadlines. A disconnect/timeout must be propagated and handled server-side to release future work/KV; in-flight GPU work may finish later.

### Server observation

Inspect the actual `/metrics` output and release-specific units. vLLM V1 0.11.0 defines metrics including `vllm:time_to_first_token_seconds`, `vllm:inter_token_latency_seconds` and `vllm:kv_cache_usage_perc`. Histogram series carry `_bucket`/`_sum`/`_count` suffixes; counters expose `_total`. Do not mix historical V0 names with V1 or assume all series exist before traffic. Compare before/after data for the run, rather than attributing all process-lifetime observations to it. Histogram quantiles are bucket estimates, not client raw-sample percentiles. Cache usage is not total GPU-memory utilization.

For a deployed application, join a request ID across gateway admission, server queue/prefill/decode, tool execution and response. Bound queue length, active work and per-tenant rates. Monitor rejected, failed, timed-out and cancelled work as well as successes. Redact personal data/secrets in logs and traces. This lab does not install an observability backend or production gateway.

## 6. Repeatable quality checks before changing configuration

Create `tasks.json` containing these **visible teaching fixtures**. They are smoke/development cases, not a secret independent held-out test. For a real comparison, freeze a representative task set and rubric before choosing the candidate; split by source document/user/time to avoid near-duplicate leakage. Keep separate development and untouched test data. Include language, rare cases, schema validity, grounded claims, abstention and known regressions. Open answers need evidence review and calibrated human scoring; an LLM judge is not ground truth.

```json
[
  {"id":"sum","prompt":"Reply with only the integer: 2 + 3 = ?","kind":"exact","expected":"5"},
  {"id":"extract","prompt":"From 'total=17;currency=SEK', return only the currency code.","kind":"exact","expected":"SEK"},
  {"id":"json","prompt":"Return only a JSON object with status equal to ok and count equal to the integer 2.","kind":"json","expected":{"status":"ok","count":2}},
  {"id":"grounded","prompt":"Evidence: Ada visited Oslo on Tuesday. Which city did Ada visit? Return only the city.","kind":"exact","expected":"Oslo"},
  {"id":"missing","prompt":"Evidence: Ada visited Oslo. What is Ada's age? If missing, return only UNKNOWN.","kind":"exact","expected":"UNKNOWN"},
  {"id":"swedish","prompt":"Svara bara med talet: tre plus fyra.","kind":"exact","expected":"7"}
]
```

Save this as `lab-quality.py`. It uses the same model and shared `LAB_MAX_TOKENS` setting as the load client and preserves the raw answer, finish reason and token usage. Its argument is the requested client concurrency. A six-case fixture can have at most six requests in flight; use a larger frozen representative suite to evaluate quality under a higher sustained load. Exact comparison intentionally penalizes extra text; the JSON fixture also checks that count is an integer (not a float or boolean). This fixture-specific check is not a general JSON Schema validator. Change the rubric only on development data, not after viewing your final test.

```python
import concurrent.futures as cf, json, os, sys
from urllib.request import Request, urlopen

with open("tasks.json", encoding="utf-8") as f:
    tasks = json.load(f)
C = int(sys.argv[1]) if len(sys.argv) > 1 else 1
MAX_TOKENS = int(os.environ.get("LAB_MAX_TOKENS", "64"))
assert C > 0 and MAX_TOKENS > 0
def grade(task):
    payload = json.dumps({
        "model": "Qwen/Qwen2.5-0.5B-Instruct",
        "messages": [{"role": "user", "content": task["prompt"]}],
        "temperature": 0, "max_tokens": MAX_TOKENS, "stream": False
    }).encode()
    try:
        req = Request("http://127.0.0.1:8000/v1/chat/completions", payload,
                      {"Content-Type": "application/json"})
        with urlopen(req, timeout=60) as r:
            data = json.load(r)
        choice = data["choices"][0]
        answer = choice["message"]["content"]
        try:
            value = json.loads(answer) if task["kind"] == "json" else answer.strip()
            passed = value == task["expected"]
            if task["kind"] == "json":
                passed = passed and isinstance(value, dict) and type(value.get("count")) is int
        except (ValueError, TypeError):
            passed = False
        return {"id": task["id"], "passed": passed, "answer": answer,
                "finish_reason": choice["finish_reason"], "usage": data["usage"]}
    except Exception as e:
        return {"id": task["id"], "passed": False, "error": type(e).__name__}
with cf.ThreadPoolExecutor(max_workers=C) as pool:
    records = list(pool.map(grade, tasks))
print(json.dumps({"requested_concurrency": C, "max_inflight": min(C, len(tasks)),
                  "max_tokens": MAX_TOKENS, "correct": sum(r["passed"] for r in records),
                  "total": len(tasks), "results": records}, ensure_ascii=False, indent=2))
```

```sh
python -c 'import hashlib,pathlib; print(hashlib.sha256(pathlib.Path("tasks.json").read_bytes()).hexdigest())' > tasks-sha256.txt
export LAB_MAX_TOKENS=64
python lab-quality.py 1 > quality-baseline.json
python lab-load.py 4 > run-c4.json
python lab-quality.py 4 > quality-c4.json
```

Run baseline load and quality checks, then change **one** item (for example concurrency, `LAB_MAX_TOKENS` or cache settings) and repeat both. Use the same token limit in the shared environment and pass the selected client concurrency to both scripts. These quality tasks differ from the repeated load prompt: record their prompt/length distribution and achieved concurrency rather than claiming identical batching. For a sustained-load quality claim, grade representative responses collected under that load. Do not call truncation a speedup with equal quality: inspect finish_reason and answer completeness. Smaller max_tokens also changes workload, so label that comparison honestly. Quantization is a separate candidate: use a compatible, appropriately licensed quantized checkpoint/engine configuration, record weight and KV precision independently, and reevaluate rare/numerical/schema/long-context cases. This lab supplies no verified INT4 startup recipe.

Use the same cases in pairs and list newly broken answers as well as fixes. Record the quality floor and latency/cost budget **before** testing. Loss/perplexity can supplement task scoring, but the non-streaming chat recipe does not compute teacher-forced perplexity; never derive it from sampled answer text or an arbitrary confidence claim.

Suggested report (fill only with your own observations):

| Configuration + revisions | Correct/total + regressions | Success/errors | p50/p95/p99 + N | Successful output tokens/s | Cost assumptions |
| --- | --- | --- | --- | --- | --- |
| baseline | not measured | not measured | not measured | not measured | not measured |
| one changed setting | not measured | not measured | not measured | not measured | not measured |

Repeat each performance run at least three times; distinguish cold-start, warmed and steady-state runs. Autoscaling is not instantaneous: new replicas must download/load weights and pass readiness, then drain safely before shutdown. Generation retries can change answers and cost. Side effects require persistent idempotency keys/deduplication and status reconciliation after ambiguous failure; tenant quotas and data/tool/cache isolation belong outside the model.

## 7. Worked arithmetic checks (not GPU results)

- Correct-token probabilities `[0.5, 0.25, 0.125]` give losses `[0.693147, 1.386294, 2.079442]` nats. Mean loss `ln(4) = 1.386294`; perplexity `exp(L) = 4`. PPL 4 is not 25% factual accuracy. Compare only matching tokenizer/data/masks.
- The 12-claim evidence-classification illustration has 6 supported and 6 unsupported claims. Baseline: TP=5, FN=1, FP=1, TN=5 (10/12). Candidate: TP=4, FN=2, FP=1, TN=5 (9/12), with 1 fix and 2 regressions. These are constructed labels, not a universal hallucination detector.
- 95 calls at 100 ms plus 5 at 1000 ms give mean 145 ms, nearest-rank p50=100 ms, p95=100 ms and p99=1000 ms. With 100 samples and only 1 slow call, p99 is still 100 ms. Always state your quantile convention and sample size.
- If a server costs $2/hour and delivers 1000 successful calls/hour with 64 output tokens each, fixed cost per million delivered output tokens is `2 × 1,000,000 / (1000 × 64) = $31.25`. This allocates fixed hourly cost; input computation, idle time and failed/cancelled work consume capacity without increasing the denominator. Network/storage/API fees and other variable costs are additional. Do not amortize only active GPU milliseconds while ignoring the paid idle hour.

## 8. Stop and clean up

1. Let the bounded client run finish, or use Ctrl-C in its own terminal. Thread workers can remain in socket operations until they return/time out; this is not a guaranteed immediate cancellation.
2. In **terminal A**, press Ctrl-C to stop your foreground vLLM server. Allow its workers to shut down. Do not use `killall` or kill unrelated GPU processes. If graceful shutdown fails, inspect your own process tree and target only the PID(s) you launched; termination can lose in-flight work.
3. Check that your listener is gone and GPU allocations have been released. This can take a short time; inspect before assuming a leak:

```sh
curl --max-time 2 http://127.0.0.1:8000/health
nvidia-smi
```

The curl request should fail once your server has stopped (a successful response could be another service—inspect ownership). `nvidia-smi` should show that your server's allocations/processes have gone, not necessarily an otherwise empty shared GPU. Deactivate the virtual environment with `deactivate`. Remove only lab-created result files/environments if desired. Model/package caches can be large and shared; do not delete a shared cache blindly. No cloud resource is provisioned by these instructions, but a rented host continues billing until you stop it through its owner/provider.

## Course integration contract

Owned additions are `src/operations-lab.html`, `src/operations-lab.js`, `src/operations-manifest.json`, the Swedish/English `operations-lab.json` catalogs and this guide. The manifest inserts the core offline prerequisite “HTTP, JSON och streaming” before “vLLM i klartext” in original module 9, and three production slides immediately before “Hela flödet”; the integrating build can move that serving material when splitting scheduling from serving. It also declares evaluation (25 minutes) then applications (35 minutes), both before original module 11. This is one sequence, not a branching path.

Registration is bounded by the exact CONTRACT DATA START/END comments so static tests can load quiz/glossary data without initializing DOM visualizations. New section roots have explicit depth levels. Interactive controls are native keyboard-accessible inputs/selects/buttons, every SVG has a bilingual description and every visualization supplies a text status. Main build integration, README/PLAN and the generated course artifact are deliberately outside this change.
