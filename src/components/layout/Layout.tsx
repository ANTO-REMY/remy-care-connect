import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isLandingPage = location.pathname === "/";
  // The global back button logic here was absolute positioning it top-left which messed with headers.
  // Instead of adding a fixed global button, we will provide a container layout
  // and handle the back button specifically in headers, or for non-dashboard pages, we can show it globally.
  // Let's hide the global back button if we are on a dashboard or profile page,
  // and manually add it to their headers instead.

  const isDashboardOrProfile = location.pathname.includes("/dashboard") || location.pathname.includes("/profile");

  return (
    <div className="relative min-h-screen">
      {!isLandingPage && !isDashboardOrProfile && (
        <button
          onClick={() => navigate(-1)}
          className={cn(
            "absolute top-4 left-4 z-50 p-3 rounded-full shadow-lg transition-all duration-300",
            "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105",
            "border-2 border-primary/20"
          )}
          aria-label="Go back"
        >
          <ArrowLeft className="h-6 w-6 md:h-8 md:w-8" strokeWidth={2.5} />
        </button>
      )}
      {children}
    </div>
  );
}
