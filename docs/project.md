# Kodergarden Project Guide

This document is the lightweight operating model for Kodergarden. It should make the next useful piece of work obvious without turning product development into project-management overhead.

## Product outcome

Kodergarden helps a teacher run an engaging introductory programming lesson in which students can build, run, submit, and discuss visual programs from classroom devices.

The current product milestone is **Pilot-ready classroom experience**.

The milestone is successful when:

- a teacher can run the suggested lesson on a real classroom network without developer intervention;
- 20–40 students can join, program, submit, and reconnect reliably;
- the teacher can review student solutions on a physical projector;
- the core editor works on at least one Android tablet and, when available, one iPad;
- pilot observations and the anonymous session export provide enough evidence to choose the next product investment.

Accounts, durable cloud progress, multi-instance Live sessions, and a broad curriculum are deliberately outside this milestone.

## Epics

| ID | Epic | Outcome | State |
| --- | --- | --- | --- |
| E1 | Learning experience | Students learn sequence, turns, repetition, and conditions through guided practice. | Built; validate in pilot |
| E2 | Authoring and simulation | Students can construct and understand programs comfortably on classroom devices. | Built; device QA pending |
| E3 | Live Classroom | A teacher can facilitate a synchronized class and review student work. | Built; classroom QA pending |
| E4 | Pilot operations | The app can be deployed, observed, supported, and evaluated during a pilot. | In progress |
| E5 | Curriculum expansion | Learning can extend beyond the current Foundations and Garden Expedition content. | Later |

## Milestones

### M1 — Pilot ready (current)

Complete the real-device and projector checks, resolve release-blocking defects, rehearse the lesson, and verify the deployable build.

### M2 — First observed classroom pilot

Run one class, retain only the intended pilot export and observation notes, and record evidence without prematurely redesigning the curriculum.

### M3 — Evidence-led iteration

Prioritize changes from observed learner and teacher friction. Decide whether persistence, curriculum growth, or Live Classroom reliability is the next outcome.

## Measures

For the first pilot, prefer a small evidence set over dashboard work:

- join success and the number of students who need help;
- submission and resubmission counts;
- reconnect failures;
- challenge completion and unexpected difficulty;
- whether students discover why Repeat is useful;
- whether teacher controls and projected content are readable and understandable;
- critical defects that interrupt or invalidate the lesson.

No numerical target is invented before a baseline pilot. After the first session, record the baseline and set targets for the next one.

## Delivery workflow

The board lives in [backlog.md](backlog.md) and uses these states:

1. **Backlog** — useful, but not yet committed.
2. **Next** — refined and ready to start, ordered from top to bottom.
3. **In progress** — actively being changed; limit this to two items.
4. **Review** — implementation is complete and evidence is being checked.
5. **Done** — acceptance criteria and the Definition of Done are satisfied.

Move work rather than copying it between columns. New ideas start in Backlog. Urgent defects may move directly to Next when they threaten the current milestone.

## Definition of Ready

A work item may enter **Next** when it has:

- a user or operational outcome;
- testable acceptance criteria;
- known dependencies or an explicit statement that there are none;
- a size small enough to finish and verify independently;
- no unresolved product choice that would materially change the implementation.

## Definition of Done

A work item is **Done** when:

- every acceptance criterion has objective evidence;
- relevant automated tests, typechecking, and the production build pass;
- affected English and Spanish behavior is checked when copy or UI changes;
- relevant tablet, projector, network, or accessibility checks are completed when automation cannot represent the environment;
- documentation is updated if setup, operation, constraints, or product behavior changed;
- no capability token, student program, or unnecessary personal data is logged or exported.

## Planning rules

- Prefer vertical, demonstrable stories over component-only work.
- Add tasks only when they help execute a story; tasks do not need their own acceptance criteria.
- Create a new epic only when several stories contribute to a distinct product outcome.
- Do not estimate by default. Add a simple small/medium/large marker only when sequencing requires it.
- Pilot observations outrank assumptions. Record an idea, but do not promote it to Next without evidence or a milestone need.
- Keep architectural decisions in [decisions.md](decisions.md); create it when the first decision needs preserving.

