# Kodergarden

Kodergarden is a bilingual, classroom-focused visual programming platform for beginner learners. It combines self-paced Practice and Challenge modes with an ephemeral, realtime Live Classroom experience for a projected teacher board and student devices. A database-backed administration workspace lets the curriculum team draft, validate, publish, and recover campaign content; students do not need accounts.

Project delivery is tracked in the lightweight [project guide](docs/project.md) and [delivery board](docs/backlog.md). The current milestone is pilot readiness.

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

Kodergarden requires PostgreSQL for its published curriculum. Before the first application start, configure `DATABASE_URL`, run the migrations, and seed the catalog by following [Database-backed curriculum](docs/database-catalog.md).

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

## Production deployment

Kodergarden deploys as one Node process. Nest serves the built React application and Socket.IO from the same origin, which avoids cross-origin setup and keeps reconnect behavior predictable.

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @kodergarden/server migration:run
pnpm --filter @kodergarden/server catalog:seed
pnpm start
```

The hosting platform may set `PORT`; it defaults to `3001`. Supply the settings described in `.env.example`, including a production PostgreSQL connection. Application startup rejects pending migrations. `GET /healthz` is the process-liveness endpoint and `GET /readyz` checks database readiness.

The recommended container path is:

```bash
docker build -t kodergarden .
docker run --rm -p 3001:3001 --env-file .env kodergarden
```

The container must be able to reach the PostgreSQL host in `DATABASE_URL`; `localhost` inside the application container is not the host machine. Then open `http://localhost:3001`. In production, terminate HTTPS at the hosting platform or reverse proxy and ensure WebSocket upgrade requests for `/socket.io/` reach this same process.

Important deployment constraints:

- Run exactly **one application instance**. Live sessions are intentionally stored in process memory; multiple replicas would require shared state and are not supported by this MVP.
- Do not use scale-to-zero while a class may be active. A restart or redeploy intentionally ends all sessions.
- Same-origin hosting is the default and needs no CORS setting. If the web application is hosted separately, build it with `VITE_LIVE_SERVER_URL=https://your-server.example` and set `CORS_ORIGINS` to the exact comma-separated HTTPS frontend origins.
- Never set `CORS_ORIGINS=*`. Capability tokens authorize Live actions and must only travel over HTTPS outside a trusted LAN.
- The server applies conservative per-IP limits to session creation, joins, and submissions. The join/submission limits allow a 40-device classroom behind one NAT address.
- Preserve sticky routing if a hosting platform places more than one transport process in front of the single application instance.

Before releasing, verify the deployed `/healthz`, load the home page, create a Live session, join from a second device, and confirm reconnect after temporarily disabling that device's network.

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

## Campaigns, Practice Mode, and localization

The published catalog groups language-neutral challenges into stable, reusable collections. **Foundations** contains sixteen guided Practice activities; **Garden Expedition** is an eight-stage advanced campaign with sequential local progress, persistent best metrics, and one-to-three-star efficiency targets. A centralized React context supplies English and neutral Latin American Spanish copy, detects the initial browser language, and persists the student's choice. Programs, worlds, evaluation, constraints, and saved completion IDs never contain localized strings.

Foundations uses intentional open lawns and connected hedge corridors. Challenges 13, 14, and 16 add deterministic shifting hedges that visibly move before Pip's first instruction, so sensing occurs only after the garden settles. Practice solutions must satisfy the authored block limit, use the newly introduced tool when required, avoid hedge collisions, and solve every declared garden layout. Live Classroom intentionally evaluates only the single layout shown for that round.

During development, `http://localhost:5173/lab/dynamic-garden` opens the isolated Dynamic Garden Lab that records the Shifting Hedge decision and retains the two rejected alternatives for comparison. It is not linked from normal navigation and is removed from production JavaScript builds. See `docs/dynamic-garden-lab.md` for the review protocol.

Local browser storage retains the selected `en`/`es` locale, legacy Practice completion, and versioned per-campaign challenge results. There are no learner accounts or remote learner-progress records. Administrative accounts exist only for curriculum and team management; see [Database-backed curriculum](docs/database-catalog.md).

## Curriculum administration

PostgreSQL stores published campaign revisions, isolated drafts, localized copy, authored layouts and programs, team roles, and curriculum audit history. Admins can edit and publish; viewers can inspect drafts, previews, validation results, and history. Publishing is blocked when reference programs fail validation. Live Classroom sessions remain in memory and are not moved into PostgreSQL.

## Tablet-first interface

The challenge workbench prioritizes tablet landscape with a narrow toolbox and dominant Program/Simulation panes. Portrait tablets and phones switch between persistent Program and World views without resetting editor or playback state. Authored instructions use CSS pseudo-elements for Kodergarden connector geometry; their semantic HTML, rectangular layout boxes, accessible controls, and dnd-kit collision regions remain unchanged.

## Live Classroom

Live Classroom uses typed Socket.IO contracts and a transport-independent NestJS session service. The server owns teacher and participant capabilities, state-machine transitions, rounds, role-scoped snapshots, submissions, and evaluation. Student clients may run programs locally, but the server independently validates each submitted AST, enforces challenge and safety limits, executes it through the shared engine, and calculates correctness and metrics.

Teacher and participant capability tokens support refresh reconnect while the server remains alive. The teacher selects an authoritative campaign in the lobby before choosing a challenge and may switch campaigns between reviewed rounds. A participant reconnect receives their own latest submitted AST but never another student's program; review details and selected playback programs are sent only to the teacher role. Language remains a client-side preference and never enters authoritative session state.

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

Server logs are structured JSON and omit participant names, active join codes, teacher/participant capabilities, and full program ASTs. During Review, the unobtrusive **Export pilot JSON** action downloads de-identified session/round timing, sequential participant numbers, submission counts, final correctness, block counts, and execution steps. The optional export contains no names, internal participant/session IDs, join codes, capability tokens, or full programs. Because exact event times remain useful for pilot analysis, treat the file as de-identified operational data rather than as guaranteed anonymous data and retain it only as long as the pilot requires.

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
