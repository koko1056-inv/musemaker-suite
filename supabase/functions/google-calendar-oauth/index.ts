import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    
    // Handle OAuth callback
    if (url.searchParams.has("code")) {
      const code = url.searchParams.get("code")!;
      const state = url.searchParams.get("state")!;
      const { integration_id, workspace_id } = JSON.parse(atob(state));

      // Get workspace credentials
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("google_client_id, google_client_secret")
        .eq("id", workspace_id)
        .single();

      if (workspaceError || !workspace?.google_client_id || !workspace?.google_client_secret) {
        return new Response(
          `<html><body><script>window.close();</script><h2>エラー: Google認証情報が設定されていません。設定画面でClient IDとClient Secretを入力してください。</h2></body></html>`,
          { headers: { ...corsHeaders, "Content-Type": "text/html" } }
        );
      }

      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: workspace.google_client_id,
          client_secret: workspace.google_client_secret,
          redirect_uri: `${supabaseUrl}/functions/v1/google-calendar-oauth`,
          grant_type: "authorization_code",
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        console.error("Token exchange error:", tokens);
        return new Response(
          `<html><body><script>window.close();</script><h2>認証エラー: ${tokens.error_description || tokens.error}</h2></body></html>`,
          { headers: { ...corsHeaders, "Content-Type": "text/html" } }
        );
      }

      // Update integration with tokens
      const { error: updateError } = await supabase
        .from("calendar_integrations")
        .update({
          is_authorized: true,
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq("id", integration_id);

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(
          `<html><body><script>window.close();</script><h2>エラー: 認証情報の保存に失敗しました</h2></body></html>`,
          { headers: { ...corsHeaders, "Content-Type": "text/html" } }
        );
      }

      return new Response(
        `<html><body><script>window.opener?.postMessage({ type: 'google-calendar-oauth-success', integration_id: '${integration_id}' }, '*'); setTimeout(() => window.close(), 1000);</script><h2>✅ Google Calendar認証が完了しました！このウィンドウは自動的に閉じます。</h2></body></html>`,
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // Handle API requests
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, integration_id } = await req.json();

    if (action === "get_auth_url") {
      // Get integration and workspace info
      const { data: integration, error: intError } = await supabase
        .from("calendar_integrations")
        .select("workspace_id")
        .eq("id", integration_id)
        .single();

      if (intError || !integration) {
        return new Response(JSON.stringify({ error: "Integration not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: workspace, error: wsError } = await supabase
        .from("workspaces")
        .select("google_client_id, google_client_secret")
        .eq("id", integration.workspace_id)
        .single();

      if (wsError || !workspace?.google_client_id) {
        return new Response(JSON.stringify({ error: "Google credentials not configured" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const state = btoa(JSON.stringify({ 
        integration_id, 
        workspace_id: integration.workspace_id 
      }));

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", workspace.google_client_id);
      authUrl.searchParams.set("redirect_uri", `${supabaseUrl}/functions/v1/google-calendar-oauth`);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", GOOGLE_OAUTH_SCOPES);
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("state", state);

      return new Response(JSON.stringify({ auth_url: authUrl.toString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "refresh_token") {
      const { data: integration, error: intError } = await supabase
        .from("calendar_integrations")
        .select("workspace_id, google_refresh_token")
        .eq("id", integration_id)
        .single();

      if (intError || !integration?.google_refresh_token) {
        return new Response(JSON.stringify({ error: "No refresh token" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: workspace } = await supabase
        .from("workspaces")
        .select("google_client_id, google_client_secret")
        .eq("id", integration.workspace_id)
        .single();

      if (!workspace?.google_client_id || !workspace?.google_client_secret) {
        return new Response(JSON.stringify({ error: "Google credentials not configured" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: workspace.google_client_id,
          client_secret: workspace.google_client_secret,
          refresh_token: integration.google_refresh_token,
          grant_type: "refresh_token",
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        return new Response(JSON.stringify({ error: tokens.error }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase
        .from("calendar_integrations")
        .update({
          google_access_token: tokens.access_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq("id", integration_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "revoke") {
      const { data: integration } = await supabase
        .from("calendar_integrations")
        .select("google_access_token")
        .eq("id", integration_id)
        .single();

      if (integration?.google_access_token) {
        // Revoke token with Google
        await fetch(`https://oauth2.googleapis.com/revoke?token=${integration.google_access_token}`, {
          method: "POST",
        });
      }

      // Clear tokens from database
      await supabase
        .from("calendar_integrations")
        .update({
          is_authorized: false,
          google_access_token: null,
          google_refresh_token: null,
          token_expires_at: null,
        })
        .eq("id", integration_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});