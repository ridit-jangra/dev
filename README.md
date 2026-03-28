# @ridit/dev

One SDK, all CLIs.

A TypeScript SDK for programmatically interacting with CLI tools like [Lens](https://github.com/ridit-jangra/lens).

## Installation

```bash
bun add @ridit/dev
```

```bash
npm install @ridit/dev
```

## Usage

### Chat

The `Chat` class lets you drive a Lens chat session programmatically, maintaining conversation history across turns.

```ts
import { Chat } from "@ridit/dev";

const chat = new Chat();

const result = await chat.push("list all files");
console.log(result.message);

// With context
const result2 = await chat.push("create main.py", {
  cwd: "/my/project",
  files: [],
});
```

#### Constructor

```ts
new Chat(session?: string, forceAll?: boolean)
```

| Parameter  | Type      | Default              | Description                          |
|------------|-----------|----------------------|--------------------------------------|
| `session`  | `string`  | `crypto.randomUUID()` | Session ID to resume or start        |
| `forceAll` | `boolean` | `false`              | Auto-approve all tool calls          |

#### Methods

| Method                        | Description                                      |
|-------------------------------|--------------------------------------------------|
| `push(message, context?)`     | Send a message and get a response                |
| `runTool(tool)`               | Execute a pending tool call                      |
| `skipTool(tool)`              | Skip a pending tool call                         |
| `getHistory()`                | Return the full message history                  |
| `getSessionId()`              | Return the current session ID                    |

### Types

```ts
import type { Context, Tool } from "@ridit/dev";

interface Context {
  cwd: string;
  files: ContextFile[];
  prompt?: string;
}

interface ContextFile {
  name: string;
  path: string;
  content: string;
  prompt?: string;
}

interface Tool {
  tool: string;
  args: Record<string, any>;
  result: string;
}
```

## Development

```bash
bun run build   # compile TypeScript
bun run dev     # watch mode
```
