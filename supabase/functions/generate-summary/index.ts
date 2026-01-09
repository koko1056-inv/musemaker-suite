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
    const { conversationId } = await req.json();

    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the conversation
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select(`
        *,
        agents (name, description, system_prompt)
      `)
      .eq('id', conversationId)
      .single();

    if (fetchError || !conversation) {
      throw new Error(`Failed to fetch conversation: ${fetchError?.message}`);
    }

    const transcript = conversation.transcript || [];
    
    if (transcript.length === 0) {
      console.log('No transcript available for summarization');
      return new Response(JSON.stringify({ success: true, summary: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Format transcript for AI - handle both 'text' and 'content' field names
    const formattedTranscript = transcript.map((entry: { role: string; text?: string; content?: string }) => {
      const messageText = entry.text || entry.content || '';
      const roleName = entry.role === 'user' ? 'ユーザー' : 'AI';
      return `${roleName}: ${messageText}`;
    }).join('\n');

    console.log('Formatted transcript:', formattedTranscript);

    const agentName = conversation.agents?.name || 'AIエージェント';
    const agentDescription = conversation.agents?.description || '';

    // Generate summary using Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `あなたは通話内容を分析し、要約と重要ポイントを抽出するアシスタントです。
以下の形式でJSON形式で回答してください：
{
  "summary": "通話内容の簡潔な要約（2-3文）",
  "key_points": [
    "重要ポイント1",
    "重要ポイント2",
    "重要ポイント3"
  ],
  "sentiment": "positive" | "neutral" | "negative",
  "action_items": ["アクションアイテム1", "アクションアイテム2"]
}

日本語で回答してください。`
          },
          {
            role: 'user',
            content: `以下は「${agentName}」（${agentDescription}）との通話記録です。この通話を分析してください。

--- 通話記録 ---
${formattedTranscript}
--- 通話記録終了 ---

通話時間: ${conversation.duration_seconds || 0}秒
ステータス: ${conversation.status}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_summary',
              description: '通話内容から要約と重要ポイントを抽出する',
              parameters: {
                type: 'object',
                properties: {
                  summary: {
                    type: 'string',
                    description: '通話内容の簡潔な要約（2-3文）'
                  },
                  key_points: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '重要なポイントのリスト'
                  },
                  sentiment: {
                    type: 'string',
                    enum: ['positive', 'neutral', 'negative'],
                    description: '通話全体の感情分析'
                  },
                  action_items: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'フォローアップが必要なアクションアイテム'
                  }
                },
                required: ['summary', 'key_points', 'sentiment'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_summary' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limited, skipping summary generation');
        return new Response(JSON.stringify({ success: false, error: 'Rate limited' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        console.error('Payment required, skipping summary generation');
        return new Response(JSON.stringify({ success: false, error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();
    console.log('AI Response:', JSON.stringify(aiResponse, null, 2));

    // Extract the tool call response
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    let summaryData = {
      summary: '',
      key_points: [] as string[],
      sentiment: 'neutral',
      action_items: [] as string[]
    };

    if (toolCall?.function?.arguments) {
      try {
        summaryData = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error('Failed to parse tool call arguments:', e);
      }
    }

    // Update the conversation with the summary
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        summary: summaryData.summary,
        key_points: summaryData.key_points,
        metadata: {
          ...((conversation.metadata as Record<string, unknown>) || {}),
          sentiment: summaryData.sentiment,
          action_items: summaryData.action_items || [],
          summarized_at: new Date().toISOString()
        }
      })
      .eq('id', conversationId);

    if (updateError) {
      throw new Error(`Failed to update conversation: ${updateError.message}`);
    }

    console.log(`Summary generated for conversation ${conversationId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      summary: summaryData.summary,
      key_points: summaryData.key_points 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in generate-summary function:', error);
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
