import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  Settings,
  Plus,
} from "lucide-react";

const mobileNavItems = [
  { name: "ホーム", href: "/", icon: LayoutDashboard },
  { name: "エージェント", href: "/agents", icon: Bot },
  { name: "", href: "/agents/new", icon: Plus, isMain: true },
  { name: "履歴", href: "/conversations", icon: MessageSquare },
  { name: "設定", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/" && item.href !== "/agents/new" && location.pathname.startsWith(item.href));
          
          // Main action button (create new agent)
          if (item.isMain) {
            return (
              <Link
                key="main-action"
                to={item.href}
                className="flex items-center justify-center -mt-6"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors active:scale-95">
                  <Plus className="h-6 w-6" />
                </div>
              </Link>
            );
          }
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[56px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground active:bg-muted"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
