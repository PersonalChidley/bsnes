# Lesson quality

The bar a captured lesson must clear before it is allowed to change a skill,
and the shape it takes when recorded.

## The bar

A lesson qualifies when all four hold:

1. **It happened.** There is a command, failure, diff, log line, or file you can
   point at. A lesson whose only support is that it sounds sensible is advice,
   and advice makes skills longer without making them sharper.
2. **A belief was wrong, or a gap was real.** Confirming what you already
   expected teaches nothing. The value is in the correction.
3. **It generalizes past this repository.** State it as a class of mistake. If
   removing the file names leaves nothing, it belongs in the backlog instead.
4. **It would change future behavior.** If an agent reading it would do exactly
   what they were going to do anyway, leave it out.

## The record

Keep captures terse while working:

```
LESSON — <one line, the class of mistake>
  Saw:     <what actually happened, with the evidence>
  Because: <the wrong belief or missing boundary>
  Next:    <what a future agent should do differently>
  Routes:  <skill(s) this bears on, or "none">
```

`Routes: none` is a legitimate outcome. Some lessons belong only in the
repository's own notes.

## Worked examples

**Qualifies.**

```
LESSON — Verify framework behavior against the installed runtime, not memory.
  Saw:     Asserted Next redacts thrown Server Action messages in production;
           confirmed by reading resolveErrorProd in the vendored react-server-dom
           client. Separately hypothesized CI skipped typecheck, planted a type
           error, and `next build` caught it — hypothesis wrong.
  Because: Framework behavior is version-specific and recollection is not
           evidence; both directions of the guess were checkable in minutes.
  Next:    Before acting on "the framework does X", read the installed artifact
           or run the real gate.
  Routes:  improve/review-conventions
```

**Qualifies.**

```
LESSON — Prefer failures that shout over failures that return empty.
  Saw:     Two modules composed the same lookup key inline with different
           separators. Every Map lookup missed, so every book reported 0%
           progress. Nothing threw; tests passed; the gate was green.
  Because: A Map miss is `undefined`, which is indistinguishable from "no data".
  Next:    When two places must agree on a derived key or format, export one
           constructor and test it. Treat a plausible-looking zero as suspect.
  Routes:  improve/review-checklist, test-coverage-review
```

**Qualifies.**

```
LESSON — Do not use publication state as a substitute for capability.
  Saw:     An upload action rejected draft and archived galleries even though
           staff permissions and storage paths were valid; shared galleries
           also failed because their deliberately-null owner was treated as
           "unassigned." Tests across all four states and shared scope exposed
           both assumptions.
  Because: Lifecycle visibility, authorization, and ownership were collapsed
           into one gate even though they answer different questions.
  Next:    Model each dimension explicitly and test the state/scope matrix,
           including meaningful null states and the selected narrower scope.
  Routes:  security-review, test-coverage-review
```

**Qualifies.**

```
LESSON — Meter scarce downloads only at the intentional consumption boundary.
  Saw:     A limited gallery archive needed a harmless GET confirmation and a
           POST that atomically claimed one use before signing the private R2
           object; otherwise previews or concurrent requests could consume or
           exceed the allowance.
  Because: Read-like previews and state-changing consumption have different
           retry, prefetch, and concurrency semantics.
  Next:    Keep previews side-effect free and atomically claim expiry,
           revocation, and usage before minting a short-lived credential.
  Routes:  security-review, test-coverage-review
```

**Does not qualify — restates the change.**

```
LESSON — Added bookProgress() to compute reading progress.
```

Nothing was corrected; this is a changelog entry.

**Does not qualify — cannot generalize.**

```
LESSON — The Bible OT strand has 12 lesson cards, not 13.
```

A fact about this data, useful in the backlog, useless in a skill.

**Does not qualify — already covered.**

```
LESSON — Scope every query to the household.
```

`AGENTS.md` states this as a standing constraint and `security-review` audits
it. Re-adding it dilutes both.

## Routing notes

- A lesson about **how to know something is true** — evidence, verification,
  honest reporting — belongs in the shared review conventions, where every
  specialist skill inherits it.
- A lesson about **what to look for** belongs in the review checklist, under the
  lens that would have caught it.
- A lesson that only bites one specialty belongs in that skill's own body.
- A lesson about the repository rather than the craft belongs in `AGENTS.md`,
  the project instructions, or the backlog — not in a skill.
