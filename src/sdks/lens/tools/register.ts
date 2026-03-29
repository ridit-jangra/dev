import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { createServer, IncomingMessage, ServerResponse } from "http";

interface RuntimeTool {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description?: string }>;
  onRun: (args: any) => Promise<any>;
}

export const registeredTools = new Map<string, RuntimeTool>();
let callbackPort: number | null = null;

async function startCallbackServer(): Promise<number> {
  if (callbackPort) return callbackPort;

  const server = createServer(
    async (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? "/", `http://localhost`);
      const toolName = url.pathname.slice(1);

      if (!toolName || !registeredTools.has(toolName)) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "tool not found" }));
        return;
      }

      if (req.method === "GET") {
        const args = Object.fromEntries(url.searchParams.entries());
        const result = await registeredTools.get(toolName)!.onRun(args);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result ?? null));
        return;
      }

      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        try {
          const args = body ? JSON.parse(body) : {};
          const result = await registeredTools.get(toolName)!.onRun(args);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result ?? null));
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    },
  );

  return new Promise((resolve) => {
    server.listen(0, () => {
      callbackPort = (server.address() as any).port;
      resolve(callbackPort!);
    });
  });
}

function writeToolsFile(toolsPath: string) {
  mkdirSync(dirname(toolsPath), { recursive: true });
  const tools = Array.from(registeredTools.values()).map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    endpoint: `http://localhost:${callbackPort}/${tool.name}`,
  }));
  writeFileSync(toolsPath, JSON.stringify(tools, null, 2));
}

export async function registerRuntimeTool(
  tool: RuntimeTool,
  toolsPath: string,
) {
  await startCallbackServer();
  registeredTools.set(tool.name, tool);
  writeToolsFile(toolsPath);
}
