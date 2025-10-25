import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, AlertCircle, ArrowLeft, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Order {
  id: string;
  date_received: string;
  collection_date: string;
  status: string;
  payment_status: string;
  total_amount: number;
  amount_paid: number;
  storage_fee: number;
  notes: string | null;
  customers: {
    full_name: string;
    phone_number: string;
  };
}

const TrackOrder = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const normalizePhoneNumber = (phone: string) => {
    let normalized = phone.trim();
    if (normalized.startsWith("0")) {
      normalized = "+254" + normalized.slice(1);
    } else if (normalized.startsWith("254")) {
      normalized = "+" + normalized;
    }
    return normalized;
  };

  const handleSearch = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number to track your order.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      console.log("Searching orders for:", normalizedPhone);

      // Step 1: Find the customer by phone number only
      const { data: customers, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("phone_number", normalizedPhone);

      if (customerError) throw customerError;

      if (!customers || customers.length === 0) {
        setOrders([]);
        toast({
          title: "No orders found",
          description: "No customer found with that phone number.",
        });
        return;
      }

      // Step 2: Fetch all orders for that customer
      const customerId = customers[0].id;
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customers (
            full_name,
            phone_number
          )
        `)
        .eq("customer_id", customerId)
        .order("date_received", { ascending: false });

      if (error) throw error;

      setOrders(data || []);

      if (!data || data.length === 0) {
        toast({
          title: "No orders found",
          description: "You don’t have any orders yet.",
        });
      }
    } catch (error) {
      console.error("Error searching orders:", error);
      toast({
        title: "Error",
        description: "Failed to search orders. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      ready: "default",
      collected: "outline",
      overdue: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const colors: Record<string, string> = {
      paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      unpaid: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      partial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    };
    return (
      <Badge className={colors[status] || ""} variant="outline">
        {status}
      </Badge>
    );
  };

  const getOverdueInfo = (collectionDate: string, status: string) => {
    const collection = new Date(collectionDate);
    const overdue = new Date(collection);
    overdue.setMonth(overdue.getMonth() + 3);
    const now = new Date();
    const daysUntil = Math.ceil((overdue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (status === "overdue") {
      return (
        <div className="flex items-center gap-1 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Overdue</span>
        </div>
      );
    }

    if (daysUntil <= 30 && daysUntil > 0 && status !== "collected") {
      return (
        <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{daysUntil} days until overdue</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Track Your Order</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Track by Phone Number
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter your phone (e.g. 07xx or +2547xx)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? "Searching..." : (<><Search className="mr-2 h-4 w-4" />Search</>)}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && orders.length > 0 && (
          <div className="mt-8 max-w-4xl mx-auto space-y-4">
            <h2 className="text-xl font-semibold">Orders Found</h2>
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="pt-6">
                  <div className="grid gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{order.customers.full_name}</p>
                        <p className="text-sm text-muted-foreground">{order.customers.phone_number}</p>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(order.status)}
                        {getPaymentBadge(order.payment_status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Received</p>
                        <p className="font-medium">{new Date(order.date_received).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Collection Date</p>
                        <p className="font-medium">{new Date(order.collection_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Amount</p>
                        <p className="font-medium">KES {order.total_amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Amount Paid</p>
                        <p className="font-medium">KES {order.amount_paid.toFixed(2)}</p>
                      </div>
                    </div>

                    {order.storage_fee > 0 && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">Storage Fee</p>
                        <p className="font-medium text-destructive">KES {order.storage_fee.toFixed(2)}</p>
                      </div>
                    )}

                    {getOverdueInfo(order.collection_date, order.status)}

                    {order.notes && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">Notes</p>
                        <p className="font-medium">{order.notes}</p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/receipt/${order.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Receipt
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {searched && orders.length === 0 && !loading && (
          <div className="text-center mt-8 text-muted-foreground">
            No orders found for that phone number.
          </div>
        )}
      </main>
    </div>
  );
};

export default TrackOrder;
