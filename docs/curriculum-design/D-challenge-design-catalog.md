# Challenge Design Catalog

These twelve challenge designs form reusable learning families, not twelve successive block tutorials. Each includes discovery, explanation, and a fresh-case check. All are proposals. C01–C06 use existing language/world primitives, although predict/debug task handling and feedback need work; C07 onward requires the extensions identified in [E](E-technical-feasibility.md).

The reference movement strategies for C01–C06 were checked against the current engine in 16 specified configurations, including zero-iteration cases and both staircase sizes. They all terminated at the intended goal without collisions. This verifies geometry and execution, not learning effectiveness or a shipped challenge experience. C07–C12 are semantic design walkthroughs pending their mechanics.

Coordinates use `(x,y)`, origin at top left, east increases x, north decreases y. Unless stated otherwise, only listed path cells are open; every other cell is blocked. All cases are deterministic. Pseudocode is explanatory notation, not valid current JSON. `Move`, `Left`, and `Right` mean one tile or one quarter-turn. A body runs fully before a loop checks again. Correctness includes normal termination; safety and pedagogical limits are distinct.

For unfamiliar cases, tell learners what may vary before they program. All failed assessment cases become replayable afterward. A reference strategy is one valid approach; alternatives satisfying the announced contract earn task success. Assessment of the intended concept additionally uses the prediction/repair evidence specified below.

## C01 Same journey and a changed plan

**Context and objective:** Pip follows a delivery plan. First learn order and facing; then discover a compact description for a known repeated journey. This replaces mandatory repetition of identical beginner build tasks and improves F05–F07.

**Starting worlds:** sequencing world is a 4×4 lawn with no obstacles, Pip `(1,2)` north, goal `(2,1)`. Compare `Move; Right; Move` with `Right; Move; Move`: endpoints are `(2,1)` and `(3,2)`. Repetition world is 8×3, open `(0..6,1)`, Pip `(0,1)` east, goal `(6,1)`.

**Blocks and observations:** sequencing uses Move and Turn; repetition first uses Move/Turn, then reveals Repeat. Learners see the whole route and its known length. They must determine command order, then the repeated unit and count.

**Why the construct helps:** six expanded moves work. Repeat communicates the sixfold pattern and makes a changed plan easier to edit; completion is not withheld merely because the expanded version is longer.

```text
Repeat 6:
  Move
```

**Incorrect strategies and run behavior:** Repeat 5 stops short; Repeat 7 reaches a wall after six moves; `Repeat 6 {Move; Right}` changes direction each iteration. Replay shows each complete body, iteration count, and facing. A turn does not move Pip.

**Feedback:** ask “What does one pass through this body do?” Offer expanded cards alongside the loop, then remove them. Avoid immediately supplying the correct count.

**Success and assessment:** reach the goal with no collisions, then predict an expanded loop and repair an incorrectly scoped turn. Both the expanded and repeated correct solutions earn correctness. Independent evidence requires explaining six executions of one body.

**Variation:** change the known length to four or five and allow editing the count; rotate the sequencing start. This is adapting to a changed known specification, not claiming one literal Repeat count handles unknown lengths.

**Weak versus strong:** “Use no more than two blocks” forces compression. “Show two descriptions of the same trip, then update a changed delivery plan” exposes why a repeated unit is useful.

## C02 Check the loading bay

**Context and objective:** enter the adjacent loading bay if it is open; otherwise remain safely where you are. Teach optional action before decisions inside loops. Replaces F10 and E04.

**Starting worlds:** 3×3, Pip `(1,1)` north. Open case: open cells `(1,1),(1,0)`, goal `(1,0)`. Closed case: only `(1,1)` open, goal `(1,1)`. All other cells blocked. Starting on the goal in the closed case is intentional: doing nothing is sometimes correct. The program still executes normally.

**Blocks and observations:** Move and If with path-ahead condition. Both cases are shown before authoring. Learners must determine whether a move should occur; no guessing about hidden doors is involved.

**Useful strategy:** If separates observing from acting and makes one program correct in both states.

```text
If path ahead is open:
  Move
```

**Incorrect strategies and run behavior:** unconditional Move collides in the closed case; empty program or empty If does not enter the open bay; Move followed by empty If still collides when closed. In the false case the body is visibly skipped and the program ends at its initial tile.

