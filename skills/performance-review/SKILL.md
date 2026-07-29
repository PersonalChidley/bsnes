---
name: performance-review
description: Measure and explain performance risks in a software repository across latency, throughput, database access, rendering, network payloads, caching, memory, and build or runtime work. Use for deep performance audits, slow-route or slow-query investigations, bundle and Core Web Vitals reviews, scalability assessments, or performance-focused change review. Do not use to make speculative micro-optimizations or perform a broad repository health review.
---

# Performance Review

Find performance constraints with measurements or strong trace evidence,
connect them to user or operational impact, and recommend the smallest useful
improvements without changing behavior.

## Select the mode

- Use **review** for a read-only performance assessment.
- Use **diagnose** for a named slow route, query, interaction, build, or job.
- Use **optimize** only when the user authorizes implementation.

Default to `review` when edit authorization is unclear.

## Establish inputs

- Read repository instructions and architecture guidance.
- Inspect version-control status and preserve unrelated changes.
- Identify deployment model, data stores, rendering modes, caching layers,
  expected traffic, representative data volume, and user-critical paths.
- Discover existing observability, profiling, benchmark, bundle, and database
  tools.
- Record the measurement environment and its limitations. Do not compare
  numbers gathered under materially different conditions as if equivalent.

## Preserve boundaries

- Do not optimize without a baseline or a traceable cost model.
- Preserve correctness, accessibility, authorization, tenant isolation,
  privacy, cache semantics, and public response contracts.
- Do not run load tests against production or third parties without explicit
  authorization.
- Do not add caching until invalidation, scope, freshness, and privacy are
  understood.
- Do not trade bounded work for unbounded memory, payload, or query growth.
- Separate measured bottlenecks from hypotheses and low-impact cleanup.

## Run the workflow

### 1. Map critical paths and budgets

Identify user and operational paths where delay matters. For each, describe
the request or interaction sequence, server and client work, database and
provider calls, payloads, cache boundaries, and expected data scale. Use
existing service objectives or budgets; otherwise state provisional comparison
criteria rather than inventing guarantees.

### 2. Establish a baseline

Use the most representative safe method available:

- route or function timing;
- database query counts and execution plans;
- browser performance traces and Core Web Vitals;
- bundle and network analysis;
- memory or CPU profiles;
- build and test duration; or
- repeatable microbenchmarks for isolated hot algorithms.

Warm up where appropriate, repeat measurements, report variance, and retain the
command, dataset shape, environment, and inputs needed to reproduce results.

### 3. Trace cost drivers

Inspect relevant risks:

- sequential independent work and request waterfalls;
- N+1 queries, over-fetching, missing bounds, and expensive sorts or joins;
- repeated computation, serialization, or provider calls;
- cache misses, unsafe cache scope, and ineffective invalidation;
- server/client component boundaries and hydration cost;
- oversized JavaScript, images, fonts, JSON, and embedded assets;
- synchronous work on latency-sensitive paths;
- retry storms, queue contention, concurrency limits, and backpressure;
- memory retention, large buffers, and unbounded collections; and
- build-time duplication or unnecessarily broad test execution.

Confirm that a suspected driver contributes materially to the observed cost.

### 4. Prioritize experiments

For each material finding, record evidence, affected path, user or operational
impact, confidence, expected improvement, implementation risk, and a
measurement that can confirm success. Prefer changes that remove work, batch
work, bound work, or move it off the critical path before tuning syntax.

### 5. Apply authorized optimizations

In `optimize` mode:

- make one attributable change at a time where practical;
- preserve ordering, time zones, filtering, authorization, and response shape;
- add regression tests for behavior-sensitive changes;
- add or retain a reproducible benchmark when ongoing performance matters; and
- revert or clearly report changes that do not improve the target metric.

### 6. Validate

- Re-run the same baseline under comparable conditions.
- Compare median and relevant tail or variance, not a single best run.
- Run correctness tests, type checking, and linting for changed code.
- Check sibling paths for cache leakage, worse payloads, or shifted work.
- Inspect the final diff and report measurement limitations honestly.

## Deliverable

Report:

1. scope, environment, workload, and baseline;
2. measured strengths and bottlenecks;
3. prioritized findings with evidence, impact, confidence, and experiment;
4. before/after results for implemented changes; and
5. residual risks and measurements still needed.

## Completion criteria

- Material findings are tied to measurements or explicit trace evidence.
- The workload and measurement method are reproducible.
- Recommendations preserve correctness and security constraints.
- Implemented changes show a comparable result or are reported as inconclusive.
- Speculation and unavailable measurements remain clearly labeled.
