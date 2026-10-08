# Dynamic Garden Lab

## Provisional decision

Shifting Hedge is the selected production mechanic for Foundations 13, 14, and 16. Its pre-run movement is visible, deterministic, and complete before the learner's first condition is evaluated. Triggered Sliding Gate and Pushable Planter remain in this development-only lab as comparison history; they are not part of the production runtime or curriculum.

The development-only lab preserves the three deterministic obstacle prototypes that informed this choice:

1. a hedge that shifts before execution;
2. a pressure-tile gate that moves before Pip's next instruction;
3. a planter that Pip can push when the cell behind it is open.

Run the web client in development and open `http://localhost:5173/lab/dynamic-garden`. The route is not linked from the product and is removed from the production JavaScript bundle.

Use **Step event** to inspect condition, action, and world-change ordering. **Run reference program** executes the same `Repeat Until Battery` and `If / Else` strategy for each mechanic. Reset always reproduces the same event sequence.

## Review protocol

Ask an unfamiliar adult proxy tester to watch one demonstration, predict the next obstacle state, and explain why the program checks the path. Do not record names or other personal information. Keep only aggregate notes.

Score each mechanic from 1–5 in the lab. Predictability contributes 40%, block relevance 25%, visual clarity 15%, rule consistency 10%, and implementation simplicity 10%. A candidate qualifies only with predictability of at least 4 and a weighted score of at least 4. Reject a mechanic described primarily as a timing or pushing puzzle. If qualified candidates tie—or none qualifies—prefer Shifting Hedge.

## Aggregate notes

| Mechanic | Review count | Predictability | Block relevance | Visual clarity | Rule consistency | Simplicity | Weighted result | Observations |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Shifting Hedge | 0 | — | — | — | — | — | — | |
| Triggered Sliding Gate | 0 | — | — | — | — | — | — | |
| Pushable Planter | 0 | — | — | — | — | — | — | |

The result remains provisional until it can be checked with learners ages 8–12.
