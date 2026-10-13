# Technical Feasibility and Architecture Implications

The current separation of AST, interpreter, runtime, and playback can support the proposed curriculum incrementally. Preserve it. Most early improvements need new task definitions and assessment/trace behavior; variables, expressions, procedures, and interactions require coordinated schema changes. This document specifies future requirements and records observed behavior; it implements none of them.

## Current boundaries

```text
PostgreSQL published revision -> catalog API -> learner/teacher client
editor tree with UI IDs -> serialized Program v1/v2/v3
Program -> validation -> interpreter -> ProgramRuntime/GridRuntime
                               -> semantic events -> playback -> world and code
Live submission -> server validation + allowed-tool check + engine evaluation
```

[AST](../../packages/language/src/ast.ts) is language-neutral but not fully environment-neutral: conditions encode path directions and one statement names the goal. [ProgramRuntime](../../packages/engine/src/runtime.ts) similarly names movement and path sensing. The useful abstraction is separation of responsibilities, not an already generic plug-in runtime for arbitrary domains.

The editor has its own recursive union and removes UI IDs when serializing. The interpreter identifies locations with numeric array paths. Adding a construct requires updating AST validation, metrics, editor transforms, serialization, palette, read-only renderer, event rendering, localization, permitted tools, catalog validation, and tests. It is not a one-file extension.

## Required corrections before expansion

| Finding | Evidence and impact | Future requirement and acceptance check |
| --- | --- | --- |
| Branch children have ambiguous execution addresses | In [interpreter.ts](../../packages/engine/src/interpreter.ts), both Then and Else execute with the same parent path; both renderers append the same child index. A Then child and Else child can both be `[0,0]` | Use branch-aware semantic addresses such as `statements/0/thenBody/0` and `.../elseBody/0`, or a run-local source map. Verify only the executed child highlights in authoring and teacher review, including nested branches |
| Fixed Repeat work escapes the control budget | `beginControlIteration` is called for While/Until, not Repeat. Nested empty fixed repeats can consume enormous synchronous work despite zero robot commands | One fuel budget covering statement visits, loop iterations, expression evaluations, assignments, and calls; separate event/byte cap. Test small empty-loop examples and bounded nested structures, never an intentional production hang |
| Reaching a goal is not equivalent to completing a run | `succeeded` is assigned `finalState.completed` even when `stoppedByLimit` is true. Shared evaluators and Campaign use `succeeded` without rejecting a limit stop | Explicit termination reason plus objective results. Test a program that reaches a goal then stalls; no mode or publishing validator may award successful termination |
| Completion logic differs across modes | Practice evaluates all worlds and constraints; Campaign executes base world and rates it directly; Live evaluates one active world | One evaluator with explicit `active-case` or `case-family` scope and policy. Preserve intentional scope choices in UI and stored evidence. Do not silently convert all lessons into hidden multi-case assessments |
| Publishing validates references only when present | `validateLoadedRevision` skips absent references, separately duplicates rules, checks guided collisions by revision kind while runtime defaults use campaign ID | Require a reference or documented alternative validation strategy for assessed published tasks. Execute through the same evaluator. Make policies explicit data, not inferred from a slug or unlock banner |
| Pre-run changes lack per-effect snapshots | `beginExecution()` applies all hedge changes before returning effects, then interpreter snapshots runtime for each returned effect | If showing individual transitions, emit a snapshot with each atomic transition or group them as one world-settled event. Verify two-hedge playback matches sensing state; this is source-identified, not a browser-observed defect |

These corrections have immediate reliability and interpretability value even if no advanced mechanic is built. Assessment expansion depends on them. Main-mode pause cannot interrupt synchronous computation that has already started; bounded engine work is therefore necessary independently of playback controls.

## AST and validation

**Conceptual recommendation:** keep statements, pure value expressions, pure Boolean expressions, and procedure definitions distinct. Start with the few expressions required by C08–C10. A generic language with arbitrary types and operations is unnecessary.

