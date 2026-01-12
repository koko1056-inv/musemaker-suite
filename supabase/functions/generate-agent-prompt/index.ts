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
    const { agentName, description, language = "ja", action = "generate", currentPrompt, editInstruction } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPromptTemplate: string;
    let userMessage: string;

    if (action === "edit" && currentPrompt && editInstruction) {
      // Edit existing prompt
      systemPromptTemplate = language === "ja" 
        ? `あなたは、AIエージェントのシステムプロンプトを編集・改善する専門家です。
ユーザーから既存のプロンプトと編集指示が与えられます。
指示に従って、プロンプトを適切に編集・改善してください。

編集時のルール：
1. 指示された変更のみを行い、不必要な変更は避ける
2. プロンプトの全体的な構造と意図を維持する
3. 日本語で自然な表現を使用する
4. 電話応対用のAI音声エージェントとして適切な内容を維持する

編集後のプロンプトのみを出力してください。説明や前置きは不要です。`
        : `You are an expert at editing and improving AI agent system prompts.
You will receive an existing prompt and editing instructions.
Edit the prompt according to the instructions.

Rules:
1. Only make requested changes, avoid unnecessary modifications
2. Maintain overall structure and intent
3. Keep it suitable for voice AI agents
4. Output only the edited prompt, no explanations.`;

      userMessage = language === "ja"
        ? `【現在のプロンプト】\n${currentPrompt}\n\n【編集指示】\n${editInstruction}`
        : `【Current Prompt】\n${currentPrompt}\n\n【Edit Instructions】\n${editInstruction}`;

    } else {
      // Generate new prompt
      if (!description || description.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "説明文を入力してください" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      systemPromptTemplate = language === "ja" 
        ? `あなたは、AIエージェントのシステムプロンプトを作成する専門家です。
ユーザーが提供する概要説明から、電話応対用のAI音声エージェントに最適なシステムプロンプトを生成してください。

以下の要素を含めてください：
1. エージェントの役割と目的を明確に定義
2. 応対時のトーンと話し方（丁寧、フレンドリー、プロフェッショナルなど）
3. 対応すべき主な質問やシナリオ
4. 回答できない場合の対処法
5. 会話を円滑に進めるためのガイドライン

日本語で、自然な会話ができるプロンプトを生成してください。
プロンプトのみを出力し、説明や前置きは不要です。`
        : `You are an expert at creating system prompts for AI agents.
Generate an optimal system prompt for a voice AI agent based on the user's description.

Include:
1. Clear role and purpose definition
2. Tone and speaking style guidelines
3. Main scenarios to handle
4. Fallback behavior for unknown questions
5. Guidelines for smooth conversation flow

Output only the prompt, no explanations.`;

      userMessage = language === "ja"
        ? `エージェント名: ${agentName || "未定"}\n概要: ${description}`
        : `Agent name: ${agentName || "Unnamed"}\nDescription: ${description}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPromptTemplate },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "リクエスト制限に達しました。しばらく待ってから再試行してください。" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "クレジットが不足しています。ワークスペース設定で追加してください。" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI生成に失敗しました");
    }

    const data = await response.json();
    const generatedPrompt = data.choices?.[0]?.message?.content;

    if (!generatedPrompt) {
      throw new Error("プロンプトの生成に失敗しました");
    }

    return new Response(
      JSON.stringify({ prompt: generatedPrompt.trim() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating prompt:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "不明なエラーが発生しました" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
