import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Plus } from "lucide-react";
import OrderList from "@/components/OrderList";
import DashboardStats from "@/components/DashboardStats";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

const CashierDashboard = () => {
  const navigate = useNavigate();
  const { role, loading } = useUserRole();
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!loading && role !== "cashier") {
      navigate("/dashboard");
    }
  }, [role, loading, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold">Cashier Dashboard</h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/new-order")} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">New Order</span>
              <span className="sm:hidden">New</span>
            </Button>
            <Button variant="outline" onClick={handleLogout} size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6">
          <DashboardStats />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-6 gap-1">
            <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm">Pending</TabsTrigger>
            <TabsTrigger value="in_progress" className="text-xs sm:text-sm">In Progress</TabsTrigger>
            <TabsTrigger value="ready" className="text-xs sm:text-sm">Ready</TabsTrigger>
            <TabsTrigger value="delayed" className="text-xs sm:text-sm">Delayed</TabsTrigger>
            <TabsTrigger value="collected" className="text-xs sm:text-sm hidden lg:block">Collected</TabsTrigger>
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
      </main>
    </div>
  );
};

export default CashierDashboard;