**Future implementation requirements:** introduce a new version only when the semantics are accepted; retain readers for versions 1–3 and normalize legacy `pathAhead` without changing meaning. Define explicit program-level integer/Boolean variables and named procedures. Validate unique semantic IDs, allowed identifiers, declared reads/writes, type compatibility, initialized values, parameter arity, call targets, and the absence of recursive call cycles in the initial procedure release.

Illustrative schema sketch, not a migration or an implemented API:

```text
ProgramNext {
  variables: [{ id, type: integer|boolean, initialValue }]
  procedures: [{ id, parameters, body }]
  statements
}
BoolExpr = pathOpen(direction) | objectPresent(kind) | atTarget(id)
         | compare(op, ValueExpr, ValueExpr)
         | and(BoolExpr, BoolExpr) | or(...) | not(BoolExpr)
ValueExpr = literal | variable(id) | parameter(id) | observation(id)
Statement += set(variable, expression) | change(variable, integerExpression)
           | interact(actionId) | report(fieldId, expression)
           | call(procedureId, arguments)
```

These are closed, typed discriminated unions, not arbitrary strings executed as code. Approved action/observation IDs are validated against the task's runtime capabilities. Start with named integer comparisons and no implicit coercion. Integer bounds should be explicit, conservatively small in beginner tasks, with a clear runtime error on overflow rather than silent wrap or clamp. Parameters are passed by value and read-only. Program variables are explicit shared run state initially; procedures may update them visibly, with no accidental local shadowing. General local variables and return values can wait.

Expression depth and count need their own limits; current block count counts statements only. Report authored statements and expression complexity separately if useful. Do not make a larger Boolean expression “free” for safety or automatically “better” for learning.

Parameter-controlled Repeat in C09 also requires a count expression: the current AST accepts only a literal number. Introduce a typed integer count evaluated once on loop entry, validate its task/runtime range before iteration, and retain literal-only authoring in introductory modules. For these first parameter tasks, inputs are positive integers; zero-count semantics can be introduced explicitly in a later version rather than silently changing the current 1–100 rule.

## Interpreter and runtime

**Conceptual recommendation:** deterministic, inspectable state transitions with explicit stop reasons. A goal is an observation; successful completion normally follows program termination and objective evaluation.

**Requirements:** make execution state include program counter/frames, variables, procedure calls, loop counters, runtime snapshot, operation budget, and termination reason. An explicit frame stack or resumable iterator becomes useful as procedures and cancellation arrive. Do not require that rewrite for content-only tasks if a fully bounded synchronous interpreter remains adequate.

Emit stable semantic events for condition operands/results, selected/skipped branch, iteration entry/exit, value change, call/return, interaction, objective status, and termination. A source address identifies authored location; call-frame/iteration identity distinguishes repeated visits. Freeze the program associated with a run so editing cannot misalign a replay with new source.

Runtime snapshots must include every mutable world component and authored variable value needed for replay. For the first interaction, extend GridRuntime with typed observations/actions, collections, inventory, and derived objectives. Keep navigation validation and collision in the engine, not React. An inspection station can initially be an object/state extension of the grid; a second runtime is a later decision.

Universal safety budgets protect computation; pedagogical constraints describe tasks. Keep these separate in schema and copy. For example, “avoid collecting an empty tile” is a stated task rule; “maximum engine fuel exceeded” is a safety result. Reaching either a safety step cap or event-memory cap invalidates successful termination across every mode.

## World and challenge definitions

**Conceptual recommendation:** author a problem family and its contract, rather than a single map with a preferred AST shape.

**Requirements:** version world schemas independently from program schemas; add typed objects with stable IDs, interaction preconditions/effects, supported observations, and initial state. Validate coordinates, uniqueness, valid target references, compatible actions, and reachability/solvability through reference programs. New mutable objects require a fresh runtime for every case, never shared mutable state between cases or learners.

