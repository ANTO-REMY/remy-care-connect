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

  return (
    <div className="relative min-h-screen">
      {!isLandingPage && (
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
