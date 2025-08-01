import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { currentUser } from "@/data/mockData";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <Sidebar userRole={currentUser.role} />
      <main className="flex-1 md:ml-0 pt-16 md:pt-0 w-full overflow-x-hidden">
        <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}