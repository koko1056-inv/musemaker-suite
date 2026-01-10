export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_extraction_fields: {
        Row: {
          agent_id: string
          created_at: string
          description: string | null
          field_key: string
          field_name: string
          field_type: string
          id: string
          is_required: boolean | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          description?: string | null
          field_key: string
          field_name: string
          field_type?: string
          id?: string
          is_required?: boolean | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          description?: string | null
          field_key?: string
          field_name?: string
          field_type?: string
          id?: string
          is_required?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_extraction_fields_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_folders: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_folders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_knowledge_bases: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          knowledge_base_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          knowledge_base_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          knowledge_base_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_knowledge_bases_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_knowledge_bases_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          created_at: string
          created_by: string | null
          custom_icon_url: string | null
          description: string | null
          elevenlabs_agent_id: string | null
          fallback_behavior: string | null
          folder_id: string | null
          icon_color: string | null
          icon_name: string | null
          id: string
          max_call_duration: number | null
          name: string
          status: Database["public"]["Enums"]["agent_status"]
          system_prompt: string | null
          updated_at: string
          vad_mode: string | null
          vad_prefix_padding_ms: number | null
          vad_silence_duration_ms: number | null
          vad_threshold: number | null
          voice_id: string
          voice_speed: string | null
          voice_style: string | null
          welcome_timeout: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          custom_icon_url?: string | null
          description?: string | null
          elevenlabs_agent_id?: string | null
          fallback_behavior?: string | null
          folder_id?: string | null
          icon_color?: string | null
          icon_name?: string | null
          id?: string
          max_call_duration?: number | null
          name: string
          status?: Database["public"]["Enums"]["agent_status"]
          system_prompt?: string | null
          updated_at?: string
          vad_mode?: string | null
          vad_prefix_padding_ms?: number | null
          vad_silence_duration_ms?: number | null
          vad_threshold?: number | null
          voice_id?: string
          voice_speed?: string | null
          voice_style?: string | null
          welcome_timeout?: number | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          custom_icon_url?: string | null
          description?: string | null
          elevenlabs_agent_id?: string | null
          fallback_behavior?: string | null
          folder_id?: string | null
          icon_color?: string | null
          icon_name?: string | null
          id?: string
          max_call_duration?: number | null
          name?: string
          status?: Database["public"]["Enums"]["agent_status"]
          system_prompt?: string | null
          updated_at?: string
          vad_mode?: string | null
          vad_prefix_padding_ms?: number | null
          vad_silence_duration_ms?: number | null
          vad_threshold?: number | null
          voice_id?: string
          voice_speed?: string | null
          voice_style?: string | null
          welcome_timeout?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "agent_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      conversation_extracted_data: {
        Row: {
          conversation_id: string
          created_at: string
          field_key: string
          field_value: string | null
          id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          field_key: string
          field_value?: string | null
          id?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          field_key?: string
          field_value?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_extracted_data_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agent_id: string
          audio_url: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          is_read: boolean
          key_points: Json | null
          metadata: Json | null
          outcome: string | null
          phone_number: string | null
          started_at: string
          status: Database["public"]["Enums"]["conversation_status"]
          summary: string | null
          transcript: Json | null
        }
        Insert: {
          agent_id: string
          audio_url?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          is_read?: boolean
          key_points?: Json | null
          metadata?: Json | null
          outcome?: string | null
          phone_number?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          summary?: string | null
          transcript?: Json | null
        }
        Update: {
          agent_id?: string
          audio_url?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          is_read?: boolean
          key_points?: Json | null
          metadata?: Json | null
          outcome?: string | null
          phone_number?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          summary?: string | null
          transcript?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      email_notifications: {
        Row: {
          agent_ids: string[] | null
          created_at: string
          id: string
          include_summary: boolean
          include_transcript: boolean
          is_active: boolean
          message_template: string | null
          name: string
          notify_on_call_end: boolean
          notify_on_call_failed: boolean
          notify_on_call_start: boolean
          recipient_email: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          agent_ids?: string[] | null
          created_at?: string
          id?: string
          include_summary?: boolean
          include_transcript?: boolean
          is_active?: boolean
          message_template?: string | null
          name: string
          notify_on_call_end?: boolean
          notify_on_call_failed?: boolean
          notify_on_call_start?: boolean
          recipient_email: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          agent_ids?: string[] | null
          created_at?: string
          id?: string
          include_summary?: boolean
          include_transcript?: boolean
          is_active?: boolean
          message_template?: string | null
          name?: string
          notify_on_call_end?: boolean
          notify_on_call_failed?: boolean
          notify_on_call_start?: boolean
          recipient_email?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      escalation_rules: {
        Row: {
          action_type: string
          agent_id: string
          created_at: string
          id: string
          is_active: boolean | null
          priority: number | null
          transfer_number: string | null
          trigger_type: string
          trigger_value: string | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          action_type?: string
          agent_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          transfer_number?: string | null
          trigger_type?: string
          trigger_value?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          action_type?: string
          agent_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          transfer_number?: string | null
          trigger_type?: string
          trigger_value?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escalation_rules_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_nodes: {
        Row: {
          agent_id: string
          config: Json
          created_at: string
          description: string | null
          id: string
          node_type: Database["public"]["Enums"]["flow_node_type"]
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          node_type: Database["public"]["Enums"]["flow_node_type"]
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          node_type?: Database["public"]["Enums"]["flow_node_type"]
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_nodes_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_folders: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_folders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_bases: {
        Row: {
          created_at: string
          description: string | null
          folder_id: string | null
          id: string
          name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          folder_id?: string | null
          id?: string
          name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          folder_id?: string | null
          id?: string
          name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_bases_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_bases_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_items: {
        Row: {
          category: string | null
          content: string
          created_at: string
          elevenlabs_document_id: string | null
          file_type: string | null
          file_url: string | null
          id: string
          knowledge_base_id: string
          metadata: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          elevenlabs_document_id?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          knowledge_base_id: string
          metadata?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          elevenlabs_document_id?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          knowledge_base_id?: string
          metadata?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_items_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_calls: {
        Row: {
          agent_id: string
          call_sid: string | null
          conversation_id: string | null
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          is_read: boolean
          metadata: Json | null
          phone_number_id: string | null
          result: string | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          to_number: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          agent_id: string
          call_sid?: string | null
          conversation_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json | null
          phone_number_id?: string | null
          result?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          to_number: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          agent_id?: string
          call_sid?: string | null
          conversation_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json | null
          phone_number_id?: string | null
          result?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          to_number?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_calls_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_calls_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_calls_phone_number_id_fkey"
            columns: ["phone_number_id"]
            isOneToOne: false
            referencedRelation: "phone_numbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_calls_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_numbers: {
        Row: {
          agent_id: string | null
          capabilities: Json | null
          created_at: string
          id: string
          label: string | null
          phone_number: string
          phone_number_sid: string
          provider: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          agent_id?: string | null
          capabilities?: Json | null
          created_at?: string
          id?: string
          label?: string | null
          phone_number: string
          phone_number_sid: string
          provider?: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          agent_id?: string | null
          capabilities?: Json | null
          created_at?: string
          id?: string
          label?: string | null
          phone_number?: string
          phone_number_sid?: string
          provider?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_numbers_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phone_numbers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      pronunciation_rules: {
        Row: {
          agent_id: string | null
          created_at: string
          id: string
          is_global: boolean | null
          original_text: string
          phoneme_type: string | null
          pronunciation: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          id?: string
          is_global?: boolean | null
          original_text: string
          phoneme_type?: string | null
          pronunciation: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          id?: string
          is_global?: boolean | null
          original_text?: string
          phoneme_type?: string | null
          pronunciation?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pronunciation_rules_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pronunciation_rules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      slack_integrations: {
        Row: {
          agent_ids: string[] | null
          channel_name: string | null
          created_at: string
          id: string
          include_summary: boolean
          include_transcript: boolean
          is_active: boolean
          message_template: string | null
          name: string
          notify_on_call_end: boolean
          notify_on_call_failed: boolean
          notify_on_call_start: boolean
          updated_at: string
          webhook_url: string
          workspace_id: string
        }
        Insert: {
          agent_ids?: string[] | null
          channel_name?: string | null
          created_at?: string
          id?: string
          include_summary?: boolean
          include_transcript?: boolean
          is_active?: boolean
          message_template?: string | null
          name: string
          notify_on_call_end?: boolean
          notify_on_call_failed?: boolean
          notify_on_call_start?: boolean
          updated_at?: string
          webhook_url: string
          workspace_id: string
        }
        Update: {
          agent_ids?: string[] | null
          channel_name?: string | null
          created_at?: string
          id?: string
          include_summary?: boolean
          include_transcript?: boolean
          is_active?: boolean
          message_template?: string | null
          name?: string
          notify_on_call_end?: boolean
          notify_on_call_failed?: boolean
          notify_on_call_start?: boolean
          updated_at?: string
          webhook_url?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slack_integrations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          conversation_id: string | null
          error_message: string | null
          id: string
          response_body: string | null
          sent_at: string
          status_code: number | null
          webhook_id: string
        }
        Insert: {
          conversation_id?: string | null
          error_message?: string | null
          id?: string
          response_body?: string | null
          sent_at?: string
          status_code?: number | null
          webhook_id: string
        }
        Update: {
          conversation_id?: string | null
          error_message?: string | null
          id?: string
          response_body?: string | null
          sent_at?: string
          status_code?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          event_type: string
          headers: Json | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          url: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          event_type?: string
          headers?: Json | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          url: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          headers?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          url?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["member_role"]
          token: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["member_role"]
          token?: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["member_role"]
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          elevenlabs_api_key: string | null
          id: string
          name: string
          plan: string
          slug: string
          twilio_account_sid: string | null
          twilio_auth_token: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          elevenlabs_api_key?: string | null
          id?: string
          name: string
          plan?: string
          slug: string
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          elevenlabs_api_key?: string | null
          id?: string
          name?: string
          plan?: string
          slug?: string
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_workspace_invitation: {
        Args: { invitation_token: string }
        Returns: Json
      }
      ensure_demo_workspace_membership: { Args: never; Returns: string }
      is_workspace_admin: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          _action: string
          _details?: Json
          _resource_id?: string
          _resource_type: string
        }
        Returns: string
      }
      remove_workspace_member: {
        Args: { p_member_id: string }
        Returns: boolean
      }
      trigger_process_scheduled_calls: { Args: never; Returns: undefined }
      update_member_role: {
        Args: {
          p_member_id: string
          p_new_role: Database["public"]["Enums"]["member_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      agent_status: "draft" | "published"
      conversation_status: "completed" | "failed" | "in_progress"
      flow_node_type: "speak" | "ask" | "condition" | "webhook" | "end"
      member_role: "owner" | "admin" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agent_status: ["draft", "published"],
      conversation_status: ["completed", "failed", "in_progress"],
      flow_node_type: ["speak", "ask", "condition", "webhook", "end"],
      member_role: ["owner", "admin", "member"],
    },
  },
} as const
