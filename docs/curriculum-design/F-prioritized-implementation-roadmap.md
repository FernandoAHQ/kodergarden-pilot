# Prioritized Implementation Roadmap

Prioritize trustworthy evidence from the existing experience, then richer problems, then a wider language. The existing [pilot-readiness board](../backlog.md) remains authoritative. This proposal does not move stories into Next, publish curriculum revisions, or change the current milestone.

**Implementation status, 13 October 2026:** the software slices for P0–P5 are implemented in the current working tree. P1 classroom execution and the physical-device gates remain pending, as does P5's X4 learner evidence. P6–P9 have not been implemented. See the [P0–P4](P0-P4-implementation.md) and [P5](P5-implementation.md) release notes for exact scope and validation.

Complexity is relative: **S** is principally content or one contained surface; **M** spans several existing layers; **L** adds semantics and coordinated schema/editor/runtime changes. These are planning estimates, not delivery dates. Physical-device checks, teaching preparation, bilingual review, and observation time are part of the work rather than post-release extras.

## Staged delivery

| Stage and priority | Vertical outcome and scope | Dependencies and complexity | Evidence required to continue | Main risk and rollback |
| --- | --- | --- | --- | --- |
| P0 Essential prerequisite | R2/R3: learner sees the correct branch and unambiguous stop result; every run is bounded. Correct execution addresses, all-operation budget, goal/termination distinction, and shared evaluation contract | Existing engine/editor; M. No new blocks | Engine edge cases in E pass; authoring and teacher review show only the executed branch; consistent stop result in all modes; one candidate cannot stall a round | Compatibility with old traces/results. Keep a versioned adapter; reject ambiguous new assessment claims until resolved |
| P1 Essential near term | R4: run the existing short pilot with paper/oral prediction and a repeat explanation check. Establish usability and learning baselines | Existing KG-015–019 release/device/projector gates; S content/observation | Baseline distinguishes join/editing failures, conceptual difficulties, and teacher workload; teacher can complete lesson without developer intervention | Changing too many things would erase baseline. Keep original sequence and identify any added prompts in notes |
| P2 Essential content revision | R1/R4: revise first If and If / Else, add zero-iteration and goal-before-wall cases, relabel weak Expedition tasks; separate correctness from optional optimization | P0, baseline from P1; S content plus M task/evaluation integration | Pilot X1/X2: new-case prediction/repair evidence improves or exposes a clearer misconception without excessive task burden; all reference/alternative/wrong-strategy checks behave as intended | Removing caps can expose accidental solutions. Evaluate outcomes and add explanation checks rather than immediately restoring arbitrary restrictions; revert published revision if task fails |
| P3 Essential feedback | R2: shared semantic trace controls with condition explanation, loop counts, pause/step/back; branch-specific replay works in Live and independent modes | P0; M. Can overlap P2 content preparation but pilot separately | X3 shows learners use the trace to locate and explain an error; physical tablet and projector checks pass in English/Spanish | Visual overload and long traces. Default to concise view; retain expandable detail and earlier playback if needed |
| P4 Essential assessment | R1/R4: predict, repair, and family evaluation become explicit activity/evidence types; teacher sees supported/independent/missing evidence | P2/P3 evidence and shared evaluator; M | Same scope and outcomes client/server; teacher can use evidence to choose support; fresh-case and delayed checks differ meaningfully from simple completion | Dashboard overhead or false mastery. Keep paper rubric available; omit automated mastery claims until calibrated |
| P5 Essential next mechanic | R5: one item sensor and Collect, explicit multi-objective results, C07 | P2/P3; M | X4 first phase: learners correctly distinguish sensor/action/state and optional collection across placements; existing navigation remains predictable | Object rules overshadow If. Reduce to one item kind and fixed familiar route; remove object unit if observation remains dominant |
| P6 Essential abstraction branch | R7: named no-parameter procedures with call/return trace and C09 constant-depth service | P3 plus M5 pattern readiness; M; collection version requires P5, movement-only prototype can precede it | X5: learner predicts return state, fixes a definition once, and reuses the behavior in another caller | Procedures become a block-count trick. Require contract explanation and fresh caller; defer wider procedure palette if not useful |
| P7 Essential state branch | R6: explicit integer/Boolean state, Set/Change, comparisons, watch panel, transient-input/report objective; C08 | P3/P5 and learner M4 readiness; L | Counter then flag then accumulator tasks pass technical checks; X4 distinguishes remembered count from inventory and detects initialization misconceptions | Multiple abstractions arrive together. Ship counter slice first, not all expressions/data types; retain paper tokens if editing consumes the lesson |
| P8 Later consolidation | R7/R8: one procedure parameter, grouped Boolean operators, C10 and C12 mixed projects with transfer | P6/P7 evidence; L total, split into separate M slices | X5 parameter check and X7 transfer succeed on new inputs; learners can explain both operands/call inputs and subproblem assumptions | Excessive nesting or vocabulary. Release one operator/input feature at a time; retain nested-If and literal-call alternatives |
| P9 Optional experiments | R9: one switch/door or phase strategy; R10: Do While comparison or paper alternative-domain prototype | Demonstrated unmet need after P8, not merely feature demand; S paper, M–L software | X6/X8 and evidence of added learning value beyond simpler alternatives | Timing puzzles and semantic overlap. Keep gated experimental content and remove it without changing the core |

