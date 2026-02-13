import type { Context } from "@netlify/functions";
import { DEFAULT_GOOGLE_MODEL } from "./constants";

type SiteDraft = {
  businessName: string;
  headline: string;
  subheadline: string;
  seoTitle: string;
  seoDescription: string;
  pages: Array<{ slug: string; title: string; summary: string }>;
};

const extractJsonObject = (text: string): SiteDraft => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("Model did not return JSON");
  }
  return JSON.parse(match[0]) as SiteDraft;
};

const generateDraft = async (input: { profileUrl?: string; businessName?: string }): Promise<SiteDraft> => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GOOGLE_MODEL || DEFAULT_GOOGLE_MODEL;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const prompt = [
    "You are creating a local business website draft.",
    `Google Business Profile URL: ${input.profileUrl || "not provided"}`,
    `Business Name: ${input.businessName || "not provided"}`,
    "Generate realistic, concise copy for a professional local business website.",
    "Respond with JSON only in this exact shape:",
    "{",
    '  "businessName": "string",',
    '  "headline": "string",',
    '  "subheadline": "string",',
    '  "seoTitle": "string",',
    '  "seoDescription": "string",',
    '  "pages": [',
    '    { "slug": "/", "title": "Home", "summary": "string" },',
    '    { "slug": "/services", "title": "Services", "summary": "string" },',
    '    { "slug": "/about", "title": "About", "summary": "string" },',
    '    { "slug": "/reviews", "title": "Reviews", "summary": "string" },',
    '    { "slug": "/contact", "title": "Contact", "summary": "string" }',
    "  ]",
    "}",
    "Requirements:",
    "- Keep language plain and professional.",
    "- Assume this is a small local service business.",
    "- SEO text must include local intent without keyword stuffing.",
  ].join("\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 900 },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return extractJsonObject(text);
};

export default async (request: Request, _context: Context) => {
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
    const payload = await request.json();
    const profileUrl = typeof payload?.profileUrl === "string" ? payload.profileUrl : "";
    const businessName = typeof payload?.businessName === "string" ? payload.businessName : "";

    if (!profileUrl && !businessName) {
      return new Response(JSON.stringify({ error: "Missing profileUrl or businessName" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profileUrl) {
      const parsed = new URL(profileUrl);
      if (!parsed.protocol.startsWith("http")) {
        throw new Error("profileUrl must be http or https");
      }
    }

    const siteDraft = await generateDraft({ profileUrl, businessName });

    return new Response(JSON.stringify({ siteDraft }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to generate site draft",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};
