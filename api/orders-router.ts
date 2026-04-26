import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const ordersRouter = createRouter({
  // Create a new order (when someone buys members)
  create: publicQuery.input(z.object({
    buyerDiscordId: z.string(),
    buyerUsername: z.string().optional(),
    serverId: z.string(),
    serverName: z.string().optional(),
    amount: z.number().min(1),
    price: z.number().min(0),
  })).mutation(async ({ input }) => {
    const db = getDb();
    
    const result = await db.insert(schema.orders).values({
      buyerDiscordId: input.buyerDiscordId,
      buyerUsername: input.buyerUsername,
      serverId: input.serverId,
      serverName: input.serverName,
      amount: input.amount,
      price: input.price,
    });

    return { id: Number(result[0]?.insertId), ...input, status: "pending" };
  }),

  // Get all orders (admin)
  allOrders: adminQuery.query(async () => {
    const db = getDb();
    return await db
      .select()
      .from(schema.orders)
      .orderBy(desc(schema.orders.createdAt));
  }),

  // Get recent orders (admin)
  recentOrders: adminQuery.query(async () => {
    const db = getDb();
    return await db
      .select()
      .from(schema.orders)
      .orderBy(desc(schema.orders.createdAt))
      .limit(20);
  }),

  // Update order status
  updateStatus: adminQuery.input(z.object({
    orderId: z.number(),
    status: z.enum(["pending", "processing", "completed", "failed", "cancelled"]),
    delivered: z.number().optional(),
  })).mutation(async ({ input }) => {
    const db = getDb();
    
    const updateData: Record<string, unknown> = { 
      status: input.status,
    };
    if (input.status === "completed") {
      updateData.completedAt = new Date();
    }
    if (input.delivered !== undefined) {
      updateData.delivered = input.delivered;
    }

    await db
      .update(schema.orders)
      .set(updateData)
      .where(eq(schema.orders.id, input.orderId));

    return { success: true };
  }),

  // Delete order
  deleteOrder: adminQuery.input(z.object({
    orderId: z.number(),
  })).mutation(async ({ input }) => {
    const db = getDb();
    await db
      .delete(schema.orders)
      .where(eq(schema.orders.id, input.orderId));
    return { success: true };
  }),
});
