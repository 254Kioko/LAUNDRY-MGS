import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, Clock, CheckCircle } from "lucide-react";

const DashboardStats = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    readyOrders: 0,
    collectedOrders: 0,
    totalIncome: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel('stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("status, payment_status, total_amount, amount_paid");

      if (error) throw error;

      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter(o => o.status === "pending").length || 0;
      const readyOrders = orders?.filter(o => o.status === "ready").length || 0;
      const collectedOrders = orders?.filter(o => o.status === "collected").length || 0;
      
      const totalIncome = orders?.reduce((sum, o) => 
        sum + (parseFloat(o.amount_paid.toString()) || 0), 0
      ) || 0;
      
      const pendingPayments = orders?.reduce((sum, o) => 
        sum + (parseFloat(o.total_amount.toString()) - parseFloat(o.amount_paid.toString())), 0
      ) || 0;

      setStats({
        totalOrders,
        pendingOrders,
        readyOrders,
        collectedOrders,
        totalIncome,
        pendingPayments,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const statCards = [
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Pending",
      value: stats.pendingOrders.toString(),
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "Ready for Pickup",
      value: stats.readyOrders.toString(),
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Total Income",
      value: `KES ${stats.totalIncome.toFixed(2)}`,
      icon: DollarSign,
      color: "text-emerald-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
