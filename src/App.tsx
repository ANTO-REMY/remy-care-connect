import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import "./App.css";
const LandingPage = lazy(() => import("./pages/LandingPage"));
const RegisterMother = lazy(() => import("./pages/RegisterMother"));
const RegisterHealthWorker = lazy(() => import("./pages/RegisterHealthWorker"));
const LoginMother = lazy(() => import("./pages/LoginMother"));
const Login = lazy(() => import("./pages/Login"));
const LoginCHW = lazy(() => import("./pages/LoginCHW"));
const LoginNurse = lazy(() => import("./pages/LoginNurse"));
const LoginFacilityStaff = lazy(() => import("./pages/LoginFacilityStaff"));
const MotherIndex = lazy(() => import("./pages/MotherIndex"));
const ModernMotherIndex = lazy(() => import("./pages/ModernMotherIndex"));
const CHWIndex = lazy(() => import("./pages/CHWIndex"));
const NurseIndex = lazy(() => import("./pages/NurseIndex"));
const FacilityIndex = lazy(() => import("./pages/FacilityIndex"));
const RegisterFacilityAdmin = lazy(() => import("./pages/RegisterFacilityAdmin"));
const MotherSettings = lazy(() => import("./pages/MotherSettings"));
const CHWSettings = lazy(() => import("./pages/CHWSettings"));
const NurseSettings = lazy(() => import("./pages/NurseSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
const MotherProfile = lazy(() => import("@/components/mother/MotherProfile").then((m) => ({ default: m.MotherProfile })));
const CHWProfile = lazy(() => import("@/components/chw/CHWProfile").then((m) => ({ default: m.CHWProfile })));
const NurseProfile = lazy(() => import("@/components/nurse/NurseProfile").then((m) => ({ default: m.NurseProfile })));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="app-shell">
    <div className="app-shell-inner flex min-h-[40vh] items-center justify-center">
      <div className="dashboard-glass px-6 py-4 text-sm text-muted-foreground">Loading page...</div>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SocketProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Layout><LandingPage /></Layout>} />
              {/* Registration Routes */}
              <Route path="/register/mother" element={<Layout><RegisterMother /></Layout>} />
              <Route path="/register/healthworker" element={<Layout><RegisterHealthWorker /></Layout>} />
              <Route path="/register/facility-admin" element={<Layout><RegisterFacilityAdmin /></Layout>} />
              {/* Legacy nurse registration route (backward compatible) */}
              <Route path="/register/nurse" element={<Layout><RegisterHealthWorker /></Layout>} />
              {/* Login Routes */}
              <Route path="/login" element={<Layout><Login /></Layout>} />
              <Route path="/login/mother" element={<Layout><LoginMother /></Layout>} />
              <Route path="/login/chw" element={<Layout><LoginCHW /></Layout>} />
              <Route path="/login/nurse" element={<Layout><LoginNurse /></Layout>} />
              <Route path="/login/facility" element={<Layout><LoginFacilityStaff /></Layout>} />
              {/* Dashboard Routes - Protected by role */}
              <Route path="/dashboard/mother" element={<Layout><ProtectedRoute requiredRole="mother"><MotherIndex /></ProtectedRoute></Layout>} />
              <Route path="/dashboard/mother/modern" element={<Layout><ProtectedRoute requiredRole="mother"><ModernMotherIndex /></ProtectedRoute></Layout>} />
              <Route path="/dashboard/chw" element={<Layout><ProtectedRoute requiredRole="chw"><CHWIndex /></ProtectedRoute></Layout>} />
              <Route path="/dashboard/nurse" element={<Layout><ProtectedRoute requiredRole="nurse"><NurseIndex /></ProtectedRoute></Layout>} />
              <Route path="/dashboard/facility" element={<Layout><ProtectedRoute requiredRole="facility_staff"><FacilityIndex /></ProtectedRoute></Layout>} />
              {/* Profile Routes - Protected by role */}
              <Route path="/dashboard/mother/profile" element={<Layout><ProtectedRoute requiredRole="mother"><MotherProfile /></ProtectedRoute></Layout>} />
              <Route path="/dashboard/chw/profile" element={<Layout><ProtectedRoute requiredRole="chw"><CHWProfile /></ProtectedRoute></Layout>} />
              <Route path="/dashboard/nurse/profile" element={<Layout><ProtectedRoute requiredRole="nurse"><NurseProfile /></ProtectedRoute></Layout>} />
              <Route path="/dashboard/mother/settings" element={<Layout><ProtectedRoute requiredRole="mother"><MotherSettings /></ProtectedRoute></Layout>} />
              <Route path="/dashboard/chw/settings" element={<Layout><ProtectedRoute requiredRole="chw"><CHWSettings /></ProtectedRoute></Layout>} />
              <Route path="/dashboard/nurse/settings" element={<Layout><ProtectedRoute requiredRole="nurse"><NurseSettings /></ProtectedRoute></Layout>} />
              {/* 404 Route */}
              <Route path="*" element={<Layout><NotFound /></Layout>} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
      </SocketProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
