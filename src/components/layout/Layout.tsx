import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="relative min-h-screen">
      <button
        onClick={() => window.history.back()}
        className="absolute top-4 left-4 z-50 bg-white rounded-full shadow hover:bg-accent p-2"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5 md:h-7 md:w-7 lg:h-9 lg:w-9" />
      </button>
      {children}
    </div>
  );
}