**Feedback:** display “Path ahead: No. Move skipped. Pip stayed safe.” For a collision, point to the observation available immediately before the move and ask whether it should always occur.

**Success and assessment:** same program reaches each case's target with zero collisions, then learner predicts the false case and explains why If does not wait for the bay to open. No small block cap is needed. The task is representable with the current grid and goals; richer objective labels improve communication later.

**Variation:** rotate both states east; later use C07's optional object with the same decision structure. The new sensor context tests transfer beyond wall avoidance.

**Weak versus strong:** one permanently open bay merely adds a ceremonial If. Opposing cases make an optional action matter and an empty If cannot compensate for unconditional movement.

## C03 Choose the open delivery lane

**Context and objective:** choose one of two lanes after observing which is open. This introduces If / Else without a loop or moving hedge.

**Starting worlds:** 5×5, Pip `(2,3)` north. Left case open cells `(2,3),(1,3),(0,3)`, goal `(0,3)`. Right case open cells `(2,3),(3,3),(4,3)`, goal `(4,3)`. Ahead is blocked in both. Exactly one side lane is open; disclose this invariant.

**Blocks and observations:** Move, Turn, Repeat, If / Else; path-left/right/ahead. Learners see both cases and must map a sensor result to one turn. Optional scaffold supplies the two moves after an incomplete branch.

```text
If path left is open:
  Left
Else:
  Right
Repeat 2:
  Move
```

**Why useful:** a fixed first turn fails in one case. The code after the choice is shared. With a single visible obstacle and no family, hardcoded movement would remain sufficient.

**Incorrect strategies and run behavior:** always Left fails right case; swapping bodies reverses choices; placing both turns after the test yields a route independent of the result. The trace must highlight only the chosen branch and keep the test result visible while it runs.

**Feedback:** “Left was closed, so the Right turn ran. Which direction is Pip facing now?” A sensor ray is drawn relative to Pip. After a failed run, replay the first inappropriate turn rather than reveal the whole solution.

**Success and assessment:** reach both targets without collisions, predict one true and one false branch, and identify the shared post-branch movement. Then compare an If / Else with two separate Ifs where the first turn changes the second sensor's frame.

**Variation:** rotate each whole configuration; change lane length to three only in a separate known-count revision exercise. Later add the existing pre-run shifting hedge while keeping the settled cases equivalent; test whether motion contributes learning.

**Boundary:** this strategy is not valid for “both sides closed” or “both open, prefer right.” Those require a revised contract or an additional decision, not surprise tests.

## C04 Corridor with an unknown length

**Context and objective:** reach the end of a corridor whose length varies. Contrast a known Repeat count with a condition that changes through action. Extends F15 and revisits F11.

**Starting worlds:** 8×3; for length `L` in `{0,1,3,6}`, open `(0..L,1)`, Pip `(0,1)` east, goal `(L,1)`. The next tile after the goal is blocked. L=0 tests an initially false condition. Preview L=1 and L=3; show the full allowed range 0–6 before the fresh checks.

**Blocks and observations:** Move, Repeat, If, While; ahead sensor. Students determine whether the number of actions is known before the program starts and what observation tells them to stop.

```text
While path ahead is open:
  Move
```

**Why useful:** the same stopping rule covers zero through six moves. `Repeat 6 {If path ahead {Move}}` is also correct within the declared range and should be accepted. Comparing its extra tests exposes why While expresses the rule more directly; it is not rejected merely for being longer.

**Incorrect strategies and run behavior:** a fixed three moves stops short or collides; `If ahead {Move}` moves only once; empty While never changes a true test. A turned body may leave the relevant path open indefinitely. A bounded run stops and explains the persistent test.

**Feedback:** on L=0 show “First check: No. Body ran zero times.” On a stalled loop, show the last checks and ask which body action could change what is being tested.

**Success and assessment:** normal termination, no collisions, goal reached in every case; independently predict zero/one/many iterations and repair one nonprogressing body. Discuss a corridor longer than the old Repeat bound as a reasoning prompt, not an undisclosed assessment rule.

**Variation:** vertical corridors and a collection stream with `has next?`. Different pictures are near transfer; the stream tests a more general stopping-rule interpretation.

**Weak versus strong:** counting a visible fixed hallway with a required While only demonstrates syntax. A family including zero-length and longer cases distinguishes checking from counting.

