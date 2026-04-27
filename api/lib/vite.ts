import type { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import path from "path";

type App = Hono<{ Bindings: HttpBindings }>;

export function serveStaticFiles(app: App) {
  // When bundled by esbuild: dist/api/boot.js
  // import.meta.dirname = <cwd>/dist/api
  // public files are at: <cwd>/dist/public
  const distPublicPath = path.resolve(import.meta.dirname, "../public");

  app.use("*", serveStatic({ root: distPublicPath }));

  app.notFound((c) => {
    const accept = c.req.header("accept") ?? "";
    if (!accept.includes("text/html")) {
      return c.json({ error: "Not Found" }, 404);
    }
    const indexPath = path.resolve(distPublicPath, "index.html");
    const content = fs.readFileSync(indexPath, "utf-8");
    return c.html(content);
  });
}
