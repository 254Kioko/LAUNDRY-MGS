import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const AT_API_KEY = Deno.env.get("AT_API_KEY");
const AT_USERNAME = Deno.env.get("AT_USERNAME");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
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

    // Send SMS
    const response = await fetch(
      "https://api.africastalking.com/version1/messaging",
      {
        method: "POST",
        headers: {
          apiKey: AT_API_KEY,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: AT_USERNAME,
          to,
          message,
        }),
      }
    );

    const data = await response.json();

    // ✅ Return full error payload if Africa's Talking rejects
    if (
      !response.ok ||
      data?.SMSMessageData?.Recipients?.[0]?.status !== "Success"
    ) {
      console.error("Africa's Talking error:", data);
      return new Response(JSON.stringify({ error: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // ✅ Success
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("SMS function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
