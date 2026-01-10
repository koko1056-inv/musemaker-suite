import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShareRequest {
  callId: string;
  shareType: "slack" | "email";
  // For Slack
  webhookUrl?: string;
  // For Email
  recipientEmail?: string;
  senderName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { callId, shareType, webhookUrl, recipientEmail, senderName }: ShareRequest = await req.json();

    if (!callId) {
      throw new Error("Missing callId");
    }

    // Get outbound call with conversation
    const { data: call, error: callError } = await supabase
      .from("outbound_calls")
      .select(`
        *,
        conversation:conversations(
          id,
          transcript,
          summary,
          key_points,
          audio_url,
          outcome,
          duration_seconds
        )
      `)
      .eq("id", callId)
      .single();

    if (callError || !call) {
      console.error("Call not found:", callError);
      throw new Error("Call not found");
    }

    // Get agent details
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("name")
      .eq("id", call.agent_id)
      .single();

    if (agentError) {
      console.error("Agent not found:", agentError);
    }

    const agentName = agent?.name || "エージェント";
    const conversation = call.conversation;

    // Get extracted data
    let extractedData: Array<{ field_key: string; field_value: string | null }> = [];
    if (conversation?.id) {
      const { data: extracted } = await supabase
        .from("conversation_extracted_data")
        .select("field_key, field_value")
        .eq("conversation_id", conversation.id);
      
      if (extracted) {
        extractedData = extracted;
      }
    }

    // Format duration
    const durationSeconds = call.duration_seconds || 0;
    const durationFormatted = `${Math.floor(durationSeconds / 60)}分${durationSeconds % 60}秒`;

    // Format transcript
    const transcriptArray = conversation?.transcript as Array<{ role: string; text: string }> | null;
    let transcriptText = "";
    if (Array.isArray(transcriptArray) && transcriptArray.length > 0) {
      transcriptText = transcriptArray
        .map((t) => `${t.role === "agent" ? "🤖 AI" : "👤 ユーザー"}: ${t.text}`)
        .join("\n");
    }

    // Format date
    const callDate = new Date(call.created_at);
    const formattedDate = callDate.toLocaleString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    if (shareType === "slack") {
      if (!webhookUrl) {
        throw new Error("Missing webhookUrl for Slack share");
      }

      // Build Slack message
      const blocks = [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `📞 通話記録 - ${agentName}`,
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*発信先:*\n${call.to_number}`,
            },
            {
              type: "mrkdwn",
              text: `*日時:*\n${formattedDate}`,
            },
            {
              type: "mrkdwn",
              text: `*通話時間:*\n${durationFormatted}`,
            },
            {
              type: "mrkdwn",
              text: `*ステータス:*\n${call.status}`,
            },
          ],
        },
      ];

      if (conversation?.summary) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*📝 要約:*\n${conversation.summary}`,
          },
        } as any);
      }

      if (conversation?.key_points && (conversation.key_points as string[]).length > 0) {
        const keyPointsText = (conversation.key_points as string[])
          .map((point, i) => `${i + 1}. ${point}`)
          .join("\n");
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*💡 重要ポイント:*\n${keyPointsText}`,
          },
        } as any);
      }

      if (extractedData.length > 0) {
        const extractedText = extractedData
          .map((item) => `• ${item.field_key}: ${item.field_value || "-"}`)
          .join("\n");
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*📊 抽出データ:*\n${extractedText}`,
          },
        } as any);
      }

      if (transcriptText) {
        // Truncate if too long
        const truncatedTranscript = transcriptText.length > 2000 
          ? transcriptText.substring(0, 2000) + "...(省略)"
          : transcriptText;
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*💬 会話ログ:*\n\`\`\`${truncatedTranscript}\`\`\``,
          },
        } as any);
      }

      blocks.push({
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `共有者: ${senderName || "Musa AI"} | ${new Date().toLocaleString("ja-JP")}`,
          },
        ],
      } as any);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks }),
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status}`);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Slackに送信しました" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (shareType === "email") {
      if (!recipientEmail) {
        throw new Error("Missing recipientEmail for email share");
      }

      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        throw new Error("RESEND_API_KEY is not configured");
      }

      const resend = new Resend(resendApiKey);

      // Build HTML email
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; }
            .content { background: #f9f9f9; padding: 24px; border-radius: 0 0 12px 12px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
            .info-item { background: white; padding: 12px; border-radius: 8px; }
            .info-label { color: #666; font-size: 12px; margin-bottom: 4px; }
            .info-value { font-weight: 600; font-size: 14px; }
            .section { background: white; padding: 16px; border-radius: 8px; margin-top: 16px; }
            .section-title { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
            .summary { border-left: 3px solid #22c55e; padding-left: 12px; }
            .key-points { list-style: none; padding: 0; margin: 0; }
            .key-points li { padding: 6px 0; border-bottom: 1px solid #eee; }
            .key-points li:last-child { border-bottom: none; }
            .extracted { border-left: 3px solid #8b5cf6; padding-left: 12px; }
            .extracted-item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
            .extracted-key { color: #6b21a8; font-family: monospace; font-size: 12px; }
            .transcript { background: #f5f5f5; padding: 12px; border-radius: 8px; font-size: 13px; max-height: 400px; overflow-y: auto; }
            .transcript-line { padding: 4px 0; }
            .role-ai { color: #22c55e; font-weight: 500; }
            .role-user { color: #3b82f6; font-weight: 500; }
            .footer { text-align: center; padding: 16px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 20px;">📞 通話記録が共有されました</h1>
              <p style="margin: 8px 0 0; opacity: 0.9;">エージェント: ${agentName}</p>
            </div>
            <div class="content">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">発信先</div>
                  <div class="info-value">${call.to_number}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">日時</div>
                  <div class="info-value">${formattedDate}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">通話時間</div>
                  <div class="info-value">${durationFormatted}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">ステータス</div>
                  <div class="info-value">${call.status}</div>
                </div>
              </div>
      `;

      if (conversation?.summary) {
        htmlContent += `
          <div class="section">
            <div class="section-title">📝 要約</div>
            <div class="summary">${conversation.summary}</div>
          </div>
        `;
      }

      if (conversation?.key_points && (conversation.key_points as string[]).length > 0) {
        htmlContent += `
          <div class="section">
            <div class="section-title">💡 重要ポイント</div>
            <ul class="key-points">
              ${(conversation.key_points as string[]).map((point) => `<li>• ${point}</li>`).join("")}
            </ul>
          </div>
        `;
      }

      if (extractedData.length > 0) {
        htmlContent += `
          <div class="section">
            <div class="section-title">📊 抽出データ</div>
            <div class="extracted">
              ${extractedData.map((item) => `
                <div class="extracted-item">
                  <span class="extracted-key">${item.field_key}</span>
                  <span>${item.field_value || "-"}</span>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }

      if (transcriptText) {
        const transcriptHtml = transcriptArray!.map((msg) => {
          const roleClass = msg.role === "agent" ? "role-ai" : "role-user";
          const roleLabel = msg.role === "agent" ? "🤖 AI" : "👤 ユーザー";
          return `<div class="transcript-line"><span class="${roleClass}">${roleLabel}:</span> ${msg.text}</div>`;
        }).join("");

        htmlContent += `
          <div class="section">
            <div class="section-title">💬 会話ログ</div>
            <div class="transcript">${transcriptHtml}</div>
          </div>
        `;
      }

      htmlContent += `
            </div>
            <div class="footer">
              <p>共有者: ${senderName || "Musa AI"}</p>
              <p>このメールはMusa Voice AIから送信されました</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const emailResponse = await resend.emails.send({
        from: "Musa Voice AI <notifications@resend.dev>",
        to: [recipientEmail],
        subject: `[共有] 通話記録 - ${agentName} (${call.to_number})`,
        html: htmlContent,
      });

      console.log("Email sent:", emailResponse);

      return new Response(
        JSON.stringify({ success: true, message: "メールを送信しました" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid shareType");

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in share-call-content function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
