import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const AT_API_KEY = Deno.env.get("AT_API_KEY");
const AT_USERNAME = Deno.env.get("AT_USERNAME");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Improved phone number validation
const smsSchema = z.object({
  to: z.string()
    .trim()
    .min(10, { message: "Phone number must be at least 10 digits" })
    .max(20, { message: "Phone number must not exceed 20 digits" })
    .regex(/^\+?[0-9]+$/, { 
      message: "Phone number must contain only digits and optional + prefix" 
    }),
  message: z.string()
    .trim()
    .min(1, { message: "Message cannot be empty" })
    .max(1600, { message: "Message must not exceed 1600 characters" }),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("=== SMS Function Started ===");

  try {
    // Check credentials
    if (!AT_API_KEY || !AT_USERNAME) {
      console.error("❌ Missing credentials - AT_API_KEY or AT_USERNAME not set");
      return new Response(
        JSON.stringify({ 
          error: "SMS service not configured",
          hint: "Check AT_API_KEY and AT_USERNAME in Cloud secrets"
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log("✓ Credentials found");

    // Parse request
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("✓ Request body parsed:", { 
        hasTo: !!requestBody.to, 
        hasMessage: !!requestBody.message 
      });
    } catch (e) {
      console.error("❌ Invalid JSON:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Validate input
    const validationResult = smsSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors;
      console.error("❌ Validation failed:", JSON.stringify(errors, null, 2));
      
      return new Response(
        JSON.stringify({ 
          error: "Validation failed",
          details: errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const { to, message } = validationResult.data;
    
    console.log(`✓ Validation passed`);
    console.log(`  Phone: ${to}`);
    console.log(`  Message length: ${message.length} chars`);

    // Send to Africa's Talking
    console.log("→ Sending to Africa's Talking...");
    
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
    console.log("← Africa's Talking response status:", response.status);
    console.log("← Response data:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("❌ Africa's Talking API error");
      return new Response(
        JSON.stringify({ 
          error: "Africa's Talking API error",
          status: response.status,
          details: data 
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: response.status,
        }
      );
    }

    // Check delivery status
    const recipients = data?.SMSMessageData?.Recipients;
    
    if (!recipients || recipients.length === 0) {
      console.error("❌ No recipients in response");
      return new Response(
        JSON.stringify({ 
          error: "No recipients found",
          details: data 
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const recipient = recipients[0];
    console.log(`Status: ${recipient.status}, Code: ${recipient.statusCode}`);

    if (recipient.statusCode !== 101) { // 101 = Success
      console.error(`❌ Delivery failed: ${recipient.status}`);
      return new Response(
        JSON.stringify({ 
          error: "SMS delivery failed",
          status: recipient.status,
          statusCode: recipient.statusCode,
          details: data 
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log("✓ SMS sent successfully!");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "SMS sent successfully",
        data: {
          messageId: recipient.messageId,
          status: recipient.status,
          cost: recipient.cost,
        }
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
