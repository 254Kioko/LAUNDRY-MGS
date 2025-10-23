import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Plus, Package } from "lucide-react";
import { Loader2 } from "lucide-react";
import OrderList from "@/components/OrderList";
import DashboardStats from "@/components/DashboardStats";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import type { Session } from "@supabase/supabase-js";

const CashierDashboard = () => {
  const navigate = useNavigate();
  const { role, loading } = useUserRole();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Handle authentication state with proper session management
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event);
        setSession(currentSession);
        
        // Handle auth events
        if (event === 'SIGNED_OUT') {
          navigate("/auth");
        } else if (event === 'TOKEN_REFRESHED') {
          console.log("Token refreshed successfully");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (error) {
        console.error("Error getting session:", error);
        toast({
          title: "Authentication Error",
          description: "Failed to verify session. Please login again.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      
      setSession(currentSession);
      setIsAuthChecking(false);
      
      if (!currentSession) {
        navigate("/auth");
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  // Handle role-based redirect
  useEffect(() => {
    if (!loading && !isAuthChecking && role && role !== "cashier") {
      console.log("Non-cashier role detected, redirecting to dashboard");
      navigate("/dashboard");
    }
  }, [role, loading, isAuthChecking, navigate]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show loading state while checking authentication or role
  if (loading || isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if no session
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return (
<div className="flex flex-wrap gap-2">
  {/* New Order Button */}
  <Button onClick={() => navigate("/new-order")} size="sm">
    <Plus className="mr-2 h-4 w-4" />
    <span className="hidden sm:inline">New Order</span>
    <span className="sm:hidden">New</span>
  </Button>

  {/* Customer Tracking Button */}
  <Button
    variant="secondary"
    size="sm"
    onClick={() => navigate("/track")}
  >
    <Package className="mr-2 h-4 w-4" />
    <span className="hidden sm:inline">Customer Tracking</span>
    <span className="sm:hidden">Track</span>
  </Button>

  {/* Logout Button */}
  <Button variant="outline" onClick={handleLogout} size="sm">
    <LogOut className="mr-2 h-4 w-4" />
    <span className="hidden sm:inline">Logout</span>
  </Button>
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
