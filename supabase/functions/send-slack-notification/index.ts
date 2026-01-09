import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SlackMessage {
  text: string;
  blocks?: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
    };
    fields?: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { conversationId, agentId, eventType } = await req.json();

    if (!conversationId || !agentId) {
      throw new Error("Missing conversationId or agentId");
    }

    console.log(`Processing Slack notifications for conversation: ${conversationId}, agent: ${agentId}, event: ${eventType}`);

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

    // Get active Slack integrations for this workspace
    const { data: integrations, error: integrationsError } = await supabase
      .from("slack_integrations")
      .select("*")
      .eq("workspace_id", agent.workspace_id)
      .eq("is_active", true);

    if (integrationsError) {
      console.error("Error fetching Slack integrations:", integrationsError);
      throw new Error("Error fetching Slack integrations");
    }

    if (!integrations || integrations.length === 0) {
      console.log("No active Slack integrations found for this workspace");
      return new Response(JSON.stringify({ message: "No Slack integrations to send" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter integrations based on event type
    const applicableIntegrations = integrations.filter((integration) => {
      switch (eventType) {
        case "call_start":
          return integration.notify_on_call_start;
        case "call_end":
          return integration.notify_on_call_end;
        case "call_failed":
          return integration.notify_on_call_failed;
        default:
          return false;
      }
    });

    if (applicableIntegrations.length === 0) {
      console.log(`No Slack integrations configured for event type: ${eventType}`);
      return new Response(JSON.stringify({ message: "No integrations for this event type" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build Slack message
    const buildSlackMessage = (integration: typeof integrations[0]): SlackMessage => {
      const emoji = eventType === "call_end" ? "📞" : eventType === "call_start" ? "🔔" : "❌";
      const eventLabel = eventType === "call_end" ? "通話終了" : eventType === "call_start" ? "通話開始" : "通話失敗";
      
      const duration = conversation.duration_seconds 
        ? `${Math.floor(conversation.duration_seconds / 60)}分${conversation.duration_seconds % 60}秒`
        : "不明";

      const blocks: SlackMessage["blocks"] = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${emoji} *${eventLabel}*`,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*エージェント:*\n${agent.name}`,
            },
            {
              type: "mrkdwn",
              text: `*電話番号:*\n${conversation.phone_number || "不明"}`,
            },
          ],
        },
      ];

      // Add duration for call_end
      if (eventType === "call_end") {
        blocks.push({
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*通話時間:*\n${duration}`,
            },
            {
              type: "mrkdwn",
              text: `*結果:*\n${conversation.outcome || "完了"}`,
            },
          ],
        });
      }

      // Add summary if configured and available
      if (integration.include_summary && conversation.summary) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*📋 要約:*\n${conversation.summary}`,
          },
        });
      }

      // Add transcript if configured and available
      if (integration.include_transcript && conversation.transcript) {
        const transcriptArray = conversation.transcript as Array<{ role: string; text: string }>;
        if (Array.isArray(transcriptArray) && transcriptArray.length > 0) {
          const transcriptText = transcriptArray
            .map((t) => `${t.role === "agent" ? "🤖" : "👤"} ${t.text}`)
            .join("\n")
            .slice(0, 2800); // Slack has a limit
          
          blocks.push({
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*💬 会話内容:*\n${transcriptText}`,
            },
          });
        }
      }

      return {
        text: `${emoji} ${eventLabel}: ${agent.name} - ${conversation.phone_number || "不明"}`,
        blocks,
      };
    };

    // Send to all applicable integrations
    const results = await Promise.all(
      applicableIntegrations.map(async (integration) => {
        try {
          const message = buildSlackMessage(integration);
          
          console.log(`Sending Slack notification to: ${integration.name}`);

          const response = await fetch(integration.webhook_url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(message),
          });

          const responseText = await response.text();
          console.log(`Slack notification sent to ${integration.name}: ${response.status} - ${responseText}`);

          return {
            integration_id: integration.id,
            integration_name: integration.name,
            success: response.ok,
            status_code: response.status,
          };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          console.error(`Error sending Slack notification to ${integration.name}:`, error);

          return {
            integration_id: integration.id,
            integration_name: integration.name,
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
    console.error("Error in send-slack-notification function:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
