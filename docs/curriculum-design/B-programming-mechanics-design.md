# Programming Mechanics Design

Keep one deterministic robot, a small visible world, and a small language. Strengthen decisions by varying relevant state, loops by varying the amount of work, variables by requiring remembered information, and procedures by naming meaningful subproblems. Every recommendation below is a design hypothesis unless marked as an observed capability or a research-supported principle.

## Decision register

These recommendations are the shared design spine for [C](C-curriculum-progression-roadmap.md), [D](D-challenge-design-catalog.md), [E](E-technical-feasibility.md), [F](F-prioritized-implementation-roadmap.md), and [G](G-classroom-experiments.md).

| ID and priority | Educational problem and current insufficiency | Proposed mechanism and intended learning | Verification | Cost and simpler alternative |
| --- | --- | --- | --- | --- |
| R1 Essential now | One successful route or required-block check does not establish understanding | Contrasting world families, explicit evaluation scope, and one prediction/repair probe teach rules that survive variation | New-case performance plus causal explanation; experiment X2 | Small content work, medium shared evaluator/UI work. Teacher-selected contrasting rounds are the first alternative |
| R2 Essential now | Incorrect or fleeting traces undermine inference about execution | Branch-specific addresses, pause/step/back, loop counters, durable condition explanations | Learner identifies first divergence and predicts next branch; X3 | Medium cross-layer work. Printed traces support the pilot before UI work |
| R3 Essential prerequisite | Safety stops and goal state are conflated; fixed-repeat work lacks a full budget | Distinguish normal termination, unmet objectives, safety stop; bound every executed operation | Engine adversarial checks plus child explanation of a stopped loop | Medium runtime/evaluator work; no sound content-only substitute for dependable execution |
| R4 Essential curriculum | Completion order and compression dominate the learning sequence | Hybrid concept modules with guided reading, building, repair, fresh checks, and corrective support | Independent explanation and delayed transfer; X1/X7 | Small lesson materials first, medium evidence UI later. Teacher checklist before adaptive routing |
| R5 Essential next | Endpoints alone provide few reasons to act conditionally or remember | One local object sensor, collection action, and explicit task objectives | Optional collection across varying placements; X4 | Medium world/action/objective work. Existing safe-bay worlds teach initial If without objects |
| R6 Essential later | Sensors expose current state but cannot express a remembered count or past event | Explicit integer/Boolean variables, Set/Change, comparisons, and state watch | Correct unseen input sequences; diagnose reset-inside-loop bug; X4 | Large language/editor/trace change. Built-in inventory suffices when only inventory is needed; do not add a variable then |
| R7 Essential later | Repeated code lacks a named purpose or interface | Named procedures with stated entry/exit behavior; then small integer parameters | Reuse in a different caller and repair one definition; X5 | Medium procedures, large parameters/scope. Repeat is simpler for one repeated sequence |
| R8 Optional after simple decisions | Nested yes/no checks become hard to express and compare | Typed AND/OR/NOT expressions, initially two atomic predicates, after nested decisions | Counterexamples for all truth cases; C10 | Medium AST/UI/trace work. Nested If can teach conjunction first; Else If is only a readability option later |
| R9 Optional extension | Current rules cannot represent changes caused by interaction | One switch and door, atomic state updates, later a sequential state-machine strategy | Predict before/after state and explain a phase transition; X6 | Medium–large extension. Static variant worlds usually teach the same conditional more simply |
| R10 Deferred | A broad vocabulary could outpace learners and classroom time | Keep Do While, event handlers, parallelism, general lists, recursion, and full alternative runtimes outside core scope | Reconsider only after an unmet learning need and a successful small prototype | High breadth cost. Body-once plus While, named procedures, paper sorting, or Scratch transfer tasks are cheaper |

The instructional rationale for guidance, transfer, and formative assessment is [S1–S9](research-and-evidence.md). The particular mechanics and sequencing remain Kodergarden hypotheses.

## Essential and optional language

