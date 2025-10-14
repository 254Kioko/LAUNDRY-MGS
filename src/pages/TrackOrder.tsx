import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, AlertCircle } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search required",
        description: "Please enter a name or phone number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customers (
            full_name,
            phone_number
          )
        `)
        .or(`customers.full_name.ilike.%${searchTerm}%,customers.phone_number.ilike.%${searchTerm}%`)
        .order("date_received", { ascending: false });

      if (error) throw error;

      setOrders(data || []);

      if (!data || data.length === 0) {
        toast({
          title: "No orders found",
          description: "No orders match your search criteria",
        });
      }
    } catch (error) {
      console.error("Error searching orders:", error);
      toast({
        title: "Error",
        description: "Failed to search orders. Please try again.",
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
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Track Your Order</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Search Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter name or phone number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? (
                  "Searching..."
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TrackOrder;