## C05 Stop at the sign before the wall

**Context and objective:** Pip must stop at a marked delivery tile even when it could keep moving. Teach a stopping condition and goal/termination distinction, with a deliberate debugging version.

**Starting worlds:** 8×3, open row `(0..7,1)`, Pip `(0,1)` east. Goals at x=0, 2, 4, or 6. The corridor itself remains identical. For the repair variant use goal x=3 with the supplied body containing two Moves.

**Blocks and observations:** Move, While, Repeat Until Goal, If. Learners see that “path is open” and “at the goal” answer different questions. They must determine which fact controls repetition.

```text
Repeat until at the goal:
  Move
```

**Why useful:** While path ahead continues past an intermediate goal. The goal loop checks before each body and handles starting at the goal with zero movement.

**Incorrect strategies and run behavior:** path-based While ends at x=7; fixed count fits one goal only. `Until goal {Move; Move}` can pass over odd-position goals between checks. Current execution semantics finish the body before checking again; the program does not automatically break mid-body when a goal event occurs.

**Feedback:** show the goal check and body boundary. For the two-Move bug, pause after the first Move onto x=3 and ask what still remains in this body. A later safety stop is reported as a stopped run, never a successful algorithm.

**Success and assessment:** normally terminate on each target, predict the initial-goal case, repair the overshoot bug, and explain when the check happens. Learners may choose a logically equivalent While with NOT once that language is available.

**Variation:** C04 end-of-corridor goal versus this intermediate goal; later “until all items are inspected” with a disclosed object objective. F16's left-turn route becomes an application after this distinction is understood.

**Weak versus strong:** putting every target against a wall makes path and goal tests observationally interchangeable. The intermediate marker makes their difference visible.

## C06 Build and revise a staircase pattern

**Context and objective:** reproduce a recurring garden border, then change the dimensions of its repeated motif. Develop nested units without pretending nesting is the only valid solution.

**Starting world:** 9×9, start `(0,8)` east. Open route: `(0,8),(1,8),(2,8),(2,7),(2,6),(3,6),(4,6),(4,5),(4,4),(5,4),(6,4),(6,3),(6,2)`. Goal `(6,2)`. All other cells blocked.

**Blocks and observations:** Move, Turn, Repeat. Learners see three identical steps, each with two eastward and two northward moves. They identify both the whole step and the repeated movement inside it.

```text
Repeat 3:
  Repeat 2: Move
  Left
  Repeat 2: Move
  Right
```

**Why useful:** nested loops express repetitions at two scales. The final Right restores east-facing orientation for the next unit; removing it breaks composition. A flat body `Move; Move; Left; Move; Move; Right` is equally valid and has the same authored block count here. Discuss representation and revision rather than awarding mastery for compression.

**Incorrect strategies and run behavior:** Repeat 6 around a single Move/turn pair changes the geometry; missing the restoring turn rotates later units; changing outer count to change tread width alters the wrong scale. Trace one inner loop and one complete outer loop separately.

**Feedback:** “After one stair, Pip moved two east and two north and faces east again.” Ask which count would change if each tread grew, and which if another whole stair were added.

**Success and assessment:** reach goal, predict the inner/outer counts, repair a count at the wrong scale, then revise a new specification. For the revision use 11×11, start `(0,10)` east, three stairs each three east/three north, goal `(9,1)`; open exactly the drawn staircase. Editing the two inner counts is allowed and expected.

**Variation:** mirror with right turns, or add a fourth stair to a sufficiently large world. These are changed known specifications, not tests requiring the original literal counts to generalize unchanged.

**Weak versus strong:** E03's tiny nested Repeat adds no needed reasoning. Naming two scales and predicting how each change affects geometry creates a genuine nested-unit task.

## C07 Collect only where an item is present

**Context and objective:** gather seed packets on a short path and return a clean delivery, using a meaningful optional action beyond navigation.

**Starting worlds:** 6×3, open `(0..4,1)`, Pip `(0,1)` east, destination `(4,1)`. Packets occur at a subset of x=0..3; no packet is at the destination. Cases: none; `{1}`; `{0,2,3}`; fresh `{0,1,3}`. All other cells blocked.

