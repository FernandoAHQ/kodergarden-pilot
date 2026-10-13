# Open Questions and Classroom Experiments

The central uncertainty is whether the proposed tasks cause learners to explain and reuse ideas, rather than merely pass more worlds. Pilot observations should distinguish learning from interface skill, prior programming experience, language fluency, and familiarity with a particular puzzle. A successful small pilot supports a design decision; it does not establish a general causal effect.

This implements R1–R10 from [B](B-programming-mechanics-design.md) with staged experiments tied to [F](F-prioritized-implementation-roadmap.md). No experiment has been run and no future session has been scheduled.

## Common protocol

Begin with a small usability observation, for example 6–8 learners, before a full 20–40-device class. These are proposed practical sample sizes, not statistical power calculations. Record broad prior-experience and preferred-language groups where appropriate; do not use age or speed as proxies for ability.

Use short matched pre/post probes with different layouts or values. If comparing two task designs, balance order or use matched groups and rotate equivalent tasks; the same exact post-test after demonstration mostly measures memory. Keep teacher explanation, device, available time, and assistance policy as similar as practical. Mark deviations rather than hiding them.

Observe independently before peer discussion when individual understanding matters. Allow a spoken answer, pointing, drawing, or a value table. Pair construction can be followed by an individual prediction. Record conceptual assistance separately from access support, including help with a touch target or reading an instruction.

Use a four-level rubric: **no usable evidence**, **correct with conceptual support**, **independent with causal reason**, **transferred to a new setting**. Missing observations remain missing, not zero ability. For explanations, ask whether the learner connects a specific state to a specific action or update. Sample a subset for a second teacher to score; reconcile disagreements before treating the rubric as reliable.

The success/failure rules below are decision criteria, not measured thresholds or release promises. Establish the baseline first, in keeping with the [project guide](../project.md). Before a comparison pilot, agree the smallest worthwhile improvement and acceptable time/help burden using that baseline. Report learner counts and denominators, missing data, assistance, and uncertainty rather than an unsupported average “learning gain.”

## X1 Does the need for Repeat survive removal of the cap

**Question:** do learners understand a repeated unit better when correct expanded programs are accepted during discovery?

**Protocol:** compare F05→F06's cap-driven transition with C01's equivalent-program and changed-plan transition. Use the same route and teaching time; balance groups by prior experience. Afterward, give a new two-action body and ask for its expansion and a count change. Recheck at the next meeting.

**Observe:** count/body explanation, turn-scope errors, willingness to revise a plan, conceptual help, editing time, and frustration. Do not count voluntary use of Repeat alone as success.

**Retain criterion:** the uncapped approach produces at least comparable task progress and clearer independent unit/scope explanations or better fresh-task performance, within the agreed lesson budget. **Revise/fail criterion:** students choose Repeat only after being told the exact pattern, or benefit is confined to copy speed with no improvement in reasoning. A confusing two-action task may need more scaffolding rather than reinstated caps.

**Decision:** P2 content strategy, R4.

## X2 Do contrasting worlds elicit a decision rule

**Question:** can visible world families distinguish a general rule from a fixed route, without making tests feel unfair?

**Protocol:** use C02 and C03 with two preview cases. Ask students to predict opposite outcomes before Run. Give a disclosed-but-unseen rotated case, then reveal/replay any failure. Compare with the current single-open F10 task using matched time and separate equivalent probes.

**Observe:** true/false prediction, explanation of skipped branch, fixed-turn programs, edits between cases, and perceived fairness in a one-question exit response. Ask one child to invent a case that breaks “always turn left.”

**Retain criterion:** learners keep one program, correctly connect sensor result to branch, and diagnose fresh-case failure using the stated contract. **Revise/fail criterion:** performance improves only on rehearsed layouts, or repeated failures arise from undisclosed rules, inaccessible observations, or relative-direction confusion. Unfair cases are removed regardless of average completion.

**Decision:** R1 and the active-case/family UI in P2/P4.

## X3 Do semantic traces support debugging

