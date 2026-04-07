import { spawn } from "child_process";

// Spawn with shell: true and a single command string. This avoids DEP0190
// (the deprecation warning triggered by passing an args array together with
// shell: true) while still letting Windows find `npm.cmd` correctly —
// post-CVE-2024-27980 Node requires a shell to spawn .cmd files on Windows.
const opts = { stdio: "inherit" as const, shell: true };

const server = spawn("npm run dev -w @jobsearch/server", opts);
const client = spawn("npm run dev -w @jobsearch/client", opts);

process.on("SIGINT", () => {
  server.kill("SIGINT");
  client.kill("SIGINT");
});

server.on("close", () => client.kill());
client.on("close", () => server.kill());
