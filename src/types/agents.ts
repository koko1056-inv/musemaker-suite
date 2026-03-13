import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Base database types
export type Agent = Tables<'agents'>;
export type AgentInsert = TablesInsert<'agents'>;
export type AgentUpdate = TablesUpdate<'agents'>;

// Extended agent fields not in generated types (stored in DB but missing from codegen)
export interface AgentExtendedFields {
  system_prompt?: string;
  first_message?: string;
  vad_mode?: string;
  vad_threshold?: number;
  vad_silence_duration_ms?: number;
  vad_prefix_padding_ms?: number;
  icon_name?: string;
  icon_color?: string;
  custom_icon_url?: string;
  extraction_fields?: ExtractionField[];
}

export type AgentWithExtended = Agent & AgentExtendedFields;

export interface ExtractionField {
  name: string;
  type: string;
  description?: string;
}

export interface PhoneNumber {
  id: string;
  phone_number: string;
  display_name: string | null;
  agent_id: string | null;
  workspace_id: string;
  is_active: boolean;
}

export interface AgentFolder {
  id: string;
  name: string;
  workspace_id: string;
  created_at: string;
}

// ElevenLabs agent config for API sync
export interface ElevenLabsAgentConfig {
  name: string;
  description?: string;
  voice_id: string;
  system_prompt?: string;
  first_message?: string;
  vad_mode?: string;
  vad_threshold?: number;
  vad_silence_duration_ms?: number;
  vad_prefix_padding_ms?: number;
}

// Agent color utility
export function getAgentColor(index: number): string {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
    'bg-pink-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-red-500',
    'bg-indigo-500', 'bg-teal-500', 'bg-emerald-500', 'bg-violet-500',
  ];
  return colors[index % colors.length];
}
