import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    if (!TWILIO_API_KEY) throw new Error("TWILIO_API_KEY is not configured (Twilio connector not linked)");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { action, workspaceId, phoneNumberSid, agentId, label } = await req.json();

    if (action === "list") {
      // Fetch phone numbers via Twilio connector gateway
      // The gateway prepends /2010-04-01/Accounts/{AccountSid} automatically
      const twilioResponse = await fetch(
        `${GATEWAY_URL}/IncomingPhoneNumbers.json`,
        {
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TWILIO_API_KEY,
          },
        }
      );

      if (!twilioResponse.ok) {
        const errorText = await twilioResponse.text();
        throw new Error(`Twilio API error [${twilioResponse.status}]: ${errorText}`);
      }

      const twilioData = await twilioResponse.json();
      const twilioNumbers = twilioData.incoming_phone_numbers || [];

      // Get existing phone numbers from database
      const { data: existingNumbers } = await supabaseClient
        .from("phone_numbers")
        .select("*")
        .eq("workspace_id", workspaceId);

      // Sync Twilio numbers with database
      for (const twilioNumber of twilioNumbers) {
        const existing = existingNumbers?.find(
          (n) => n.phone_number_sid === twilioNumber.sid
        );

        if (!existing) {
          await supabaseClient.from("phone_numbers").insert({
            workspace_id: workspaceId,
            phone_number: twilioNumber.phone_number,
            phone_number_sid: twilioNumber.sid,
            label: twilioNumber.friendly_name,
            capabilities: {
              voice: twilioNumber.capabilities?.voice || false,
              sms: twilioNumber.capabilities?.sms || false,
            },
            status: "active",
          });
        }
      }

      const { data: phoneNumbers, error: fetchError } = await supabaseClient
        .from("phone_numbers")
        .select("*, agents(id, name)")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      return new Response(JSON.stringify({ phoneNumbers }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "assign") {
      const { error: updateError } = await supabaseClient
        .from("phone_numbers")
        .update({ agent_id: agentId })
        .eq("phone_number_sid", phoneNumberSid)
        .eq("workspace_id", workspaceId);
      if (updateError) throw updateError;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "unassign") {
      const { error: updateError } = await supabaseClient
        .from("phone_numbers")
        .update({ agent_id: null })
        .eq("phone_number_sid", phoneNumberSid)
        .eq("workspace_id", workspaceId);
      if (updateError) throw updateError;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "updateLabel") {
      const { error: updateError } = await supabaseClient
        .from("phone_numbers")
        .update({ label })
        .eq("phone_number_sid", phoneNumberSid)
        .eq("workspace_id", workspaceId);
      if (updateError) throw updateError;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
