import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, ShoppingCart, MessageSquare, Settings, Ticket } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 border border-blue-600/30 text-blue-400 text-sm mb-6">
          <Shield className="w-4 h-4" />
          Discord OAuth2 Member System v1.0
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Revel Members Bot
        </h1>
        <p className="text-zinc-400 text-xl max-w-2xl mx-auto mb-10">
          Your own member-selling bot. Users authorize via OAuth2, you collect tokens, 
          buyers pay credits, and the bot joins members to their server automatically.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8">
              <Shield className="w-5 h-5 mr-2" />
              Admin Dashboard
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="outline" className="border-zinc-700 hover:bg-zinc-800 px-8">
              <Settings className="w-5 h-5 mr-2" />
              Bot Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">OAuth2 Member Capture</h3>
              <p className="text-zinc-400 text-sm">
                Share your OAuth2 link. Users authorize and their tokens are stored in your database as member stock.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4">
                <ShoppingCart className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Buy Members System</h3>
              <p className="text-zinc-400 text-sm">
                Buyers run /buy command, pay credits via ProBot, open a ticket. You verify and process the order.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Welcome DM Messages</h3>
              <p className="text-zinc-400 text-sm">
                Custom welcome message sent to every new member who joins. Configurable from the admin dashboard.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center mb-4">
                <Ticket className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ticket System</h3>
              <p className="text-zinc-400 text-sm">
                Built-in ticket system for buyers. Open tickets for buying members, coins, or general support.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-pink-600/20 rounded-lg flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Full Admin Dashboard</h3>
              <p className="text-zinc-400 text-sm">
                Web dashboard with stats, orders, tickets, member stock management, pricing, and access control.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Access Control</h3>
              <p className="text-zinc-400 text-sm">
                Only you and people you add can use admin commands. Full control over who manages the bot.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Commands */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Available Commands</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="grid grid-cols-3 gap-4 p-4 border-b border-zinc-800 text-zinc-400 text-sm font-medium">
            <div>Command</div>
            <div>Description</div>
            <div>Permission</div>
          </div>
          {[
            { cmd: "/help", desc: "Show all commands", perm: "Everyone" },
            { cmd: "/stock", desc: "View member stock", perm: "Everyone" },
            { cmd: "/buy <amount> <server_id>", desc: "Buy members", perm: "Everyone" },
            { cmd: "/check <server_id>", desc: "Check server info", perm: "Everyone" },
            { cmd: "/ticket <type>", desc: "Open support ticket", perm: "Everyone" },
            { cmd: "/join <server_id> <amount>", desc: "Force-join members", perm: "Admin Only" },
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-3 gap-4 p-4 border-b border-zinc-800/50 hover:bg-zinc-800/30">
              <div className="font-mono text-blue-400 text-sm">{row.cmd}</div>
              <div className="text-zinc-300 text-sm">{row.desc}</div>
              <div className={`text-sm ${row.perm === "Admin Only" ? "text-red-400" : "text-green-400"}`}>
                {row.perm}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 mt-12 py-8 text-center text-zinc-500 text-sm">
        <p>Built by 42rqu_ — Discord: 1464058168496881724</p>
        <p className="mt-1">Revel Members Bot v1.0</p>
      </div>
    </div>
  );
}
