# Curriculum Quality Audit

Kodergarden has a sound small interpreter, a concrete world, bilingual authoring, and useful teacher review facilities. Its curriculum is less mature than its block vocabulary: it provides build tasks and completion gates but little direct evidence of prediction, debugging, transfer, or abstraction. The first priority is to improve those learning opportunities and the reliability of their feedback.

This audit covers all 24 challenges in the source catalog on 13 October 2026. It does not establish which PostgreSQL revision is currently deployed. The [evidence register](research-and-evidence.md#repository-evidence-map) identifies inspected files; [E](E-technical-feasibility.md#bounded-audit-probes) records bounded checks. Educational judgments below are hypotheses about task affordances, not observations of children.

## What exists and what is worth preserving

| Area | Observed capability | Educational opportunity and boundary |
| --- | --- | --- |
| Language | Move, left/right turn, fixed Repeat, If, If / Else, While, Repeat Until Goal; v1–v3 AST validation | Enough vocabulary for a substantial control-flow curriculum already exists. Conditions currently mean adjacent traversability, not arbitrary Boolean expressions. |
| World | Robot orientation, obstacles, boundary, one goal, deterministic shifting hedges before execution | Relative sensing and predictable replay are valuable. Hedges stop moving before the first statement; this is not a continuously changing environment. |
| Authoring | Nested bodies, separate Then/Else containers, stable editor IDs, drag/drop, undo/redo | Structural editing reduces syntax errors. It does not remove the reasoning demands of scope, orientation, or loop boundaries. |
| Practice | Six challenges have several declared layouts; all are checked, with zero collisions by default for Foundations | This is a real move toward generalization. Learners can inspect a failing layout. Passing a finite family is still limited evidence. |
| Campaign | Sequential local progression and optional stars; a correct long solution can earn completion | Keeping correctness separate from full efficiency stars is useful. Star targets currently carry more pedagogical meaning than they can support. |
| Live Classroom | Shared round, local runs, authoritative server submission checking, resubmission, teacher review and projected replay | Supports discussion and comparison now. It evaluates only the round's active layout and is not a longitudinal mastery system. |
| Publishing | Isolated drafts, bilingual copy, reference validation, published revisions and history | Strong basis for controlled curriculum pilots and rollback. Validation establishes solvability under checks, not instructional quality. |
| Feedback | Active block, condition result, collision, run/reset, playback speed, failing-layout selection | Immediate consequences are visible. A richer trace can explain control flow without introducing additional world complexity. |

The interpreter/runtime/event/playback boundary should be preserved. The learner can see the same semantics in Practice and teacher review; the proposal should make assessment rules similarly consistent, while clearly labeling intentional lesson-specific differences.

## Four kinds of limitation

| Category | Highest-priority findings | Consequence |
| --- | --- | --- |
| Technical | Fixed Repeat iterations do not consume the control-iteration budget; goal state can coexist with a limit stop; Then and Else children share numeric execution addresses; evaluation rules are spread across several paths | Reliability or contradictory highlights can invalidate what students are being asked to infer. These are preconditions for expansion, not requests to add blocks. |
| Curriculum | One activity often introduces a construct and immediately combines it with other demands; all 24 source activities are `build` with empty starters; no designed predict/debug/complete-program sequence; Expedition falls back to older vocabulary | Learners can progress by reconstructing paths without developing a coherent account of control flow. |
| Interaction and usability | Palette insertion requires dragging; no configured keyboard drag sensor or tap-to-insert workflow; nested branches consume vertical space; main modes lack pause/step/back; portrait separates code and world | Motor skill, reading load, or memory can masquerade as conceptual difficulty. Physical tablet accessibility remains unverified. |
| Assessment | Required tools are checked for syntactic presence; completion unlocks the next task; stars use blocks/commands; no independent explanation, prediction, repair, or transfer evidence; Live tests one world | The system can measure task performance but cannot currently substantiate mastery claims. |

Source inspection establishes the interaction affordances above; it does not establish a measured usability defect on a particular tablet. Branch-address ambiguity and the runtime budget/termination findings are independently probed in E.

## How to read the challenge audit

Numbers F01–F16 and E01–E08 are audit labels; stable source IDs appear in each row. “Need” distinguishes an inherent task demand from a rule requiring a block. “Difficulty” is a predicted transition relative to the preceding task and needs classroom calibration.

All rows inherit these observed feedback limits: animated execution and generic success/incomplete feedback are available; there is no recorded pre-run prediction or causal explanation. Foundations additionally reports block-limit, required-tool, collision, and layout failures. Expedition reports correctness and stars. The feedback column below identifies the specific missing explanation for each task, not an assertion that no feedback exists.

### Foundations

| Challenge and concept | Prerequisites and new reasoning | Need and trial-and-error risk | Difficulty and educational value | Feedback needed and future preparation | Disposition |
| --- | --- | --- | --- | --- | --- |
| F01 First Steps · `sequence-01` · two moves | Drag, Run, count two; realize one instruction advances one tile | Sequencing is inherent, but two identical blocks do not test ordering; quick retries suffice | Appropriate orientation task; two-block cap adds little | Ask for the endpoint before Run; distinguish command from destination. Prepares tracing | Keep as onboarding; add C01 prediction |
| F02 Keep Going · `sequence-02` · four moves | F01; extend a sequence | More counting, no qualitatively new reasoning; easy trial-and-error | Small step, useful only for learners who need extra editor practice | Compare three/four/five moves and explain overshoot. Prepares counting repetitions | Make optional fluency practice; replace mandatory slot with a repair |
| F03 Turn the Corner · `turn-01` · right turn | F01–02 and relative orientation; turn without translation | A direction change is necessary; required Turn is redundant | Meaningful increase from one-dimensional movement | Trace position separately from facing after the turn. Prepares conditional sensors | Keep; allow physical pointing before editing |
| F04 Zigzag Path · `turn-02` · left/right sequence | F03; maintain facing through two turns | Both route order and orientation matter; visible path permits incremental copying | Larger jump to eight commands, reasonable with a scaffold | Stop at first wrong facing, not just final failure. Prepares pattern units | Keep with predict and complete-program variants |
| F05 The Long Hallway · `repetition-01` · notice redundancy | Sequence; build six moves with existing tools | Repetition in the problem is real; no loop yet | Good problem-before-construct contrast, provided it is brief | Ask what would need changing if a known route grows. Prepares Repeat's count/body model | Keep; do not prolong labor as punishment |
| F06 Meet Repeat · `repeat-01` · fixed count | F05; distinguish one authored body from six executions | Two-block cap and required Repeat force the form; the same task was just solved without it | Useful comparison, weak mastery test; may teach “Repeat is how to obey the limit” | Compare expanded and repeated traces; ask for a different count. Prepares pattern abstraction | Remove pedagogical cap for discovery; retain optional optimization after C01 |
| F07 Two Long Sides · `repeat-turn` · Repeat plus turn | F06 and F03; keep turn outside both loops | Repetition is useful but a nine-command route works if cap is removed | Meaningful composition step; five-block limit obscures scope errors | Contrast turn inside versus outside body. Prepares decomposition into segments | Keep; add one deliberate scope bug |
| F08 Three-Segment Route · `efficient` · segment counts | F07; count lengths 4, 3, 2 and alternate turns | Mainly rehearses F07; instructions already prescribe a Repeat per segment | More work rather than much new reasoning | Ask which part changes if only middle segment grows. Prepares parameterization later | Move to optional reinforcement; use freed slot for C05 |
| F09 Stair-Step Pattern · `pattern` · repeat a compound unit | F04/F07; find a four-command unit preserving facing | Compound repetition has a real pattern; five-block cap forces compression | Substantial conceptual jump from repeating only Move | Mark one unit and predict its exit position/facing. Prepares named procedures | Keep; provide one complete unit then fade it (C06) |
| F10 Check the Gate · `condition-01` · If | Sequencing and meaning of an open path; supposed optional execution | Only one open, one-step route exists. `Move; If(path ahead){}` passes with two blocks. The decision does no useful work | New syntax but almost no new reasoning; a weak first conditional | Must show both true and false cases and an observable skipped action | Replace with C02, a safe optional move in contrasting bays |
| F11 Changing Hallway · `condition-repeat` · repeated guard | F06/F10; re-evaluate a condition on each iteration | Lengths 2/4/6 and collision rule make guarding useful; count 6 is a family bound, not an unknown-length algorithm | Good transfer from one layout; combines two concepts after a weak If introduction | Trace the first false result and explain why later checks do not move. Prepares While | Keep after C02; explicitly discuss the upper-bound limitation |
| F12 Garden Patrol · `final` · two guarded segments | F11 plus orientation; same code across three L paths | Family variation is meaningful, but fixed six checks per segment can be memorized | Reasonable synthesis with earlier support; still not arbitrary navigation | Explain why the right turn occurs once, outside loops. Prepares subproblem composition | Keep as guarded-loop application; revisit with While |
| F13 Dynamic If / Else · `if-else` · choose move or turn | F11, Repeat, left turn; one decision per iteration | Three layouts need different turn timing; branch choice is meaningful. Hedge motion is deterministic pre-run, not ongoing unpredictability | Introduces Else, nesting, and movement change at once; four-command path totals can hide counting assumptions | Show a single decision before wrapping it in Repeat; indicate one selected branch only | Teach C03 first; reuse as later mixed task |
| F14 Directional Dynamic Garden · `directional-condition` · side sensing | F13 and relative directions; choose left/right then travel three cells | Two layouts genuinely need different turns; one program is checked on both | Conceptually clearer branching than F13 despite later position; no need for animation to establish variation | Show sensor ray relative to Pip; predict mirrored case. Prepares richer observations | Move a static version earlier as C03; make hedge variation optional |
| F15 Unknown Hallway · `while-hallway` · pre-test loop | If and repetition; check, move, check again | Lengths 2/4/6 make While useful, although palette/cap also mandate it | Appropriate contrast to F11; all authored lengths are positive, so zero iterations remain untested | Include blocked-at-start case and a wrong body that never changes the condition | Keep as C04 with zero-case and repair variants |
| F16 Changing Garden Finale · `repeat-until-battery` · goal test plus decision | F13/F15; distinguish goal from blockage | Three rotated paths support an advance-else-left rule; all require nine moves and two turns, so variation is largely orientation | Mixed capstone is useful but compresses a new stopping rule into four blocks | Explain test-before-body and challenge a route with a right corner. Prepares strategy contracts | Replace as mastery check with C05; retain as application within stated left-turn family |

### Garden Expedition

All eight challenges are single visible worlds and expose only Move, Turn, Repeat, and If. The “advanced” campaign does not build on Foundations' If / Else, While, or goal loop. It is better described as a route-planning and optimization practice collection until redesigned.

| Challenge and concept | Prerequisites and new reasoning | Need and trial-and-error risk | Difficulty and educational value | Feedback needed and future preparation | Disposition |
| --- | --- | --- | --- | --- | --- |
| E01 Winding Path · `expedition-winding-path` | F07; two four-move legs and one turn | No branching; repeated legs are useful. Visible geometry is sufficient | Easier than late Foundations; concept copy says multi-turn although reference uses one | Compare legal route strategies; make obstacle relevance explicit. Prepares route decomposition | Keep as optional warm-up, relabel |
| E02 Twin Corridors · `expedition-twin-corridors` | E01; unequal legs 4/6 | Almost the same strategy as E01; no corridor-state uncertainty | More distance, little additional CT demand | Predict the changed count without rebuilding. Prepares varying procedure inputs | Merge with E01 as a variation |
| E03 Spiral Garden · `expedition-spiral-garden` | F09; intended nested Repeat | `Repeat 2 {Move; Move; Left}` earns three stars without nesting; legitimate equivalent solution | A two-leg route, not a substantive spiral; nesting adds no essential insight | Explain expanded trace and equivalent programs. Prepares nested-loop comparison only | Replace nesting lesson with C06's multi-scale pattern |
| E04 Gate Check · `expedition-gate-check` | F06; intended conditional movement | No gate state: empty row to boundary. `Repeat 5 {Move}` earns three stars | Easier than E03 and no decision need | Introduce a case where moving is inappropriate. Prepares sensing only after redesign | Replace with C02/C07 |
| E05 Patrol Route · `expedition-patrol-route` | F07/F11; intended guarded legs | `Repeat 4 {Move}; Left; Repeat 4 {Move}` earns three stars with no If | Redundant guards in reference can teach ceremonial conditions | Ask for a counterexample to a fixed route; trace changed lengths | Replace with C04 plus C03 composition |
| E06 Nested Trail · `expedition-nested-trail` | E03; mirrored intended nesting | `Repeat 2 {Move; Move; Right}` earns three stars without nesting | Mostly a mirror of E03; not meaningful advancement | Compare single versus nested units and outer-loop effects | Fold into C06 as a transfer/repair case |
| E07 The Detour · `expedition-detour` | Turns, segment planning; choose a route around a wall | Obstacle genuinely changes the plan; hardcoded solution is appropriate for a known world | Meaningful spatial planning; optimization can distract from correctness | Explain why the direct route fails and justify a waypoint | Keep as planning/debugging task; optional efficiency badge |
| E08 Expedition Summit · `expedition-summit` | E03/E06; repeated three-move legs | Nested reference meets four-block target; a five-block, seven-command route also reaches goal | Capstone covers compression more than branching/state/transfer; final reference turn affects facing, not endpoint | Explain equivalent endpoints but different orientations/costs; require a novel task | Replace capstone with C12; preserve old level as optional puzzle |

These counterexamples are evidence against the assessment claim, not evidence that students who find them are cheating. Accepting a simpler valid strategy is good. The curriculum must change the problem or ask a different question if it needs evidence about nesting or decisions.

## Sequence quality and artificial difficulty

F05→F06 has the right causal structure: students see repeated work before meeting Repeat. Its hard cap should be a later comparison task, not the discovery reward. F09 offers a stronger reason for repetition because the repeatable object is a meaningful movement pattern.

F10→F11 is the weakest bridge. The first task gives no false case, then the next demands nested conditional repetition and all-layout success. Teach one optional action first, a two-way choice next, then combine each with repetition. F14's single directional choice is a better introduction than F13's loop of decisions.

F15 and F16 arrive too close together to reveal whether a learner distinguishes continuing while a condition holds from stopping when a goal holds. F16's rotated worlds also share the same action count. Add zero-iteration, intermediate-goal, and variable-length cases before treating either as mastered.

Repetition, conditions, and nesting are not mathematically required by every finite puzzle. A learner could enumerate enough cases, or expand a finite loop. “Conceptually useful” should mean that the construct expresses the rule, adapts to the declared variations, and is explainable—not that every alternative syntax has been forbidden.

## Assessment and feedback diagnosis

The presence of `requiredTools` checks is a scaffolding choice, not evidence of understanding. The accepted empty If probe is the clearest example. Similarly, command count excludes control evaluation; a program can perform many useless tests while reporting few steps. Best blocks and best steps are stored independently, so displayed best metrics need not belong to one coherent solution.

Practice already checks a meaningful family. In F11, `Repeat 4 {If path ahead {Move}}` passes the medium Live layout but fails Practice's long layout. Both results match current rules; presenting both simply as “correct” hides their different scope. Label a round “this garden” or “all gardens,” and preserve that scope in evidence.

The generic shared `Challenge` type names build/debug/predict, but the active Practice definition, catalog entity, and all source content use build. Type vocabulary alone does not establish a shipped assessment experience. There is no concept-level evidence model or durable learner assessment record; existing export has attempts, final correctness, timing, blocks, and commands, not predictions or debugging rationales.

Brennan and Resnick's framework motivates looking beyond constructs, while Black and Wiliam motivate using evidence to choose an instructional response. Neither establishes that an automated dashboard alone can infer understanding. See [S1 and S9](research-and-evidence.md#instructional-evidence) and the concrete rubric in [C](C-curriculum-progression-roadmap.md#assessment-of-understanding).

## Classroom fit and immediate opportunities

Use the existing Live flow for a shared prediction, individual or paired construction, and two contrasting solutions. Select a revealing incomplete program as well as a correct one; the current fewest/earliest shortcuts should not dictate what counts as an instructive strategy. Ask students to point at the first divergent block, then retry privately.

Before adding analytics, collect a short paper or oral exit check alongside the operational export. This can distinguish an orientation problem from a loop misconception in the first pilot. Device-local progress, shared tablets, and ephemeral sessions mean completion records should not be interpreted as durable individual attainment.

The grid remains appropriate for sequence, orientation, condition checks, repetition, and procedures. It needs objectives beyond an endpoint for memory and state to become meaningful. A small collection or inspection task is a proportionate extension; continuously moving obstacles, keys, pressure plates, and multiple robots together would overload the learning problem.

The recommended replacements and tests are specified in [D](D-challenge-design-catalog.md) and [G](G-classroom-experiments.md). Preserve the current pilot baseline, resolve trace/safety defects before using affected constructs to judge learning, then compare the revised tasks with actual learners.
