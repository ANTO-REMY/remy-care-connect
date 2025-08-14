import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Heart, 
  Users, 
  UserCheck, 
  Home, 
  MessageCircle, 
  AlertTriangle,
  BookOpen,
  Settings,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userRole: 'mother' | 'chw' | 'nurse';
}

const sidebarItems = {
  mother: [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "Weekly Tips", url: "/tips", icon: BookOpen },
    { title: "My CHW", url: "/chw-contact", icon: UserCheck },
    { title: "Messages", url: "/messages", icon: MessageCircle },
  ],
  chw: [
    { title: "Dashboard", url: "/chw", icon: Home },
    { title: "My Mothers", url: "/chw/mothers", icon: Users },
    { title: "Alerts", url: "/chw/alerts", icon: AlertTriangle },
    { title: "Education", url: "/chw/education", icon: BookOpen },
  ],
  nurse: [
    { title: "Dashboard", url: "/nurse", icon: Home },
    { title: "Critical Cases", url: "/nurse/cases", icon: AlertTriangle },
    { title: "Resources", url: "/nurse/resources", icon: BookOpen },
    { title: "Communication", url: "/nurse/communication", icon: MessageCircle },
  ]
};

export function Sidebar({ userRole }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const items = sidebarItems[userRole];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="sm"
        className="md:hidden fixed top-4 left-4 z-50 bg-background"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-border transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-xl font-bold text-primary">RemyAfya</h1>
                <p className="text-sm text-muted-foreground capitalize">
                  {userRole} Portal
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.title}>
                  <NavLink
                    to={item.url}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive: navIsActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        navIsActive || isActive(item.url)
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    {item.title}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}