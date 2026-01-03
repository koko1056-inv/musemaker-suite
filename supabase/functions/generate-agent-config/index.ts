import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `あなたは音声AIエージェントの設計を支援するアシスタントです。
ユーザーとの会話を通じて、どのような音声AIエージェントを作りたいのかを理解し、最適な設定を提案します。

【あなたの役割】
1. ユーザーの業種やビジネスについて質問する
2. エージェントの用途（予約受付、問い合わせ対応、案内など）を明確にする
3. 対応すべき主なシナリオを洗い出す
4. 適切なトーン（フォーマル/カジュアル）を決める
5. 必要な情報が揃ったら、エージェントの設定を提案する

【対話の進め方】
- 1つの質問につき1-2個の具体的な質問をする
- ユーザーが答えやすいように選択肢を提示する
- 専門用語を避け、分かりやすい言葉で説明する

【設定が決まったら】
必要な情報が十分に集まったら、以下のJSON形式で設定を提案してください：
\`\`\`json
{
  "ready": true,
  "config": {
    "name": "エージェント名",
    "description": "エージェントの説明（1-2文）",
    "systemPrompt": "詳細なシステムプロンプト",
    "maxCallDuration": 10,
    "voiceSpeed": 1.0
  }
}
\`\`\`

まだ情報が不足している場合は、追加の質問をしてください。
JSONは設定が完全に決まった場合のみ出力してください。`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "リクエスト制限に達しました。しばらく待ってから再度お試しください。" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AIクレジットが不足しています。" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-agent-config error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
