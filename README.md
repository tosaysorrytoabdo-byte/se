# Revel Members Bot v1.0

A complete **Discord OAuth2 Member System** — your own member-selling bot similar to Revel Stock. Users authorize via OAuth2, their tokens are stored securely, and when someone buys members, the bot uses those tokens to join them to the buyer's server.

---

## Features

| Feature | Description |
|---------|-------------|
| **OAuth2 Capture** | Users click your OAuth2 link, authorize, and their token is saved to your database |
| **Member Stock** | View active/used/expired members in your admin dashboard |
| **Buy Members** | `/buy <amount> <server_id>` — creates an order for the buyer |
| **Auto Join** | `/join <server_id> <amount>` — admin command to join stored members to any server |
| **Tickets** | `/ticket <type>` — buyers open tickets to pay with ProBot credits |
| **Welcome DM** | Custom welcome message sent to every new member who joins (configurable from dashboard) |
| **Price Control** | Set price per member from dashboard (default: 7 credits) |
| **Bot Controllers** | Only you (and people you add) can use admin commands |
| **Server Check** | `/check <server_id>` — inspect any server's member count & boost level |
| **Admin Dashboard** | Full web dashboard with stats, orders, tickets, settings |

---

## Screenshots (What You Get)

```
Dashboard Tabs:
├── Overview      → Stock stats + OAuth2 invite link
├── Orders        → View/manage all member purchase orders
├── Tickets       → Handle buyer support tickets
├── Members Stock → Full list of OAuth users with status
├── Settings      → Welcome DM message + Price per member
└── Controllers   → Manage who can use admin commands
```

---

## Prerequisites

| Requirement | Where to Get |
|-------------|--------------|
| Node.js 20+ | https://nodejs.org |
| Discord Bot Token | https://discord.com/developers/applications |
| Discord App (OAuth2) | Same developer portal |
| MySQL Database | Included free with this project |

---

## Step 1: Create Discord Application

