import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const AT_API_KEY = Deno.env.get("AT_API_KEY");
const AT_USERNAME = Deno.env.get("AT_USERNAME");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message } = await req.json();

    if (!to || !message) {
      throw new Error("Phone number and message are required");
    }

    if (!AT_API_KEY || !AT_USERNAME) {
      throw new Error("Africa's Talking credentials not configured");
    }

    const url = "https://api.africastalking.com/version1/messaging";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "apiKey": AT_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username: AT_USERNAME,
        to,
        message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Africa's Talking API error:", data);
      throw new Error(JSON.stringify(data));
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-sms function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
