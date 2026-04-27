import { Client, GatewayIntentBits, Collection, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { config } from "./config";
import { sendWelcomeDM } from "./utils/joiner";
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});
const commands = new Collection();
// ===================== HELP COMMAND =====================
const helpCommand = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Show all available commands"),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle("📖 Revel Members Bot - Help")
            .setDescription("Here are all available commands:")
            .setColor(0x5865F2)
            .addFields({ name: "/stock", value: "View available member stock", inline: true }, { name: "/buy", value: "Buy members for your server", inline: true }, { name: "/check", value: "Check server information", inline: true }, { name: "/ticket", value: "Open a support ticket", inline: true }, { name: "/join", value: "[Admin] Force join members to server", inline: true }, { name: "/help", value: "Show this help message", inline: true })
            .setFooter({ text: "Revel Members Bot v1.0" });
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
// ===================== STOCK COMMAND =====================
const stockCommand = {
    data: new SlashCommandBuilder()
        .setName("stock")
        .setDescription("View available member stock"),
    async execute(interaction) {
        const resp = await fetch(`${config.apiUrl}/api/trpc/discord.stock`);
        const json = await resp.json();
        const data = json.result?.data || { stock: 0, nitro: 0, normal: 0, used: 0 };
        const embed = new EmbedBuilder()
            .setTitle("📦 Member Stock")
            .setDescription(`**Available Members:** ${data.stock}\n` +
            `**Nitro Members:** ${data.nitro}\n` +
            `**Normal Members:** ${data.normal}\n` +
            `**Total Used:** ${data.used}`)
            .setColor(0x5865F2)
            .setFooter({ text: "Revel Members Bot" })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
// ===================== BUY COMMAND =====================
const buyCommand = {
    data: new SlashCommandBuilder()
        .setName("buy")
        .setDescription("Buy members for your server")
        .addIntegerOption(opt => opt.setName("amount")
        .setDescription("Number of members to buy")
        .setRequired(true)
        .setMinValue(10))
        .addStringOption(opt => opt.setName("server_id")
        .setDescription("Your server ID (right-click server -> Copy Server ID)")
        .setRequired(true)),
    async execute(interaction) {
        const amount = interaction.options.getInteger("amount", true);
        const serverId = interaction.options.getString("server_id", true);
        // Get price per member from API
        const priceResp = await fetch(`${config.apiUrl}/api/trpc/settings.getPrice`);
        const priceJson = await priceResp.json();
        const pricePerMember = priceJson.result?.data?.price || 7;
        const totalPrice = amount * pricePerMember;
        // Create order via API
        const orderResp = await fetch(`${config.apiUrl}/api/trpc/orders.create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                buyerDiscordId: interaction.user.id,
                buyerUsername: interaction.user.username,
                serverId,
                amount,
                price: totalPrice,
            }),
        });
        const orderJson = await orderResp.json();
        const order = orderJson.result?.data;
        if (!order) {
            await interaction.reply({ content: "❌ Failed to create order. Please try again.", ephemeral: true });
            return;
        }
        const embed = new EmbedBuilder()
            .setTitle("🛒 Order Created")
            .setDescription(`**Order ID:** #${order.id}\n` +
            `**Members:** ${amount}\n` +
            `**Server ID:** ${serverId}\n` +
            `**Total Price:** ${totalPrice} credits\n\n` +
            `📌 **Next Steps:**\n` +
            `1. Pay **${totalPrice}** credits to the shop\n` +
            `2. Open a ticket with proof of payment\n` +
            `3. Staff will process your order`)
            .setColor(0x57F287)
            .setTimestamp();
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder()
            .setCustomId(`ticket_buy_${order.id}`)
            .setLabel("Open Payment Ticket")
            .setStyle(ButtonStyle.Success)
            .setEmoji("🎫"));
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};
// ===================== CHECK COMMAND =====================
const checkCommand = {
    data: new SlashCommandBuilder()
        .setName("check")
        .setDescription("Check server information")
        .addStringOption(opt => opt.setName("server_id")
        .setDescription("Server ID to check")
        .setRequired(true)),
    async execute(interaction) {
        const serverId = interaction.options.getString("server_id", true);
        const resp = await fetch(`${config.apiUrl}/api/trpc/discord.checkServer?input=${encodeURIComponent(JSON.stringify({ serverId }))}`);
        const json = await resp.json();
        const data = json.result?.data;
        if (!data?.success) {
            await interaction.reply({ content: `❌ ${data?.error || "Could not fetch server info."}`, ephemeral: true });
            return;
        }
        const embed = new EmbedBuilder()
            .setTitle(`🔍 ${data.name}`)
            .setDescription(`**Members:** ${data.memberCount}\n` +
            `**Boost Level:** ${data.premiumTier}\n` +
            `**Max Members:** ${data.maxMembers || "Unknown"}`)
            .setColor(0x5865F2)
            .setThumbnail(data.icon || null)
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
// ===================== JOIN COMMAND (ADMIN) =====================
const joinCommand = {
    data: new SlashCommandBuilder()
        .setName("join")
        .setDescription("[Admin] Add members to a server")
        .addStringOption(opt => opt.setName("server_id")
        .setDescription("Target server ID")
        .setRequired(true))
        .addIntegerOption(opt => opt.setName("amount")
        .setDescription("Number of members to add")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const serverId = interaction.options.getString("server_id", true);
        const amount = interaction.options.getInteger("amount", true);
        await interaction.deferReply({ ephemeral: true });
        const resp = await fetch(`${config.apiUrl}/api/trpc/discord.join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ serverId, amount }),
        });
        const json = await resp.json();
        const result = json.result?.data || { success: 0, failed: 0 };
        const embed = new EmbedBuilder()
            .setTitle("✅ Members Added")
            .setDescription(`**Server:** ${serverId}\n` +
            `**Requested:** ${amount}\n` +
            `**Success:** ${result.success}\n` +
            `**Failed:** ${result.failed}`)
            .setColor(result.failed === 0 ? 0x57F287 : 0xFEE75C)
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    }
};
// ===================== TICKET COMMAND =====================
const ticketCommand = {
    data: new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Open a support ticket")
        .addStringOption(opt => opt.setName("type")
        .setDescription("Type of ticket")
        .setRequired(true)
        .addChoices({ name: "Buy Members", value: "buy_members" }, { name: "Buy Coins", value: "buy_coins" }, { name: "Support", value: "support" })),
    async execute(interaction) {
        const type = interaction.options.getString("type", true);
        const resp = await fetch(`${config.apiUrl}/api/trpc/tickets.create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userDiscordId: interaction.user.id,
                userUsername: interaction.user.username,
                type,
            }),
        });
        const json = await resp.json();
        const ticket = json.result?.data;
        if (!ticket) {
            await interaction.reply({ content: "❌ Failed to create ticket.", ephemeral: true });
            return;
        }
        const embed = new EmbedBuilder()
            .setTitle("🎫 Ticket Opened")
            .setDescription(`**Ticket ID:** #${ticket.id}\n` +
            `**Type:** ${type}\n` +
            `**User:** <@${interaction.user.id}>\n\n` +
            `A staff member will assist you soon.`)
            .setColor(0xFEE75C)
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
// ===================== REGISTER COMMANDS =====================
async function registerCommands() {
    const rest = new REST({ version: "10" }).setToken(config.discordToken);
    const cmds = [
        helpCommand.data.toJSON(),
        stockCommand.data.toJSON(),
        buyCommand.data.toJSON(),
        checkCommand.data.toJSON(),
        joinCommand.data.toJSON(),
        ticketCommand.data.toJSON(),
    ];
    try {
        await rest.put(Routes.applicationCommands(config.clientId), { body: cmds });
        console.log("✅ Slash commands registered globally");
    }
    catch (err) {
        console.error("❌ Failed to register commands:", err);
    }
}
// ===================== EVENTS =====================
client.once("ready", async () => {
    console.log(`🤖 Bot logged in as ${client.user?.tag}`);
    console.log(`🆔 Client ID: ${config.clientId}`);
    console.log(`🔗 Invite URL: https://discord.com/oauth2/authorize?client_id=${config.clientId}&scope=bot+applications.commands&permissions=268435520`);
    await registerCommands();
});
// Welcome DM when a member joins a server
client.on("guildMemberAdd", async (member) => {
    try {
        const msgResp = await fetch(`${config.apiUrl}/api/trpc/settings.getWelcomeMessage`);
        const msgJson = await msgResp.json();
        const message = msgJson.result?.data?.message || "Welcome to the server! 🎉";
        const enabledResp = await fetch(`${config.apiUrl}/api/trpc/settings.getWelcomeEnabled`);
        const enabledJson = await enabledResp.json();
        const enabled = enabledJson.result?.data?.enabled;
        if (!enabled)
            return;
        await sendWelcomeDM(member.id, message.replace(/{user}/g, `<@${member.id}>`).replace(/{server}/g, member.guild.name));
    }
    catch (err) {
        console.error("[Welcome DM] Error:", err);
    }
});
// Handle interactions
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand())
        return;
    const command = commands.get(interaction.commandName);
    if (!command)
        return;
    try {
        await command.execute(interaction);
    }
    catch (err) {
        console.error(`[Command Error] ${interaction.commandName}:`, err);
        const reply = interaction.deferred ? interaction.editReply.bind(interaction) : interaction.reply.bind(interaction);
        await reply({ content: "❌ An error occurred while executing this command.", ephemeral: true });
    }
});
// Register all commands
commands.set(helpCommand.data.name, helpCommand);
commands.set(stockCommand.data.name, stockCommand);
commands.set(buyCommand.data.name, buyCommand);
commands.set(checkCommand.data.name, checkCommand);
commands.set(joinCommand.data.name, joinCommand);
commands.set(ticketCommand.data.name, ticketCommand);
// ===================== START =====================
export async function startBot() {
    await client.login(config.discordToken);
}
export { client };