Go to **[Discord Developer Portal](https://discord.com/developers/applications)** and create a new application.

### Bot Tab
1. Click **"Add Bot"**
2. Enable **SERVER MEMBERS INTENT** (scroll down, toggle on)
3. Copy **Token** → save for `.env`
4. Copy **Application ID** → save for `.env`

### OAuth2 Tab
1. Go to **OAuth2 → General**
2. Add redirect URI:
   ```
   http://localhost:3000/api/discord/oauth/callback
   ```
   (Replace `localhost` with your domain when deploying)
3. Go to **OAuth2 → URL Generator**
4. Select scopes:
   - ☑️ `identify`
   - ☑️ `email`
   - ☑️ `guilds`
   - ☑️ `guilds.join`
5. Copy the generated URL — this is your **OAuth2 capture link** (share this to collect members)

### OAuth2 (Client Secret)
1. Go to **OAuth2 → General**
2. Click **Reset Secret**
3. Copy **Client Secret** → save for `.env`

---

## Step 2: Invite Bot to Your Server

Use this invite URL (replace `YOUR_CLIENT_ID`):

```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot+applications.commands&permissions=268435520
```

Permissions needed:
- Send Messages
- Embed Links
- Use Slash Commands
- Manage Server (to add members)

---

## Step 3: Configure Environment

Edit `.env` file in the project root:

```env
# Kimi OAuth (for Dashboard login)
APP_ID=your_kimi_app_id
APP_SECRET=your_kimi_app_secret
VITE_APP_ID=your_kimi_app_id
VITE_KIMI_AUTH_URL=https://auth.kimi.com

# Database (already provided by this project)
DATABASE_URL=mysql://user:pass@host:port/database
KIMI_AUTH_URL=https://auth.kimi.com
KIMI_OPEN_URL=https://open.kimi.com
OWNER_UNION_ID=d70r9see8aihl9k212d0

# Discord Bot (fill these from Step 1)
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_application_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_REDIRECT_URI=http://localhost:3000/api/discord/oauth/callback

# Backend URL
API_URL=http://localhost:3000
```

---

## Step 4: Database Setup

Run this to sync tables:

```bash
cd /mnt/agents/output/app
npm install
npm run db:push
```

If you get a prompt error, run with:
```bash
npx drizzle-kit push --force
```

---

## Step 5: Set Yourself as Owner

In the database, run this SQL (or use the Dashboard after first login):

```sql
INSERT INTO bot_controllers (discord_id, username, is_owner) 
VALUES ('1464058168496881724', '42rqu_', true);
```

Or use the Dashboard → Controllers tab → Add your Discord ID.

---

## Step 6: Run the Bot

### Development Mode (2 terminals needed)

**Terminal 1 — Backend + Frontend:**
```bash
cd /mnt/agents/output/app
npm run dev
```
Opens at `http://localhost:3000`

**Terminal 2 — Discord Bot:**
```bash
cd /mnt/agents/output/app
npm run bot
```

### Production Mode

```bash
cd /mnt/agents/output/app
npm run build
npm start        # Starts Hono server
npm run bot      # Starts Discord bot (separate terminal)
```

---

## All Slash Commands

| Command | Usage | Who Can Use |
|---------|-------|-------------|
| `/help` | Show all commands | Everyone |
| `/stock` | View member stock count | Everyone |
| `/buy <amount> <server_id>` | Create an order to buy members | Everyone |
| `/check <server_id>` | Inspect a server's info | Everyone |
| `/ticket <type>` | Open a support ticket | Everyone |
| `/join <server_id> <amount>` | Force-join members to server | Admin only |

---

## How the System Works

```
1. You share OAuth2 link → Users click and authorize
2. Their access_token is stored in your database (member stock)
3. Buyer runs /buy 50 1234567890 → Order created
4. Buyer pays via ProBot credits → Opens ticket
5. You verify payment in Dashboard
6. You run /join 1234567890 50 or process via Dashboard
7. Bot uses stored tokens to join users to buyer's server
8. Welcome DM sent to new joins (if enabled)
```

---

## 24/7 Hosting Guide

To keep your bot running 24/7, you need a **VPS** or **hosting service**.

### Option 1: VPS (Recommended)

**Providers:** Contabo, Vultr, Hetzner, DigitalOcean

**Setup:**
```bash
# 1. Buy a Ubuntu 22.04 VPS
# 2. SSH into it
ssh root@your-vps-ip

# 3. Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install PM2 (process manager)
sudo npm install -g pm2

# 5. Upload your project (via SCP or git clone)
# 6. Install dependencies
cd revel-members-bot
npm install
npm run build
npm run db:push

# 7. Start with PM2
pm2 start dist/boot.js --name "revel-api"
pm2 start "npx tsx bot/index.ts" --name "revel-bot"

# 8. Save PM2 config
pm2 save
pm2 startup

# 9. Monitor
pm2 status
pm2 logs revel-bot
```

### Option 2: Railway / Render (Free Tier)

**Railway:**
1. Connect your GitHub repo to Railway
2. Add environment variables in Railway dashboard
3. Set start command: `npm start`
4. Add a separate service for the bot: `npm run bot`

**Render:**
1. Create Web Service for API: `npm start`
2. Create Background Worker for Bot: `npm run bot`

### Option 3: Replit (Free but sleeps)

1. Import project to Replit
2. Add secrets (environment variables)
3. Use UptimeRobot to ping your Replit URL every 5 minutes to keep it awake

---

## Dashboard Access

1. Go to `http://localhost:3000/dashboard` (or your deployed URL)
2. Login with Kimi OAuth
3. You become admin automatically (OWNER_UNION_ID in .env)
4. Add your Discord ID in Controllers tab
5. Start managing!

---

## File Structure

```
revel-members-bot/
├── api/
│   ├── router.ts              # tRPC router registry
│   ├── discord-router.ts      # Discord API (stock, join, check)
│   ├── discord-auth.ts        # OAuth2 callback handler
│   ├── orders-router.ts       # Order management
│   ├── tickets-router.ts      # Ticket system
│   ├── settings-router.ts     # Welcome message & pricing
│   ├── controllers-router.ts  # Bot access control
│   └── boot.ts                # Hono server entry
├── bot/
│   ├── index.ts               # Discord bot + slash commands
│   ├── config.ts              # Bot configuration
│   └── utils/
│       └── joiner.ts          # Server join logic + welcome DM
├── db/
│   └── schema.ts              # Database tables
├── src/
│   ├── pages/
│   │   └── Dashboard.tsx      # Admin dashboard
│   └── App.tsx                # React routes
├── dist/                      # Production build
└── .env                       # Environment variables
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Bot won't start | Check `DISCORD_BOT_TOKEN` is correct |
| Commands don't appear | Wait up to 1 hour for global commands, or re-invite bot |
| OAuth2 fails | Verify redirect URI matches EXACTLY in Discord app settings |
| Members not joining | Bot must have `Manage Server` permission in target server |
| "No active members" | Share OAuth2 link to collect member tokens first |
| Database error | Check `DATABASE_URL` format and credentials |
| Welcome DM not sending | Enable in Dashboard → Settings, check bot has permission |

---

## Security Notes

- OAuth2 tokens are stored in your MySQL database
- Only the bot owner (and added controllers) can use admin commands
- Dashboard requires Kimi OAuth login
- Use HTTPS in production (set `DISCORD_REDIRECT_URI` to HTTPS URL)

---

## License

MIT — Use at your own risk. This tool is for legitimate purposes only.

---

**Built by:** 42rqu_ (Discord: 1464058168496881724)