**Question:** which trace details help a learner find the first error without overloading the tablet display?

**Protocol:** compare current playback with a paper/mock or future step trace on equivalent If / Else and While bugs. Do not test a branch-identification lesson until the ambiguous-address defect is fixed. Let learners predict one step, inspect it, identify the first discrepancy, then propose a repair.

**Observe:** wrong-branch highlighting, correct first-divergence location, quality of causal explanation, unproductive replay cycles, teacher help, portrait switching, and interpretation of zero iterations and safety stops.

**Retain criterion:** learners explain the error from state/test/body evidence and can apply the repair to an unseen case with manageable trace navigation. **Revise/fail criterion:** they can only narrate animation, confuse a skipped operand with false, or spend most of the task navigating panels. Any incorrect highlight is a technical blocker, not learner evidence.

**Decision:** choose condition persistence, loop badges, and step granularity for R2; remove low-value visual details.

## X4 Do variables represent necessary memory

**Question:** does a counter make sense as memory after object interaction, and can learners distinguish counter, flag, and sum?

**Protocol:** first use C07 to verify sensor/action/state understanding. In a separate meeting, use C08 scanner strips with one authored counter. Ask for values after the second scan, then diagnose reset-inside-loop. Use new mixed, zero, and all-marked strips. Flags and accumulators are later variations, not simultaneous conditions of the first comparison.

**Observe:** initialization placement, Set versus Change confusion, reading-before-scan errors, correct choice of memory representation, value traces, and explanations tied to previous readings.

**Retain criterion:** learners explain what would be forgotten without the variable, predict updates, and report unseen inputs correctly. **Revise/fail criterion:** they merely duplicate a visible built-in count, memorize one total, or cannot track a value without repeated teacher prompting. If scanner rules dominate the difficulty, prototype the same task with physical cards before adding UI.

**Decision:** R5/R6 and P5/P7 sequencing; simplify the domain before widening arithmetic.

## X5 Are procedures understood as interfaces

**Question:** do named procedures help learners decompose, test, and revise meaningful behavior beyond making code shorter?

**Protocol:** C09 constant-depth bed service first. Ask for entry and exit facing, then supply one bug in the shared definition. Change the caller's position while preserving its contract. Only after that succeeds, compare two depths using a single parameter.

**Observe:** definition/call distinction, return location, repair in definition versus editing every call, parameter value trace, semantic naming, and reuse at a fresh valid entrance.

**Retain criterion:** learners describe the job and assumptions, fix both callers through one definition, and reuse it in a different plan. **Revise/fail criterion:** they treat calls as magic movement, cannot explain return state, or use procedures only to obtain a block-count reward. If parameters obscure an otherwise understood procedure, defer parameters while retaining simple procedures.

**Decision:** R7; P6 separately from P8.

## X6 Does a changing world add value

**Question:** do pre-run hedges or action-triggered changes improve state reasoning enough to justify their extra rule?

**Protocol:** compare static contrasting lanes with equivalent settled shifting-hedge lanes. Keep routes, sensors, and code demands equal. Ask for the settled configuration before execution and the sensor result afterward. A later optional switch/door prototype changes the door immediately after the switch action; no real-time motion.

**Observe:** correct event order, whether learners think speed affects success, ability to explain the door/hedge state, and references to the condition rather than animation timing.

**Retain criterion:** the change improves attention to relevant state or causal explanation without worse prediction or excess facilitation. **Revise/fail criterion:** students see a reflex/timing game, cannot tell when sensing occurs, or static contrast teaches the same idea more clearly. Default to static cases on a tie.

**Decision:** R9. Existing [lab scores](../dynamic-garden-lab.md) have zero recorded reviewers; their provisional selection is not learning evidence.

## X7 Does the strategy transfer beyond the route

**Question:** does mixed success in the garden predict use of the same rule in a different task?

**Protocol:** after C12, use a paper receipt stream with optional amounts and no movement. Ask for a rule, two value predictions, and a repair. At a later meeting, repeat with an unfamiliar narrative and fresh values. A practical target interval is about one week, subject to the class schedule.

