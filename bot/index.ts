import { Client, GatewayIntentBits, Collection, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { ChatInputCommandInteraction, GuildMember, Message } from "discord.js";
import { config } from "./config";
import { sendWelcomeDM } from "./utils/joiner";

const PREFIX = "!";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

const commands = new Collection<string, any>();

interface TRPCResponse<T> {
  result?: {
    data?: T;
  };
}

// ===================== HELP =====================
async function handleHelp(msg: Message) {
  const embed = new EmbedBuilder()
    .setTitle("📖 Revel Members Bot - Help")
    .setDescription("Here are all available commands:")
    .setColor(0x5865F2)
    .addFields(
      { name: `${PREFIX}stock`, value: "View available member stock", inline: true },
      { name: `${PREFIX}buy <amount> <server_id>`, value: "Buy members for your server", inline: true },
      { name: `${PREFIX}check <server_id>`, value: "Check server information", inline: true },
      { name: `${PREFIX}ticket <type>`, value: "Open a support ticket", inline: true },
      { name: `${PREFIX}join <server_id> <amount>`, value: "[Admin] Force join members", inline: true },
      { name: `${PREFIX}help`, value: "Show this help message", inline: true },
    )
    .setFooter({ text: "Revel Members Bot v1.0" });

  await msg.reply({ embeds: [embed] });
}

// ===================== STOCK =====================
async function handleStock(msg: Message) {
  const resp = await fetch(`${config.apiUrl}/api/trpc/discord.stock`);
  const json = await resp.json() as TRPCResponse<{ stock: number; nitro: number; normal: number; used: number }>;
  const data = json.result?.data || { stock: 0, nitro: 0, normal: 0, used: 0 };

  const embed = new EmbedBuilder()
    .setTitle("📦 Member Stock")
    .setDescription(
      `**Available Members:** ${data.stock}\n` +
      `**Nitro Members:** ${data.nitro}\n` +
      `**Normal Members:** ${data.normal}\n` +
      `**Total Used:** ${data.used}`
    )
    .setColor(0x5865F2)
    .setTimestamp();

  await msg.reply({ embeds: [embed] });
}

// ===================== BUY =====================
async function handleBuy(msg: Message, args: string[]) {
  const amount = parseInt(args[0]);
  const serverId = args[1];

  if (!amount || !serverId) {
    return msg.reply(`❌ Usage: \`${PREFIX}buy <amount> <server_id>\``);
  }

  const priceResp = await fetch(`${config.apiUrl}/api/trpc/settings.getPrice`);
  const priceJson = await priceResp.json() as TRPCResponse<{ price: number }>;
  const pricePerMember = priceJson.result?.data?.price || 7;
  const totalPrice = amount * pricePerMember;

  const orderResp = await fetch(`${config.apiUrl}/api/trpc/orders.create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      buyerDiscordId: msg.author.id,
      buyerUsername: msg.author.username,
      serverId,
      amount,
      price: totalPrice,
    }),
  });
  const orderJson = await orderResp.json() as TRPCResponse<{ id: number }>;
  const order = orderJson.result?.data;

  if (!order) {
    return msg.reply("❌ Failed to create order. Please try again.");
  }

  const embed = new EmbedBuilder()
    .setTitle("🛒 Order Created")
    .setDescription(
      `**Order ID:** #${order.id}\n` +
      `**Members:** ${amount}\n` +
      `**Server ID:** ${serverId}\n` +
      `**Total Price:** ${totalPrice} credits\n\n` +
      `📌 **Next Steps:**\n` +
      `1. Pay **${totalPrice}** credits to the shop\n` +
      `2. Open a ticket with \`${PREFIX}ticket buy_members\`\n` +
      `3. Staff will process your order`
    )
    .setColor(0x57F287)
    .setTimestamp();

  await msg.reply({ embeds: [embed] });
}

// ===================== CHECK =====================
async function handleCheck(msg: Message, args: string[]) {
  const serverId = args[0];
  if (!serverId) return msg.reply(`❌ Usage: \`${PREFIX}check <server_id>\``);

  const resp = await fetch(`${config.apiUrl}/api/trpc/discord.checkServer?input=${encodeURIComponent(JSON.stringify({ serverId }))}`);
  const json = await resp.json() as TRPCResponse<{ success: boolean; name?: string; memberCount?: number; premiumTier?: number; icon?: string | null; error?: string; maxMembers?: number }>;
  const data = json.result?.data;

  if (!data?.success) {
    return msg.reply(`❌ ${data?.error || "Could not fetch server info."}`);
  }

  const embed = new EmbedBuilder()
    .setTitle(`🔍 ${data.name}`)
    .setDescription(
      `**Members:** ${data.memberCount}\n` +
      `**Boost Level:** ${data.premiumTier}\n` +
      `**Max Members:** ${data.maxMembers || "Unknown"}`
    )
    .setColor(0x5865F2)
    .setTimestamp();

  await msg.reply({ embeds: [embed] });
}

// ===================== JOIN (ADMIN) =====================
async function handleJoin(msg: Message, args: string[]) {
  const serverId = args[0];
  const amount = parseInt(args[1]);

  if (!serverId || !amount) {
    return msg.reply(`❌ Usage: \`${PREFIX}join <server_id> <amount>\``);
  }

  const processing = await msg.reply("⏳ Processing...");

  const resp = await fetch(`${config.apiUrl}/api/trpc/discord.join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ serverId, amount }),
  });
  const json = await resp.json() as TRPCResponse<{ success: number; failed: number }>;
  const result = json.result?.data || { success: 0, failed: 0 };

  const embed = new EmbedBuilder()
    .setTitle("✅ Members Added")
    .setDescription(
      `**Server:** ${serverId}\n` +
      `**Requested:** ${amount}\n` +
      `**Success:** ${result.success}\n` +
      `**Failed:** ${result.failed}`
    )
    .setColor(result.failed === 0 ? 0x57F287 : 0xFEE75C)
    .setTimestamp();

  await processing.edit({ content: "", embeds: [embed] });
}

// ===================== TICKET =====================
async function handleTicket(msg: Message, args: string[]) {
  const type = args[0];
  const validTypes = ["buy_members", "buy_coins", "support"];

  if (!type || !validTypes.includes(type)) {
    return msg.reply(`❌ Usage: \`${PREFIX}ticket <buy_members|buy_coins|support>\``);
  }

  const resp = await fetch(`${config.apiUrl}/api/trpc/tickets.create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userDiscordId: msg.author.id,
      userUsername: msg.author.username,
      type,
    }),
  });
  const json = await resp.json() as TRPCResponse<{ id: number }>;
  const ticket = json.result?.data;

  if (!ticket) {
    return msg.reply("❌ Failed to create ticket.");
  }

  const embed = new EmbedBuilder()
    .setTitle("🎫 Ticket Opened")
    .setDescription(
      `**Ticket ID:** #${ticket.id}\n` +
      `**Type:** ${type}\n` +
      `**User:** <@${msg.author.id}>\n\n` +
      `A staff member will assist you soon.`
    )
    .setColor(0xFEE75C)
    .setTimestamp();

  await msg.reply({ embeds: [embed] });
}

