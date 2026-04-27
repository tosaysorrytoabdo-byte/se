import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { discordRouter } from "./discord-router";
import { ordersRouter } from "./orders-router";
import { ticketsRouter } from "./tickets-router";
import { settingsRouter } from "./settings-router";
import { controllersRouter } from "./controllers-router";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  discord: discordRouter,
  orders: ordersRouter,
  tickets: ticketsRouter,
  settings: settingsRouter,
  controllers: controllersRouter,
});

export type AppRouter = typeof appRouter;
