import { execSync, spawn } from "node:child_process";

import { fileURLToPath } from "node:url";
import path from "node:path";

const PORT = process.env.PORT ?? "3000";
const root = path.dirname(fileURLToPath(import.meta.url));
const nextBin = path.join(root, "..", "node_modules", "next", "dist", "bin", "next");

function killPort(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
    const pids = new Set();
    for (const line of out.split("\n")) {
      if (!line.includes("LISTENING")) continue;
      const pid = line.trim().split(/\s+/).at(-1);
      if (pid && pid !== "0") pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`Stopped process ${pid} on port ${port}`);
      } catch {
        // already exited
      }
    }
  } catch {
    // port free
  }
}

killPort(PORT);

const child = spawn(process.execPath, [nextBin, "dev", "-p", PORT], {
  stdio: "inherit",
  cwd: path.join(root, ".."),
});

child.on("exit", (code) => process.exit(code ?? 0));
