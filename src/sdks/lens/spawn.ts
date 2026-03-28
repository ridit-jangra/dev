import { execa } from "execa";
import type { Context } from "./types/context";

interface ChatProcessProps {
  prompt: string;
  context?: Context;
  session?: string;
  forceAll?: boolean;
}

export interface Tool {
  tool: string;
  args: Record<string, any>;
  result: string;
}

export interface ChatProcessResult {
  sessionId: string;
  message: string;
  model: string;
  tools: Tool[];
  error?: any;
}

export async function spawnChatProcess({
  context,
  prompt,
  session,
  forceAll,
}: ChatProcessProps): Promise<ChatProcessResult> {
  let newPrompt = prompt;

  if (context) {
    const parts: string[] = [];

    if (context.prompt) parts.push(context.prompt);

    if (context.files.length > 0) {
      const fileContext = context.files
        .map(
          (f) =>
            `### ${f.name} (${f.path})\n${f.prompt ? `Note: ${f.prompt}\n` : ""}\`\`\`\n${f.content}\n\`\`\``,
        )
        .join("\n\n");
      parts.push(`## Open Files\n${fileContext}`);
    }

    parts.push(`## Task\n${prompt}`);
    newPrompt = parts.join("\n\n");
  }

  const args = [
    "chat",
    "--dev",
    "--prompt",
    newPrompt,
    "--session",
    session ?? crypto.randomUUID(),
  ];

  if (forceAll) args.push("--force-all");

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
