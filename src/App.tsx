import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RoleSelector from "./pages/RoleSelector";
import MotherIndex from "./pages/MotherIndex";
import CHWIndex from "./pages/CHWIndex";
import NurseIndex from "./pages/NurseIndex";
import NotFound from "./pages/NotFound";
import LandingPagePhotos from "./pages/LandingPagePhotos";
import LandingPageIllustrations from "./pages/LandingPageIllustrations";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleSelector />} />
          <Route path="/landing-photos" element={<LandingPagePhotos />} />
          <Route path="/landing-illustrations" element={<LandingPageIllustrations />} />
          <Route path="/mother" element={<MotherIndex />} />
          <Route path="/chw" element={<CHWIndex />} />
          <Route path="/nurse" element={<NurseIndex />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
