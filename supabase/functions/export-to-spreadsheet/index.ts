import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExportPayload {
  workspace_id: string;
  event_type: "call_end" | "call_failed";
  agent_id: string;
  agent_name: string;
  conversation_id: string;
  phone_number: string | null;
  duration_seconds: number;
  outcome: string | null;
  transcript: any[];
  summary?: string;
  extracted_data?: Record<string, string>;
}

async function refreshAccessToken(
  supabase: any,
  integration: any,
  workspace: any
): Promise<string | null> {
  if (!integration.google_refresh_token || !workspace.google_client_id || !workspace.google_client_secret) {
    return null;
  }

  try {
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
      console.error("Token refresh error:", tokens);
      return null;
    }

    // Update tokens in database
    await supabase
      .from("spreadsheet_integrations")
      .update({
        google_access_token: tokens.access_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      })
      .eq("id", integration.id);

    return tokens.access_token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

async function getSheetRowCount(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string
): Promise<number> {
  try {
    const range = `${sheetName}!A1:A1`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      // If sheet is empty or doesn't exist, return 0
      return 0;
    }

    const data = await response.json();
    return data.values ? data.values.length : 0;
  } catch (error) {
    console.error("Error getting sheet row count:", error);
    return 0;
  }
}

async function appendToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  values: string[][],
  headers: string[]
): Promise<boolean> {
  try {
    // Check if header row exists
    const rowCount = await getSheetRowCount(accessToken, spreadsheetId, sheetName);
    
    // If sheet is empty, add header row first
    if (rowCount === 0) {
      console.log("Sheet is empty, adding header row first");
      const headerRange = `${sheetName}!A1`;
      const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(headerRange)}?valueInputOption=USER_ENTERED`;

      const headerResponse = await fetch(headerUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [headers],
        }),
      });

      if (!headerResponse.ok) {
        const errorText = await headerResponse.text();
        console.error("Error adding header row:", headerResponse.status, errorText);
      } else {
        console.log("Header row added successfully");
      }
    }

    // Append data row
    const range = `${sheetName}!A:Z`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: values,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Sheets API error:", response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error appending to sheet:", error);
    return false;
  }
}

function formatTranscript(transcript: any[]): string {
  if (!transcript || !Array.isArray(transcript)) return "";
  
  return transcript
    .map((entry) => {
      const role = entry.role === "agent" ? "エージェント" : "ユーザー";
      return `${role}: ${entry.message || entry.text || ""}`;
    })
    .join("\n");
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}分${secs}秒`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: ExportPayload = await req.json();
    const {
      workspace_id,
      event_type,
      agent_id,
      agent_name,
      conversation_id,
      phone_number,
      duration_seconds,
      outcome,
      transcript,
      summary,
      extracted_data,
    } = payload;

    console.log(`Exporting to spreadsheet for workspace: ${workspace_id}, event: ${event_type}`);

    // Get active spreadsheet integrations for this workspace
    const { data: integrations, error: intError } = await supabase
      .from("spreadsheet_integrations")
      .select("*")
      .eq("workspace_id", workspace_id)
      .eq("is_active", true)
      .eq("is_authorized", true);

    if (intError) {
      console.error("Error fetching integrations:", intError);
      throw intError;
    }

    if (!integrations || integrations.length === 0) {
      console.log("No active spreadsheet integrations found");
      return new Response(JSON.stringify({ success: true, message: "No integrations" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get workspace for OAuth credentials
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .select("google_client_id, google_client_secret")
      .eq("id", workspace_id)
      .single();

    if (wsError || !workspace) {
      console.error("Error fetching workspace:", wsError);
      throw new Error("Workspace not found");
    }

    const results: { integration_id: string; success: boolean; error?: string }[] = [];

    for (const integration of integrations) {
      // Check if this integration should export for this event type
      const shouldExport =
        (event_type === "call_end" && integration.export_on_call_end) ||
        (event_type === "call_failed" && integration.export_on_call_failed);

      if (!shouldExport) {
        console.log(`Integration ${integration.id} not configured for ${event_type}`);
        continue;
      }

      // Check agent filter
      if (integration.agent_ids && integration.agent_ids.length > 0) {
        if (!integration.agent_ids.includes(agent_id)) {
          console.log(`Integration ${integration.id} not configured for agent ${agent_id}`);
          continue;
        }
      }

      // Check if spreadsheet ID is set
      if (!integration.spreadsheet_id) {
        console.log(`Integration ${integration.id} has no spreadsheet ID`);
        results.push({ integration_id: integration.id, success: false, error: "No spreadsheet ID" });
        continue;
      }

      // Get valid access token
      let accessToken = integration.google_access_token;
      
      // Check if token is expired or about to expire
      if (integration.token_expires_at) {
        const expiresAt = new Date(integration.token_expires_at);
        const now = new Date();
        // Refresh if expires within 5 minutes
        if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
          console.log("Token expired or expiring soon, refreshing...");
          accessToken = await refreshAccessToken(supabase, integration, workspace);
        }
      }

      if (!accessToken) {
        console.error(`No valid access token for integration ${integration.id}`);
        results.push({ integration_id: integration.id, success: false, error: "No access token" });
        continue;
      }

      // Build headers and row data
      const headers: string[] = ["日時", "エージェント名", "電話番号", "通話時間", "結果", "ステータス"];
      const now = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
      const row: string[] = [
        now,                                          // 日時
        agent_name,                                   // エージェント名
        phone_number || "-",                          // 電話番号
        formatDuration(duration_seconds),             // 通話時間
        outcome || "-",                               // 結果
        event_type === "call_failed" ? "失敗" : "完了", // ステータス
      ];

      // Add optional fields
      if (integration.include_summary) {
        headers.push("要約");
        row.push(summary || "-");
      }

      if (integration.include_transcript) {
        headers.push("トランスクリプト");
        row.push(formatTranscript(transcript));
      }

      if (integration.include_extracted_data && extracted_data) {
        headers.push("抽出データ");
        // Add extracted data as JSON or individual columns
        const extractedStr = Object.entries(extracted_data)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n");
        row.push(extractedStr || "-");
      }

      // Append to spreadsheet (with auto header)
      const sheetName = integration.sheet_name || "Sheet1";
      const success = await appendToSheet(accessToken, integration.spreadsheet_id, sheetName, [row], headers);

      results.push({ integration_id: integration.id, success });

      if (success) {
        console.log(`Successfully exported to integration ${integration.id}`);
      } else {
        console.error(`Failed to export to integration ${integration.id}`);
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in export-to-spreadsheet:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
