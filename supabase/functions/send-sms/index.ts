import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const AT_API_KEY = Deno.env.get("AT_API_KEY");
const AT_USERNAME = Deno.env.get("AT_USERNAME");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const smsSchema = z.object({
  to: z.string()
    .trim()
    .min(10, { message: "Phone number must be at least 10 digits" })
    .max(15, { message: "Phone number must not exceed 15 digits" })
    .regex(/^\+?[1-9]\d{1,14}$/, { 
      message: "Invalid phone number format. Use format: +254712345678" 
    }),
  message: z.string()
    .trim()
    .min(1, { message: "Message cannot be empty" })
    .max(1600, { message: "Message must not exceed 1600 characters" }),
});

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("SMS function invoked");

  try {
    // Check environment variables
    if (!AT_API_KEY || !AT_USERNAME) {
      console.error("Missing Africa's Talking credentials");
      return new Response(
        JSON.stringify({ 
          error: "SMS service not configured. Please contact administrator." 
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error("Invalid JSON in request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid request body. Expected JSON." }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Validate input with zod
    const validationResult = smsSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      console.error("Input validation failed:", errors);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input",
          details: errors 
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const { to, message } = validationResult.data;

    console.log(`Sending SMS to: ${to.substring(0, 8)}...`);
    console.log(`Message length: ${message.length} characters`);

    // Send SMS to Africa's Talking
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
    console.log("Africa's Talking response:", JSON.stringify(data));

    // Check for API errors
    if (!response.ok) {
      console.error("Africa's Talking API error:", data);
      return new Response(
        JSON.stringify({ 
          error: "SMS service error",
          details: data 
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: response.status,
        }
      );
    }

    // Check SMS delivery status
    const recipients = data?.SMSMessageData?.Recipients;
    if (!recipients || recipients.length === 0) {
      console.error("No recipients in response:", data);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send SMS. No recipients found in response.",
          details: data 
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const recipientStatus = recipients[0]?.status;
    const statusCode = recipients[0]?.statusCode;

    if (recipientStatus !== "Success") {
      console.error(`SMS delivery failed. Status: ${recipientStatus}, Code: ${statusCode}`);
      return new Response(
        JSON.stringify({ 
          error: `SMS delivery failed: ${recipientStatus}`,
          statusCode,
          details: data 
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log("SMS sent successfully");

    // Success response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "SMS sent successfully",
        data: {
          messageId: data?.SMSMessageData?.Recipients?.[0]?.messageId,
          status: recipientStatus,
          cost: data?.SMSMessageData?.Recipients?.[0]?.cost,
        }
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Unexpected error in SMS function:", error);
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
