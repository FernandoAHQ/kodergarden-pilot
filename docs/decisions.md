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
- Student progress is stored locally; there are no accounts or remote progress records.

