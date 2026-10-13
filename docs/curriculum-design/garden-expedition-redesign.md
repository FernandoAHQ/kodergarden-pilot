# Garden Expedition redesign

Status: implemented in the source catalog and published as additive local catalog revision **e0000000-0000-4000-8000-000000000003** on 13 October 2026. Classroom and physical-device validation remain pending.

## Scope

Garden Expedition is now the advanced continuation of Foundations. The redesign replaces the eight fixed route puzzles with eight missions that reuse the existing language in stronger combinations. It does not add a new programming construct.

| Stage | Mission | Main evidence |
| --- | --- | --- |
| 1 | Corners Without Counting | One pair of condition-controlled segments solves three L-shaped gardens with changing lengths. |
| 2 | Choose the Open Lane | A side observation selects left or right, then a stopping rule handles the remaining distance. |
| 3 | Stop at the Marker | Goal-controlled repetition stops at four battery positions, including a zero-iteration case before the wall. |
| 4 | Packet Patrol | If packet here makes collection valid across empty and populated placements. |
| 5 | The Overshoot Bug | The learner repairs a two-move loop body and explains why a body-boundary check skipped the target. |
| 6 | Terraced Garden | A three-stair route gives inner and outer repetitions distinct geometric roles. |
| 7 | Repair the Detour | The learner repairs a supplied route that collides with a known hedge and explains the waypoint plan. |
| 8 | Adaptive Summit | One goal loop combines packet state, path choice, moving hedges, and three rotated trail families. |

Stages 1, 2, 3, 4, and 8 evaluate the same program against every announced garden. Stages 5 and 7 are explicit debug tasks: reaching the goal is insufficient until the starter changes and the learner supplies an explanation. Stage 6 keeps a known-world construction because the intended work is identifying two repeatable scales rather than claiming generalization from one literal count.

## Evaluation and progression

- Correctness requires normal termination, every destination, every packet, no invalid collection, and zero collisions.
- Block and step targets award the second and third stars. They never determine the first correctness star.
- New **expedition-v2-*** challenge IDs prevent historical completion records from silently unlocking or marking redesigned missions complete.
- Old published revisions remain intact. Migration **1791405000000-GardenExpeditionRedesign** creates a new immutable revision and moves only the campaign's published pointer.
- Reference programs are checked against all 20 Expedition base/variant worlds. The current Foundations plus Expedition source catalog contains 47 base/variant worlds.

## Student experience

Campaign challenges now use the same responsive workbench behavior as Practice:

- garden buttons appear directly above the map whenever a mission has multiple layouts;
- maps use the shared bounded viewport and fit without changing authored coordinates;
- trace explanations identify branch results, loop iterations, collisions, empty collection, and safety stops;
- block help is available from the palette and from each block;
- failed attempts can jump to the first failing garden, review the relevant trace step, or request progressive hints;
- help use remains coded separately from learner self-report and teacher observation;
- advanced missions do not auto-open concept coaching on fresh or delayed checks.

## Validation limits

Automated checks establish program semantics, catalog serialization, translation lookup, scoring, and responsive rendering. A local browser inspection confirmed the campaign path, optional-target wording, program/garden tabs, and immediate three-garden selector at the current narrow desktop viewport. They do not establish learning effectiveness, Spanish classroom wording quality, or comfort on the target tablets. Those claims still require the facilitator protocol and device checklist.
