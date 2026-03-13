import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLocation } from "react-router-dom";
import musaLogo from "@/assets/musa-logo.png";

const routeTitles: Record<string, string> = {
  "/": "ホーム",
  "/agents": "エージェント",
  "/agents/new": "新規作成",
  "/conversations": "会話履歴",
  "/settings": "設定",
};

function usePageTitle(): string {
  const { pathname } = useLocation();
  // Exact match first
  if (routeTitles[pathname]) return routeTitles[pathname];
  // Prefix match for nested routes (e.g. /agents/some-id)
  const match = Object.keys(routeTitles)
    .filter((key) => key !== "/" && pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  return match ? routeTitles[match] : "";
}

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pageTitle = usePageTitle();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-full items-center justify-between px-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-5 w-5" />
                <span className="sr-only">メニューを開く</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <AppSidebar onNavigate={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Center: page title or logo */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
            {pageTitle ? (
              <span className="text-sm font-serif font-semibold">{pageTitle}</span>
            ) : (
              <img src={musaLogo} alt="MUSA" className="h-8 w-auto" />
            )}
          </div>

          <div className="w-10" /> {/* Spacer for balance */}
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64 pt-14 lg:pt-0 min-h-screen">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
