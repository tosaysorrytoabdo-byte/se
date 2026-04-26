import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router";
import { useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, Users, ShoppingCart, Ticket, Settings, Link, MessageSquare, UserPlus, UserX, Trash2 } from "lucide-react";

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-zinc-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const isAdmin = user.role === "admin";
  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-lg">
              R
            </div>
            <div>
              <h1 className="text-xl font-bold">Revel Members Bot</h1>
              <p className="text-zinc-400 text-sm">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-zinc-400">
              Logged in as <span className="text-white font-medium">{user.name}</span>
            </div>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-800">
              Overview
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-zinc-800">
              Orders
            </TabsTrigger>
            <TabsTrigger value="tickets" className="data-[state=active]:bg-zinc-800">
              Tickets
            </TabsTrigger>
            <TabsTrigger value="members" className="data-[state=active]:bg-zinc-800">
              Members Stock
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-zinc-800">
              Settings
            </TabsTrigger>
            <TabsTrigger value="controllers" className="data-[state=active]:bg-zinc-800">
              Controllers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="orders">
            <OrdersTab />
          </TabsContent>
          <TabsContent value="tickets">
            <TicketsTab />
          </TabsContent>
          <TabsContent value="members">
            <MembersTab />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
          <TabsContent value="controllers">
            <ControllersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function OverviewTab() {
  const stats = trpc.discord.stats.useQuery(undefined, { refetchInterval: 30000 });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Active Members" value={stats.data?.activeMembers ?? "--"} icon={Users} color="bg-blue-600" />
        <StatCard title="Total Members" value={stats.data?.totalMembers ?? "--"} icon={Users} color="bg-indigo-600" />
        <StatCard title="Total Orders" value={stats.data?.totalOrders ?? "--"} icon={ShoppingCart} color="bg-green-600" />
        <StatCard title="Open Tickets" value={stats.data?.openTickets ?? "--"} icon={Ticket} color="bg-yellow-600" />
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            OAuth2 Invite Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OAuth2LinkSection />
        </CardContent>
      </Card>
    </div>
  );
}

function OAuth2LinkSection() {
  const [link, setLink] = useState("");
  const authUrl = trpc.discord.authUrl.useQuery();

  useEffect(() => {
    if (authUrl.data?.url) {
      setLink(authUrl.data.url);
    }
  }, [authUrl.data]);

  return (
    <div className="space-y-3">
      <p className="text-zinc-400 text-sm">
        Share this link with users. When they authorize, their account becomes part of the member stock.
      </p>
      <div className="flex gap-2">
        <Input
          value={link}
          readOnly
          className="bg-zinc-800 border-zinc-700 text-zinc-300 font-mono text-sm"
        />
        <Button
          onClick={() => {
            navigator.clipboard.writeText(link);
            toast.success("Link copied to clipboard!");
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Copy
        </Button>
      </div>
      <p className="text-zinc-500 text-xs">
        Scopes: identify, email, guilds, guilds.join
      </p>
    </div>
  );
}

function OrdersTab() {
  const orders = trpc.orders.recentOrders.useQuery();
  const utils = trpc.useUtils();
  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      utils.orders.recentOrders.invalidate();
      toast.success("Order updated!");
    },
  });
  const deleteOrder = trpc.orders.deleteOrder.useMutation({
    onSuccess: () => {
      utils.orders.recentOrders.invalidate();
      toast.success("Order deleted!");
    },
  });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-600/20 text-yellow-400 border-yellow-600/50",
    processing: "bg-blue-600/20 text-blue-400 border-blue-600/50",
    completed: "bg-green-600/20 text-green-400 border-green-600/50",
    failed: "bg-red-600/20 text-red-400 border-red-600/50",
    cancelled: "bg-zinc-600/20 text-zinc-400 border-zinc-600/50",
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Recent Orders
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orders.data && orders.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="text-left py-3 px-2">ID</th>
                  <th className="text-left py-3 px-2">Buyer</th>
                  <th className="text-left py-3 px-2">Server</th>
                  <th className="text-left py-3 px-2">Amount</th>
                  <th className="text-left py-3 px-2">Price</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.data.map((order: any) => (
                  <tr key={order.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-3 px-2 font-mono">#{order.id}</td>
                    <td className="py-3 px-2">{order.buyerUsername || order.buyerDiscordId}</td>
                    <td className="py-3 px-2 font-mono text-xs">{order.serverId}</td>
                    <td className="py-3 px-2">{order.amount}</td>
                    <td className="py-3 px-2">{order.price}</td>
                    <td className="py-3 px-2">
                      <Badge variant="outline" className={statusColors[order.status] || ""}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-1">
                        <Select
                          onValueChange={(val) => updateStatus.mutate({ orderId: order.id, status: val as any })}
                        >
                          <SelectTrigger className="w-24 h-7 text-xs bg-zinc-800 border-zinc-700">
                            <SelectValue placeholder="Set" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                          onClick={() => deleteOrder.mutate({ orderId: order.id })}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-zinc-500 text-center py-8">No orders yet</p>
        )}
      </CardContent>
    </Card>
  );
}

