export const config = {
    discordToken: process.env.DISCORD_BOT_TOKEN || "",
    clientId: process.env.DISCORD_CLIENT_ID || "",
    clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
    apiUrl: process.env.API_URL || "http://localhost:3000",
    redirectUri: process.env.DISCORD_REDIRECT_URI || "http://localhost:3000/api/discord/oauth/callback",
};
if (!config.discordToken) {
    console.error("ERROR: DISCORD_BOT_TOKEN is not set!");
    console.error("Set it in your .env file: DISCORD_BOT_TOKEN=your_token_here");
}
