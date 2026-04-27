import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";

import { createContext } from "./context.js";
import { env } from "./lib/env.js";
import { createOAuthCallbackHandler } from "./kimi/auth.js";
import { Paths } from "../contracts/constants.js";

import { createDiscordOAuthCallbackHandler } from "./discord-auth.js";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// OAuth
app.get(Paths.oauthCallback, createOAuthCallbackHandler());

// ❌ لا تستخدم await هنا
const discordHandler = await createDiscordOAuthCallbackHandler();
app.get("/api/discord/oauth/callback", discordHandler);

// tRPC
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

// Production only
if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite.js");

  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");

  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
