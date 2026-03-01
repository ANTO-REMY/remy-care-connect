import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import LandingPage from "./pages/LandingPage";
import RegisterMother from "./pages/RegisterMother";
import RegisterHealthWorker from "./pages/RegisterHealthWorker";
import LoginMother from "./pages/LoginMother";
import Login from "./pages/Login";
import LoginCHW from "./pages/LoginCHW";
import LoginNurse from "./pages/LoginNurse";
import MotherIndex from "./pages/MotherIndex";
import ModernMotherIndex from "./pages/ModernMotherIndex";
import CHWIndex from "./pages/CHWIndex";
import NurseIndex from "./pages/NurseIndex";
import NotFound from "./pages/NotFound";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MotherProfile } from "@/components/mother/MotherProfile";
import { CHWProfile } from "@/components/chw/CHWProfile";
import { NurseProfile } from "@/components/nurse/NurseProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SocketProvider>
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
            {/* Dashboard Routes - Protected by role */}
            <Route path="/dashboard/mother" element={<Layout><ProtectedRoute requiredRole="mother"><MotherIndex /></ProtectedRoute></Layout>} />
            <Route path="/dashboard/mother/modern" element={<Layout><ProtectedRoute requiredRole="mother"><ModernMotherIndex /></ProtectedRoute></Layout>} />
            <Route path="/dashboard/chw" element={<Layout><ProtectedRoute requiredRole="chw"><CHWIndex /></ProtectedRoute></Layout>} />
            <Route path="/dashboard/nurse" element={<Layout><ProtectedRoute requiredRole="nurse"><NurseIndex /></ProtectedRoute></Layout>} />
            {/* Profile Routes - Protected by role */}
            <Route path="/dashboard/mother/profile" element={<Layout><ProtectedRoute requiredRole="mother"><MotherProfile /></ProtectedRoute></Layout>} />
            <Route path="/dashboard/chw/profile" element={<Layout><ProtectedRoute requiredRole="chw"><CHWProfile /></ProtectedRoute></Layout>} />
            <Route path="/dashboard/nurse/profile" element={<Layout><ProtectedRoute requiredRole="nurse"><NurseProfile /></ProtectedRoute></Layout>} />
            {/* 404 Route */}
            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </SocketProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
