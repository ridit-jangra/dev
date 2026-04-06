# @ridit/dev

One SDK, all CLIs.

A TypeScript SDK for programmatically interacting with [Milo](https://github.com/ridit-jangra/Milo) — the tiny cat coding agent.

Used by [Meridia](https://github.com/ridit-jangra/Meridia).

## Installation

```bash
bun add @ridit/dev
```

```bash
npm install @ridit/dev
```

## Usage

### Milo

The `Milo` class lets you drive a Milo daemon session programmatically — streaming tool calls, permissions, and responses over SSE.

```ts
import { Milo } from "@ridit/dev";

// auto-start the daemon if not running
await Milo.start();

const milo = new Milo("agent");

const text = await milo.chat("create a hello world app", (event) => {
  if (event.type === "tool_call") console.log("calling", event.toolName);

  if (event.type === "permission_request")
    milo.resolvePermission(event.id, "allow");
});

console.log(text);
await milo.disconnect();
```

#### Constructor

```ts
new Milo(mode?: Mode)
```

| Parameter | Type   | Default   | Description                            |
| --------- | ------ | --------- | -------------------------------------- |
| `mode`    | `Mode` | `"agent"` | Session mode (`chat`, `agent`, `plan`) |

#### Methods

| Method                                | Description                                          |
| ------------------------------------- | ---------------------------------------------------- |
| `connect()`                           | Create a new daemon session                          |
| `disconnect()`                        | Delete the session and clean up                      |
| `chat(prompt, onEvent?)`              | Send a message, stream SSE events, return final text |
| `resolvePermission(permId, decision)` | Allow or deny a pending tool permission              |
| `getSessionId()`                      | Return the current session ID                        |
| `Milo.start(port?)`                   | Start the daemon if not already running              |
| `Milo.isRunning()`                    | Check if the daemon is up                            |
| `Milo.listSessions()`                 | List all active sessions                             |

#### Types

```ts
import type { Mode, SSEEvent, PermissionDecision } from "@ridit/dev";

type Mode = "chat" | "agent" | "plan";

type PermissionDecision = "allow" | "allow_session" | "deny";

type SSEEvent =
  | { type: "tool_call"; id: string; toolName: string; args: unknown }
  | { type: "tool_result"; id: string; toolName: string; result: unknown }
  | { type: "permission_request"; id: string; tool: string; args: unknown }
  | { type: "compacted" }
  | { type: "done"; text: string }
  | { type: "error"; message: string };
```

---

> **Note:** `Chat` (Lens-based) has been removed as of `0.2.4`. Migrate to `Milo`.

## Requirements

Milo daemon must be installed globally:

```bash
bun add -g @ridit/milo
```

Then either run `milo serve` manually, or call `Milo.start()` to auto-launch it.

## Development

```bash
bun run build   # compile TypeScript
bun run dev     # watch mode
```
