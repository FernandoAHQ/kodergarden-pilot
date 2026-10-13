# Practice guidance plan

Status: T0–T3 implemented in guided Practice on 13 October 2026. T4 authoring and reuse in Campaign and Live remain pending. Classroom and physical-device validation remain pending.

## Purpose and scope

Practice guidance should help a learner answer three different questions without turning the activity into a sequence of modal instructions:

1. **How do I use this interface?** Dragging, tapping, inserting, changing a value, undoing, running, resetting and switching gardens.
2. **What does this block mean?** The block's exact effect, when it checks state, what repeats, and what it does not do.
3. **How can I investigate this attempt?** The first difference between the learner's expectation and the trace, followed by progressively stronger hints only when requested.

The first implementation targets guided Practice campaigns and the shared visual editor. The same block reference and trace explanations can later be reused in Campaign and Live modes, but those modes should not receive new guidance automatically until their evidence and facilitation rules are reviewed.

The original Foundations campaign is the P1 baseline. Do not add, remove or change its automatic hints during an active comparison. Guidance must be attached to a versioned curriculum or feature flag so groups never receive silently different treatment.

## Design rules

- Show at most one automatic teaching surface when a challenge opens. Never stack coach marks, popovers and result feedback.
- Keep every explanation dismissible and permanently available again from **Block help**.
- Do not require hover. Every surface must work with tap, keyboard and a screen reader.
- Do not open guidance while a program is running. A drag, Run, Reset or garden change closes a transient popover without marking the concept learned.
- Use an unrelated miniature example for block semantics. Do not reveal the current challenge's solution.
- Give outcome feedback before optimization feedback. Reaching the goal safely is distinct from using fewer blocks.
- Treat interface help and conceptual help separately. Neither automatically becomes independent or transferred evidence.
- Do not trigger hints from elapsed time or number of edits. Those signals confound reading, motor access and reasoning.
- Fresh and delayed assessment activities receive no automatic conceptual coach marks. If reference or hints remain available, their use is visibly recorded as support for that attempt.
- English and Spanish must express the same rule, including zero iterations, relative direction and the distinction between a test and an action.

## Guidance surfaces

| Surface | Purpose | Trigger | Behavior |
| --- | --- | --- | --- |
| Palette microcopy | One-line meaning under every available block | Always visible | Existing card description remains concise and uses a visible info button. |
| Block popover | Exact behavior, a tiny example, and one common mistake | Learner taps the info button or a placed block's help action | Anchored beside the block on desktop; bottom sheet on narrow screens. It never changes the program. |
| First-use coach mark | Introduce a newly unlocked concept | First visit to a discovery/build challenge with `unlockKey` | Highlights one palette card and offers **Try it** and **Not now**. It appears once per guidance version and remains reopenable. |
| Block anatomy callout | Explain editable parts such as count, condition and body | First insertion of a new container block | Labels the count/test/body in place. It closes on edit or Run and does not reopen automatically. |
| Trace explanation | Connect the active block to visible state | First relevant check or loop boundary during stepped/replayed execution | Shows short text such as “Path ahead: No, so the body is skipped” or “Repeat pass 2 of 4.” |
| Result diagnosis | Explain the observable reason an attempt did not finish | Every completed run | Names the outcome and links to the relevant trace point without proposing a full program. |
| Hint drawer | Offer progressively stronger investigation prompts | Learner selects **Get a hint** after an incomplete result | Preserves the program and reveals one level at a time. Conceptual stages are recorded as supported work. |
| Block help drawer | Provide an always-available reference for every unlocked block | **? Block help** in the palette heading | Remembers the last entry, supports search by block name, and shows only concepts available in the current curriculum. |
| Family-of-gardens callout | Explain that one unchanged program is evaluated in every listed garden | First family challenge and first family failure | Points to the garden buttons, states the invariant, and offers **Show the first failing garden** after a run. |

Use transient toasts only for action confirmation such as “Program restored.” Do not use toasts for rules, failures or content a learner may need to reread.

Full-screen modals are unnecessary for normal block teaching. The existing prediction commitment is a required task step and should remain visibly distinct from optional help.

## Practice-round sequence

### 1. Orient

On the learner's first Practice challenge, show one short interface coach that identifies the palette, program and Run action. Use a neutral two-step demonstration unrelated to the assigned route. The learner can dismiss it immediately or reopen **How to build** from Block help.

### 2. Encounter the problem

Let the learner inspect the challenge and garden before explaining the strategy. When a level introduces a block, retain the existing new-tool banner but make **Show me** open the first-use coach. Do not automatically display a worked example before the learner sees the problem.

### 3. Build

