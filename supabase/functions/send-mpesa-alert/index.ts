import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
const ALERT_PHONE_NUMBER = "+254742048000"; // Your target number

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MpesaAlertRequest {
  customerName: string;
  orderNumber: string;
  amountPaid: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerName, orderNumber, amountPaid }: MpesaAlertRequest = await req.json();

    // Validate input
    if (!customerName || !orderNumber || !amountPaid) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: customerName, orderNumber, or amountPaid" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate Twilio credentials
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error("Missing Twilio credentials");
      return new Response(
        JSON.stringify({ error: "Twilio credentials not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Construct SMS message
    const message = `MPESA PAYMENT ALERT\nCustomer: ${customerName}\nOrder #: ${orderNumber}\nAmount: KES ${amountPaid.toFixed(2)}`;

    console.log("Sending SMS alert:", { customerName, orderNumber, amountPaid });

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append("To", ALERT_PHONE_NUMBER);
    formData.append("From", TWILIO_PHONE_NUMBER!);
    formData.append("Body", message);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!twilioResponse.ok) {
      const errorData = await twilioResponse.json();
      console.error("Twilio API error:", errorData);
      throw new Error(`Twilio API error: ${errorData.message || twilioResponse.statusText}`);
    }

    const twilioData = await twilioResponse.json();
    console.log("SMS sent successfully:", twilioData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "SMS alert sent successfully",
        twilioMessageSid: twilioData.sid 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-mpesa-alert function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send SMS alert" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