// ===================== MESSAGE HANDLER =====================
client.on("messageCreate", async (msg: Message) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(PREFIX)) return;

  const args = msg.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();

  try {
    switch (command) {
      case "help": await handleHelp(msg); break;
      case "stock": await handleStock(msg); break;
      case "buy": await handleBuy(msg, args); break;
      case "check": await handleCheck(msg, args); break;
      case "join": await handleJoin(msg, args); break;
      case "ticket": await handleTicket(msg, args); break;
    }
  } catch (err) {
    console.error(`[Command Error] ${command}:`, err);
    await msg.reply("❌ An error occurred.");
  }
});

// ===================== EVENTS =====================
client.once("ready", async () => {
  console.log(`🤖 Bot logged in as ${client.user?.tag}`);
  console.log(`✅ Prefix commands active with prefix: ${PREFIX}`);
});

client.on("guildMemberAdd", async (member: GuildMember) => {
  try {
    const msgResp = await fetch(`${config.apiUrl}/api/trpc/settings.getWelcomeMessage`);
    const msgJson = await msgResp.json() as TRPCResponse<{ message: string }>;
    const message = msgJson.result?.data?.message || "Welcome to the server! 🎉";

    const enabledResp = await fetch(`${config.apiUrl}/api/trpc/settings.getWelcomeEnabled`);
    const enabledJson = await enabledResp.json() as TRPCResponse<{ enabled: boolean }>;
    const enabled = enabledJson.result?.data?.enabled;

    if (!enabled) return;

    await sendWelcomeDM(member.id, message.replace(/{user}/g, `<@${member.id}>`).replace(/{server}/g, member.guild.name));
  } catch (err) {
    console.error("[Welcome DM] Error:", err);
  }
});

// ===================== START =====================
export async function startBot() {
  await client.login(config.discordToken);
}

export { client };

startBot().catch(console.error);
