import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      agentId, 
      phoneNumber, 
      transcript, 
      durationSeconds, 
      outcome,
      status = 'completed'
    } = await req.json();

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    console.log(`Saving conversation for agent: ${agentId}`);

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        agent_id: agentId,
        phone_number: phoneNumber,
        transcript: transcript || [],
        duration_seconds: durationSeconds || 0,
        outcome: outcome,
        status: status,
        ended_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to save conversation: ${error.message}`);
    }

    console.log('Conversation saved successfully:', data.id);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in save-conversation function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
