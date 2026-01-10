import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CalendarEventRequest {
  conversation_id?: string;
  outbound_call_id?: string;
  agent_id: string;
  phone_number?: string;
  datetime?: string;
  summary?: string;
  extracted_data?: Record<string, string>;
  call_status: 'completed' | 'failed' | 'missed';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: CalendarEventRequest = await req.json();
    const { agent_id, phone_number, datetime, summary, extracted_data, call_status } = body;

    // Get agent info
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, name, workspace_id")
      .eq("id", agent_id)
      .single();

    if (agentError || !agent) {
      throw new Error("Agent not found");
    }

    // Get active calendar integrations for this agent or workspace
    const { data: integrations, error: integrationsError } = await supabase
      .from("calendar_integrations")
      .select("*")
      .eq("workspace_id", agent.workspace_id)
      .eq("is_active", true)
      .or(`agent_id.eq.${agent_id},agent_id.is.null`);

    if (integrationsError) {
      throw new Error(`Failed to fetch integrations: ${integrationsError.message}`);
    }

    if (!integrations || integrations.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active calendar integrations found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get workspace settings for Google credentials
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("settings")
      .eq("id", agent.workspace_id)
      .single();

    if (workspaceError || !workspace?.settings) {
      throw new Error("Workspace settings not found");
    }

    const settings = workspace.settings as Record<string, string>;
    const googleClientId = settings.google_client_id;
    const googleClientSecret = settings.google_client_secret;
    const googleRefreshToken = settings.google_refresh_token;

    if (!googleClientId || !googleClientSecret || !googleRefreshToken) {
      return new Response(
        JSON.stringify({ message: "Google Cloud credentials not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get access token from refresh token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        refresh_token: googleRefreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to refresh Google access token");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const createdEvents = [];

    for (const integration of integrations) {
      // Check if this integration should create event based on call status
      if (call_status === 'completed' && !integration.create_on_call_end) continue;
      if ((call_status === 'failed' || call_status === 'missed') && !integration.create_on_call_failed) continue;

      // Replace template variables
      const templateVars: Record<string, string> = {
        agent_name: agent.name || '',
        phone_number: phone_number || '',
        datetime: datetime || new Date().toISOString(),
        summary: summary || '',
        call_status: call_status,
        ...extracted_data,
      };

      let eventTitle = integration.event_title_template;
      let eventDescription = integration.event_description_template;

      for (const [key, value] of Object.entries(templateVars)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        eventTitle = eventTitle.replace(regex, value);
        eventDescription = eventDescription.replace(regex, value);
      }

      // Create calendar event
      const eventStartTime = datetime ? new Date(datetime) : new Date();
      const eventEndTime = new Date(eventStartTime.getTime() + integration.event_duration_minutes * 60 * 1000);

      const calendarId = integration.calendar_id || 'primary';
      
      const eventData = {
        summary: eventTitle,
        description: eventDescription,
        start: {
          dateTime: eventStartTime.toISOString(),
          timeZone: "Asia/Tokyo",
        },
        end: {
          dateTime: eventEndTime.toISOString(),
          timeZone: "Asia/Tokyo",
        },
      };

      const calendarResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        }
      );

      if (calendarResponse.ok) {
        const createdEvent = await calendarResponse.json();
        createdEvents.push({
          integration_id: integration.id,
          event_id: createdEvent.id,
          event_link: createdEvent.htmlLink,
        });
      } else {
        const errorText = await calendarResponse.text();
        console.error(`Failed to create calendar event for integration ${integration.id}:`, errorText);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        created_events: createdEvents,
        message: `Created ${createdEvents.length} calendar event(s)`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating calendar event:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});