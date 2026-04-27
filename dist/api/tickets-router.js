import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";
import { eq, desc } from "drizzle-orm";
export const ticketsRouter = createRouter({
    // Create a new ticket
    create: publicQuery.input(z.object({
        userDiscordId: z.string(),
        userUsername: z.string().optional(),
        type: z.enum(["buy_members", "buy_coins", "support"]),
        metadata: z.string().optional(),
    })).mutation(async ({ input }) => {
        const db = getDb();
        const result = await db.insert(schema.tickets).values({
            userDiscordId: input.userDiscordId,
            userUsername: input.userUsername,
            type: input.type,
            metadata: input.metadata,
        });
        return { id: Number(result[0]?.insertId), ...input, status: "open" };
    }),
    // Get all tickets (admin)
    allTickets: adminQuery.query(async () => {
        const db = getDb();
        return await db
            .select()
            .from(schema.tickets)
            .orderBy(desc(schema.tickets.createdAt));
    }),
    // Get open tickets
    openTickets: adminQuery.query(async () => {
        const db = getDb();
        return await db
            .select()
            .from(schema.tickets)
            .where(eq(schema.tickets.status, "open"))
            .orderBy(desc(schema.tickets.createdAt));
    }),
    // Update ticket status
    updateStatus: adminQuery.input(z.object({
        ticketId: z.number(),
        status: z.enum(["open", "in_progress", "closed"]),
        notes: z.string().optional(),
    })).mutation(async ({ input }) => {
        const db = getDb();
        const updateData = {
            status: input.status,
            updatedAt: new Date(),
        };
        if (input.notes) {
            updateData.notes = input.notes;
        }
        await db
            .update(schema.tickets)
            .set(updateData)
            .where(eq(schema.tickets.id, input.ticketId));
        return { success: true };
    }),
    // Delete ticket
    deleteTicket: adminQuery.input(z.object({
        ticketId: z.number(),
    })).mutation(async ({ input }) => {
        const db = getDb();
        await db
            .delete(schema.tickets)
            .where(eq(schema.tickets.id, input.ticketId));
        return { success: true };
    }),
});
