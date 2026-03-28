import { spawnChatProcess, type Tool } from "../spawn";
import type { Context } from "../types/context";

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
  ) {}

  public async push(message: string, context?: Context) {
    this.messages.push({ message, context });

    const result = await spawnChatProcess({
      context,
      session: this.session,
      prompt: message,
      forceAll: true,
    });

    this.messages.push({
      model: result.model,
      message: result.message,
      tools: result.tools,
    });

    return result;
  }

  public getHistory(): ChatMessage[] {
    return this.messages;
  }

  public async runTool(tool: Tool) {
    this.messages.push({ message: `Execute ${tool.tool}` });

    const result = await spawnChatProcess({
      session: this.session,
      prompt: `Execute ${tool.tool}`,
      forceAll: true,
    });

    this.messages.push({
      model: result.model,
      message: result.message,
      tools: result.tools,
    });

    return result;
  }
  public async skipTool(tool: Tool) {
    this.messages.push({ message: `Execute tool ${tool.tool}` });

    const result = await spawnChatProcess({
      session: this.session,
      prompt: `Skip tool ${tool.tool}`,
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
