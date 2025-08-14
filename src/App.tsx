import { Toaster } from "@/components/ui/toaster";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Registration Routes */}
            <Route path="/register/mother" element={<RegisterMother />} />
            <Route path="/register/healthworker" element={<RegisterHealthWorker />} />
            
            {/* Login Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Dashboard Routes - Now directly accessible */}
            <Route path="/dashboard/mother" element={<MotherIndex />} />
            <Route path="/dashboard/chw" element={<CHWIndex />} />
            <Route path="/dashboard/nurse" element={<NurseIndex />} />
            
            {/* Legacy redirects for old routes */}
            
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
