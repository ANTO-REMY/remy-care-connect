import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import RegisterMother from "./pages/RegisterMother";
import RegisterHealthWorker from "./pages/RegisterHealthWorker";
import LoginMother from "./pages/LoginMother";
import Login from "./pages/Login";
import LoginCHW from "./pages/LoginCHW";
import LoginNurse from "./pages/LoginNurse";
import MotherIndex from "./pages/MotherIndex";
import CHWIndex from "./pages/CHWIndex";
import NurseIndex from "./pages/NurseIndex";
import NotFound from "./pages/NotFound";
import { Layout } from "@/components/layout/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout><LandingPage /></Layout>} />
            {/* Registration Routes */}
            <Route path="/register/mother" element={<Layout><RegisterMother /></Layout>} />
            <Route path="/register/healthworker" element={<Layout><RegisterHealthWorker /></Layout>} />
            {/* Login Routes */}
            <Route path="/login" element={<Layout><Login /></Layout>} />
            <Route path="/login/mother" element={<Layout><LoginMother /></Layout>} />
            <Route path="/login/chw" element={<Layout><LoginCHW /></Layout>} />
            <Route path="/login/nurse" element={<Layout><LoginNurse /></Layout>} />
            {/* Dashboard Routes - Now directly accessible */}
            <Route path="/dashboard/mother" element={<Layout><MotherIndex /></Layout>} />
            <Route path="/dashboard/chw" element={<Layout><CHWIndex /></Layout>} />
            <Route path="/dashboard/nurse" element={<Layout><NurseIndex /></Layout>} />
            {/* 404 Route */}
            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
