import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Slack Workflow用のペイロード構造
// これらの変数がSlackワークフローやカスタムメッセージで使用できます:
// - {{event_type}}: "call_start" | "call_end" | "call_failed"
// - {{agent_name}}: エージェント名
// - {{phone_number}}: 電話番号
// - {{duration_seconds}}: 通話時間(秒)
// - {{duration_formatted}}: 通話時間(フォーマット済み: "X分Y秒")
// - {{outcome}}: 通話結果
// - {{summary}}: AI要約
// - {{transcript}}: 会話内容(テキスト)
// - {{timestamp}}: タイムスタンプ
// - {{conversation_id}}: 会話ID

interface SlackWorkflowPayload {
  event_type: string;
  agent_name: string;
  phone_number: string;
  duration_seconds: number;
  duration_formatted: string;
  outcome: string;
  summary: string;
  transcript_text: string;
  timestamp: string;
  conversation_id: string;
  text?: string; // カスタムメッセージ用
}

// テンプレート変数を実際の値に置換する関数
function replaceTemplateVariables(template: string, variables: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, String(value));
  }
  return result;
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

    // Format duration
    const durationSeconds = conversation.duration_seconds || 0;
    const durationFormatted = `${Math.floor(durationSeconds / 60)}分${durationSeconds % 60}秒`;

    // Format transcript
    const transcriptArray = conversation.transcript as Array<{ role: string; text: string }> | null;
    let transcriptText = "";
    if (Array.isArray(transcriptArray) && transcriptArray.length > 0) {
      transcriptText = transcriptArray
        .map((t) => `${t.role === "agent" ? "AI" : "お客様"}: ${t.text}`)
        .join("\n");
    }

    // テンプレート変数用のマッピング
    const templateVariables: Record<string, string | number> = {
      event_type: eventType,
      agent_name: agent.name,
      phone_number: conversation.phone_number || "不明",
      duration_seconds: durationSeconds,
      duration_formatted: durationFormatted,
      outcome: conversation.outcome || "完了",
      summary: conversation.summary || "",
      transcript: transcriptText,
      timestamp: new Date().toISOString(),
      conversation_id: conversationId,
    };

    // Build payload for Slack Workflow
    const buildWorkflowPayload = (integration: typeof integrations[0]): SlackWorkflowPayload => {
      const payload: SlackWorkflowPayload = {
        event_type: eventType,
        agent_name: agent.name,
        phone_number: conversation.phone_number || "不明",
        duration_seconds: durationSeconds,
        duration_formatted: durationFormatted,
        outcome: conversation.outcome || "完了",
        summary: integration.include_summary && conversation.summary ? conversation.summary : "",
        transcript_text: integration.include_transcript ? transcriptText : "",
        timestamp: new Date().toISOString(),
        conversation_id: conversationId,
      };

      // カスタムメッセージテンプレートがある場合は text フィールドに追加
      if (integration.message_template) {
        payload.text = replaceTemplateVariables(integration.message_template, templateVariables);
      }

      return payload;
    };

    // Send to all applicable integrations
    const results = await Promise.all(
      applicableIntegrations.map(async (integration) => {
        try {
          const payload = buildWorkflowPayload(integration);
          
          console.log(`Sending Slack workflow notification to: ${integration.name}`);
          console.log(`Payload: ${JSON.stringify(payload)}`);

          const response = await fetch(integration.webhook_url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
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
