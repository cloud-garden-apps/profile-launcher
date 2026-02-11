import type { Context } from "@netlify/functions";

export default async (request: Request, context: Context) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { email } = await request.json();
  if (!email) {
    return new Response(JSON.stringify({ error: "Missing email" }), { status: 400 });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "ProfileLauncher <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to ProfileLauncher!",
      html: `<h1>Welcome to ProfileLauncher!</h1><p>Thanks for signing up. Connect your Google Business Profile and launch your website today.</p>`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
