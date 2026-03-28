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
  const newPrompt = context
    ? `Available context: ${JSON.stringify(context)}; given prompt: ${prompt}`
    : prompt;

  const result = await execa(
    "lens",
    [
      "chat",
      "--dev",
      "--prompt",
      newPrompt,
      "--session",
      session ?? crypto.randomUUID(),
      forceAll ? "--force-all" : "",
    ],
    { reject: false },
  );

  try {
    const data = JSON.parse(result.stdout);
    return data;
  } catch (err) {
    console.log("error: ", err, "data", result.stdout);
    return { error: err, message: "", model: "", sessionId: "", tools: [] };
  }
}
