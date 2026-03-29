import { execa } from "execa";
import type { Context } from "./types/context";
import { registeredTools } from "./tools/register";

interface ChatProcessProps {
  prompt?: string;
  context?: Context;
  session?: string;
  forceAll?: boolean;
  resume?: boolean;
  toolsPath?: string;
}

export interface Tool {
  tool: string;
  args: Record<string, any>;
  result: string;
}

export interface Permission {
  tool: string;
  description: string;
}

export interface ChatProcessResult {
  sessionId: string;
  message: string;
  model: string;
  tools: Tool[];
  error?: any;
  permissionRequired?: Permission[];
}

export async function spawnChatProcess({
  context,
  prompt,
  session,
  forceAll,
  resume,
  toolsPath,
}: ChatProcessProps): Promise<ChatProcessResult> {
  let newPrompt = prompt;

  if (context) {
    const parts: string[] = [];

    if (context.prompt) parts.push(context.prompt);

    if (context.files.length > 0) {
      const fileContext = context.files
        .map((f) =>
          [
            `File: ${f.path}`,
            f.prompt ? `Context: ${f.prompt}` : "",
            `\`\`\`\n${f.content}\n\`\`\``,
          ]
            .filter(Boolean)
            .join("\n"),
        )
        .join("\n\n");
      parts.push(`Open files:\n\n${fileContext}`);
    }

    if (prompt) parts.push(prompt);
    newPrompt = parts.join("\n\n");
  }

  const args = [
    "chat",
    "--dev",
    "--session",
    session ?? crypto.randomUUID(),
  ];

  if (newPrompt) args.push("--prompt", newPrompt);
  if (forceAll) args.push("--force-all");
  if (resume) args.push("--resume");
  if (registeredTools.size > 0 && toolsPath)
    args.push("--runtime-tools", toolsPath);

  const result = await execa("lens", args, {
    reject: false,
    cwd: context?.cwd,
  });

  try {
    const data = JSON.parse(result.stdout);
    return data;
  } catch (err) {
    console.log("error: ", err, "data", result.stdout);
    return { error: err, message: "", model: "", sessionId: "", tools: [] };
  }
}
