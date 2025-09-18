import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { HamburgerButton } from "@/components/ui/HamburgerButton";
import { MobileMenuPanel } from "@/components/ui/MobileMenuPanel";
import { cn } from "@/lib/utils";

interface NavigationProps {
  className?: string;
  onLogin: () => void;
  onRegister: () => void;
}

export const Navigation = ({ className, onLogin, onRegister }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // RemyAfya title: never changes style on click/hover/focus
  const handleTitleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = '/';
  };

  // Desktop nav: scroll to anchor
  const handleDesktopNav = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Mobile nav: scroll or navigate
  const handleMobileNavigate = (href: string) => {
    if (window.location.pathname === "/") {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.location.href = `/${href}`;
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        ref={navRef}
        className={cn(
          "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b border-border",
          className
        )}
      >
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <a
                href="/"
                className="text-3xl font-black tracking-tight text-primary cursor-pointer rounded-md px-2 py-1 select-none"
                onClick={handleTitleClick}
                style={{ userSelect: 'none' }}
              >
                RemyAfya
              </a>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-1 justify-center">
              <div className="flex items-center space-x-6 lg:space-x-8">
                <a href="#platform" onClick={e => handleDesktopNav(e, '#platform')} className="text-sm lg:text-base text-foreground transition-colors">Platform</a>
                <a href="#features" onClick={e => handleDesktopNav(e, '#features')} className="text-sm lg:text-base text-foreground transition-colors">Features</a>
                <a href="#impact" onClick={e => handleDesktopNav(e, '#impact')} className="text-sm lg:text-base text-foreground transition-colors">Impact</a>
              </div>
            </div>
            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Button onClick={onLogin} variant="outline" size="sm" className="text-sm">Login</Button>
              <Button onClick={onRegister} variant="default" size="sm" className="text-sm font-semibold">Register</Button>
            </div>
            {/* Mobile Hamburger Button */}
            <div className="md:hidden">
              <HamburgerButton
                ref={hamburgerRef}
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(prev => !prev)}
              />
            </div>
          </div>
        </div>
      </nav>
      <MobileMenuPanel
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onLogin={onLogin}
        onRegister={onRegister}
        onNavigate={handleMobileNavigate}
      />
    </>
  );
};