| Construct | Current status | Curriculum role and prerequisites | Proposed semantics and introduction |
| --- | --- | --- | --- |
| Move and Turn | Implemented | Sequence and relative orientation | One Move attempts one tile; Turn changes facing only. Never describe Turn as moving left/right |
| Repeat N | Implemented, integer 1–100 | Known quantity and stable repeated unit | Evaluate count once at entry; execute complete body N times. Keep positive literal counts first; do not silently turn it into a condition loop |
| If | Implemented | Optional action; prerequisite: predict a condition true/false | Evaluate once when reached; false skips body. It neither waits nor keeps checking |
| If / Else | Implemented | Two mutually exclusive actions; prerequisite: If and both outcomes | Evaluate once and execute exactly one complete branch. Later statements follow that branch |
| Nested If | Structurally possible | A second decision that matters only inside the first; after independent two-way reasoning | Teach with two decisions, one new distinction at a time. Avoid deep maze nesting as an introduction |
| While | Implemented, path predicates only | Unknown repetition count, guard, progress; after If and Repeat | Check before each body; false on entry means zero executions; body must eventually change relevant state |
| Repeat Until | Implemented only as `repeatUntilGoal` | Stop condition; after While tracing | Current semantics are pre-test. Generalize later to a Boolean condition; true on entry means zero executions. Do not rename it Do While |
| Variables and comparisons | Absent | Remember count/history; after guarded iteration and visible world-state changes | Explicit declarations/initial values per run, typed integer and Boolean values, Set and Change by, `=`, `<`, `>` first. Comparisons read values and do not assign |
| Procedures | Absent | Name and test a useful behavior; after compound patterns | Definition does nothing until called; call runs body and returns to following statement. No recursion initially |
| Parameters | Absent | Same strategy with one meaningful variation; after procedures and value tracing | Named integer input, evaluated at call, passed by value, read-only inside procedure. Initially one input; two only after pilot |
| AND, OR, NOT | Absent | Combine already understood observations/comparisons | Boolean-only sockets; left-to-right short circuit; visually group operands. OR is inclusive. A skipped operand is shown as “not checked,” not false |
| Else If | Absent | Optional readable multiway selection after nested If / Else | Syntactic presentation of ordered choices; first true case wins. Do not introduce together with AND/OR |
| Do While | Absent, deferred | At-least-once action followed by a continue test | Body, then condition, repeat if true. C11 provides a valid comparison, but core needs do not justify new syntax yet |

All expressions are pure observations or calculations. Conditions never move Pip, collect objects, consume inventory, or advance world time. There is no implicit conversion between numbers and Boolean values. Invalid or missing references produce an authoring error linked to the offending block, not a default zero that hides the problem.

## Choosing the right loop

| Problem | Useful loop | Required counterexample |
| --- | --- | --- |
| A plan calls for exactly four beds to be serviced | Repeat 4 | Change the body but preserve four complete repetitions |
| Move as long as the next tile is open | While path ahead is open | Path is blocked initially: zero moves |
| Travel until the marked stop, even if the corridor continues | Repeat Until at goal | Already at goal: zero moves; goal before wall: stop early |
| Obtain at least one sample before deciding whether another is needed | Do once then While; optional Do While later | First sample already satisfies requirement: one action, not zero |

While and pre-test Until differ in the meaning of their condition: continue while true versus stop when true. With NOT available they can express equivalent rules. Do While differs in *when* it checks; `While NOT done` is not equivalent to `Do body While NOT done` on the initial state. Never teach all these as interchangeable “keep going” blocks.

A proposed general Until can initially appear only as “Repeat until at the goal.” Preserve existing `repeatUntilGoal` when loading older programs, with an explicit normalization step. More surface vocabulary should wait until learners need the distinction.

## The world model

Retain the grid. Static known movement worlds support planning, orientation, decomposition, and debugging. They can demonstrate branch execution, but a single predictable route rarely establishes the value of decisions. A declared family of worlds with opposing action needs is usually enough; fog and moving objects are not prerequisites.

