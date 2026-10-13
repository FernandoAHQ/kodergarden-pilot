# P5 item interaction implementation and release notes

Implemented in the current working tree on 13 October 2026. The local development catalog was migrated to the new pilot revision; no production database or deployment was changed.

## Learner experience

P5 adds one visible object, a seed packet, and two language elements: the `Packet here` sensor and the `Collect` action. Collection removes the packet on Pip's current tile. Calling Collect on an empty tile records an invalid attempt. A successful run must reach the battery, collect every packet, avoid collisions and invalid collection attempts, satisfy the authored block/tool rules, and terminate normally.

The pilot campaign now contains **Seed packet delivery** as activity 19. Its four 6×3 gardens place zero, one, or several packets along the same familiar four-step corridor. One program must solve every garden. The intended pattern is:

```text
Repeat 4:
  If packet here:
    Collect
  Move
```

The result panel and garden show destination, packets collected, and empty collection attempts separately. Traces show the item test and each collection. English and Spanish labels and feedback are included.

## Technical scope

- Saved programs use additive AST version 4; versions 1–3 remain valid.
- The deterministic grid runtime owns item state, atomic collection, inventory counts, and invalid attempts.
- Practice, Campaign, Live, server validation and publication use the same multi-case assessment contract.
- The visual editor, read-only/projector renderer, playback, admin palette and grid authoring surface support the sensor and action.
- Catalog persistence accepts item layouts and publishes the addition as a new immutable pilot revision. Existing progress IDs and historical revisions are retained.
- Safety limits still count Collect as an execution step, so item programs remain bounded.

## Validation

Automated checks cover zero/one/many packet placements, collection at the starting tile, destination reached with packets remaining, empty collection attempts, AST version compatibility, editor round trips, playback feedback, pilot reference solutions, server catalog serialization, and migration from the earlier pilot revision.

Validated locally:

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:database` against the disposable `kodergarden_test` database
- the additive migration against the local development database

## Evidence gate and remaining roadmap

P5 software is implemented, but its classroom evidence gate is still open. Run the first phase of X4 in [G Open Questions and Classroom Experiments](G-classroom-experiments.md): check whether learners distinguish sensing, action, and system-maintained item state across the four placements. Record support given and editing friction with the [baseline pilot protocol](pilot-baseline-protocol.md) and [coded observation worksheet](pilot-observations.csv). A physical tablet and projector check in English and Spanish also remains required.

P6–P9 remain unimplemented. P6 introduces named procedures, P7 introduces learner-managed state, P8 combines procedures, parameters and Boolean operators, and P9 contains optional switch/phase and Do While experiments. Their evidence and sequencing gates remain as written in the roadmap; this P5 slice does not claim those learning results.
