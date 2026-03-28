import { execa } from "execa";

export async function spawnProcess() {
  const { stdout } = await execa("lens", [
    "chat",
    "--dev",
    "--prompt",
    "hello",
    "--single",
    "--session",
    "proasd",
  ]);
  console.log(stdout);
}
