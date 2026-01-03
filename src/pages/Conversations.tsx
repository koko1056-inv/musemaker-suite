import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  Play,
} from "lucide-react";

const conversations = [
  {
    id: "1",
    phone: "+1 (555) 123-4567",
    agent: "Customer Support",
    duration: "3:45",
    status: "completed",
    outcome: "Resolved",
    date: "2024-01-20 14:32",
    transcript: [
      { role: "agent", text: "Hello! Thank you for calling Acme Corp. How can I help you today?" },
      { role: "user", text: "Hi, I need to check on my order status." },
      { role: "agent", text: "Of course! Can you please provide your order number?" },
      { role: "user", text: "It's order 12345." },
      { role: "agent", text: "Thank you. I can see your order is currently being processed and will ship within 2 business days." },
      { role: "user", text: "Great, thank you!" },
      { role: "agent", text: "You're welcome! Is there anything else I can help you with?" },
      { role: "user", text: "No, that's all. Thanks!" },
      { role: "agent", text: "Thank you for calling. Have a great day!" },
    ],
  },
  {
    id: "2",
    phone: "+1 (555) 987-6543",
    agent: "Sales Assistant",
    duration: "5:12",
    status: "completed",
    outcome: "Demo Scheduled",
    date: "2024-01-20 13:15",
    transcript: [
      { role: "agent", text: "Hello! Thanks for your interest in our product. How can I help?" },
      { role: "user", text: "I'd like to schedule a demo." },
      { role: "agent", text: "I'll connect you with our sales team." },
    ],
  },
  {
    id: "3",
    phone: "+1 (555) 456-7890",
    agent: "Booking Agent",
    duration: "2:30",
    status: "completed",
    outcome: "Appointment Booked",
    date: "2024-01-20 11:45",
    transcript: [],
  },
  {
    id: "4",
    phone: "+1 (555) 321-0987",
    agent: "Customer Support",
    duration: "1:15",
    status: "failed",
    outcome: "Transferred",
    date: "2024-01-20 10:20",
    transcript: [],
  },
  {
    id: "5",
    phone: "+1 (555) 654-3210",
    agent: "FAQ Helper",
    duration: "4:00",
    status: "completed",
    outcome: "Resolved",
    date: "2024-01-20 09:55",
    transcript: [],
  },
];

export default function Conversations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<typeof conversations[0] | null>(null);

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.phone.includes(searchQuery) ||
      conv.agent.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Conversations</h1>
          <p className="mt-1 text-muted-foreground">
            View and analyze all voice agent conversations
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by phone or agent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Table */}
        <div className="glass rounded-xl card-shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead>Phone</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConversations.map((conv, index) => (
                <TableRow
                  key={conv.id}
                  className="border-border/50 animate-fade-in cursor-pointer hover:bg-accent/50"
                  style={{ animationDelay: `${index * 30}ms` }}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{conv.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>{conv.agent}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {conv.duration}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={conv.status === "completed" ? "default" : "destructive"}
                      className="gap-1"
                    >
                      {conv.status === "completed" ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {conv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{conv.outcome}</TableCell>
                  <TableCell className="text-muted-foreground">{conv.date}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedConversation(conv);
                      }}
                    >
                      <Play className="h-4 w-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Conversation Detail Dialog */}
        <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                {selectedConversation?.phone}
              </DialogTitle>
            </DialogHeader>
            
            {selectedConversation && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Agent</p>
                    <p className="font-medium">{selectedConversation.agent}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-medium">{selectedConversation.duration}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Outcome</p>
                    <p className="font-medium">{selectedConversation.outcome}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">{selectedConversation.date}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="font-medium mb-4">Transcript</h4>
                  <div className="space-y-3">
                    {selectedConversation.transcript.length > 0 ? (
                      selectedConversation.transcript.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${msg.role === "agent" ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              msg.role === "agent"
                                ? "bg-primary/10 text-foreground"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {msg.role === "agent" ? "Agent" : "Caller"}
                            </p>
                            <p className="text-sm">{msg.text}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No transcript available
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
