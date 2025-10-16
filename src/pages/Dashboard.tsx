import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Plus, Search, Camera, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import OrderList from "@/components/OrderList";
import DashboardStats from "@/components/DashboardStats";
import { useUserRole } from "@/hooks/useUserRole";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { role, loading: roleLoading } = useUserRole();

  useEffect(() => {
    checkUser();
    updateOverdueOrders();
  }, []);

  useEffect(() => {
    if (!roleLoading && role === "cashier") {
      navigate("/cashier-dashboard");
    }
  }, [role, roleLoading, navigate]);

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
        <div className="container mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            {role === "admin" && (
              <>
                <Button onClick={() => navigate("/cctv")} size="sm" variant="outline">
                  <Camera className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">CCTV</span>
                </Button>
                <Button onClick={() => navigate("/reports")} size="sm" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Reports</span>
                </Button>
              </>
            )}
            <Button onClick={() => navigate("/dashboard/track")} size="sm" variant="outline">
              <Search className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Track Order</span>
              <span className="sm:hidden">Track</span>
            </Button>
            <Button onClick={() => navigate("/new-order")} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">New Order</span>
              <span className="sm:hidden">New</span>
            </Button>
            <Button variant="outline" onClick={handleSignOut} size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
              <span className="sm:hidden">Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-8">
        <DashboardStats />

        <Card className="mt-4 sm:mt-8">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-6 h-auto gap-1">
                <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs sm:text-sm">Pending</TabsTrigger>
                <TabsTrigger value="in_progress" className="text-xs sm:text-sm">In Progress</TabsTrigger>
                <TabsTrigger value="ready" className="text-xs sm:text-sm">Ready</TabsTrigger>
                <TabsTrigger value="delayed" className="text-xs sm:text-sm">Delayed</TabsTrigger>
                <TabsTrigger value="collected" className="text-xs sm:text-sm">Collected</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <OrderList status="all" />
              </TabsContent>
              <TabsContent value="pending">
                <OrderList status="pending" />
              </TabsContent>
              <TabsContent value="in_progress">
                <OrderList status="in_progress" />
              </TabsContent>
              <TabsContent value="ready">
                <OrderList status="ready" />
              </TabsContent>
              <TabsContent value="delayed">
                <OrderList status="delayed" />
              </TabsContent>
              <TabsContent value="collected">
                <OrderList status="collected" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
