import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  workspace_id: string;
  event_type: "call_start" | "call_end" | "call_failed";
  agent_name?: string;
  phone_number?: string;
  duration_seconds?: number;
  summary?: string;
  transcript?: Array<{ role: string; message: string }>;
  outcome?: string;
  conversation_id?: string;
}

// テンプレート変数を実際の値に置換する関数
function replaceTemplateVariables(
  template: string, 
  variables: Record<string, string | number>, 
  extractedData: Record<string, string> = {}
): string {
  let result = template;
  
  // 通常の変数を置換
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, String(value));
  }
  
  // 抽出データの変数を置換 ({{extracted.key}} 形式)
  for (const [key, value] of Object.entries(extractedData)) {
    const regex = new RegExp(`{{\\s*extracted\\.${key}\\s*}}`, 'g');
    result = result.replace(regex, String(value || ''));
  }
  
  // 未定義の抽出データ変数をクリア
  result = result.replace(/\{\{\s*extracted\.\w+\s*\}\}/g, '');
  
  return result;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      workspace_id,
      event_type,
      agent_name,
      phone_number,
      duration_seconds,
      summary,
      transcript,
      outcome,
      conversation_id,
    }: EmailNotificationRequest = await req.json();

    // Get all active email notifications for this workspace
    const { data: notifications, error: fetchError } = await supabase
      .from("email_notifications")
      .select("*")
      .eq("workspace_id", workspace_id)
      .eq("is_active", true);

    if (fetchError) {
      console.error("Error fetching email notifications:", fetchError);
      throw new Error("Failed to fetch email notifications");
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active email notifications found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get extracted data if conversation_id is provided
    let extractedData: Record<string, string> = {};
    if (conversation_id) {
      const { data: extractedDataRows, error: extractedError } = await supabase
        .from("conversation_extracted_data")
        .select("field_key, field_value")
        .eq("conversation_id", conversation_id);

      if (extractedError) {
        console.error("Error fetching extracted data:", extractedError);
      } else if (extractedDataRows) {
        for (const row of extractedDataRows) {
          extractedData[row.field_key] = row.field_value || '';
        }
      }
    }

    console.log(`Found ${Object.keys(extractedData).length} extracted data fields`);

    const formattedDuration = duration_seconds
      ? `${Math.floor(duration_seconds / 60)}分${duration_seconds % 60}秒`
      : null;

    // Template variables for custom messages
    const templateVariables: Record<string, string | number> = {
      event_type,
      agent_name: agent_name || 'エージェント',
      phone_number: phone_number || '不明',
      duration_seconds: duration_seconds || 0,
      duration_formatted: formattedDuration || '-',
      outcome: outcome || '完了',
      summary: summary || '',
      timestamp: new Date().toISOString(),
      conversation_id: conversation_id || '',
    };

    const results = [];

    for (const notification of notifications) {
      // Check if this notification should be sent based on event type
      const shouldSend =
        (event_type === "call_start" && notification.notify_on_call_start) ||
        (event_type === "call_end" && notification.notify_on_call_end) ||
        (event_type === "call_failed" && notification.notify_on_call_failed);

      if (!shouldSend) continue;

      // Build email content
      const eventLabels = {
        call_start: "📞 通話が開始されました",
        call_end: "✅ 通話が終了しました",
        call_failed: "❌ 通話が失敗しました",
      };

      const eventTitle = eventLabels[event_type];

      // カスタムテンプレートがある場合は使用
      let customContent = "";
      if (notification.message_template) {
        customContent = replaceTemplateVariables(
          notification.message_template, 
          templateVariables, 
          extractedData
        );
      }

      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; }
            .content { background: #f9f9f9; padding: 24px; border-radius: 0 0 12px 12px; }
            .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
            .label { color: #666; font-size: 14px; }
            .value { font-weight: 500; }
            .summary { background: white; padding: 16px; border-radius: 8px; margin-top: 16px; border-left: 4px solid #333; }
            .custom-message { background: white; padding: 16px; border-radius: 8px; margin-top: 16px; white-space: pre-wrap; }
            .extracted { background: #f0f0ff; padding: 16px; border-radius: 8px; margin-top: 16px; border-left: 4px solid #8b5cf6; }
            .extracted-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0ff; }
            .extracted-key { color: #6b21a8; font-family: monospace; font-size: 12px; }
            .transcript { background: white; padding: 16px; border-radius: 8px; margin-top: 16px; }
            .message { padding: 8px 0; }
            .role { font-size: 12px; color: #666; text-transform: uppercase; }
            .footer { text-align: center; padding: 16px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 20px;">${eventTitle}</h1>
              ${agent_name ? `<p style="margin: 8px 0 0; opacity: 0.8;">エージェント: ${agent_name}</p>` : ""}
            </div>
            <div class="content">
      `;

      // カスタムテンプレートがある場合はそれを表示
      if (customContent) {
        htmlContent += `
          <div class="custom-message">${customContent.replace(/\n/g, '<br>')}</div>
        `;
      } else {
        // デフォルトの表示
        if (phone_number) {
          htmlContent += `
            <div class="info-row">
              <span class="label">電話番号</span>
              <span class="value">${phone_number}</span>
            </div>
          `;
        }

        if (formattedDuration) {
          htmlContent += `
            <div class="info-row">
              <span class="label">通話時間</span>
              <span class="value">${formattedDuration}</span>
            </div>
          `;
        }

        if (outcome) {
          htmlContent += `
            <div class="info-row">
              <span class="label">結果</span>
              <span class="value">${outcome}</span>
            </div>
          `;
        }

        if (notification.include_summary && summary) {
          htmlContent += `
            <div class="summary">
              <h3 style="margin: 0 0 8px; font-size: 14px; color: #666;">📝 サマリー</h3>
              <p style="margin: 0;">${summary}</p>
            </div>
          `;
        }

        // Add extracted data section
        if (Object.keys(extractedData).length > 0) {
          htmlContent += `
            <div class="extracted">
              <h3 style="margin: 0 0 12px; font-size: 14px; color: #6b21a8;">📊 抽出データ</h3>
          `;
          for (const [key, value] of Object.entries(extractedData)) {
            htmlContent += `
              <div class="extracted-row">
                <span class="extracted-key">${key}</span>
                <span class="value">${value}</span>
              </div>
            `;
          }
          htmlContent += `</div>`;
        }
      }

      if (notification.include_transcript && transcript && transcript.length > 0) {
        htmlContent += `
          <div class="transcript">
            <h3 style="margin: 0 0 12px; font-size: 14px; color: #666;">💬 トランスクリプト</h3>
        `;
        for (const msg of transcript.slice(0, 20)) {
          const roleLabel = msg.role === "agent" ? "AI" : "ユーザー";
          htmlContent += `
            <div class="message">
              <div class="role">${roleLabel}</div>
              <div>${msg.message}</div>
            </div>
          `;
        }
        if (transcript.length > 20) {
          htmlContent += `<p style="color: #999; font-size: 12px;">...他 ${transcript.length - 20} 件のメッセージ</p>`;
        }
        htmlContent += `</div>`;
      }

      htmlContent += `
            </div>
            <div class="footer">
              <p>このメールはMusa Voice AIから自動送信されています</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const subjectLabels = {
        call_start: `[Musa] 通話開始: ${agent_name || "エージェント"}`,
        call_end: `[Musa] 通話終了: ${agent_name || "エージェント"}`,
        call_failed: `[Musa] 通話失敗: ${agent_name || "エージェント"}`,
      };

      try {
        const emailResponse = await resend.emails.send({
          from: "Musa Voice AI <notifications@resend.dev>",
          to: [notification.recipient_email],
          subject: subjectLabels[event_type],
          html: htmlContent,
        });

        results.push({
          notification_id: notification.id,
          success: true,
          email_id: (emailResponse as any)?.data?.id || "sent",
        });

        console.log(`Email sent successfully to ${notification.recipient_email}:`, emailResponse);
      } catch (emailError: any) {
        console.error(`Failed to send email to ${notification.recipient_email}:`, emailError);
        results.push({
          notification_id: notification.id,
          success: false,
          error: emailError.message,
        });
      }
    }

    return new Response(
      JSON.stringify({ results }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
