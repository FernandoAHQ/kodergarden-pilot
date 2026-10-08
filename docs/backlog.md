# Kodergarden Delivery Board

Last reviewed: 2026-10-07  
Current milestone: **M1 — Pilot ready**

This file is the source of truth for near-term delivery. Keep **Next** ordered and no more than five items; keep **In progress** at two items or fewer.

## In progress

### KG-014 — Add If/Else as a learnable programming block

**Epic:** E1 Learning experience / E2 Authoring and simulation  
**Outcome:** A learner can express and observe a two-branch decision in a program.

Acceptance criteria:

- Version 1 programs remain valid and behave as before.
- Version 2 programs can contain `ifElse` with independently editable Then and Else bodies.
- Validation rejects `ifElse` in version 1 and applies existing depth and block limits to both branches.
- The interpreter executes exactly one branch and emits condition/highlighting paths that the UI can display correctly.
- The editor supports adding, moving, nesting, deleting, undoing, and redoing blocks in both branches.
- Read-only and live review views render both branches.
- English and Spanish labels and the Foundations challenge explain the new block consistently.
- Relevant automated tests, typechecking, and the production build pass.

Dependencies: none. Existing uncommitted workspace changes are the active implementation.

## Review

No items.

## Next

### KG-015 — Verify the release candidate automatically

**Epic:** E4 Pilot operations  
**Outcome:** The team knows the current code is safe to take into physical QA.

Acceptance criteria:

- `pnpm test` passes from a clean install-compatible workspace.
- `pnpm typecheck` passes.
- `pnpm build` produces the deployable server and web artifacts.
- The 40-client Live Classroom load scenario completes without an unhandled server exception.
- Any failure is captured as a separate defect with reproduction evidence rather than hidden in this item.

Dependencies: KG-014.

### KG-016 — Complete Android tablet QA

**Epic:** E2 Authoring and simulation / E3 Live Classroom  
**Outcome:** A student can complete the core lesson flow on a physical Android tablet.

Acceptance criteria:

- Every Android-relevant item in [pilot-checklists.md](pilot-checklists.md) is executed on a named device/browser.
- Portrait, landscape, and rotation during an active challenge are checked.
- Practice and Live flows are checked in English and Spanish.
- Results include date, device, browser, pass/fail, and concise notes.
- Every release-blocking failure has a reproducible defect item on this board.

Dependencies: KG-015 and access to a physical Android tablet.

### KG-017 — Complete iPad QA when hardware is available

**Epic:** E2 Authoring and simulation / E3 Live Classroom  
**Outcome:** The team understands whether the pilot experience is usable on iPadOS.

Acceptance criteria:

- Every iPad-relevant item in [pilot-checklists.md](pilot-checklists.md) is executed on a named iPad/browser.
- Results include date, OS/device, browser, pass/fail, and concise notes.
- Browser emulation is not recorded as a physical-device pass.
- Every release-blocking failure has a reproducible defect item on this board.

Dependencies: KG-015 and access to an iPad. If no iPad is available, record the limitation and do not block an Android-only pilot.

### KG-018 — Validate the teacher and projector experience

**Epic:** E3 Live Classroom / E4 Pilot operations  
**Outcome:** A teacher can operate the lesson and the class can read the projected experience.

Acceptance criteria:

- The projector checklist is completed at 1920×1080, 1366×768, and the pilot projector's actual resolution where available.
- The join code, participant count, challenge, submissions, student list, selected program, highlighting, and result are readable from the back of the room.
- The teacher can complete the lobby → preview → programming → review → playback → review flow without developer assistance.
- English and Spanish presentation are checked where relevant.
- Every release-blocking failure has a reproducible defect item on this board.

Dependencies: KG-015 and access to the classroom display or representative projector.

### KG-019 — Rehearse deployment and recovery

**Epic:** E4 Pilot operations  
**Outcome:** The facilitator can start and recover the pilot predictably.

Acceptance criteria:

- A production build starts as one Node process and serves the app, `/healthz`, `/readyz`, and Socket.IO from the same origin.
- A second device can join over the intended network.
- A temporary client network interruption reconnects while the server remains alive.
- A server restart produces the documented unavailable-session behavior; the facilitator can create a replacement session.
- The exact pilot start, network, firewall, and recovery steps are recorded in the README or checklist.

Dependencies: KG-015 and access to the intended network.

## Backlog

### KG-020 — Run the first observed classroom pilot

**Epic:** E4 Pilot operations  
**Outcome:** Product decisions are grounded in a real lesson rather than assumptions.

Acceptance criteria:

- The suggested lesson is run with teacher consent under the agreed classroom conditions.
- Teacher observations in [pilot-checklists.md](pilot-checklists.md) are recorded.
- The optional pilot JSON is exported only if appropriate for the pilot and inspected for the documented data boundaries.
- Incidents, learner friction, and teacher friction are captured as evidence, not immediately converted into solutions.
- A short pilot review identifies the three highest-value next actions.

Dependencies: KG-016, KG-018, KG-019, and resolution of all release-blocking defects. KG-017 is required only for an iPad pilot.

### KG-021 — Set post-pilot priorities from evidence

**Epic:** E4 Pilot operations  
**Outcome:** The next milestone invests in the most important observed constraint.

Acceptance criteria:

- Pilot evidence is summarized without student-identifying data.
- Observations are grouped into reliability, usability, curriculum, and facilitation themes.
- Each proposed story cites its evidence and expected outcome.
- One next product outcome is selected; lower-priority ideas remain in Backlog.
- M2 measures receive a baseline and, where useful, a target for the next pilot.

Dependencies: KG-020.

### KG-022 — Decide the next persistence boundary

**Epic:** E4 Pilot operations  
**Outcome:** Persistence is added only if pilot evidence shows that device-local progress or ephemeral sessions are inadequate.

Acceptance criteria:

- The decision compares no change, session recovery, teacher-owned class records, and student accounts.
- Privacy, child-safety, operational, and multi-instance implications are recorded.
- The selected option has a measurable user outcome and an incremental delivery path.
- No implementation begins until the decision is accepted.

Dependencies: KG-021.

## Done baseline

These capabilities existed when this board was created; commit history and tests are their implementation evidence. They are recorded as a baseline rather than reconstructed as retroactive stories.

- Visual language, validation, interpreter, grid runtime, and semantic playback events.
- Card-based editor with nested Repeat and If, drag/drop, undo/redo, and execution highlighting.
- Foundations Practice campaign and Garden Expedition advanced campaign with local progress.
- English and neutral Latin American Spanish UI.
- Live Classroom session lifecycle, server-side validation/evaluation, reconnect, review, and pilot export.
- Same-origin production deployment, health/readiness checks, rate limits, and structured redacted logs.
- Automated unit/integration coverage and a repeatable 40-client load scenario.

## Defect template

Copy this section into the appropriate board state:

```text
### KG-___ — Short observable problem

Epic:
Outcome:
Severity: release-blocking | high | normal | low

Evidence:
- Environment/device:
- Reproduction:
- Expected:
- Actual:

Acceptance criteria:
- The reproduction no longer fails.
- A regression check exists at the lowest practical test level.
```