A future challenge revision should declare learning objective, prerequisite concepts, activity kind, world family, visible and assessment cases, variation contract, runtime capabilities, allowed palette, starter/scaffold, objective predicates, hint ladder, misconception tags, evaluation scope, reference and alternative solutions, and bilingual copy. Prefer a small schema for each activity kind rather than one large optional object with contradictory combinations.

The generic [Challenge type](../../packages/shared/src/challenge.ts) already names `build`, `debug`, and `predict`, but the active [Practice definition](../../packages/shared/src/practice.ts) and [database entity](../../apps/server/src/catalog/catalog.entities.ts) are build-only. Implementing other activities requires new API/editor/render/evaluation paths, not merely changing a string. Predict tasks should grade a semantic answer; debug tasks should retain a supplied program plus an identified discrepancy and fix; complete-program tasks need intentional editable regions.

`maxCollisions` and arbitrary `requiredTools` are not independently stored in the current challenge entity. [CatalogService.mapRevision](../../apps/server/src/catalog/catalog.service.ts) derives collision policy from `foundations` and required tools from `unlockKey`. Separate pedagogy and outcome policies from presentation metadata when introducing a new schema.

## Test-case evaluation and fairness

Use a shared pure evaluator taking a validated program, immutable challenge revision, selected case set, and evaluation policy. Return per-case objectives, invalid actions, stop reason, costs, and first relevant failure location. Capture a detailed trace only for the selected/replayed case where possible; do not allocate a full maximum trace for every student × every case. Keep enough evidence to reproduce any failed result exactly.

Public practice cases are inspectable and useful. An assessment case may be unseen in the normal workflow without pretending client-delivered cases or reference solutions are secret. If later a genuine server-held assessment is needed, omit those payloads from learner responses and evaluate on the server. The current catalog returns `referenceSolution`; it should not be mistaken for a secure exam delivery system.

Use fixed authored suites first. For generated cases store generator version, seed, resolved world fingerprint, and task revision; validate generated cases before using them. Test determinism across server/client and speed settings. Do not evaluate against an undeclared rule or a configuration that lacks information necessary to solve it.

Current Live submission executes once for metrics and again within `evaluateLiveProgram`. Consolidate this into one authoritative result when refactoring, particularly before adding multi-case evaluation. Bound per-case and per-submission work; measure a 40-device round without letting one expensive candidate stall unrelated sessions.

## Editor and execution visualization

Preserve immutable editor transforms, stable UI IDs, executable serialization, and undo/redo. Add tests for branch-aware address mapping, nested moves, subtree deletion, variable/procedure rename by ID, call argument editing, and undo/redo of those edits. Expression editing needs an explicit grouping model, typed sockets/chips, and accessible controls; it should not rely on increasingly narrow drag targets.

A trace player should be reusable across Practice, Campaign, and projected Live review. Add semantic checkpoints for step/back, retained condition results while a branch executes, iteration badges, variable watch, and call context. A recorded event sequence can support replay without inverse execution. To bound memory, use periodic full snapshots plus deterministic deltas if measurements justify it; this is an optimization decision after simpler bounded traces are measured.

Validation failures currently return early in some client Run paths. Replace silent failure with localized, block-linked messages before introducing more ways for a program to be invalid. Keep source/run errors, objective failures, and safety stops distinct.

## Classroom analytics and persistence

**Conceptual recommendation:** a minimal evidence profile, with human interpretation for explanations, before an adaptive learner model.

**Requirements:** store concept/task version, case scope, evidence kind, independent/supported status, response or rubric result, timestamp granularity needed for the study, and teacher observation where authorized. A draft event vocabulary might include `predictionRecorded`, `repairExplained`, `caseFamilyEvaluated`, and `hintUsed`; it should not collect every drag action by default.