function TicketsTab() {
  const tickets = trpc.tickets.allTickets.useQuery();
  const utils = trpc.useUtils();
  const updateStatus = trpc.tickets.updateStatus.useMutation({
    onSuccess: () => {
      utils.tickets.allTickets.invalidate();
      toast.success("Ticket updated!");
    },
  });

  const statusColors: Record<string, string> = {
    open: "bg-yellow-600/20 text-yellow-400 border-yellow-600/50",
    in_progress: "bg-blue-600/20 text-blue-400 border-blue-600/50",
    closed: "bg-zinc-600/20 text-zinc-400 border-zinc-600/50",
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          All Tickets
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tickets.data && tickets.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="text-left py-3 px-2">ID</th>
                  <th className="text-left py-3 px-2">User</th>
                  <th className="text-left py-3 px-2">Type</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Created</th>
                  <th className="text-left py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.data.map((ticket: any) => (
                  <tr key={ticket.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-3 px-2 font-mono">#{ticket.id}</td>
                    <td className="py-3 px-2">{ticket.userUsername || ticket.userDiscordId}</td>
                    <td className="py-3 px-2">{ticket.type}</td>
                    <td className="py-3 px-2">
                      <Badge variant="outline" className={statusColors[ticket.status] || ""}>
                        {ticket.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-zinc-400">
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-3 px-2">
                      <Select
                        onValueChange={(val) => updateStatus.mutate({ ticketId: ticket.id, status: val as any })}
                      >
                        <SelectTrigger className="w-24 h-7 text-xs bg-zinc-800 border-zinc-700">
                          <SelectValue placeholder="Set" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-zinc-500 text-center py-8">No tickets yet</p>
        )}
      </CardContent>
    </Card>
  );
}

