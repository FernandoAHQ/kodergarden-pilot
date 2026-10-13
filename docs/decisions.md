# Kodergarden Decision Log

Record decisions here when they constrain future product or technical work. Keep entries short and link to evidence where it exists.

## Template

```text
## ADR-___ — Decision title

Date: YYYY-MM-DD
Status: proposed | accepted | superseded
Related work: KG-___

Context:

Decision:

Consequences:
```

## Existing constraints

The following decisions predate this log and are documented in the README and implementation:

- Live sessions are ephemeral and held by one server process for the pilot milestone.
- The interpreter depends on a runtime abstraction; grid rules remain outside the language and interpreter.
- Localization is client-side, while programs, worlds, evaluation, constraints, and saved completion IDs remain language-neutral.
- Student progress is stored locally; there are no learner accounts or remote learner-progress records.
- PostgreSQL stores published curriculum, curriculum drafts and history, and administrative accounts. Live sessions remain in process memory.

## ADR-001 — De-identify classroom operational evidence

Date: 2026-10-13
Status: accepted
Related work: KG-023

Context:

Live Classroom needs enough operational evidence to evaluate a pilot without retaining student names, access credentials, programs, or identifiers that can be correlated directly with the active session.

Decision:

Structured Live logs exclude participant names and active join codes as well as capability tokens and program ASTs. Pilot exports use stable sequential participant numbers and round numbers, and exclude names, internal participant/session/round IDs, join codes, capability tokens, and program ASTs. Exact event timestamps remain because they are needed to diagnose lesson flow and reliability, so the export is described as de-identified rather than anonymous.

Consequences:

Teachers can compare a numbered participant's outcomes across rounds in one export, but cannot recover the participant's classroom display name from the file. Pilot operators must still limit retention and access because exact timestamps and classroom context can permit indirect identification.