**Blocks and observations:** Move, Repeat, If, `item here?`, Collect. Quantity in inventory is system-maintained world state; no learner variable is introduced. Learners see packets in discovery cases and determine whether collection should occur before moving.

```text
Repeat 4:
  If item here:
    Collect
  Move
```

**Why useful:** an action is meaningful at some tiles and invalid at others. The known four path positions retain familiar control structure while object state is new.

**Incorrect strategies and run behavior:** collecting everywhere produces empty-tile errors; moving before checking misses x=0; sensing without Collect leaves packets in place. Collect atomically removes the packet and increments inventory. Sensors never consume objects.

**Feedback:** objective panel separately shows destination and packets remaining. “The test saw a packet here, but no Collect ran before Pip left.” Offer the tile trace and ask where the check/action belong.

**Success and assessment:** all packets collected, Pip at `(4,1)`, no invalid collection or collision, normal termination in all cases. Ask for the inventory before/after one collection and repair a move-before-check program. Do not require an unnecessary authored counter.

**Variation:** add packets at the destination only in a new announced specification, which requires a final check; learners explain why changing the specification changes the algorithm. Another transfer asks whether a light should be switched off only if it is on.

**Weak versus strong:** collecting a packet on every tile with a required If does not need optional behavior. Empty and populated tiles make the test consequential.

## C08 Remember the inspection results

**Context and objective:** count marked trays as they pass a scanner. Earlier readings are no longer observable after the next scan; report the total at the end. Then revisit with a Boolean flag and an accumulator.

**Starting world:** a 3×3 inspection station, only `(1,1)` open, Pip there facing north. Position is irrelevant to success. A deterministic input sequence contains 0–6 trays. `has next?` reports whether another tray exists; Scan Next consumes one and sets a read-only current reading. Before any scan there is no reading; reading it is an explicit error. The input sequence is not directly accessible to the learner program.

**Blocks and observations:** While, If, Scan Next, `current marked?`, integer variable, Set, Change by, Report. Discovery shows an example strip `[marked, plain, marked]`, then covers previous readings as it advances. Learners determine what must be remembered and when to initialize it.

```text
Set count to 0
While has next:
  Scan Next
  If current marked:
    Change count by 1
Report count
```

**Why useful:** current observation alone cannot answer a question about all previous trays. A hardcoded report fits one strip only. A system-maintained count is deliberately not exposed; if it were, this memory task would be redundant.

**Incorrect strategies and run behavior:** Set count to 0 inside While forgets previous matches; Set count to 1 records only the latest match; increment outside If counts all trays; read before scanning uses absent/stale input. Each update shows old and new value with its block.

**Feedback:** replay the second match and ask “What should count remember before this update?” For empty input, display zero loop bodies and the initial value used in Report.

**Success and assessment:** consume all input, report exactly the marked count, terminate with no invalid scans on `[]`, `[plain]`, `[marked]`, mixed and all-marked strips. Require an unseen strip, a value prediction, and a reset-inside-loop repair.

**Variations:** flag task reports whether any marked tray occurred: initialize false and set true on a match. Accumulator task scans amounts 0–3 and adds each amount to total; vary sequences with equal length but different sums. Ask why a flag cannot answer “how many.” These are later lessons, not three new variable roles at once.

**Weak versus strong:** renaming a visible inventory count as a variable adds no memory need. Transient readings plus a later report make state a purposeful tool.

## C09 Name a reusable bed service

**Context and objective:** retrieve packets from two garden spurs while returning to the main path in a predictable orientation. Teach procedures as contracts, then parameters as meaningful variation.

**Starting world:** 7×5. Open main path `(0..6,3)` plus `(1,2),(1,1),(4,2),(4,1)`. Pip `(0,3)` east, goal `(6,3)`, packets at `(1,1)` and `(4,1)`.

**Blocks and observations:** Move, Turn, Repeat, Collect, Define procedure, Call; later one integer parameter. Learners first solve one spur, describe its entry/exit behavior, then see that the same task recurs farther along the route.

```text
Define serviceBed:
  Left
  Repeat 2: Move
  Collect
  Right
  Right
  Repeat 2: Move
  Left

Move
Call serviceBed
Repeat 3: Move
Call serviceBed
Repeat 2: Move
```

**Contract and usefulness:** enter at a spur entrance facing east; retrieve its tip packet; return to the same entrance facing east. A named, testable unit lets the main plan describe jobs and ensures one repair benefits both calls. It is useful beyond saving blocks.