**Observe:** explicit mapping between local observation, update, and advancing input; appropriate stopping condition; independent debugging; retention. Keep rotated-garden performance separate from non-navigation transfer.

**Retain criterion:** learners independently map the algorithm to the new representation and justify it, not merely recite block names. **Revise/fail criterion:** garden success coexists with inability to recognize the same structure outside navigation. Add explicit comparison and more varied contexts before declaring mastery or replacing the grid.

**Decision:** R4 and whether an inspection-bench runtime is warranted. A single small comparison cannot establish far transfer across school subjects.

## X8 Does Do While earn its complexity

**Question:** is post-test syntax useful after learners already understand compulsory action plus While?

**Protocol:** only with learners secure in M4, use C11. First obtain a correct action-plus-While solution. Compare with Do While and ask for first-clean, later-clean, and no-initial-observation traces. Use a second at-least-once problem for transfer.

**Observe:** first-check placement, number of compulsory actions, confusion with Repeat Until, explanation quality, and vocabulary burden.

**Retain criterion:** learners explain the semantic difference and use the compact form appropriately on the fresh problem, with a benefit beyond fewer blocks. **Revise/fail criterion:** the new block produces more loop-checking errors or no distinct learning benefit. Keep it deferred if evidence is mixed; the simpler solution remains available.

**Decision:** R10. No commitment to implementation follows merely from producing a solvable example.

## Cross-cutting risks and unresolved questions

| Risk or question | Mitigation and observable signal |
| --- | --- |
| Too many concepts at once | One new world rule or semantic distinction per introductory task; log what learners ask about before offering more blocks |
| Repetitive maze solving | Interleave prediction, repair, comparison, optional interaction, and authored tests; ask whether a learner can state a new problem beyond “reach the battery” |
| Memorized solutions | Fresh cases with disclosed variation and a causal probe; don't infer copying from fast completion |
| Hidden cases feel punitive | Preview contrasting examples and family rules, reveal counterexamples after failure; review fairness responses alongside performance |
| Deep nesting is unreadable | Physical tablet trials with Spanish text; inspect wrong-container edits and lost execution context; offer named subproblems |
| English/Spanish copy changes the concept | Bilingual teacher reviews the same edge case in both languages; track Si/Sí, Mientras/Hasta, relative-direction and assignment misunderstandings |
| Reading or motor skill confounds assessment | Spoken/pointing answers, larger targets, access help recorded separately; compare conceptual response without drag input |
| Efficiency dominates motivation | Correctness and understanding feedback first; observe whether learners reject understandable solutions solely for stars |
| Teacher workload grows | Record preparation, time finding a revealing program, and number of simultaneous support needs; retain a small shared lesson spine |
| Completion locks exclude slower learners | Teacher override plus missing-evidence note; check whether children remain engaged and receive appropriate next tasks |
| Shared devices blur identity | Individual exit check and teacher-owned record; no inference from device-local completion alone |
| Analytics overstates mastery | Show evidence scope, assistance, and missing observations; sample rubric agreement; avoid ability rankings |

## Evidence handling and decision record

Retain only data needed for the agreed pilot. Existing pilot exports are de-identified operational records, not guaranteed anonymous longitudinal research data. Session participant numbers must not be linked across classes without an explicit approved identity plan. Do not add names, join codes, capabilities, or raw student programs to diagnostic logs.

A minimal observation sheet has: task/revision/case, broad prior experience, preferred language if relevant, predicted outcome, rubric code, conceptual help, access help, misconception code, technical incident, and teacher next action. Store quotations or recordings only under the school's agreed process; coded notes are sufficient for early decisions. Establish storage access and retention deadline before collection.

For each experiment, write a short decision record: question, comparison, participants and missing observations, actual teaching conditions, fresh-task results, misconception examples without identifiers, usability incidents, uncertainty, and retain/revise/defer decision. Set the next pilot's targets from that baseline. This keeps research-supported principles, local design hypotheses, and demonstrated classroom outcomes distinct.
