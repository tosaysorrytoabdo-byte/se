import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";
import { eq } from "drizzle-orm";
// Helper to get setting value
async function getSetting(key) {
    const db = getDb();
    const rows = await db
        .select()
        .from(schema.settings)
        .where(eq(schema.settings.key, key))
        .limit(1);
    return rows[0]?.value || null;
}
// Helper to set setting value
async function setSetting(key, value) {
    const db = getDb();
    const existing = await db
        .select()
        .from(schema.settings)
        .where(eq(schema.settings.key, key))
        .limit(1);
    if (existing[0]) {
        await db
            .update(schema.settings)
            .set({ value, updatedAt: new Date() })
            .where(eq(schema.settings.id, existing[0].id));
    }
    else {
        await db.insert(schema.settings).values({ key, value });
    }
}
export const settingsRouter = createRouter({
    // Get welcome message
    getWelcomeMessage: publicQuery.query(async () => {
        const value = await getSetting("welcome_dm_message");
        return { message: value || "Welcome to the server! 🎉" };
    }),
    // Set welcome message (admin)
    setWelcomeMessage: adminQuery.input(z.object({
        message: z.string().min(1).max(2000),
    })).mutation(async ({ input }) => {
        await setSetting("welcome_dm_message", input.message);
        return { success: true, message: input.message };
    }),
    // Get price per member
    getPrice: publicQuery.query(async () => {
        const value = await getSetting("price_per_member");
        return { price: parseInt(value || "7", 10) }; // default 7 coins
    }),
    // Set price per member (admin)
    setPrice: adminQuery.input(z.object({
        price: z.number().min(1).max(1000),
    })).mutation(async ({ input }) => {
        await setSetting("price_per_member", String(input.price));
        return { success: true, price: input.price };
    }),
    // Get all settings (admin)
    allSettings: adminQuery.query(async () => {
        const db = getDb();
        const rows = await db.select().from(schema.settings);
        return rows;
    }),
    // Toggle welcome DM on/off
    getWelcomeEnabled: publicQuery.query(async () => {
        const value = await getSetting("welcome_dm_enabled");
        return { enabled: value !== "false" };
    }),
    setWelcomeEnabled: adminQuery.input(z.object({
        enabled: z.boolean(),
    })).mutation(async ({ input }) => {
        await setSetting("welcome_dm_enabled", String(input.enabled));
        return { success: true, enabled: input.enabled };
    }),
});
