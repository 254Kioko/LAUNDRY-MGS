import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const AddOrder = () => {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !phoneNumber || !totalAmount) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (paymentStatus === "deposit" && !amountPaid) {
      toast({
        title: "Amount required",
        description: "Please enter the deposit amount.",
        variant: "destructive",
      });
      return;
    }

    if (
      (paymentStatus === "deposit" || paymentStatus === "paid") &&
      !paymentMethod
    ) {
      toast({
        title: "Payment method required",
        description: "Please select a payment method.",
        variant: "destructive",
      });
      return;
    }

    // Prevent overpayment
    if (paymentStatus === "deposit" && Number(amountPaid) > Number(totalAmount)) {
      toast({
        title: "Invalid amount",
        description: "Deposit cannot exceed total amount.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Insert customer or find existing
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("phone_number", phoneNumber)
        .single();

      let customerId = existingCustomer?.id;

      if (!customerId) {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert([
            { full_name: customerName, phone_number: phoneNumber },
          ])
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      // Insert order
      const { error: orderError } = await supabase.from("orders").insert([
        {
          customer_id: customerId,
          total_amount: Number(totalAmount),
          amount_paid:
            paymentStatus === "deposit" || paymentStatus === "paid"
              ? Number(amountPaid || totalAmount)
              : 0,
          payment_status: paymentStatus,
          payment_method:
            paymentStatus === "deposit" || paymentStatus === "paid"
              ? paymentMethod
              : null,
          notes,
          status: "pending",
          date_received: new Date().toISOString(),
        },
      ]);

      if (orderError) throw orderError;

      toast({
        title: "Success",
        description: "Order added successfully!",
      });

      navigate("/");
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Failed to add order.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add New Order</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+254..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Amount (KES) *</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Payment Status *</Label>
              <Select
                value={paymentStatus}
                onValueChange={(value: any) => setPaymentStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Show Payment Method for deposit and paid */}
            {(paymentStatus === "deposit" || paymentStatus === "paid") && (
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value: any) => setPaymentMethod(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Show Amount Paid only for deposit */}
            {paymentStatus === "deposit" && (
              <div className="space-y-2">
                <Label htmlFor="amountPaid">Amount Paid *</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  required={paymentStatus === "deposit"}
                  placeholder="0.00"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions..."
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Add Order"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddOrder;
