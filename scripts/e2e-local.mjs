// Runs the Playwright suite against the local Supabase stack (npx supabase start),
// including the signed-in specs. Never points at the hosted project.
import { execFileSync, spawnSync } from "node:child_process";

const statusEnv = execFileSync("npx", ["supabase", "status", "-o", "env"], { encoding: "utf8" });
const local = Object.fromEntries(
  statusEnv
    .split("\n")
    .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map(([, key, value]) => [key, value]),
);

for (const key of ["API_URL", "ANON_KEY", "SERVICE_ROLE_KEY"]) {
  if (!local[key]) {
    console.error(`Local Supabase isn't running (missing ${key}). Start it with: npx supabase start`);
    process.exit(1);
  }
}

const result = spawnSync("npx", ["playwright", "test", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: {
    ...process.env,
    // Process env wins over .env.local, so the build talks to local Supabase
    NEXT_PUBLIC_SUPABASE_URL: local.API_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: local.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY,
    E2E_LOCAL_SUPABASE: "1",
  },
});
process.exit(result.status ?? 1);
