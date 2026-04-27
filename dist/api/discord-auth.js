import axios from "axios";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";
import { eq } from "drizzle-orm";
export async function createDiscordOAuthCallbackHandler() {
    return async (c) => {
        const code = c.req.query("code");
        const error = c.req.query("error");
        if (error) {
            return c.redirect("/?error=oauth_denied", 302);
        }
        if (!code) {
            return c.json({ error: "code is required" }, 400);
        }
        try {
            // Exchange code for tokens
            const params = new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID || "",
                client_secret: process.env.DISCORD_CLIENT_SECRET || "",
                grant_type: "authorization_code",
                code,
                redirect_uri: process.env.DISCORD_REDIRECT_URI || "http://localhost:3000/api/discord/oauth/callback",
            });
            const tokenRes = await axios.post("https://discord.com/api/v10/oauth2/token", params.toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });
            const { access_token, refresh_token, expires_in } = tokenRes.data;
            // Get user info
            const userRes = await axios.get("https://discord.com/api/v10/users/@me", {
                headers: { Authorization: `Bearer ${access_token}` },
            });
            const discordUser = userRes.data;
            // Check nitro (premium_type: 0 = none, 1 = nitro classic, 2 = nitro)
            const nitro = discordUser.premium_type && discordUser.premium_type > 0 ? "yes" : "no";
            // Save to database
            const db = getDb();
            const existing = await db
                .select()
                .from(schema.discordUsers)
                .where(eq(schema.discordUsers.discordId, discordUser.id))
                .limit(1);
            const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);
            if (existing[0]) {
                await db
                    .update(schema.discordUsers)
                    .set({
                    username: discordUser.username,
                    avatar: discordUser.avatar,
                    email: discordUser.email,
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    tokenExpiresAt,
                    nitro,
                    status: "active",
                })
                    .where(eq(schema.discordUsers.id, existing[0].id));
            }
            else {
                await db.insert(schema.discordUsers).values({
                    discordId: discordUser.id,
                    username: discordUser.username,
                    avatar: discordUser.avatar,
                    email: discordUser.email,
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    tokenExpiresAt,
                    nitro,
                    status: "active",
                });
            }
            // Log the activity
            await db.insert(schema.activityLogs).values({
                type: "oauth",
                description: `User ${discordUser.username} (${discordUser.id}) authorized via OAuth2`,
                metadata: JSON.stringify({ userId: discordUser.id, username: discordUser.username, nitro }),
            });
            // Redirect back with success message
            return c.redirect("/dashboard?oauth=success&user=" + encodeURIComponent(discordUser.username), 302);
        }
        catch (error) {
            console.error("[Discord OAuth] Callback failed:", error.response?.data || error.message);
            return c.redirect("/?error=oauth_failed", 302);
        }
    };
}
