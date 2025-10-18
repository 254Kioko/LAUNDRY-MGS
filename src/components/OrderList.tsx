import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Eye, Loader2, AlertCircle } from "lucide-react";
import { format, addMonths, differenceInDays } from "date-fns";

type OrderStatus =
  | "all"
  | "pending"
  | "in_progress"
  | "ready"
  | "delayed"
  | "collected"
  | "overdue";

type PaymentStatus = "unpaid" | "deposit" | "paid";

interface OrderListProps {
  status: OrderStatus;
}

const OrderList = ({ status }: OrderListProps) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("order-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [status]);

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from("orders")
        .select(`*, customers (*)`)
        .order("created_at", { ascending: false });

      if (status !== "all") {
        query = query.eq("status", status); // ✅ use correct column
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ SMS helper
  const sendSMSNotification = async (
    phoneNumber: string | undefined,
    orderId: string,
    status: string
  ) => {
    if (!phoneNumber) {
      console.log("No phone number available for SMS");
      return;
    }

    const message =
      status === "ready"
        ? `Your laundry order is ready for collection. Order ID: ${orderId.slice(0, 8)}`
        : `Your laundry order has been delayed. We apologize for the inconvenience. Order ID: ${orderId.slice(0, 8)}`;

    try {
      console.log("Sending SMS to:", phoneNumber);
      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: { to: phoneNumber, message },
      });

      if (error) {
        console.error("SMS edge function error:", error);
        toast({
          title: "SMS notification failed",
          description: "Status updated but SMS could not be sent",
          variant: "destructive",
        });
      } else {
        console.log("SMS sent successfully:", data);
      }
    } catch (smsError: any) {
      console.error("SMS sending failed:", smsError);
    }
  };

  // ✅ FIXED: updateOrderStatus uses "status"
  const updateOrderStatus = async (
    orderId: string,
    newStatus: Exclude<OrderStatus, "all">
  ) => {
    const previousOrders = [...orders];
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );

    try {
      const { data: updatedOrder, error: updateError } = await supabase
        .from("orders")
        .update({ status: newStatus }) // ✅ fixed column
        .eq("id", orderId)
        .select("id, customers(phone_number)")
        .single();

      if (updateError) {
        console.error("Database update error:", updateError);
        throw updateError;
      }

      console.log("Status updated successfully to:", newStatus);

      if (newStatus === "ready" || newStatus === "delayed") {
        sendSMSNotification(
          updatedOrder?.customers?.phone_number,
          orderId,
          newStatus
        );
      }

      toast({
        title: "Status updated",
        description: `Order status changed to ${newStatus}`,
      });
    } catch (error: any) {
      console.error("Error updating order status:", error);
      setOrders(previousOrders);
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const updatePaymentStatus = async (
    orderId: string,
    newPaymentStatus: PaymentStatus
  ) => {
    const previousOrders = [...orders];
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, payment_status: newPaymentStatus }
          : order
      )
    );

    try {
      const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select("total_amount, amount_paid")
        .eq("id", orderId)
        .single();

      if (fetchError) throw fetchError;

      let amount_paid = order.amount_paid;

      if (newPaymentStatus === "paid") {
        amount_paid = order.total_amount;
      } else if (newPaymentStatus === "unpaid") {
        amount_paid = 0;
      }

      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: newPaymentStatus,
          amount_paid: amount_paid,
        })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Payment status updated",
        description: "Payment status has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating payment status:", error);
      setOrders(previousOrders);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      pending: "secondary",
      in_progress: "default",
      ready: "default",
      delayed: "destructive",
      collected: "outline",
      overdue: "destructive",
    };

    const displayText =
      status === "in_progress"
        ? "In Progress"
        : status.charAt(0).toUpperCase() + status.slice(1);

    return <Badge variant={variants[status] || "default"}>{displayText}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const colors: Record<string, string> = {
      unpaid: "bg-red-100 text-red-800",
      deposit: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
    };

    return (
      <Badge className={colors[status] || ""}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getOverdueInfo = (collectionDate: string, status: string) => {
    if (status === "collected") return null;

    const overdueDate = addMonths(new Date(collectionDate), 3);
    const daysUntil = differenceInDays(overdueDate, new Date());

    if (daysUntil < 0) {
      return (
        <span className="text-destructive text-xs flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Overdue
        </span>
      );
    } else if (daysUntil <= 30) {
      return (
        <span className="text-orange-600 text-xs">{daysUntil}d left</span>
      );
    }
    return <span className="text-xs text-muted-foreground">{daysUntil}d</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">No orders found</div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Mobile View */}
      <div className="block lg:hidden space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border rounded-xl p-4 shadow-sm bg-white space-y-3"
          >
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-sm">
                  {order.customers?.full_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.customers?.phone_number}
                </p>
              </div>
              {getStatusBadge(order.status)}
            </div>

            {/* Details */}
            <div className="text-xs space-y-1">
              <p>
                <span className="text-muted-foreground">Collection:</span>{" "}
                {format(new Date(order.collection_date), "MMM dd")}
              </p>
              <p>
                <span className="text-muted-foreground">Total:</span> KES{" "}
                {parseFloat(order.total_amount).toFixed(2)}
              </p>
              <p>
                <span className="text-muted-foreground">Payment:</span>{" "}
                {getPaymentBadge(order.payment_status)}
              </p>
              {getOverdueInfo(order.collection_date, order.status) && (
                <p>
                  <span className="text-muted-foreground">Storage:</span>{" "}
                  {getOverdueInfo(order.collection_date, order.status)}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {/* Status Update */}
              <Select
                value={order.status}
                onValueChange={(value) =>
                  updateOrderStatus(order.id, value as Exclude<OrderStatus, "all">)
                }
              >
                <SelectTrigger className="h-9 text-xs w-full">
                  <SelectValue placeholder="Order Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="collected">Collected</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              {/* Payment Update */}
              <Select
                value={order.payment_status}
                onValueChange={(value) =>
                  updatePaymentStatus(order.id, value as PaymentStatus)
                }
              >
                <SelectTrigger className="h-9 text-xs w-full">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              {/* View Receipt */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate(`/receipt/${order.id}`)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View Receipt
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Collection Date</TableHead>
              <TableHead>Storage</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Order Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  {order.customers?.full_name}
                </TableCell>
                <TableCell>{order.customers?.phone_number}</TableCell>
                <TableCell>
                  {format(new Date(order.collection_date), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                  {getOverdueInfo(order.collection_date, order.status)}
                </TableCell>
                <TableCell>
                  KES {parseFloat(order.total_amount).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Select
                    value={order.payment_status}
                    onValueChange={(value) =>
                      updatePaymentStatus(order.id, value as PaymentStatus)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={order.status}
                    onValueChange={(value) =>
                      updateOrderStatus(order.id, value as Exclude<OrderStatus, "all">)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                      <SelectItem value="collected">Collected</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/receipt/${order.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OrderList;
