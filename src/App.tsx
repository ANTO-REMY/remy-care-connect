import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import RegisterMother from "./pages/RegisterMother";
import RegisterHealthWorker from "./pages/RegisterHealthWorker";
import LoginMother from "./pages/LoginMother";
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
            <Route path="/login/mother" element={<LoginMother />} />
            <Route path="/login/chw" element={<LoginCHW />} />
            <Route path="/login/nurse" element={<LoginNurse />} />
            
            {/* Protected Dashboard Routes */}
            <Route 
              path="/dashboard/mother" 
              element={
                <ProtectedRoute requiredRole="mother">
                  <MotherIndex />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/chw" 
              element={
                <ProtectedRoute requiredRole="chw">
                  <CHWIndex />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/nurse" 
              element={
                <ProtectedRoute requiredRole="nurse">
                  <NurseIndex />
                </ProtectedRoute>
              } 
            />
            
            {/* Legacy redirects for old routes */}
            <Route path="/mother" element={<LoginMother />} />
            <Route path="/chw" element={<LoginCHW />} />
            <Route path="/nurse" element={<LoginNurse />} />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