Current exports contain operational timing, attempt counts, final correctness, blocks, and execution steps. They intentionally exclude names, capabilities, internal IDs, and full ASTs. Retain that boundary. An experimental explanation instrument may be recorded on paper or as a small coded score without sending free text or programs to analytics. Cross-session individual mastery requires a separately agreed identity/persistence model; do not infer one from session participant numbers or device-local completion.

Challenge revision must accompany future progress. Preserve old completions as historical task completions; do not retroactively label them mastery of revised objectives. Independent best metrics should not be displayed as one optimal program unless they came from the same run.

## Bounded audit probes

On 13 October 2026, the existing package command `pnpm -r --filter @kodergarden/language --filter @kodergarden/engine --filter @kodergarden/shared test` passed: language reported 11 checks, engine 38 checks, and shared compiled. The initial sandboxed invocation failed with a filesystem `EPERM`; the authorized retry completed. No new feature or regression-test source was added.

After that build, read-only Node probes imported `packages/shared/dist/practice.js`, `packages/engine/dist/index.js`, and `packages/language/dist/index.js`. These results concern the current source-derived builds:

| Probe | Method | Observed result |
| --- | --- | --- |
| Reference solvability | For each `allChallenges` item, validate reference and call `evaluatePracticeProgram` with `countBlocks`; iterate `challengeWorlds` | All 24 references valid and complete, covering 35 worlds |
| Proposed movement tasks | Translate C01–C06 reference strategies to existing v3 statements and construct the 16 specified worlds, including both C06 sizes | All 16 validate, terminate normally, reach their goals, and produce zero blocked effects; this does not validate unimplemented activity UI or learning outcomes |
| Empty required If | F10 candidate `Move; If(path ahead){}` | Allowed, complete, 2 authored blocks, 1 command; If contributes no behavior |
| E04 without condition | `Repeat 5 {Move}` | Complete, 2 blocks, 5 commands; current star formula gives 3 |
| E05 without condition | `Repeat 4 {Move}; Left; Repeat 4 {Move}` | Complete, 5 blocks, 9 commands; 3 stars |
| E03 without nesting | `Repeat 2 {Move; Move; Left}` | Complete, 4 blocks, 6 commands; 3 stars |
| E06 without nesting | `Repeat 2 {Move; Move; Right}` | Complete, 4 blocks, 6 commands; 3 stars |
| Mode scope | F11 `Repeat 4 {If(path ahead){Move}}`, 3 blocks, unchanged challenge definition | Practice fails only long layout; Live medium layout completes with no collision |
| Goal at safety stop | 3×3 open world, robot `(0,1)` east, goal `(1,1)`; `Move; While(path ahead){}`, limits 10 commands/2 control iterations | `succeeded=true`, `stoppedByLimit=true`, final event `executionLimitReached` |
| Fixed-repeat budget | Same small world, `Repeat 3 {Repeat 3 {}}`, limits 1 command/1 control iteration | No limit stop, 10 events, zero commands; fixed iterations do not consume that budget |
| Branch identity | If / Else with one turn in each branch; run once with true and once with false sensor | Both executed child events have path `[0,0]`; statement type differs, address does not |

To reproduce counterexamples, use the stable challenge IDs from [A](A-curriculum-quality-audit.md), Program version 3 with canonical `{type:"path",direction:"ahead"}` conditions, and the literal statement sequences above. Stars follow `!succeeded ? 0 : blocks > parBlocks ? 1 : steps > parSteps ? 2 : 3` from [campaign progress](../../apps/web/src/campaign/progress.ts). Source inspection of the UI confirms it uses that formula; no browser-earned stars are claimed.

Not performed: deployed database inspection, browser interaction audit, physical tablet/projector QA, learner study, database integration suite, full release build, or 40-client load test. Those are release/pilot gates, not necessary to claim this documentation task or the bounded observations above. C07–C12 require unimplemented mechanics and remain design walkthroughs; only C01–C06 received the engine checks described above.
