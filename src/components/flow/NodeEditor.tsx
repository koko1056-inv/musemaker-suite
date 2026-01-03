import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NodeType } from "./FlowNode";
import { Play, Trash2, X } from "lucide-react";

interface NodeEditorProps {
  node: {
    id: string;
    type: NodeType;
    title: string;
    description?: string;
  };
  onClose: () => void;
}

export function NodeEditor({ node, onClose }: NodeEditorProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-semibold text-foreground">Edit Node</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="node-title">Node Name</Label>
          <Input id="node-title" defaultValue={node.title} />
        </div>

        {node.type === "speak" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="speak-text">Message</Label>
              <Textarea
                id="speak-text"
                placeholder="Enter the message to speak..."
                rows={4}
                defaultValue="Hello! How can I help you today?"
              />
            </div>
            <div className="space-y-2">
              <Label>Voice</Label>
              <Select defaultValue="rachel">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rachel">Rachel</SelectItem>
                  <SelectItem value="josh">Josh</SelectItem>
                  <SelectItem value="sarah">Sarah</SelectItem>
                  <SelectItem value="adam">Adam</SelectItem>
                  <SelectItem value="emily">Emily</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="w-full gap-2">
              <Play className="h-4 w-4" />
              Preview Voice
            </Button>
          </>
        )}

        {node.type === "ask" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="ask-prompt">Question</Label>
              <Textarea
                id="ask-prompt"
                placeholder="What would you like to ask?"
                rows={3}
                defaultValue="What can I help you with today?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variable">Save Response To</Label>
              <Input id="variable" placeholder="user_intent" defaultValue="user_response" />
            </div>
            <div className="space-y-2">
              <Label>Expected Answers (optional)</Label>
              <Textarea
                placeholder="sales, support, billing, other"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of expected responses
              </p>
            </div>
          </>
        )}

        {node.type === "condition" && (
          <>
            <div className="space-y-2">
              <Label>Condition Variable</Label>
              <Input placeholder="user_intent" defaultValue="user_response" />
            </div>
            <div className="space-y-3">
              <Label>Branches</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Value" defaultValue="sales" className="flex-1" />
                  <Input placeholder="Go to" defaultValue="Sales Flow" className="flex-1" />
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Value" defaultValue="support" className="flex-1" />
                  <Input placeholder="Go to" defaultValue="Support Flow" className="flex-1" />
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Value" value="default" readOnly className="flex-1 opacity-50" />
                  <Input placeholder="Go to" defaultValue="General Flow" className="flex-1" />
                </div>
              </div>
              <Button variant="outline" size="sm">Add Branch</Button>
            </div>
          </>
        )}

        {node.type === "webhook" && (
          <>
            <div className="space-y-2">
              <Label>HTTP Method</Label>
              <Select defaultValue="post">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="get">GET</SelectItem>
                  <SelectItem value="post">POST</SelectItem>
                  <SelectItem value="put">PUT</SelectItem>
                  <SelectItem value="delete">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Endpoint URL</Label>
              <Input
                id="webhook-url"
                placeholder="https://api.example.com/webhook"
                defaultValue="https://api.example.com/lookup"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-body">Request Body (JSON)</Label>
              <Textarea
                id="webhook-body"
                placeholder='{"key": "value"}'
                rows={4}
                className="font-mono text-sm"
                defaultValue={'{\n  "phone": "{{caller_phone}}"\n}'}
              />
            </div>
            <div className="space-y-2">
              <Label>Save Response To</Label>
              <Input placeholder="api_response" defaultValue="customer_data" />
            </div>
          </>
        )}

        {node.type === "end" && (
          <div className="space-y-2">
            <Label htmlFor="end-message">Goodbye Message</Label>
            <Textarea
              id="end-message"
              placeholder="Thank you for calling!"
              rows={3}
              defaultValue="Thank you for calling. Goodbye!"
            />
          </div>
        )}
      </div>

      <div className="border-t border-border p-4 flex gap-2">
        <Button variant="destructive" size="sm" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
        <Button className="flex-1">Save Changes</Button>
      </div>
    </div>
  );
}
