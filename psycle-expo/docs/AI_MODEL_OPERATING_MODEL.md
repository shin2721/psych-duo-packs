# AI Model Operating Model

This document defines how AI models may be used in Psycle development. Product
principles stay in `PRINCIPLES.md`; implementation contracts stay in
`CONTENT_SYSTEM_SPEC.md`. This file must not duplicate either one.

## Current Mode

Psycle currently uses Codex as the default development operator. Other models
and Antigravity are optional and must not be assumed to be available.

For non-trivial work, Codex separates these passes even when one model performs
all of them:

1. inspect the relevant docs, diff, and runtime state
2. compare plausible causes or approaches
3. make one bounded change
4. review the change from an opposing perspective
5. verify with tests and, for UI work, Simulator
6. record only the remaining decision-relevant handoff

For lesson work, keep source modeling, raw pilot, critique, implementation, and
runtime judgment separate. A weak raw pilot is revised or rejected before JSON,
audits, XP, or UI are changed.

## Lesson Pipeline and Owner Time

The owner is the last reader of a lesson, not the first. Sending raw drafts to
them turned a single episode into two weeks of correction rounds, most of which
were errors an agent should have caught. The pipeline below exists to spend
agent passes instead of owner attention.

**Owner's part — two decisions, about twenty minutes per lesson**

1. **Approve the finding** (one minute). The agent pitches in four lines: the
   belief being tested, the verdict, why it is worth a reader's time, the grade
   of the evidence. The owner answers go or no.
2. **Taste the finished lesson** (fifteen minutes). One Simulator playthrough,
   feedback in one batch. Two rounds at most; if a third is needed, the pipeline
   failed, and the pipeline is what gets fixed.

Anything that changes what readers see beyond a lesson's own copy still needs
its own approval: adding a lesson to a course, monetization surfaces, deleting
existing work, and format-level changes.

**Agent's part — everything before the owner sees it**

1. Read the primary source in full. Record measurement, sample and design in the
   ledger, marking unreported items as unreported (checklist item 0).
2. Verify the belief being posed is the one the study tested (item 0.1).
3. Write the cards.
4. Trace every reader-visible string against a ledger line — cards, completion
   takeaway, per-card advice, preview copy, choices (item 8).
5. Run the machine gates: tsc, tests, validate-lessons.
6. **Run cross-review and fix what it finds.** This step was skipped for the
   whole of the anger episode, which is why the owner ended up performing it.
7. Play the lesson through in Simulator.
8. Deliver with a QA note: what the trace covered, what cross-review raised and
   how it was resolved, and any judgment call left open for the owner.

**How this is judged**

The next episode built this way should draw no factual or logical corrections
from the owner, within two rounds of taste feedback. Wording and readability
notes are expected and are not failures — those are the owner's job. Factual
corrections are the agent's failures, and if they persist, the fault is in the
pipeline rather than in the lesson.

## Optional Model Roles

These are current operating assumptions, not permanent rankings.

| Work | Useful model role | Required gate |
| --- | --- | --- |
| broad source and multimodal review | Gemini or another long-context model | extracted structure, not copied lesson text |
| raw pilot and prose critique | Claude or another strong long-form model | owner taste review before implementation |
| repository implementation | Codex | diff review, tests, and runtime proof |
| evidence extraction | model-assisted extraction plus deterministic checks | claim/source trace and human review when required |
| product acceptance | owner using the real app | machine scores cannot approve taste or meaning |

Codex may perform every role when it is the only available model, but it must
not treat its own draft, critique, and acceptance judgment as independent proof.

## Switching Models

Re-evaluate a role only when a major model update, repeated benchmark failure,
material cost or latency change, or source-format change could affect the
result. Do not switch because of general hype or one impressive answer.

Use the same small comparison pack before switching:

1. one Paleo-style research extraction
2. one D-Lab-style life-improvement extraction
3. one raw pilot from the same notes
4. one critique against `Raw insight first` and `Paleo-to-Practice`
5. one structured blueprint conversion

Compare source fidelity, evidence caution, daily-life transfer, raw readability,
contract fit, cost, latency, and owner preference. Record the date and winner by
work type; do not declare one model universally best.

## Reject Rules

- Do not generate many lesson files before one raw pilot passes human review.
- Do not add docs or audit rules to compensate for weak lesson content.
- Do not copy source wording or article structure into lessons.
- Do not promote an audit pass to product success.
- Do not change product contracts because a new model prefers another format.
- Do not enable an external-agent workflow without explicit owner approval.

`ANTIGRAVITY_PLAYBOOK.md` is retained only as an optional external-agent
workflow. `NORTH_STAR_PROGRESS.md` is updated only when North-Star behavior or
its operating evidence actually changes.
