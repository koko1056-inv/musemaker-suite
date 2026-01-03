import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { FlowCanvas } from "@/components/flow/FlowCanvas";
import { NodeEditor } from "@/components/flow/NodeEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Play,
  Upload,
  Code,
  Settings,
  Circle,
  Volume2,
} from "lucide-react";
import { NodeType } from "@/components/flow/FlowNode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const voices = [
  { id: "rachel", name: "Rachel", language: "English (US)", gender: "Female" },
  { id: "josh", name: "Josh", language: "English (US)", gender: "Male" },
  { id: "sarah", name: "Sarah", language: "English (UK)", gender: "Female" },
  { id: "adam", name: "Adam", language: "English (UK)", gender: "Male" },
  { id: "emily", name: "Emily", language: "English (AU)", gender: "Female" },
];

export default function AgentEditor() {
  const { id } = useParams();
  const isNew = id === "new";
  const [agentName, setAgentName] = useState(isNew ? "" : "Customer Support");
  const [selectedVoice, setSelectedVoice] = useState("rachel");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [selectedNode, setSelectedNode] = useState<{
    id: string;
    type: NodeType;
    title: string;
    description?: string;
  } | null>(null);

  const embedCode = `<script src="https://voiceforge.ai/embed.js"></script>
<voice-agent id="agent_${id || 'xxx'}" />`;

  const apiEndpoint = `https://api.voiceforge.ai/v1/agents/${id || 'xxx'}/call`;

  return (
    <AppLayout>
      <div className="flex h-screen flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border bg-background px-6 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/agents">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Input
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Agent Name"
              className="w-64 border-0 bg-transparent text-lg font-semibold focus-visible:ring-0"
            />
            <Badge
              variant={status === "published" ? "default" : "secondary"}
              className="gap-1"
            >
              <Circle
                className={`h-1.5 w-1.5 ${
                  status === "published"
                    ? "fill-primary-foreground"
                    : "fill-muted-foreground"
                }`}
              />
              {status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Play className="h-4 w-4" />
              Test
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Publish
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Publish Agent</DialogTitle>
                  <DialogDescription>
                    Make this agent available for production use.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Embed Code</Label>
                    <Textarea
                      readOnly
                      value={embedCode}
                      className="font-mono text-sm"
                      rows={3}
                    />
                    <Button variant="outline" size="sm" className="gap-2">
                      <Code className="h-4 w-4" />
                      Copy Code
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>API Endpoint</Label>
                    <Input readOnly value={apiEndpoint} className="font-mono text-sm" />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => setStatus("published")}
                  >
                    Publish Now
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Settings */}
          <div className="w-72 border-r border-border bg-card overflow-auto">
            <Tabs defaultValue="voice" className="h-full">
              <TabsList className="w-full rounded-none border-b border-border bg-transparent p-0">
                <TabsTrigger
                  value="voice"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Voice
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="voice" className="p-4 space-y-4 mt-0">
                <div className="space-y-2">
                  <Label>Select Voice</Label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div className="flex flex-col">
                            <span>{voice.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {voice.language} • {voice.gender}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="glass rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-foreground">Voice Preview</h4>
                  <p className="text-sm text-muted-foreground">
                    Listen to a sample of the selected voice
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2 flex-1">
                      <Volume2 className="h-4 w-4" />
                      Play Sample
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Speaking Style</Label>
                  <Select defaultValue="conversational">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conversational">Conversational</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="calm">Calm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Speaking Speed</Label>
                  <Select defaultValue="normal">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Slow</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="p-4 space-y-4 mt-0">
                <div className="space-y-2">
                  <Label>Agent Description</Label>
                  <Textarea
                    placeholder="Describe what this agent does..."
                    rows={3}
                    defaultValue="Handles customer inquiries and support tickets"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Welcome Timeout (seconds)</Label>
                  <Input type="number" defaultValue="5" />
                </div>

                <div className="space-y-2">
                  <Label>Max Call Duration (minutes)</Label>
                  <Input type="number" defaultValue="10" />
                </div>

                <div className="space-y-2">
                  <Label>Fallback Behavior</Label>
                  <Select defaultValue="transfer">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">Transfer to Human</SelectItem>
                      <SelectItem value="retry">Retry 3 Times</SelectItem>
                      <SelectItem value="end">End Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Center - Flow Canvas */}
          <div className="flex-1 bg-muted/30">
            <FlowCanvas onNodeSelect={setSelectedNode} />
          </div>

          {/* Right Panel - Node Editor */}
          {selectedNode && (
            <div className="w-80 border-l border-border bg-card animate-slide-in-right">
              <NodeEditor
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
              />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
