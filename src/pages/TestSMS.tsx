import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const TestSMS = () => {
  const [phone, setPhone] = useState("+254741056273");
  const [message, setMessage] = useState("Test message from laundry system");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const testSMS = async () => {
    setLoading(true);
    setResponse(null);

    try {
      console.log("📤 Testing SMS to:", phone);
      console.log("📝 Message:", message);

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ 
            to: phone,
            message 
          }),
        }
      );

      const responseText = await res.text();
      console.log("📥 Status:", res.status);
      console.log("📥 Response:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      setResponse({
        status: res.status,
        ok: res.ok,
        data
      });

      if (res.ok) {
        toast({
          title: "✅ SMS Sent Successfully!",
          description: `Status: ${data.data?.status || 'Sent'}`,
        });
      } else {
        toast({
          title: "❌ SMS Failed",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("❌ Error:", error);
      setResponse({
        error: error.message
      });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>SMS Function Test</CardTitle>
            <CardDescription>
              Test your Africa's Talking SMS integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254XXXXXXXXX"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Include country code (e.g., +254 for Kenya)
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Message</label>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your test message"
                className="mt-1"
              />
            </div>

            <Button 
              onClick={testSMS} 
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Test SMS
            </Button>
          </CardContent>
        </Card>

        {response && (
          <Card>
            <CardHeader>
              <CardTitle>Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                {JSON.stringify(response, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span>1.</span>
              <span>Verify AT_API_KEY is set in Cloud secrets</span>
            </div>
            <div className="flex items-start gap-2">
              <span>2.</span>
              <span>Verify AT_USERNAME is set in Cloud secrets</span>
            </div>
            <div className="flex items-start gap-2">
              <span>3.</span>
              <span>Check phone number format: +254XXXXXXXXX (Kenya)</span>
            </div>
            <div className="flex items-start gap-2">
              <span>4.</span>
              <span>Ensure your Africa's Talking account has credit</span>
            </div>
            <div className="flex items-start gap-2">
              <span>5.</span>
              <span>Check the browser console for detailed logs</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestSMS;