| Candidate mechanic | Educational value | Complexity and confusion risk | Decision |
| --- | --- | --- | --- |
| Explicit variants, variable corridor lengths, mirrored choices | Strong distinction between route and rule | Low world cost; moderate assessment UI; students must know which facts vary | Essential first |
| Nearby path/object sensors | Separates what programmer sees from what program can observe | Low for existing paths, medium for objects; relative versus absolute direction needs instruction | Essential; expose only relevant sensors |
| Collectibles | Optional actions, counters, invariants, objectives beyond arrival | Medium; distinguish visible world quantity, inventory, and learner variables | First interaction |
| Multiple targets and conditional objectives | Planning and decisions based on state | Medium; goal labels must be unambiguous | Add only for collection/inspection units |
| Keys and inventory | Persistent world state can explain dependencies | Medium; may make learner variables redundant | Optional after collection; not a mandatory separate subsystem |
| One switch and one door | Causal state changes, sequencing, simple state machines | Medium; specify when the door changes and whether switch toggles or sets | Optional pilot; prefer Set-open switch initially |
| Pressure plate | Teaches location-dependent state | Medium–high; standing versus leaving creates a second rule | Deferred until switch pilot shows a need |
| Pre-run shifting hedge | Makes a changed configuration salient | Already implemented; animation may distract from the actual condition | Keep as optional variation, test against static contrast |
| Obstacles changing after each action | Temporal reasoning, reactive behavior | High; world tick and sensor timing become simultaneous learning targets | Defer during core control-flow lessons |
| Hidden configurations or sealed input | Distinguishes runtime observation from precomputed route; can motivate memory | Medium; risks surprise rules or impossible information requirements | Use after visible examples, with declared input contract |
| Energy | Accumulation and constraints | Medium; can become another artificial efficiency gate | Optional only when energy is the actual domain objective |
| Multiple robots/parallel behavior | Coordination and concurrency | Very high trace, scheduling, interface, and safety cost | Defer; not needed for core CT outcomes |

### Interaction contract

For the first collection extension, an object is a typed item on one tile. `item here?` is a Boolean sensor. `collect` removes that item and updates built-in inventory atomically. Collecting an empty tile yields an explicit invalid-action result; it does not silently succeed. The task may require zero invalid actions, but that rule is announced before Run. Decorative sprouts must remain visibly different from interactive items.

Initially all state changes are caused by explicit commands, except the already documented pre-run hedge transition. The order is: check action precondition, apply action, apply its immediate linked world effect, record resulting snapshot, evaluate objective indicators, then continue execution. Conditions are evaluated only against settled state. Playback speed never changes semantics. No real-time physics or races are introduced.

World state and learner memory are different. Inventory is world state that the system maintains. A counter variable is memory the learner programs. If `inventory count` already answers the question, adding an identical learner counter is decorative. C08 therefore uses transient observations that are no longer available after advancing.

## Objectives, visibility, and deterministic variation

An objective is a declared predicate over final state and, where necessary, an event summary: reach a named tile, collect specified objects, report a count, perform at least one scan, avoid invalid actions, or leave a door in a stated condition. Each objective has a child-readable label and visible status. The program normally runs to its end; reaching a target mid-program is an observation, not automatic termination.

For a finite program, success requires normal termination and all required objectives. A safety limit yields “paused by safety limit,” even if Pip is temporarily at the goal. Optional efficiency badges appear only after correctness and never imply mastery. Existing programs retain legacy semantics until explicit revision/migration; do not silently invalidate saved content.

Introduce scenario families with two visible contrasting cases, then a visible test set. Later assessment cases may be unseen beforehand but must obey the disclosed rules, sizes, sensor availability, and goals. Reveal the first failing case and replay after submission. This turns a hidden case into a learnable counterexample rather than a secret exception.

Use authored cases first. If generation is later useful, resolve a seed and generator version into an immutable world before evaluation; store its fingerprint with the run. Derive any changing-obstacle schedule from semantic action ticks, never animation timing or `Math.random` inside a sensor. Same program, revision, world, and seed must produce the same trace on client and server.

No assessment can require an action based on information unavailable to the program. If the same sensor/memory state demands two different actions, either expose the missing observation or redesign the task. Partial observability is educational only when the missing information can be obtained or remembered.

## Feedback and debugging design

The first layer describes what happened; later layers help locate and explain the discrepancy. Learners may request hints; neither run count nor elapsed time triggers disclosure of the full solution.

| Layer | Example | Purpose |
| --- | --- | --- |
| 1 Outcome | “Garden 2: Pip reached the stop. One seed is still on the path.” | Separate objective results from generic failure |
| 2 Evidence | “At this If, item here was No, so Collect was skipped.” | Connect state, test, and chosen behavior |
| 3 Prompt | “What must change before this While test becomes No?” | Direct attention without supplying code |
| 4 Contrast | Replay one working and one failing case up to first divergence | Help learner test a hypothesis |
| 5 Scaffold | Offer a partially completed program or trace | Reduce load after an explanation attempt; mark assistance |
| 6 Worked example | Teacher/requested reveal, then a fresh independent task | Restore progress without treating copied success as mastery |

