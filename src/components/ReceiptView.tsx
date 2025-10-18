import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer } from "lucide-react";
import { format } from "date-fns";

const Receipt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customers (*),
          order_items (
            *,
            clothing_types (*)
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error: any) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading receipt...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p>Order not found</p>
        <Button onClick={() => navigate("/")}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex justify-between items-center print:hidden">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
        </div>

        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Laundry Receipt</h1>
            <p className="text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-2">Customer Details</h3>
              <p>{order.customers.full_name}</p>
              <p className="text-sm text-muted-foreground">{order.customers.phone_number}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Order Details</h3>
              <p className="text-sm">
                <span className="font-medium">Created:</span>{" "}
                {format(new Date(order.created_at), "PPP")}
              </p>
              <p className="text-sm">
                <span className="font-medium">Collection:</span>{" "}
                {format(new Date(order.collection_date), "PPP")}
              </p>
              <p className="text-sm">
                <span className="font-medium">Status:</span>{" "}
                <span className="capitalize">{order.status.replace("_", " ")}</span>
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="mb-6">
            <h3 className="font-semibold mb-4">Items</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Item</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items.map((item: any) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{item.clothing_types.name}</p>
                        {item.color && (
                          <p className="text-sm text-muted-foreground">Color: {item.color}</p>
                        )}
                      </div>
                    </td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">KES {item.unit_price.toFixed(2)}</td>
                    <td className="text-right font-medium">KES {item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Separator className="my-6" />

          <div className="space-y-2">
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Total Amount:</span>
              <span className="font-bold">KES {order.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount Paid:</span>
              <span>KES {order.amount_paid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold">
              <span>Balance Due:</span>
              <span>KES {(order.total_amount - order.amount_paid).toFixed(2)}</span>
            </div>
          </div>

          {order.notes && (
            <>
              <Separator className="my-6" />
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </div>
            </>
          )}

          <Separator className="my-6" />

          <div className="text-center text-sm text-muted-foreground">
            <p>Thank you for your business!</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Receipt;