**Incorrect strategies and run behavior:** definition alone performs no action; failing to return to the entrance breaks the next caller; missing the final turn changes later movement; hardcoding global coordinates prevents reuse. Trace shows definition execution only on a call and return to the next main statement.

**Feedback:** test the procedure alone from an entrance, display start/end facing, and ask which part of the contract failed. Do not propose shrinking code as the sole improvement.

**Success and assessment:** both packets collected and goal reached; predict the second call's entry/exit states, fix a single definition defect, and reuse it at another entrance. A fully expanded valid solution earns correctness, followed by a procedure comparison task for abstraction evidence.

**Parameter variation:** change the second spur to depth one with its packet at `(4,2)` and close `(4,1)`. Rename the two inner Repeat counts to input `depth`, then call `serviceBed(2)` and `serviceBed(1)`. Calls evaluate their positive integer input once. The input is local/read-only; no automatic coordinate teleportation occurs.

**Weak versus strong:** forcing a procedure on one short route only creates another compression rule. Repeated subjobs with explicit return behavior and differing inputs reveal abstraction and composition.

## C10 Decide which parcel needs cover

**Context and objective:** report whether a garden parcel needs protective cover. The stated policy for this exercise is “cover only when the parcel is fragile AND the weather is wet.” This is a fictional classification rule, not a claim about real packaging.

**Starting worlds:** 3×3 station, Pip `(1,1)` north; no movement objective. One parcel has Boolean `fragile`, the world has Boolean `wet`. Use all four combinations `(false,false)`, `(false,true)`, `(true,false)`, `(true,true)`.

**Blocks and observations:** If / Else, Report Boolean, pure `parcel fragile?` and `weather wet?`; start with nested decisions, then reveal AND. Later tasks add OR and NOT separately. Learners see both attributes and must determine which combinations satisfy the policy.

```text
If fragile AND wet:
  Report true
Else:
  Report false
```

Before revealing AND, compare this equivalent nested strategy:

```text
If fragile:
  If wet:
    Report true
  Else:
    Report false
Else:
  Report false
```

Use the same four cases to distinguish later policies, rather than changing both the world and the operator at once:

| Fragile | Wet | Fragile AND wet | Fragile OR wet | NOT wet |
| --- | --- | --- | --- | --- |
| No | No | No | No | Yes |
| No | Yes | No | Yes | No |
| Yes | No | No | Yes | Yes |
| Yes | Yes | Yes | Yes | No |

**Why useful:** neither predicate alone classifies all four states correctly. Nested If / Else is an acceptable equivalent; AND expresses the composed rule directly. A truth table is a test set, not a memorized ritual detached from the task.

**Incorrect strategies and run behavior:** OR accepts fragile/dry and sturdy/wet cases; NOT wet reverses the weather policy; two independent Reports can produce contradictory output. Evaluation shows operand values and the selected branch. Short-circuited operands are labeled not checked.

**Feedback:** reveal the first counterexample and ask which part of the rule was required but absent. Let learners choose a case that distinguishes AND from OR before rerunning.

**Success and assessment:** exactly one correct report in all four cases, explain why a near miss is false, and construct a counterexample to a buggy rule. Later compare “cover when fragile OR wet,” including the both-true case to expose inclusive OR.

**Variation:** use a remembered flag plus a current sensor after M7; or translate the policy into two nested decisions. Else If is considered only for a later three-category policy where ordered choice improves readability.

**Weak versus strong:** a task displaying only both-true objects cannot distinguish AND, OR, or a single predicate. The contrasting cases make the logic observable.

## C11 Take one sample before deciding

**Status:** optional Do While experiment, not core curriculum or a commitment to a new block.

**Context and objective:** obtain at least one water-quality sample; if that sample is marked dirty, obtain another until the sample is clean. This simplified deterministic station has no real-world safety interpretation.

**Starting worlds:** 3×3 station, Pip `(1,1)` north. Input is `[clean]`, `[dirty,clean]`, or `[dirty,dirty,clean]`; every sequence contains a clean sample. No sample exists initially. A `sample dirty?` observation before sampling is unavailable, not a remembered result from the prior run.

