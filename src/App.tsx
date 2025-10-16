import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CashierDashboard from "./pages/CashierDashboard";
import NewOrder from "./pages/NewOrder";
import Receipt from "./pages/Receipt";
import TrackOrder from "./pages/TrackOrder";
import DashboardTrack from "./pages/DashboardTrack";
import CCTV from "./pages/CCTV";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cashier-dashboard" element={<CashierDashboard />} />
          <Route path="/dashboard/track" element={<DashboardTrack />} />
          <Route path="/cctv" element={<CCTV />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/new-order" element={<NewOrder />} />
          <Route path="/receipt/:orderId" element={<Receipt />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
