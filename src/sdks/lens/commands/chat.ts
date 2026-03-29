import { join } from "path";
import { spawnChatProcess, type Tool, type ChatProcessResult } from "../spawn";
import type { Context } from "../types/context";
import { homedir } from "os";
import { registerRuntimeTool } from "../tools/register";

interface UserMessage {
  message: string;
  context?: Context;
}

interface AssistantMessage {
  model: string;
  message: string;
  tools?: Tool[];
}

type ChatMessage = UserMessage | AssistantMessage;

export class Chat {
  private messages: ChatMessage[] = [];

  constructor(
    private session: string = crypto.randomUUID(),
    private forceAll: boolean = false,
    private runtimeToolsPath: string = join(
      homedir(),
      ".lens",
      "runtime-tools.json",
    ),
  ) {}

  public async push(
    message: string,
    context?: Context,
  ): Promise<ChatProcessResult> {
    this.messages.push({ message, context });

    const result = await spawnChatProcess({
      context,
      session: this.session,
      prompt: message,
      forceAll: this.forceAll,
      toolsPath: this.runtimeToolsPath,
    });

    this.messages.push({
      model: result.model,
      message: result.message,
      tools: result.tools,
    });

    return result;
  }

  public async registerTool(tool: {
    name: string;
    description: string;
    parameters: Record<string, { type: string; description?: string }>;
    onRun: (args: any) => Promise<any>;
  }) {
    await registerRuntimeTool(tool, this.runtimeToolsPath);
  }

  public getHistory(): ChatMessage[] {
    return this.messages;
  }

  public async runTool(tool: Tool): Promise<ChatProcessResult> {
    this.messages.push({ message: `Execute ${tool.tool}` });

    const result = await spawnChatProcess({
      session: this.session,
      prompt: `Execute ${tool.tool}`,
      forceAll: true,
      toolsPath: this.runtimeToolsPath,
    });

    this.messages.push({
      model: result.model,
      message: result.message,
      tools: result.tools,
    });

    return result;
  }
  public async skipTool(tool: Tool): Promise<ChatProcessResult> {
    this.messages.push({ message: `Execute tool ${tool.tool}` });

    const result = await spawnChatProcess({
      session: this.session,
      prompt: `Skip tool ${tool.tool}`,
      toolsPath: this.runtimeToolsPath,
    });

    this.messages.push({
      model: result.model,
      message: result.message,
      tools: result.tools,
    });

    return result;
  }

  public getSessionId(): string {
    return this.session;
  }
}
