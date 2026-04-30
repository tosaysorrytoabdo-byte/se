import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";

import { createDiscordOAuthCallbackHandler } from "./discord-auth";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.get("/api/discord/oauth/callback", await createDiscordOAuthCallbackHandler());
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  // Auto-push database schema on startup
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    console.log("Pushing database schema...");
    const { stdout, stderr } = await execAsync(
      "npx drizzle-kit push --config=drizzle.config.ts --force",
      { env: { ...process.env } }
    );
    if (stdout) console.log(stdout);
    if (stderr) console.log(stderr);
    console.log("✅ Database schema ready");
  } catch (err) {
    console.error("⚠️ DB push warning:", err);
  }

  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
