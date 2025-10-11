import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format, addMonths, differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface ReceiptViewProps {
  order: any;
}

const ReceiptView = ({ order }: ReceiptViewProps) => {
  const collectionDate = new Date(order.collection_date);
  const overdueDate = addMonths(collectionDate, 3);
  const daysUntilOverdue = differenceInDays(overdueDate, new Date());
  const isOverdue = daysUntilOverdue < 0;
  const isApproachingOverdue = daysUntilOverdue <= 30 && daysUntilOverdue > 0;

  return (
    <Card className="print:shadow-none">
      <CardHeader className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Laundry Receipt</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2 text-sm sm:text-base">Customer Details</h3>
            <div className="space-y-1 text-xs sm:text-sm">
              <p><span className="text-muted-foreground">Name:</span> {order.customers.full_name}</p>
              <p><span className="text-muted-foreground">Phone:</span> {order.customers.phone_number}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-sm sm:text-base">Order Details</h3>
            <div className="space-y-1 text-xs sm:text-sm">
              <p><span className="text-muted-foreground">Date Received:</span> {format(new Date(order.date_received), "MMM dd, yyyy")}</p>
              <p><span className="text-muted-foreground">Collection Date:</span> {format(new Date(order.collection_date), "MMM dd, yyyy")}</p>
              <p><span className="text-muted-foreground">Status:</span> {order.status.toUpperCase()}</p>
              {order.status !== 'collected' && (
                <p className="flex items-center gap-2">
                  <span className="text-muted-foreground">Storage After:</span> 
                  <span>{format(overdueDate, "MMM dd, yyyy")}</span>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">Overdue</Badge>
                  )}
                  {isApproachingOverdue && (
                    <Badge variant="secondary" className="text-xs">{daysUntilOverdue} days left</Badge>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-4 text-sm sm:text-base">Items</h3>
          <div className="space-y-2">
            <div className="hidden sm:grid grid-cols-5 gap-4 text-sm font-semibold text-muted-foreground">
              <div className="col-span-2">Item</div>
              <div>Quantity</div>
              <div>Unit Price</div>
              <div className="text-right">Subtotal</div>
            </div>
            <Separator className="hidden sm:block" />
            {order.order_items?.map((item: any) => (
              <div key={item.id}>
                {/* Mobile View */}
                <div className="sm:hidden space-y-1 border-b pb-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.clothing_types.name}</span>
                    <span className="font-semibold">KES {parseFloat(item.subtotal).toFixed(2)}</span>
                  </div>
                  {item.color && (
                    <div className="text-xs text-muted-foreground">Color: {item.color}</div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {item.quantity} x KES {parseFloat(item.unit_price).toFixed(2)}
                  </div>
                </div>
                {/* Desktop View */}
                <div className="hidden sm:grid grid-cols-5 gap-4 text-sm">
                  <div className="col-span-2">
                    <div>{item.clothing_types.name}</div>
                    {item.color && (
                      <div className="text-xs text-muted-foreground">Color: {item.color}</div>
                    )}
                  </div>
                  <div>{item.quantity}</div>
                  <div>KES {parseFloat(item.unit_price).toFixed(2)}</div>
                  <div className="text-right">KES {parseFloat(item.subtotal).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-base sm:text-lg">
            <span className="font-semibold">Total Amount:</span>
            <span className="font-bold">KES {parseFloat(order.total_amount).toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-sm sm:text-base">
            <span className="text-muted-foreground">Amount Paid:</span>
            <span>KES {parseFloat(order.amount_paid).toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-base sm:text-lg font-semibold">
            <span>Balance Due:</span>
            <span className={parseFloat(order.total_amount) - parseFloat(order.amount_paid) > 0 ? "text-destructive" : "text-green-600"}>
              KES {(parseFloat(order.total_amount) - parseFloat(order.amount_paid)).toFixed(2)}
            </span>
          </div>

          {parseFloat(order.storage_fee) > 0 && (
            <div className="flex justify-between text-destructive text-sm sm:text-base">
              <span>Storage Fee:</span>
              <span>KES {parseFloat(order.storage_fee).toFixed(2)}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-1 text-xs sm:text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment Status:</span>
            <span className="font-medium uppercase">{order.payment_status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment Method:</span>
            <span className="font-medium uppercase">{order.payment_method}</span>
          </div>
        </div>

        {order.notes && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Notes</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{order.notes}</p>
            </div>
          </>
        )}

        <div className="text-center text-xs text-muted-foreground pt-4">
          <p>Thank you for your choosing us!</p>
          <p className="mt-1">Items not collected within 3 months will incur storage fees</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReceiptView;
