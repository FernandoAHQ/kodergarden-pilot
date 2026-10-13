# P0–P4 implementation and release notes

Implemented in the current working tree. No production database or deployment was changed.

## Scope

- **P0:** branch-qualified execution paths, fixed-loop and condition fuel, bounded traces, separate goal/termination outcomes, per-hedge snapshots, one shared evaluator for Practice, Campaign, Live and publication. Saved AST versions 1–3 remain supported. Default scope is now explicitly **case-family** in all modes; an authored `active-case` policy checks only the displayed garden. This intentionally corrects the previous Live/Practice disagreement.
- **P1:** facilitator protocol and coded observation worksheet in `pilot-baseline-protocol.md` and `pilot-observations.csv`. Original Foundations IDs, worlds and constraints remain available. A classroom session has **not** been conducted by automated verification.
- **P2:** opt-in `foundations-pilot-v1` campaign with separate `pilot-v1-*` progress IDs: contrasting If/IfElse cases, zero-iteration While, goal-before-wall Until, and correctness independent of optional efficiency. Expedition descriptions now match the evidence their existing worlds can support.
- **P3:** one semantic trace player in Practice, Campaign, Live student and teacher projector. Pause/resume, next/back, replay and position slider operate on a bounded, frozen trace. Editing, changing activities and resets cancel prior playback. A playback pause does not suspend interpreter computation.
- **P4:** build/predict/debug/family types; catalog JSON policy, additive migration, admin controls, bilingual forms, bounded server evidence validation, teacher-only observation assignment, role-scoped recovery and de-identified exports. Correct results never automatically become independent/transferred observations. Prediction fixes the supplied program and records an endpoint and direction before the first run. Debug requires a changed solution plus a short explanation; explanation quality is teacher reviewed.

## Enable the pilot

1. Back up the target database using the existing deployment procedure.
2. Build and apply migrations: `pnpm build`, then `pnpm --filter @kodergarden/server migration:run`.
3. Set `ENABLE_CURRICULUM_PILOT=true` for the seed command and server environment.
4. Run `pnpm --filter @kodergarden/server catalog:seed`; existing published campaigns are skipped, and the pilot is inserted once.
5. Restart the server. Select **Foundations — pilot v1** in Practice's curriculum selector or the Live campaign chooser.

To withdraw the pilot, remove the flag or set it to `false`, then restart the server between sessions. The public catalog and newly started Live service omit the pilot. Its revisions and completion evidence remain stored for recovery. Do not revert the additive schema migration on a database containing authored evidence policies; hiding the pilot is the intended rollout reversal.

Existing published campaign content remains authoritative. Translated seed keys resolve through the updated web dictionaries; custom literal admin translations are retained. Existing active Live sessions should finish before a server restart. The assessment additions are additive in the v1 API; updated clients and server should be deployed together because older clients do not render new activity types.

## Evidence semantics and retention

- `correctness` is an automated outcome; `observation` is a teacher judgment for a particular attempt, initially `missing`.
- Assistance and prior playback are learner/client reports, not proof of independent work. The server strips unrecognized fields, including attempted student observation assignments.
- Teacher observations require a teacher capability and the current round in Review or Playback. Students receive only their own evidence. Explanations are visible only on the selected teacher submission and the student's own recovery state.
- The pilot export includes coded evidence, scope, activity type, occasion and per-case results. It excludes explanations, names, ASTs and capability tokens. Live records retain the existing in-memory session TTL/end-session lifecycle.
- Solo mode stores at most 100 coded attempt summaries locally, under `kodergarden.evidence.v1`, without names or explanations. Historical completion remains under its existing key. Completing an activity unlocks progress; it does not assert mastery.
- `initial`, `fresh`, and `delayed` are authored assessment occasions. A teacher must actually schedule the fresh/delayed check; a tag does not establish elapsed time or transfer.

## Validation

Automated checks cover all pilot reference programs, scope parity, construct counterexamples, safety stops at the goal, empty nested repeats, branch identity, semantic frame replay, malformed evidence, teacher authorization, export redaction, and catalog save/duplicate/publish/restore. Database tests use a disposable `kodergarden_test` database and never a production database.

Classroom comprehension, projector readability at actual viewing distances, and touch/keyboard behavior on school devices remain release gates. Use the accompanying protocol and record the software revision and device for each session.


Validation performed on 13 October 2026:

- `pnpm -r build`: passed, including web production bundle and server TypeScript.
- `pnpm test`: passed across language, engine, shared assessment, editor/playback, curriculum/progress, Live domain and socket integration. The shared assessment suite includes 94 checks; additional runtime and role/round authorization regressions pass.
- `pnpm test:database`: passed on a task-owned disposable PostgreSQL 17 database, including baseline preservation and pilot save/duplicate/publish/restore/visibility.
- `pnpm test:live-load`: passed the existing 40-student integration scenario against that disposable database.
- Browser check: teacher selects pilot prediction activity; student commits position/direction before Run; supplied program controls remain disabled; pause, next/back and resume restore trace frames; submission reaches teacher; automated correct result retains missing observation until teacher explicitly changes it; English/Spanish teacher review renders.
- `git diff --check`: passed.

No physical tablet/projector test, classroom learning study or production deployment was performed. Browser checking used synthetic learner data and a local test server. The disposable services were stopped after verification.
