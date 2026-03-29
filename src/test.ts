import { Chat } from "./sdks/lens";

const chat = new Chat("askjdasd", true);

await chat.registerTool({
  name: "log_text",
  description: "Logs the provided text to the console",
  parameters: { text: { type: "string" } },
  async onRun(args) {
    console.error("logged by dev: ", args.text);
  },
});

console.log(await chat.push("Log the message 'Hello, World!'"));
