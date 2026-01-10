export interface TranscriptMessage {
  role: 'agent' | 'user';
  text: string;
}

export interface ExtractedDataItem {
  field_key: string;
  field_value: string;
  field_name?: string;
}

export interface ConversationDisplay {
  id: string;
  phone: string;
  agent: string;
  agentId: string;
  duration: string;
  durationSeconds: number;
  status: 'completed' | 'failed' | 'in_progress';
  outcome: string;
  date: string;
  rawDate: Date;
  transcript: TranscriptMessage[];
  audioUrl: string | null;
  summary: string | null;
  keyPoints: string[];
  sentiment: string | null;
  actionItems: string[];
  iconName: string;
  iconColor: string;
  isRead: boolean;
  extractedData: ExtractedDataItem[];
}

export interface AgentConversations {
  agentId: string;
  agentName: string;
  conversations: ConversationDisplay[];
  lastConversation: ConversationDisplay;
  totalConversations: number;
  unreadCount: number;
  iconName: string;
  iconColor: string;
  customIconUrl?: string | null;
  phoneNumber?: string;
}

export interface PhoneNumberInfo {
  phone_number: string;
  phone_number_sid: string;
  label: string | null;
  agent_id: string | null;
}

export interface OutboundAgentInfo {
  agentId: string;
  agentName: string;
  calls: any[];
  lastCall: any;
  totalCalls: number;
  unreadCount: number;
  iconName: string;
  iconColor: string;
  customIconUrl?: string | null;
}
