import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { currentUser } from "@/data/mockData";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar userRole={currentUser.role} />
      <main className="flex-1 md:ml-0 pt-16 md:pt-0">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}