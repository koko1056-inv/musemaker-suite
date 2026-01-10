import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  invitationId: string;
  inviteeEmail: string;
  inviterName: string;
  workspaceName: string;
  role: string;
}

const roleLabels: Record<string, string> = {
  admin: "管理者",
  member: "メンバー",
  owner: "オーナー",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("認証が必要です");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("認証に失敗しました");
    }

    const { 
      invitationId, 
      inviteeEmail, 
      inviterName, 
      workspaceName, 
      role 
    }: InvitationEmailRequest = await req.json();

    // Get invitation token
    const { data: invitation, error: invError } = await supabase
      .from("workspace_invitations")
      .select("token")
      .eq("id", invitationId)
      .single();

    if (invError || !invitation) {
      throw new Error("招待が見つかりません");
    }

    // Build invitation URL
    const appUrl = Deno.env.get("APP_URL") || "https://musa-ai.lovable.app";
    const inviteUrl = `${appUrl}/invite/accept?token=${invitation.token}`;

    const roleLabel = roleLabels[role] || role;

    // Send email via Resend API
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEYが設定されていません");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Musa <onboarding@resend.dev>",
        to: [inviteeEmail],
        subject: `${inviterName}さんから${workspaceName}への招待が届いています`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">ワークスペースへの招待</h1>
            </div>
            
            <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px;">
                <strong>${inviterName}</strong>さんが、あなたを<strong>${workspaceName}</strong>ワークスペースに招待しました。
              </p>
              
              <div style="background: #ffffff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0; color: #666;">招待された役割:</p>
                <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">${roleLabel}</p>
              </div>
              
              <a href="${inviteUrl}" style="display: inline-block; background: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; font-size: 16px;">
                招待を承認する
              </a>
            </div>
            
            <div style="text-align: center; color: #888; font-size: 14px;">
              <p style="margin: 0 0 10px 0;">このリンクは7日間有効です。</p>
              <p style="margin: 0;">ボタンが機能しない場合は、以下のURLをブラウザにコピーしてください:</p>
              <p style="margin: 10px 0 0 0; word-break: break-all; color: #666;">${inviteUrl}</p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(errorData.message || "メール送信に失敗しました");
    }

    const emailResult = await emailResponse.json();

    console.log("Invitation email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, ...emailResult }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation-email function:", error);
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
