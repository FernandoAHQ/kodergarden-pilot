# Kodergarden curriculum design

Design proposal · 13 October 2026

The original A–G documents below record the pre-implementation audit. The authorized implementation is documented in the [P0–P4 release notes](P0-P4-implementation.md) and [P5 item interaction release notes](P5-implementation.md). The [baseline pilot protocol](pilot-baseline-protocol.md) and [coded observation worksheet](pilot-observations.csv) are ready for classroom use; classroom and physical-device validation remain pending.

Kodergarden should retain its grid world and concentrate first on stronger tasks, trustworthy execution feedback, and evidence of understanding. It already implements If, If / Else, While, goal-controlled repetition, directional sensing, and evaluation across several layouts in Practice. Adding more block types is therefore not the first priority.

The recommended learning cycle is: encounter a problem, predict behavior, investigate a short example, name the useful construct, apply it independently, debug it, and transfer it to a different problem. Successful execution earns task completion; evidence from prediction, explanation, debugging, and unfamiliar cases supports mastery. These are separate claims.

## Deliverables

| Document | Purpose |
| --- | --- |
| [A Curriculum Quality Audit](A-curriculum-quality-audit.md) | Audits all 24 source-defined challenges, the connected progression, and the four categories of limitation. |
| [B Programming Mechanics Design](B-programming-mechanics-design.md) | Defines the small language, world interactions, execution semantics, bilingual terminology, and debugging experience. |
| [C Curriculum Progression Roadmap](C-curriculum-progression-roadmap.md) | Specifies prerequisites, readiness, learning objectives, assessment, mastery, and classroom pathways. |
| [D Challenge Design Catalog](D-challenge-design-catalog.md) | Supplies concrete world families, strategies, failure cases, feedback, and transfer tasks. |
| [E Technical Feasibility and Architecture Implications](E-technical-feasibility.md) | Maps recommendations to the existing code, identifies prerequisites and compatibility risks, and records audit probes. |
| [F Prioritized Implementation Roadmap](F-prioritized-implementation-roadmap.md) | Sequences small, testable investments and classroom decision gates. |
| [G Open Questions and Classroom Experiments](G-classroom-experiments.md) | Defines practical experiments, learning indicators, stop conditions, and evidence handling. |
| [Research and Evidence Register](research-and-evidence.md) | Connects research and official learning environments to design decisions, with limits on the claims. |
| [P0–P4 implementation notes](P0-P4-implementation.md) | Records the implemented execution, curriculum, trace, and evidence slices and their validation limits. |
| [P5 implementation notes](P5-implementation.md) | Records item sensing, collection, multi-objective results, C07, compatibility, and the remaining X4 evidence gate. |
| [Practice guidance implementation](practice-guidance-plan.md) | Records the implemented Practice block help, first-use coaches, trace explanations, progressive hints, responsive behavior, evidence boundaries, and pending T4 reuse. |

## Recommended decisions

1. **Improve the existing curriculum before widening the language.** Replace the first conditional demonstration and weak Expedition condition/nesting tasks. Retain the useful sequence-to-Repeat contrast and the stronger families of layouts.
2. **Make generalization explicit.** Show the family of possible worlds and test the same program in each. Introduce unfamiliar assessment cases only after learners know the rules and range of variation.
3. **Make traces and evaluation trustworthy before expanding control flow.** Resolve ambiguous branch addresses, unbounded work inside fixed repeats, and the separation between reaching a goal and terminating successfully.
4. **Introduce one purposeful interaction before variables.** Optional collection and a local object sensor support decisions; a later sealed-input task makes remembering information useful.
5. **Teach procedures as named, testable subproblems.** Introduce simple procedures after repeated patterns; add parameters after learners can explain what varies and what remains invariant.
6. **Postpone Do While, event scheduling, parallelism, lists, and recursion.** Do While has a valid later comparison task, but does not yet justify a second loop-checking model in the core pathway.

## Evidence status and scope

**Observed** means inspected source or a bounded execution probe. **Research-supported principle** means a cited study, synthesis, or theoretical argument supports the general instructional rationale. **Design hypothesis** means the proposed application to Kodergarden is untested. **Pilot assumption** means a working choice, such as lesson length or mastery threshold, that must be calibrated with learners.

The audit covers the working tree at base commit `7046cd7d6c77bd49b0685c7485ac00c85b988d48`, including changes already present when this task began. The source catalog contains 16 Foundations challenges and 8 Garden Expedition challenges, totaling 35 base/variant worlds. The running product loads published PostgreSQL revisions, which may differ from these definitions; no deployed database revision was read or changed. Runtime probes cover the source definitions, not an assertion about every published installation.

No learner study, physical-device observation, or measured learning gain is claimed. Existing checklists and the Dynamic Garden Lab contain pending validation. Approximate ages and lesson counts below are planning assumptions, not developmental cutoffs. The expansion proposal does not promote items on the existing [delivery board](../backlog.md), replace the [pilot milestone](../project.md), or implement features.

## Reading and decision order

Read A and the evidence register to judge the diagnosis. Use C and D together to review the educational experience. B and E define the semantics needed to make those experiences coherent. F and G specify what to validate before committing to each expansion. Stable recommendation IDs R1–R10 in B connect the documents.
