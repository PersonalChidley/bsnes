# Output contracts

## Improvement backlog

Use the repository's existing format when it contains equivalent information.
Otherwise organize items under Critical, High, Medium, Low, and Future Ideas.

Each item must contain:

- **ID and title:** stable within the backlog and phrased as an outcome.
- **Description:** what should change or be decided.
- **Evidence:** repository-relative paths, observed behavior, or specialist
  finding. Mark inference explicitly.
- **Rationale:** consequence, risk, or maintenance value.
- **Priority:** Critical, High, Medium, Low, or Future Idea.
- **Effort:** S, M, or L, with uncertainty stated when discovery remains.
- **Dependencies:** prerequisite decisions, work, expertise, or `None`.
- **Acceptance criteria:** observable conditions that close the item.

### Priority guide

- **Critical:** a verified and urgent risk to security, safety, data integrity,
  legal obligations, production correctness, or a load-bearing invariant.
- **High:** a material risk to address in the next work cycle.
- **Medium:** meaningful debt with bounded impact and no immediate threat.
- **Low:** useful cleanup with small or local impact.
- **Future Idea:** optional exploration, not required maintenance.

### Effort guide

- **S:** local, well-understood change with limited validation.
- **M:** several related files or one meaningful design or test concern.
- **L:** cross-cutting work, migration, specialist review, or broad decision.

## Repository health report

Conclude with:

- **Scope and limitations**
- **Strengths**
- **Weaknesses and risks**
- **Documentation coverage**
- **Code-quality observations**
- **Test-coverage observations**
- **Highest-value next improvements**
- **Changes made**
- **Validation performed**

Do not invent numeric test, documentation, performance, or health scores.
Separate verified defects from recommendations, inferences, and open questions.

## Portfolio report

Add:

- a per-repository summary using the same evidence standard;
- shared strengths and risks supported in more than one repository;
- repository-specific exceptions that must not be normalized away;
- cross-repository priorities with ownership and dependencies; and
- validation or environmental limits for each repository.