Palette cards keep their short descriptions. Tapping the info control opens the block popover; dragging or tapping the card inserts it. The first inserted Repeat, If, If / Else, While or Repeat Until block receives one anatomy callout for its editable controls and body slots.

### 4. Predict and run

Discovery tasks can ask a short optional prediction such as “Which block runs next?” before the first execution of a newly introduced control block. Formal predict activities retain their committed endpoint/direction input. During playback, explanations attach to semantic trace events rather than animation time.

### 5. Diagnose

After an incomplete run, show what happened and where it first became visible. The result card offers **Review this step** and **Get a hint**. Review jumps to the relevant frozen trace frame. It does not alter the program.

### 6. Generalize

On family challenges, the UI states before authoring that the same program will be tested in every listed garden. After evaluation, passed gardens remain visible and the first failing garden is selected on request. A hint discusses the shared rule rather than giving separate routes.

### 7. Complete and retrieve

Completion feedback celebrates the result and may ask one short causal question. It should not open a new lesson before the learner chooses Next. Fresh and delayed checks suppress automatic semantic guidance so their evidence can be interpreted separately.

## Block reference content

Each entry has four fixed fields: **Does**, **Does not**, **Watch**, and **Try**. “Try” uses a miniature example that cannot solve the current challenge directly.

| Concept | Does | Critical distinction and common mistake |
| --- | --- | --- |
| Move Forward | Moves Pip one tile in the direction Pip faces when that tile is open | It does not move toward the battery automatically. A blocked move leaves Pip in place. |
| Turn | Rotates Pip left or right by one quarter-turn | It does not move Pip to a new tile. Left/right are relative to Pip's current facing direction. |
| Repeat | Runs the entire body a known number of times | Count is the number of body passes, not total commands. A block outside the body does not repeat. |
| If | Checks once when execution reaches it and may run its body | It does not wait for the garden to change and it does not repeat. A false test skips the body. |
| If / Else | Checks once and runs exactly one branch | Both branches never run in the same check. The condition describes which branch is chosen. |
| While | Checks before every pass and repeats while the test is Yes | It may run zero times. The body must change something relevant or the safety limit can stop the run. |
| Repeat Until Battery | Checks whether Pip has reached the battery and repeats its body until that is true | It is controlled by the goal, not by corridor length. Reaching the goal and then leaving it is not success. |
| Path direction | Looks ahead, left or right relative to Pip without moving Pip | Screen-left and Pip's left can differ after a turn. |
| Packet here | Reports whether a packet is on Pip's current tile | It does not collect the packet and does not inspect the next tile. |
| Collect | Removes a packet from Pip's current tile | Collecting an empty tile is an invalid action. Use a sensor when presence varies. |

## Hint ladder

Hints are requested one at a time and stay attached to the current attempt.

1. **Observe:** ask the learner to inspect a state or the first divergent trace frame. Example: “At this step, which way is Pip facing?”
2. **Focus:** point to the relevant block property or program region. Example: “Which instructions are inside Repeat?”
3. **Structure:** show a partial outline or constraint without values or the final sequence. Example: an empty Repeat body and a prompt to place the repeating unit.
4. **Worked micro-example:** demonstrate the same semantic rule in a different tiny world. It never inserts the current solution.

An optional fifth classroom-only action can reveal a teacher-supplied solution. It must be explicitly labeled and recorded separately from the product hint ladder.

Opening gesture instructions counts as interface help. Opening a semantic definition, structure hint or worked example counts as conceptual support for the attempt. The UI should state this when the learner opens that stage; it must never change the teacher's observation of mastery.

## Outcome-specific diagnosis

| Outcome | Initial feedback | First hint target |
| --- | --- | --- |
| Collision | “Pip tried to move into a hedge and stayed put.” | Jump to the blocked Move and inspect direction/path state. |
| Destination missing | “The program stopped before Pip reached the battery.” | Compare Pip's final position and facing direction with the next intended action. |
| Packets remaining | “Pip reached the battery with packets still in the garden.” | Inspect whether Packet here is checked before leaving each tile. |
| Empty collection | “Collect ran where there was no packet.” | Connect the local sensor result to the guarded action. |
| One garden fails | “This program solved X of Y gardens.” | Select the first failing garden and compare the first divergent state while keeping the program unchanged. |
| Block limit | “The route works, but this round asks for a reusable pattern.” | Identify a repeated unit only after correctness is acknowledged. |
| Required concept missing | “The route works; now show the requested idea.” | Open the requested block's reference and explain why the round asks for it. |
| Safety stop | “The safety limit stopped this run. The condition stayed Yes in the last checks.” | Show the last condition results and ask what the body changes. Never claim proof of an infinite loop. |
| Invalid program | Show a localized, block-linked validation message | Focus the empty body, invalid count or unsupported structure. Silent Run failures are not acceptable. |

