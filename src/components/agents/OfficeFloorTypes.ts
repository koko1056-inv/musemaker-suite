export interface Agent {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "published";
  elevenlabs_agent_id: string | null;
  folder_id: string | null;
  icon_name?: string | null;
  icon_color?: string | null;
  custom_icon_url?: string | null;
}

export interface PhoneNumber {
  phone_number_sid: string;
  phone_number: string;
  label: string | null;
  agent_id: string | null;
}

export interface AgentFolder {
  id: string;
  name: string;
  color: string;
}

export function getAgentColor(id: string): string {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}