P6 and P7 are separate conceptual branches. They need not ship in the order shown; select whichever observed learning need is stronger. Parameters require value tracing, but simple procedures do not require a full variable language.

## Small implementation slices

Start P2 with C02 using existing grids: two explicit cases, same program, visible false outcome, teacher prediction prompt. This changes the instructional demand without adding sensors or objects. A following slice adds C03's single choice; a third adds C04's zero case and C05's intermediate goal. Do not bundle shifting hedges into the first comparison.

Start P3 with one branch-aware step operation on a recorded trace, then add retained condition result and loop count. Add back/replay only after reset, cancellation, and frozen-program identity are unambiguous. Verify each in both the learner workbench and projected review.

Start P7 with one declared counter and a scalar Report objective at a stationary scanner. Add Boolean flags and numeric accumulators in separate curriculum revisions after counter tracing works. Add the same semantics to server validation before exposing a student submission path.

## Release requirements for every slice

1. State the learning outcome, expected misconception, and simpler alternative. Attach a challenge contract and evidence probe before implementing UI.
2. Validate reference and legitimate alternative programs against every case. Include plausible incorrect programs that should fail for the intended reason. Where possible, include zero/one/many or true/false boundary cases.
3. Verify version compatibility, deterministic client/server evaluation, bounded work and trace size, fresh state per run, and localization. Repeat full checks only as required by affected behavior and the existing Definition of Done.
4. Perform the affected physical tablet/projector checks. Browser emulation does not prove touch usability or classroom readability.
5. Publish as an isolated curriculum revision or bounded feature slice with a recorded rollback path. Existing completion remains historical completion, not retroactive mastery of the new version.
6. Run the corresponding small classroom experiment, review evidence, and choose retain/revise/defer. Do not turn every observed difficulty immediately into a new feature.

## Explicitly outside the committed roadmap

Do not begin a grid replacement, multi-robot scheduler, random real-time hazards, general recursion, lists, return-value functions, or student-account system as a prerequisite for the proposed core. Do not build an AI explanation scorer or infer ability from speed. None is necessary to test the principal learning hypotheses.

The persistence decision remains aligned with KG-022. A teacher-owned evidence sheet and the existing de-identified export are sufficient for early pilots. A new durable mastery service should be considered only after the evidence model is useful and its identity/retention boundaries are agreed.

## Decision authority and continuation

The curriculum lead and pilot teacher should judge educational value; engineering should establish semantic consistency and operational feasibility. These are proposed responsibilities, not assumed named owners. Each stage ends with a short record containing the cases tested, observable learner responses, assistance given, usability incidents, and the next choice.

The first useful investment is a small trustworthy lesson, not completion of every stage in this document. Continue expansion only when a previously learned idea supports the next problem and its classroom evidence justifies the added complexity.