## Device and accessibility behavior

- Desktop uses anchored popovers that stay within the program or palette column.
- Tablet and phone use a bottom sheet no taller than 45% of the visual viewport. The associated block remains highlighted above it, and closing returns focus to that block.
- Family controls and Run remain visible when help is open; the sheet must not cover both the program and garden switcher.
- Minimum interactive target is 44 by 44 CSS pixels. The info action is separate from the drag handle.
- Escape closes a transient surface. Tab remains trapped only inside a true modal; these guidance surfaces are nonmodal.
- Every illustration has equivalent text. Meaning never depends only on color, animation or arrow direction.
- Reduced-motion mode removes coach transitions while preserving state changes and focus.
- Spanish copy is tested in portrait at the same text size, without truncating block names or condition results.

## Content and state model

Begin with version-controlled definitions in the shared catalog rather than hard-coded JSX branches:

```text
GuidanceProfile
  version
  concept entries
    palette summary
    does / does not / watch / try copy keys
    first-use steps
    anatomy targets
  outcome hint sets
    outcome code
    ordered hint steps
  challenge overrides
    automatic concept
    guidance mode: discovery | assessment | off
```

Client progress stores only `seen`, `dismissed`, `reopened` and highest requested hint level, scoped by curriculum revision and guidance version. Changing copy alone does not reset every coach; a semantic change increments the guidance version.

Useful bounded events are `coachShown`, `referenceOpened`, `traceReviewOpened` and `hintLevelUsed`, with challenge/revision and concept identifiers. Do not store dwell time, raw programs, free-text explanations or detailed drag histories for this feature. Guidance use does not produce a mastery score.

## Implementation sequence

### T0 — Guidance foundation

**Implemented in Practice.**

- Add a reusable nonmodal popover/bottom-sheet primitive with focus return, collision-aware placement and reduced-motion support.
- Add **Block help** to the palette heading.
- Define bilingual reference entries and a versioned local guidance-progress store.
- Add visible, block-linked validation errors so Run never fails silently.

### T1 — First concepts

**Implemented in Practice.**

- Add the one-time orientation coach to the first challenge.
- Convert the Turn and Repeat unlock banners into optional first-use coaches.
- Add block anatomy for Turn and Repeat, including Repeat count/body trace text.
- Pilot on challenges 1, 3, 5 and 6 because the baseline protocol already probes sequence, turn and the expanded-to-Repeat transition.

### T2 — Conditional and variable-length control

**Implemented in Practice.**

- Add If, If / Else, relative direction, While and Repeat Until reference/anatomy content.
- Add condition-result and loop-pass trace explanations.
- Add the family-of-gardens callout and first-failing-garden link.
- Cover Foundations challenges 10, 11, 13, 14, 15 and 16.

### T3 — Diagnostic feedback and hints

**Implemented in Practice.**

- Implement the outcome-to-diagnosis mapping and four-stage hint drawer.
- Record interface versus conceptual guidance use visibly on the attempt without modifying teacher observation.
- Add Packet here and Collect guidance to the P5 pilot.
- Add teacher-facing wording that distinguishes product hints from teacher- or peer-supplied solutions.

### T4 — Authoring and broader reuse

**Pending.**

- Add admin validation for guidance mode, concept keys, localization parity and hint availability.
- Reuse the fixed guidance definitions in Campaign and Live after separate review of their scoring and facilitation behavior.
- Allow curriculum authors to override examples only after the fixed content model succeeds in a pilot; avoid a general rich-text popup editor in the first slice.

## Validation and decision gates

Automated checks should cover trigger state, once-per-version behavior, keyboard focus return, Run/drag dismissal, assessment suppression, locale parity, bounded local storage and analytics redaction. Interaction tests should confirm that help never mutates a program unless a later explicitly labeled scaffold action is added.

Visual checks should cover every block entry at desktop, tablet portrait and phone widths in English and Spanish. A physical-device review remains required for drag handles, bottom-sheet reachability and projector trace readability.

The first classroom comparison should ask whether guidance reduces interface requests while improving Repeat body/count explanations and first-divergence debugging. Track completion separately. Retain a mechanism when learners can reopen it, connect its explanation to a fresh case, and use it within the agreed lesson budget. Revise or remove it when it interrupts successful work, teaches only the current route, increases navigation time, or makes supported attempts look independent.

The facilitator protocol remains authoritative for the P1 baseline. Record the exact guidance profile and revision in every later pilot so hint exposure is comparable rather than inferred.
