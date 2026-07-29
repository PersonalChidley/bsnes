# Output contracts

## Improvement backlog

Use the repository's existing format when it contains equivalent information.
Otherwise organize items under:

1. Critical
2. High
3. Medium
4. Low
5. Future Ideas

Each item must contain:

- **ID and title:** stable within the backlog and phrased as an outcome.
- **Description:** what should change or be decided.
- **Evidence:** repository-relative paths, observed behavior, or specialist
  finding. Mark inference explicitly.
- **Rationale:** consequence, risk, or maintenance value.
- **Recommended priority:** Critical, High, Medium, Low, or Future Idea.
- **Estimated effort:** S, M, or L, using the scale below.
- **Dependencies:** prerequisite decisions, work, expertise, or `None`.
- **Acceptance criteria:** observable conditions that close the item.

Do not hide eligibility, unresolved decisions, or verification needs inside an
effort estimate.

### Priority guide

- **Critical:** a verified, urgent risk to security, safety, data integrity,
  legal obligations, production correctness, or a load-bearing project
  invariant. It blocks affected release or operation.
- **High:** material correctness, architecture, test, security, or
  maintainability risk that should be addressed in the next work cycle.
- **Medium:** meaningful debt or documentation drift with bounded impact and no
  immediate operational threat.
- **Low:** useful cleanup with small or primarily local impact.
- **Future Idea:** optional capability or exploration, not required maintenance.
  Keep it out of current commitments.

### Effort guide

- **S:** local, well-understood change with limited review and validation.
- **M:** several related files or one meaningful design/test concern.
- **L:** cross-cutting work, migration, specialist review, or a decision with
  broad validation needs.

Effort is relative and does not imply elapsed time. State uncertainty when the
scope must be discovered first.

## Continuous-improvement guide

Cover:

- purpose, scope, owners, and triggers or cadence;
- repository review checklist;
- documentation review and authority process;
- architecture review and decision process;
- code-quality expectations;
- testing and reproducibility expectations;
- security, privacy, and dependency checks;
- release-readiness checklist;
- agent-instruction maintenance;
- backlog intake, prioritization, closure, and evidence rules; and
- exceptions, unresolved risks, and escalation.

Link to existing governing documents instead of copying their normative rules.

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

Do not invent numeric test or documentation coverage. If no measurement exists,
describe which components and behaviors were observed and which were not.
Separate verified defects from recommendations and open questions.