If / Else highlights the test, keeps its result visible while the selected branch executes, and marks the other branch “skipped.” It must never highlight both child blocks at the same numeric offset. While shows `check → body iteration 1 → check → … → exit`, including an immediate exit. Until shows `done? Yes → exit` so the polarity is visible. A later Do While would place the test at the bottom and visibly run one body before any condition evaluation.

Loop badges show current iteration and, for fixed Repeat, total count. A two-level loop displays separate inner/outer counts. Variables show previous value, new value, and responsible block. Procedure traces show call site, input value, active definition, and return location. Avoid simultaneous animated highlights in every panel.

Step advances by a meaningful action, condition check, assignment, call, or loop boundary—not every low-level event. Back restores a previous recorded state and cursor; it does not run inverse commands. Reset restarts the same case; edit creates a new run. Replay is clearly labeled as viewing the previous run, not re-evaluating changed code. Pause freezes playback; runtime cancellation is a separate engine concern in E.

For a possible nonterminating loop, say “The safety limit stopped this run. This condition stayed Yes in the last checks.” Show the relevant condition and values. Do not claim a proof of infinity from a finite budget. Unreachable goals may be authored defects; reference checking should detect them before publication. A learner loop that leaves required state unchanged should receive a prompt about progress, not a cryptic timeout.

## English and Spanish language choices

Programs store semantic IDs; translations label them. Use short natural phrases and test them with learners. Existing neutral Latin American Spanish remains the baseline. Proposed phrases below require classroom review.

| English | Spanish | Teaching distinction |
| --- | --- | --- |
| Move forward one tile | Avanzar una casilla | Movement relative to facing |
| Turn left / right | Girar a la izquierda / derecha | Rotation without changing tile |
| If path ahead is open | Si hay camino adelante | `Si` without accent for condition; `Sí` for a Yes result |
| Otherwise | Si no | “Si / Si no” can remain the compound heading; explain mutually exclusive actions |
| Repeat 4 times | Repetir 4 veces | Known count |
| While path ahead is open | Mientras haya camino adelante | Check before each repetition |
| Repeat until at the goal | Repetir hasta llegar a la meta | Stop condition; avoid suggesting this always runs once |
| Set seeds to 0 / Change seeds by 1 | Fijar semillas en 0 / Cambiar semillas en 1 | Assignment versus update |
| Define / Call service bed | Definir / Ejecutar atender parterre | Define versus execute; test familiar regional noun |
| AND / OR / NOT | Y / O / NO | Inclusive OR and visible expression grouping |
| Do once, then repeat while | Hacer una vez y repetir mientras | Optional later wording for post-test semantics |

Do not mix `battery` as an endpoint metaphor with an energy meter until they are visually and linguistically distinct. “At the goal” should become the general semantic label, with scenario-specific labels such as “at the battery” where appropriate.

## Tablet authoring and vocabulary control

Keep dropdown path directions initially. When expressions arrive, use typed condition chips and explicit grouped operands; a novice should not have to drag tiny sockets inside a deeply nested card. Provide a tap-select-insertion workflow and keyboard equivalent in addition to dragging. Preserve Undo/Redo and predictable whole-body movement.

Use two visible nesting levels as an initial authoring target, not a semantic restriction. Deeper logic should prompt a named subproblem, a collapsed body with an accessible summary, or an alternative layout. Test in portrait with Spanish copy and on a physical tablet. No animation-only, color-only, or hover-only explanation should be necessary.

Expose only blocks needed for the module, while revisiting earlier ones. Temporary restricted palettes can focus attention, but a learner's valid alternative should count as task success unless it violates an announced domain requirement. A follow-up prediction or comparison can supply missing concept evidence.

## Further concepts and the grid boundary

Simple state machines can be taught as a strategy using a phase variable, for example searching then returning, after variables and procedures. A new State Machine block is unnecessary initially. Events become useful for a later interactive garden or story; begin with one event handler at a time and a stated event queue before discussing concurrent behavior.

Lists, recursion, and parallelism should wait for domains that need them: multiple remembered observations, hierarchical structures, or independent actors. Do not use self-calling procedures as the first meaning of repetition. Parameters and composition already offer substantial abstraction practice.

If navigation consumes more attention than the target concept, offer a small inspection bench using the same deterministic command/sensor contract. First pilot it with cards or a fixed station in the grid. A separate runtime is warranted only if that simpler representation improves transfer and repeated garden extensions are demonstrably confusing.
