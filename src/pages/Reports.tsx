import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Reports = () => {
  const navigate = useNavigate();
  const { role, loading } = useUserRole();
  const [stats, setStats] = useState({
    totalOrders: 0,
    delayedOrders: 0,
    overdueOrders: 0,
    collectedOrders: 0,
    totalRevenue: 0,
  });

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
    if (!loading && role !== "admin") {
      navigate("/dashboard");
    }
  }, [role, loading, navigate]);

  useEffect(() => {
    if (role === "admin") {
      fetchStats();
    }
  }, [role]);

  const fetchStats = async () => {
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("status, total_amount, amount_paid");

      if (error) throw error;

      const totalOrders = orders?.length || 0;
      const delayedOrders = orders?.filter(o => o.status === "delayed").length || 0;
      const overdueOrders = orders?.filter(o => o.status === "overdue").length || 0;
      const collectedOrders = orders?.filter(o => o.status === "collected").length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + parseFloat(String(o.amount_paid || 0)), 0) || 0;

      setStats({
        totalOrders,
        delayedOrders,
        overdueOrders,
        collectedOrders,
        totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const downloadCSV = async () => {
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          *,
          customers (full_name, phone_number)
        `);

      if (error) throw error;

      const csv = [
        ["Order ID", "Customer", "Phone", "Status", "Total Amount", "Amount Paid", "Collection Date"].join(","),
        ...orders.map(o => [
          o.id,
          o.customers?.full_name || "",
          o.customers?.phone_number || "",
          o.status,
          o.total_amount,
          o.amount_paid,
          o.collection_date,
        ].join(","))
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-report-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();

      toast({
        title: "Report Downloaded",
        description: "CSV report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    }
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
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Reports
            </h1>
            <Button onClick={downloadCSV}>
              <Download className="mr-2 h-4 w-4" />
              Download Report (CSV)
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Delayed Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.delayedOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Overdue Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdueOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Collected Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.collectedOrders}</div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Reports;
