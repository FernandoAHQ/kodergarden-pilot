# Kodergarden

Kodergarden is a classroom-focused visual programming platform. It includes self-paced Practice Mode and an ephemeral, realtime Live Classroom experience for a projected teacher board and student devices.

## Architecture

```text
visual editor
  -> Program AST (@kodergarden/language)
  -> interpreter (@kodergarden/engine)
  -> runtime interface
  -> GridRuntime (first environment)
  -> semantic event stream
  -> React playback controller
  -> animated grid + read-only program viewer
```

The interpreter depends only on the runtime interface. Grid rules do not leak into the language or interpreter.

## Run locally

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:5173`. The combined command starts the Vite web client on port 5173 and the NestJS/Socket.IO server on port 3001. During development, Vite proxies `/socket.io` to Nest, so phones and tablets connect through the same host and port as the page. Active Live sessions are intentionally held in server memory, so restarting the server ends them.

For another device on the same network, start with `pnpm dev -- --host`, then open the LAN URL Vite prints, such as `http://192.168.1.161:5173`. A separately hosted frontend can set `VITE_LIVE_SERVER_URL` to the public Socket.IO server origin.

Useful separate commands:

```bash
pnpm dev:web
pnpm dev:server
pnpm test
pnpm typecheck
pnpm build
```

## Metric semantics

- **Block count** is the number of authored statements. A `repeat` and each statement in its body count once, regardless of repeat count.
- **Execution steps** count executed robot commands (`moveForward`, `turnLeft`, and `turnRight`). Control structures do not count as execution steps.

## Coordinate system

The grid origin is the top-left. `x` increases to the right and `y` increases downward; north therefore decreases `y`.

## Browser simulation

The web app validates a selected hardcoded program, executes it synchronously through the engine, then plays the resulting immutable event sequence on a UI-controlled clock. Reset aborts that playback and reconstructs the initial runtime snapshot. React never calculates robot movement, collision, conditions, or success.

## Visual editor prototype

The web app now includes an editable card-based authoring experiment for movement, turns, nested repeats, and `If Path Ahead`. It uses `@dnd-kit/core` for pointer and touch sensors while keeping all structural transformations in a framework-independent editor model. Generous overlapping hit regions and nearest-center collision selection make compact insertion bands easier to target without adding permanent whitespace.

Editor statements carry UI-only stable IDs for React identity and drag operations. `toExecutableProgram` removes that metadata and produces the original serialized Kodergarden AST; execution highlighting continues to use authored array paths from the interpreter. Undo and redo store immutable editor-tree snapshots, while simulation Reset deliberately leaves the editor history and program untouched.

The interpreter emits a semantic `conditionEvaluated` event with the authored statement path, condition type, and boolean result. Playback uses it to briefly display `Path ahead → YES/NO`; the event is environment-agnostic and contains no UI timing or styling concerns.

## Practice Mode and localization

Practice Mode defines twelve language-neutral challenge mechanics in one progression and references localized content by translation key. A centralized React context supplies English and neutral Latin American Spanish copy, detects the initial browser language, and persists the student's choice. Programs, worlds, evaluation, constraints, and saved completion IDs never contain localized strings.

Local browser storage currently retains only the selected `en`/`es` locale, completed challenge IDs, and the most recent completion. There are no accounts or remote progress records.

## Tablet-first interface

The challenge workbench prioritizes tablet landscape with a narrow toolbox and dominant Program/Simulation panes. Portrait tablets and phones switch between persistent Program and World views without resetting editor or playback state. Authored instructions use CSS pseudo-elements for Kodergarden connector geometry; their semantic HTML, rectangular layout boxes, accessible controls, and dnd-kit collision regions remain unchanged.

## Live Classroom

Live Classroom uses typed Socket.IO contracts and a transport-independent NestJS session service. The server owns teacher and participant capabilities, state-machine transitions, rounds, role-scoped snapshots, submissions, and evaluation. Student clients may run programs locally, but the server independently validates each submitted AST, enforces challenge and safety limits, executes it through the shared engine, and calculates correctness and metrics.

Teacher and participant capability tokens support refresh reconnect while the server remains alive. A participant reconnect receives their own latest submitted AST but never another student's program; review details and selected playback programs are sent only to the teacher role. Language remains a client-side preference and never enters authoritative session state.

## Classroom Pilot

### Prerequisites

- A laptop running the Kodergarden web and server processes.
- Teacher laptop and student tablets on the same LAN.
- Approximately 20–40 charged student devices with a current browser.
- A classroom projector or TV for the teacher view.
- A completed pass through [the physical-device and projector checklist](docs/pilot-checklists.md).

### Start the pilot

```bash
pnpm install
pnpm dev -- --host
```

Open the local URL on the teacher laptop. Students use the LAN URL printed by Vite, not `localhost`. Keep the terminal visible enough to capture structured `live-session` error/event lines if support is needed.

The teacher creates a Live Session, projects the six-digit code, waits for the joined count, chooses a challenge, starts programming, closes submissions, and reviews two or three programs. Students join with the code and a classroom display name, build and run locally, then Submit or Resubmit.

### Suggested first pilot lesson

1. First Steps.
2. Keep Going or another slightly longer sequence.
3. The Long Hallway without Repeat.
4. Meet Repeat.
5. One additional Repeat challenge.
6. Use Live Review to run two or three student programs.

The observation goal is whether students discover why Repeat is useful, not whether the later curriculum is perfectly tuned.

### Reliability and pilot data

Sessions are intentionally in memory. An ended session is removed immediately; an abandoned session expires after four hours of inactivity. Restarting the server ends every active session by design. Clients attempt capability-based reconnect while the process remains alive and return to a localized unavailable-session state after a restart or expiration.

Server logs are structured JSON and omit teacher/participant capabilities and full program ASTs. During Review, the unobtrusive **Export pilot JSON** action downloads session/round timing, participant submission counts, final correctness, block counts, and execution steps. Export is optional and contains no capability tokens or full programs.

Run the repeatable 40-client Socket.IO stress scenario with:

```bash
pnpm test:live-load
```

Set `LIVE_LOAD_STUDENTS` to use a different client count. The report includes join, submission, reconnect, rejection, socket/server-error, and evaluation-latency metrics.

### Troubleshooting

- **Tablet cannot open Kodergarden:** use the Vite LAN URL, keep both devices on the same network, and allow ports 5173 and 3001 through the laptop firewall.
- **Join code fails:** confirm the teacher session is still open and the student is using the current six-digit code.
- **Reconnecting:** wait for Wi-Fi to recover. Refreshing is safe while the server remains alive.
- **Server restarted:** the old session cannot be recovered; create a new Live Session.
- **Drag/drop fails:** verify the device/browser in the physical QA checklist. The editor uses drag—not palette tap—to insert blocks.
- **A refresh returns Home:** re-enter Live Mode; retained capability credentials reconnect to an active in-memory session.

For the first real pilot, complete the manual checklist on at least one Android tablet. Test an iPad when one is available; do not record iPad touch QA as passed based on browser emulation.
