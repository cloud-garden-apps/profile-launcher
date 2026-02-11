import type { Context } from "@netlify/functions";

const generateIdeas = async (thought: string): Promise<string[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GOOGLE_MODEL || "gemma-3-4b-it";

  const prompt = `Given this thought or idea: "${thought}"

Generate exactly 3 related business ideas that could solve real problems. Each idea should be:
- Practical and achievable
- Related to the original thought
- Addressing a genuine need

Respond with ONLY a JSON array of 3 strings, no other text. Example format:
["Idea 1 description", "Idea 2 description", "Idea 3 description"]`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse LLM response as JSON array");
  }

  return JSON.parse(jsonMatch[0]);
};

export default async (request: Request, context: Context) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { thought } = await request.json();

    if (!thought || typeof thought !== "string") {
      return new Response(JSON.stringify({ error: "Missing thought parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ideas = await generateIdeas(thought);

    return new Response(JSON.stringify({ ideas }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating ideas:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate ideas" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};
