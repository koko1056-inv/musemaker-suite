import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Building,
  Key,
  Bell,
  Shield,
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiKeySaved, setApiKeySaved] = useState(false);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      setApiKeySaved(true);
      // In production, this would save to the backend
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your workspace preferences and integrations
          </p>
        </div>

        <Tabs defaultValue="workspace" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="workspace" className="gap-2">
              <Building className="h-4 w-4" />
              Workspace
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Key className="h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
          </TabsList>

          {/* Workspace Tab */}
          <TabsContent value="workspace" className="space-y-6">
            <div className="glass rounded-xl card-shadow p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-4">Workspace Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="workspace-name">Workspace Name</Label>
                    <Input id="workspace-name" defaultValue="Acme Corp" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workspace-slug">Workspace URL</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                        voiceforge.ai/
                      </span>
                      <Input
                        id="workspace-slug"
                        defaultValue="acme-corp"
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <Button>Save Changes</Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="glass rounded-xl card-shadow p-6 border-destructive/50">
              <h3 className="font-semibold text-destructive mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your workspace and all associated data.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Workspace</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      workspace, all agents, conversations, and data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            {/* ElevenLabs */}
            <div className="glass rounded-xl card-shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">XI</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">ElevenLabs</h3>
                    <p className="text-sm text-muted-foreground">
                      Voice synthesis and speech-to-text
                    </p>
                  </div>
                </div>
                {apiKeySaved ? (
                  <Badge className="bg-success/10 text-success gap-1">
                    <Check className="h-3 w-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline">Not Connected</Badge>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="elevenlabs-key">API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="elevenlabs-key"
                        type={apiKeyVisible ? "text" : "password"}
                        placeholder="Enter your ElevenLabs API key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setApiKeyVisible(!apiKeyVisible)}
                      >
                        {apiKeyVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button onClick={handleSaveApiKey}>Save</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your API key is encrypted and stored securely on our servers.
                  </p>
                </div>

                <Button variant="outline" className="gap-2" asChild>
                  <a href="https://elevenlabs.io/api" target="_blank" rel="noopener noreferrer">
                    Get API Key
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Webhooks */}
            <div className="glass rounded-xl card-shadow p-6">
              <h3 className="font-semibold text-foreground mb-4">Webhooks</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Receive real-time notifications when events occur in your workspace.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://your-server.com/webhook"
                  />
                </div>
                <Button>Add Webhook</Button>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="glass rounded-xl card-shadow p-6">
              <h3 className="font-semibold text-foreground mb-6">Email Notifications</h3>
              <div className="space-y-4">
                {[
                  { id: "new-conversation", label: "New conversations", description: "Get notified when a new conversation starts" },
                  { id: "failed-calls", label: "Failed calls", description: "Get alerted when a call fails or transfers" },
                  { id: "weekly-report", label: "Weekly analytics report", description: "Receive a summary of your agent performance" },
                  { id: "team-updates", label: "Team updates", description: "When members join or leave the workspace" },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch defaultChecked={item.id !== "team-updates"} />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="glass rounded-xl card-shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-foreground">Current Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    You are currently on the Pro plan
                  </p>
                </div>
                <Badge className="bg-primary/10 text-primary text-lg px-4 py-1">Pro</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-foreground">10,000</p>
                  <p className="text-sm text-muted-foreground">API calls / month</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-foreground">5</p>
                  <p className="text-sm text-muted-foreground">Team members</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-foreground">Unlimited</p>
                  <p className="text-sm text-muted-foreground">Agents</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button>Upgrade Plan</Button>
                <Button variant="outline">Manage Billing</Button>
              </div>
            </div>

            {/* Usage */}
            <div className="glass rounded-xl card-shadow p-6">
              <h3 className="font-semibold text-foreground mb-4">This Month's Usage</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">API Calls</span>
                    <span className="font-medium text-foreground">6,234 / 10,000</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: "62.34%" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Voice Minutes</span>
                    <span className="font-medium text-foreground">1,450 / 5,000</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: "29%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