**Blocks and observations:** Sample, While, sensor sample-dirty, then optional Do While. Learners observe that a decision about a sample requires first obtaining it; they determine when the first check can occur.

```text
Sample
While sample is dirty:
  Sample

# Equivalent later notation:
Do:
  Sample
While sample is dirty
```

**Why useful:** the post-test form packages a compulsory action followed by a continuation rule. The simpler action-plus-While version is already understandable and remains accepted. This task demonstrates meaningful semantics without establishing that the extra construct belongs in the core language.

**Incorrect strategies and run behavior:** While sample-dirty before any Sample attempts to read absent state; treating the initial state as clean incorrectly permits zero samples; fixed three samples reads beyond the shortest sequence. The trace places the first Sample before the first condition evaluation.

**Feedback:** ask “Which action gives this test something to inspect?” Contrast one sample for initially clean input with zero body runs in C04's initially blocked corridor.

**Success and assessment:** take at least one sample, end after the first clean sample, avoid reading beyond input, and predict all three counts. Explain why this differs from pre-test Until; compare with the expanded version on a fresh task.

**Variation and release decision:** test X8 only with learners secure in While. If Do While increases vocabulary errors without better explanations or transfer, retain the expanded version and defer the block.

**Weak versus strong:** requiring Do While to walk a corridor is a syntax exercise. A task whose first observation depends on its first action supplies a real semantic reason.

## C12 Plan an inspection mission and transfer it

**Context and objective:** inspect trays along a garden path, collect them, and report the total number of seeds they contained. The tray count and seed total differ. Combine optional action, iteration, memory, and decomposition, then apply the same idea outside navigation.

**Starting worlds:** 6×3, open `(0..4,1)`, Pip `(0,1)` east, destination `(4,1)`. Trays may occur at x=0..3, each with a locally observable amount 0–3. After collection, the tray and its amount are no longer observable by the program. Built-in inventory reports number of trays only, never seed total. Cases: no trays; `{1:2}`; `{0:1,2:3,3:0}`; fresh `{0:3,1:2,3:1}`. Destination has no tray.

**Blocks and observations:** previously learned movement, goal Until, If, pure item/amount observations, Collect, Set/Change, Report, named procedures. No new construct is introduced. Learners see the contract and must plan separate inspection, travel, and reporting subproblems.

```text
Define inspectTile:
  If tray here:
    Change total by tray amount
    Collect

Set total to 0
Repeat until at the goal:
  Call inspectTile
  Move
Report total
```

**Why useful:** a route alone cannot satisfy the report objective; inventory alone gives the wrong quantity; a procedure communicates the local inspection job. A known Repeat 4 version is equally correct here and must be accepted. Learners justify their choice instead of inserting every available construct.

**Incorrect strategies and run behavior:** collect before observing loses the amount; adding one counts trays; resetting total per tile forgets history; moving before inspection misses a tray at the start. Trace highlights the observation, update, removal, and subsequent move in that order.

**Feedback:** report objective results separately. A wrong sum prompts comparison of expected and actual total immediately after the first differing update, without revealing the whole program.

**Success and assessment:** all trays collected, correct seed total reported, destination reached, normal termination, no invalid actions across all cases. Learner authors a valid test that catches “count trays” or “skip start” and explains the failing line. Choose two contrasting student strategies for discussion.

**Transfer:** replace the garden with a paper stream of optional receipts containing amounts. Ask for a rule and value trace using no movement blocks; later translate to simple text pseudocode. Assess the mapping explicitly: tray amount becomes receipt amount, travel becomes next input, total remains the accumulator. Recheck after a delay using a different narrative.

**Weak versus strong:** a capstone demanding a nested loop on one endpoint route measures compliance. This mission tests decisions about tools, objectives, remembered information, test design, and an unfamiliar representation.

## Authoring review checklist

Before publishing a family, verify that every case follows its contract; at least one case defeats the plausible misconception; a reference and at least one legitimate alternative work; wrong strategies fail for educational reasons; objective and collision rules are visible before Run; hints identify evidence before revealing a strategy; Spanish instructions preserve the same rule; and a physical-device review separates editing friction from reasoning difficulty.

Use a family-level learning objective, a small set of reusable world rules, and explicit assessment scope. Add a new object or sensor only when existing observations cannot express the intended problem. The mechanics above are original proposals; they should be piloted rather than treated as validated learning interventions.
