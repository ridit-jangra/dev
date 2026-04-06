import { Milo } from "./sdks/milo";

await Milo.start();

const milo = new Milo("agent");

const text = await milo.chat("create a hello world app", (event) => {
  if (event.type === "tool_call") console.log("calling", event.toolName);

  if (event.type === "permission_request")
    milo.resolvePermission(event.id, "allow");
});

console.log(text);
await milo.disconnect();
