import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileMenuPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (href: string) => void;
  onLogin: () => void;
  onRegister: () => void;
}

const navigationItems = [
  { label: "Platform", href: "#platform" },
  { label: "Features", href: "#features" },
  { label: "Impact", href: "#impact" }
];

export const MobileMenuPanel = ({ isOpen, onClose, onNavigate, onLogin, onRegister }: MobileMenuPanelProps) => {
  if (!isOpen) return null;
  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-b border-border shadow-lg transition-all duration-300 my-4 md:mx-auto rounded-xl",
      isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
    )} style={{ top: 73 }}>
      <div className="flex flex-col items-center py-6 px-2 max-w-xs mx-auto">
        <nav className="flex flex-col items-center space-y-3 mb-8 w-full">
          {navigationItems.map((item) => (
            <button
              key={item.href}
              onClick={() => {
                onNavigate(item.href);
                onClose();
              }}
              className="w-full px-4 py-2 text-lg font-medium text-foreground hover:text-accent transition-colors hover:bg-accent/10 rounded-lg border-2 border-border focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="flex flex-col items-center space-y-4 w-full">
          <Button
            onClick={() => { onLogin(); onClose(); }}
            variant="outline"
            size="default"
            className="w-full px-4 py-2 min-h-[44px] border-2 border-border"
          >
            Login
          </Button>
          <Button
            onClick={() => { onRegister(); onClose(); }}
            size="default"
            className="w-full px-4 py-2 min-h-[44px] font-semibold border-2 border-blue-900 bg-blue-900 hover:bg-blue-800 text-white"
          >
            Register
          </Button>
        </div>
      </div>
    </div>
  );
};