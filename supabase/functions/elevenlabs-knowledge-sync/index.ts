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
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY is not configured');
      throw new Error('ElevenLabs API key is not configured');
    }

    const { action, knowledgeItem, documentId } = await req.json();

    console.log(`Processing ${action} action for knowledge item`, { 
      itemId: knowledgeItem?.id, 
      documentId 
    });

    if (action === 'create' || action === 'update') {
      if (!knowledgeItem) {
        throw new Error('Knowledge item is required');
      }

      // If updating, first delete the old document
      if (action === 'update' && documentId) {
        console.log('Deleting old document:', documentId);
        await fetch(`https://api.elevenlabs.io/v1/convai/knowledge-base/documents/${documentId}`, {
          method: 'DELETE',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
          },
        });
      }

      // Create document from text content
      const createResponse = await fetch('https://api.elevenlabs.io/v1/convai/knowledge-base/documents/text', {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: knowledgeItem.title,
          text: knowledgeItem.content,
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('ElevenLabs create document error:', createResponse.status, errorText);
        throw new Error(`Failed to create document: ${createResponse.status} - ${errorText}`);
      }

      const docData = await createResponse.json();
      console.log('Document created successfully:', docData);

      // Update the knowledge item with the ElevenLabs document ID
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { error: updateError } = await supabase
          .from('knowledge_items')
          .update({ elevenlabs_document_id: docData.id })
          .eq('id', knowledgeItem.id);

        if (updateError) {
          console.error('Failed to update knowledge item with document ID:', updateError);
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        document_id: docData.id,
        name: docData.name 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'delete') {
      if (!documentId) {
        console.log('No document ID provided, skipping delete');
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Delete document from ElevenLabs
      const deleteResponse = await fetch(`https://api.elevenlabs.io/v1/convai/knowledge-base/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      });

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        console.error('ElevenLabs delete document error:', deleteResponse.status, errorText);
        // Don't throw - document might already be deleted
        console.warn('Could not delete document from ElevenLabs, continuing anyway');
      } else {
        console.log('Document deleted successfully:', documentId);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'sync_agent') {
      // Sync knowledge base documents to an agent
      const { agentId, elevenlabsAgentId, documentIds } = await req.json();

      if (!elevenlabsAgentId) {
        throw new Error('ElevenLabs agent ID is required');
      }

      // Build knowledge_base array for the agent
      const knowledgeBase = (documentIds || []).map((doc: { id: string; name: string; type?: string }) => ({
        type: doc.type || 'text',
        id: doc.id,
        name: doc.name,
      }));

      console.log('Syncing agent with knowledge base:', { elevenlabsAgentId, knowledgeBase });

      const updateResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${elevenlabsAgentId}`, {
        method: 'PATCH',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_config: {
            agent: {
              prompt: {
                knowledge_base: knowledgeBase,
              },
            },
          },
        }),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('ElevenLabs sync agent error:', updateResponse.status, errorText);
        throw new Error(`Failed to sync agent knowledge base: ${updateResponse.status} - ${errorText}`);
      }

      console.log('Agent knowledge base synced successfully');

      return new Response(JSON.stringify({ 
        success: true,
        documents_count: knowledgeBase.length 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      throw new Error(`Unknown action: ${action}`);
    }

  } catch (error: unknown) {
    console.error('Error in elevenlabs-knowledge-sync function:', error);
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
