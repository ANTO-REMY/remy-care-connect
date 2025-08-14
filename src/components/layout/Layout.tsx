import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with logout */}
      <header className="bg-background border-b px-3 sm:px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary">RemyAfya</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {user?.name}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>
      
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar userRole={user?.role || 'mother'} />
        <main className="flex-1 md:ml-0 pt-16 md:pt-0 w-full overflow-x-hidden">
          <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}