function MembersTab() {
  const members = trpc.discord.users.useQuery();
  const utils = trpc.useUtils();
  const deleteUser = trpc.discord.deleteUser.useMutation({
    onSuccess: () => {
      utils.discord.users.invalidate();
      toast.success("User removed from stock!");
    },
  });

  const statusColors: Record<string, string> = {
    active: "bg-green-600/20 text-green-400 border-green-600/50",
    expired: "bg-red-600/20 text-red-400 border-red-600/50",
    used: "bg-blue-600/20 text-blue-400 border-blue-600/50",
    banned: "bg-zinc-600/20 text-zinc-400 border-zinc-600/50",
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Member Stock (Discord OAuth Users)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {members.data && members.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="text-left py-3 px-2">ID</th>
                  <th className="text-left py-3 px-2">Discord ID</th>
                  <th className="text-left py-3 px-2">Username</th>
                  <th className="text-left py-3 px-2">Nitro</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Joins</th>
                  <th className="text-left py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.data.map((user: any) => (
                  <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-3 px-2 font-mono">{user.id}</td>
                    <td className="py-3 px-2 font-mono text-xs">{user.discordId}</td>
                    <td className="py-3 px-2">{user.username}</td>
                    <td className="py-3 px-2">
                      {user.nitro === "yes" ? (
                        <span className="text-purple-400 font-medium">Nitro</span>
                      ) : (
                        <span className="text-zinc-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant="outline" className={statusColors[user.status] || ""}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">{user.totalJoins || 0}</td>
                    <td className="py-3 px-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                        onClick={() => deleteUser.mutate({ id: user.id })}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-zinc-500 text-center py-8">
            No members in stock. Share the OAuth2 link to start collecting!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SettingsTab() {
  const utils = trpc.useUtils();
  
  const welcomeMsg = trpc.settings.getWelcomeMessage.useQuery();
  const welcomeEnabled = trpc.settings.getWelcomeEnabled.useQuery();
  const price = trpc.settings.getPrice.useQuery();

  const setWelcomeMsg = trpc.settings.setWelcomeMessage.useMutation({
    onSuccess: () => {
      utils.settings.getWelcomeMessage.invalidate();
      toast.success("Welcome message saved!");
    },
  });
  const setWelcomeEnabled = trpc.settings.setWelcomeEnabled.useMutation({
    onSuccess: () => {
      utils.settings.getWelcomeEnabled.invalidate();
      toast.success("Welcome DM setting updated!");
    },
  });
  const setPrice = trpc.settings.setPrice.useMutation({
    onSuccess: () => {
      utils.settings.getPrice.invalidate();
      toast.success("Price updated!");
    },
  });

  const [message, setMessage] = useState("");
  const [newPrice, setNewPrice] = useState("");

  useEffect(() => {
    if (welcomeMsg.data?.message) setMessage(welcomeMsg.data.message);
  }, [welcomeMsg.data]);

  useEffect(() => {
    if (price.data?.price) setNewPrice(String(price.data.price));
  }, [price.data]);

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Welcome DM Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-zinc-400">Enable welcome DMs:</span>
            <Button
              size="sm"
              variant={welcomeEnabled.data?.enabled ? "default" : "outline"}
              onClick={() => setWelcomeEnabled.mutate({ enabled: !welcomeEnabled.data?.enabled })}
            >
              {welcomeEnabled.data?.enabled ? "Enabled" : "Disabled"}
            </Button>
          </div>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter welcome message... Use {user} for user mention and {server} for server name"
            className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
          />
          <Button
            onClick={() => setWelcomeMsg.mutate({ message })}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Save Welcome Message
          </Button>
          <p className="text-zinc-500 text-xs">
            Variables: {"{user}"} = user mention, {"{server}"} = server name
          </p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-zinc-400">Price per member (coins/credits):</span>
            <Input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-24 bg-zinc-800 border-zinc-700"
            />
            <Button
              onClick={() => setPrice.mutate({ price: parseInt(newPrice) || 7 })}
              className="bg-green-600 hover:bg-green-700"
            >
              Update Price
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ControllersTab() {
  const controllers = trpc.controllers.list.useQuery();
  const utils = trpc.useUtils();
  const addController = trpc.controllers.add.useMutation({
    onSuccess: () => {
      utils.controllers.list.invalidate();
      toast.success("Controller added!");
    },
  });
  const removeController = trpc.controllers.remove.useMutation({
    onSuccess: () => {
      utils.controllers.list.invalidate();
      toast.success("Controller removed!");
    },
  });

  const [newDiscordId, setNewDiscordId] = useState("");
  const [newUsername, setNewUsername] = useState("");

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Bot Controllers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-zinc-400 text-sm">
            Only these Discord users can use admin commands on the bot. Add trusted staff members here.
          </p>
          
          <div className="flex gap-3">
            <Input
              placeholder="Discord ID (e.g. 1464058168496881724)"
              value={newDiscordId}
              onChange={(e) => setNewDiscordId(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
            />
            <Input
              placeholder="Username (optional)"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="bg-zinc-800 border-zinc-700 w-48"
            />
            <Button
              onClick={() => {
                addController.mutate({ discordId: newDiscordId, username: newUsername });
                setNewDiscordId("");
                setNewUsername("");
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Authorized Controllers</CardTitle>
        </CardHeader>
        <CardContent>
          {controllers.data && controllers.data.length > 0 ? (
            <div className="space-y-2">
              {controllers.data.map((controller: any) => (
                <div
                  key={controller.id}
                  className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">{controller.username || controller.discordId}</p>
                      <p className="text-zinc-500 text-xs font-mono">{controller.discordId}</p>
                      {controller.isOwner && (
                        <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/50 mt-1">
                          Owner
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!controller.isOwner && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => removeController.mutate({ id: controller.id })}
                    >
                      <UserX className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-8">
              No controllers added yet. Only the default owner can access admin features.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
