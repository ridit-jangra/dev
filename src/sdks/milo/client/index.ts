import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const PORT_FILE = join(homedir(), ".milo", "milo.port");

function baseUrl(): string {
  try {
    const port = readFileSync(PORT_FILE, "utf-8").trim();
    return `http://localhost:${port}`;
  } catch {
    return "http://localhost:6969";
  }
}

export type Mode = "chat" | "agent" | "plan";

export type SSEEvent =
  | { type: "tool_call"; id: string; toolName: string; args: unknown }
  | { type: "tool_result"; id: string; toolName: string; result: unknown }
  | { type: "permission_request"; id: string; tool: string; args: unknown }
  | { type: "compacted" }
  | { type: "done"; text: string }
  | { type: "error"; message: string };

export type PermissionDecision = "allow" | "allow_session" | "deny";

async function readSSE(
  res: Response,
  onEvent: (event: SSEEvent) => void,
): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let finalText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(line.slice(6)) as SSEEvent;
        if (event.type === "done") finalText = event.text;
        onEvent(event);
      } catch {}
    }
  }

  return finalText;
}

export class Milo {
  private sessionId: string | null = null;

  constructor(private mode: Mode = "agent") {}

  static async start(port = 6969): Promise<void> {
    if (await Milo.isRunning()) return;

    const { spawnSync } = await import("child_process");
    const binary = process.platform === "win32" ? "milo.cmd" : "milo";

    spawnSync(binary, ["serve", "--port", String(port)], {
      windowsHide: true,
      //   detached: true,
      stdio: "ignore",
    });

    for (let i = 0; i < 50; i++) {
      await new Promise((r) => setTimeout(r, 100));
      if (await Milo.isRunning()) return;
    }

    throw new Error("milo daemon failed to start");
  }

  async connect(): Promise<void> {
    const res = await fetch(`${baseUrl()}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: this.mode }),
    });
    if (!res.ok) throw new Error(`failed to create session: ${res.status}`);
    const { id } = (await res.json()) as { id: string; mode: Mode };
    this.sessionId = id;
  }

  async disconnect(): Promise<void> {
    if (!this.sessionId) return;
    await fetch(`${baseUrl()}/sessions/${this.sessionId}`, {
      method: "DELETE",
    });
    this.sessionId = null;
  }

  async chat(
    prompt: string,
    onEvent?: (event: SSEEvent) => void,
  ): Promise<string> {
    if (!this.sessionId) await this.connect();

    const res = await fetch(`${baseUrl()}/sessions/${this.sessionId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok || !res.body) throw new Error(`chat failed: ${res.status}`);

    return readSSE(res, onEvent ?? (() => {}));
  }

  async resolvePermission(
    permId: string,
    decision: PermissionDecision,
  ): Promise<void> {
    if (!this.sessionId) throw new Error("no active session");
    await fetch(
      `${baseUrl()}/sessions/${this.sessionId}/permissions/${permId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allow: decision !== "deny",
          allowSession: decision === "allow_session",
        }),
      },
    );
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  static async isRunning(): Promise<boolean> {
    try {
      const res = await fetch(`${baseUrl()}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }

  static async listSessions(): Promise<{ id: string; mode: Mode }[]> {
    const res = await fetch(`${baseUrl()}/sessions`);
    return res.json() as any;
  }
}
