import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const controllersRouter = createRouter({
  // Get all bot controllers
  list: adminQuery.query(async () => {
    const db = getDb();
    return await db
      .select()
      .from(schema.botControllers)
      .orderBy(desc(schema.botControllers.createdAt));
  }),

  // Add a new controller (admin only)
  add: adminQuery.input(z.object({
    discordId: z.string(),
    username: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = getDb();
    
    const existing = await db
      .select()
      .from(schema.botControllers)
      .where(eq(schema.botControllers.discordId, input.discordId))
      .limit(1);

    if (existing[0]) {
      return { success: false, error: "Controller already exists" };
    }

    await db.insert(schema.botControllers).values({
      discordId: input.discordId,
      username: input.username,
      addedBy: ctx.user?.name || "admin",
    });

    return { success: true };
  }),

  // Remove a controller
  remove: adminQuery.input(z.object({
    id: z.number(),
  })).mutation(async ({ input }) => {
    const db = getDb();
    await db
      .delete(schema.botControllers)
      .where(eq(schema.botControllers.id, input.id));
    return { success: true };
  }),

  // Check if a Discord user is an authorized controller
  isAuthorized: adminQuery.input(z.object({
    discordId: z.string(),
  })).query(async ({ input }) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.botControllers)
      .where(eq(schema.botControllers.discordId, input.discordId))
      .limit(1);
    
    return { authorized: rows.length > 0, isOwner: rows[0]?.isOwner || false };
  }),
});
