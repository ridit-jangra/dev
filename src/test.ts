import { Chat } from "./sdks/lens";

const chat = new Chat("asdasdasd");

const toolRequest = await chat.push("create main.py'");
console.log(toolRequest);
toolRequest.tools.forEach(async (tool) => {
  const toolExecution = await chat.runTool(tool);
  console.log(toolExecution);
});
