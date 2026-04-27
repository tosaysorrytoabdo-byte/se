import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import axios from "axios";
export const discordRouter = createRouter({
    // Get OAuth2 authorization URL for capturing member tokens
    authUrl: publicQuery.query(async () => {
        const clientId = process.env.DISCORD_CLIENT_ID;
        const redirectUri = process.env.DISCORD_REDIRECT_URI || "http://localhost:3000/api/discord/oauth/callback";
        const scope = "identify email guilds guilds.join";
        const state = Buffer.from(redirectUri).toString("base64");
        const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;
        return { url };
    }),
    // Get stock count (active members available)
    stock: publicQuery.query(async () => {
        const db = getDb();
        const total = await db
            .select({ count: count() })
            .from(schema.discordUsers)
            .where(eq(schema.discordUsers.status, "active"));
        const nitro = await db
            .select({ count: count() })
            .from(schema.discordUsers)
            .where(and(eq(schema.discordUsers.status, "active"), eq(schema.discordUsers.nitro, "yes")));
        const used = await db
            .select({ count: count() })
            .from(schema.discordUsers)
            .where(eq(schema.discordUsers.status, "used"));
        return {
            stock: total[0]?.count || 0,
            nitro: nitro[0]?.count || 0,
            normal: (total[0]?.count || 0) - (nitro[0]?.count || 0),
            used: used[0]?.count || 0,
        };
    }),
    // Get all stored Discord users (admin only)
    users: adminQuery.query(async () => {
        const db = getDb();
        return await db
            .select()
            .from(schema.discordUsers)
            .orderBy(desc(schema.discordUsers.createdAt));
    }),
    // Delete a stored user (admin)
    deleteUser: adminQuery.input(z.object({
        id: z.number(),
    })).mutation(async ({ input }) => {
        const db = getDb();
        await db
            .delete(schema.discordUsers)
            .where(eq(schema.discordUsers.id, input.id));
        return { success: true };
    }),
    // Check if server is accessible by bot
    checkServer: publicQuery.input(z.object({
        serverId: z.string(),
    })).query(async ({ input }) => {
        try {
            const res = await axios.get(`https://discord.com/api/v10/guilds/${input.serverId}`, {
                headers: {
                    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                },
            });
            return {
                success: true,
                id: res.data.id,
                name: res.data.name,
                memberCount: res.data.approximate_member_count || res.data.member_count,
                icon: res.data.icon ? `https://cdn.discordapp.com/icons/${res.data.id}/${res.data.icon}.png` : null,
                premiumTier: res.data.premium_tier,
                maxMembers: res.data.max_members,
            };
        }
        catch (err) {
            return {
                success: false,
                error: err.response?.data?.message || err.message,
            };
        }
    }),
    // Join members to a target server
    join: publicQuery.input(z.object({
        serverId: z.string(),
        amount: z.number().min(1).max(100),
    })).mutation(async ({ input }) => {
        const db = getDb();
        // Get available active users
        const users = await db
            .select()
            .from(schema.discordUsers)
            .where(eq(schema.discordUsers.status, "active"))
            .limit(input.amount);
        if (users.length === 0) {
            return { success: 0, failed: 0, error: "No active members in stock" };
        }
        let success = 0;
        let failed = 0;
        for (const user of users) {
            try {
                // Use guilds.join to add user to server using their access token
                const res = await axios.put(`https://discord.com/api/v10/guilds/${input.serverId}/members/${user.discordId}`, { access_token: user.accessToken }, {
                    headers: {
                        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                });
                if (res.status === 201 || res.status === 204) {
                    success++;
                    // Update user record
                    await db
                        .update(schema.discordUsers)
                        .set({
                        lastUsedAt: new Date(),
                        totalJoins: (user.totalJoins || 0) + 1,
                    })
                        .where(eq(schema.discordUsers.id, user.id));
                }
                else {
                    failed++;
                }
            }
            catch (err) {
                failed++;
                // If token expired, mark as expired
                if (err.response?.status === 401 || err.response?.status === 403) {
                    await db
                        .update(schema.discordUsers)
                        .set({ status: "expired" })
                        .where(eq(schema.discordUsers.id, user.id));
                }
            }
        }
        return { success, failed, total: input.amount, attempted: users.length };
    }),
    // Get stats for dashboard
    stats: adminQuery.query(async () => {
        const db = getDb();
        const [activeCount, totalCount, orderCount, ticketCount] = await Promise.all([
            db.select({ count: count() }).from(schema.discordUsers).where(eq(schema.discordUsers.status, "active")),
            db.select({ count: count() }).from(schema.discordUsers),
            db.select({ count: count() }).from(schema.orders),
            db.select({ count: count() }).from(schema.tickets).where(eq(schema.tickets.status, "open")),
        ]);
        return {
            activeMembers: activeCount[0]?.count || 0,
            totalMembers: totalCount[0]?.count || 0,
            totalOrders: orderCount[0]?.count || 0,
            openTickets: ticketCount[0]?.count || 0,
        };
    }),
});
