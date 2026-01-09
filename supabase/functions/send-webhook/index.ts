import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  event_type: string;
  conversation_id: string;
  agent_id: string;
  agent_name?: string;
  phone_number?: string;
  duration_seconds?: number;
  outcome?: string;
  transcript?: any;
  summary?: string;
  key_points?: string[];
  extracted_data?: Record<string, string>;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { conversationId, agentId } = await req.json();

    if (!conversationId || !agentId) {
      throw new Error("Missing conversationId or agentId");
    }

    console.log(`Processing webhooks for conversation: ${conversationId}, agent: ${agentId}`);

    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      console.error("Conversation not found:", convError);
      throw new Error("Conversation not found");
    }

    // Get agent details
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("name, workspace_id")
      .eq("id", agentId)
      .single();

    if (agentError || !agent) {
      console.error("Agent not found:", agentError);
      throw new Error("Agent not found");
    }

    // Get active webhooks for this workspace
    const { data: webhooks, error: webhooksError } = await supabase
      .from("webhooks")
      .select("*")
      .eq("workspace_id", agent.workspace_id)
      .eq("is_active", true)
      .eq("event_type", "conversation_ended");

    if (webhooksError) {
      console.error("Error fetching webhooks:", webhooksError);
      throw new Error("Error fetching webhooks");
    }

    if (!webhooks || webhooks.length === 0) {
      console.log("No active webhooks found for this workspace");
      return new Response(JSON.stringify({ message: "No webhooks to send" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get extracted data for this conversation
    const { data: extractedDataRows, error: extractedError } = await supabase
      .from("conversation_extracted_data")
      .select("field_key, field_value")
      .eq("conversation_id", conversationId);

    if (extractedError) {
      console.error("Error fetching extracted data:", extractedError);
    }

    // Convert to object
    const extractedData: Record<string, string> = {};
    if (extractedDataRows) {
      for (const row of extractedDataRows) {
        extractedData[row.field_key] = row.field_value || '';
      }
    }

    console.log(`Found ${Object.keys(extractedData).length} extracted data fields`);

    const payload: WebhookPayload = {
      event_type: "conversation_ended",
      conversation_id: conversationId,
      agent_id: agentId,
      agent_name: agent.name,
      phone_number: conversation.phone_number,
      duration_seconds: conversation.duration_seconds,
      outcome: conversation.outcome,
      transcript: conversation.transcript,
      summary: conversation.summary,
      key_points: conversation.key_points,
      extracted_data: extractedData,
      timestamp: new Date().toISOString(),
    };

    const results = await Promise.all(
      webhooks.map(async (webhook) => {
        try {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(webhook.headers as Record<string, string> || {}),
          };

          console.log(`Sending webhook to: ${webhook.url}`);

          const response = await fetch(webhook.url, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          });

          const responseText = await response.text();

          // Log the webhook attempt
          await supabase.from("webhook_logs").insert({
            webhook_id: webhook.id,
            conversation_id: conversationId,
            status_code: response.status,
            response_body: responseText.substring(0, 1000),
          });

          console.log(`Webhook sent to ${webhook.name}: ${response.status}`);

          return {
            webhook_id: webhook.id,
            success: response.ok,
            status_code: response.status,
          };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          console.error(`Error sending webhook to ${webhook.name}:`, error);

          // Log the error
          await supabase.from("webhook_logs").insert({
            webhook_id: webhook.id,
            conversation_id: conversationId,
            error_message: errorMessage,
          });

          return {
            webhook_id: webhook.id,
            success: false,
            error: errorMessage,
          };
        }
      })
    );

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-webhook function:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
