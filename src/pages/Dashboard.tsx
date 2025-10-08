import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Plus, Package, DollarSign, Clock, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import OrderList from "@/components/OrderList";
import DashboardStats from "@/components/DashboardStats";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    updateOverdueOrders();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
    setLoading(false);
  };

  const updateOverdueOrders = async () => {
    try {
      const { error } = await supabase.rpc('update_overdue_orders');
      if (error) console.error('Error updating overdue orders:', error);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Laundry Management</h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/new-order")}>
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <DashboardStats />

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="ready">Ready</TabsTrigger>
                <TabsTrigger value="collected">Collected</TabsTrigger>
                <TabsTrigger value="overdue">Overdue</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <OrderList status="all" />
              </TabsContent>
              <TabsContent value="pending">
                <OrderList status="pending" />
              </TabsContent>
              <TabsContent value="ready">
                <OrderList status="ready" />
              </TabsContent>
              <TabsContent value="collected">
                <OrderList status="collected" />
              </TabsContent>
              <TabsContent value="overdue">
                <OrderList status="overdue" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
