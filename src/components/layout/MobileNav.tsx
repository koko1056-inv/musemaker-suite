import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  Settings,
  Plus,
  Sparkles,
  FileText,
  Wand2,
  X,
} from "lucide-react";

const mobileNavItems = [
  { name: "ホーム", href: "/", icon: LayoutDashboard },
  { name: "エージェント", href: "/agents", icon: Bot },
  { name: "", href: "/agents/new", icon: Plus, isMain: true },
  { name: "履歴/発信", href: "/conversations", icon: MessageSquare },
  { name: "設定", href: "/settings", icon: Settings },
];

const createOptions = [
  { 
    id: "template", 
    label: "テンプレート", 
    icon: FileText, 
    color: "bg-blue-500",
    description: "既存のテンプレートから作成"
  },
  { 
    id: "scratch", 
    label: "ゼロから", 
    icon: Sparkles, 
    color: "bg-purple-500",
    description: "完全にカスタマイズ"
  },
  { 
    id: "ai", 
    label: "AIアシスト", 
    icon: Wand2, 
    color: "bg-emerald-500",
    description: "AIが自動で構築"
  },
];

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleOptionClick = (optionId: string) => {
    setIsMenuOpen(false);
    // Navigate with query param to indicate creation method
    navigate(`/agents/new?method=${optionId}`);
  };

  return (
    <>
      {/* Overlay */}
      {isMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Floating menu */}
      {isMenuOpen && (
        <div className="lg:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-end gap-6 animate-scale-in">
          {createOptions.map((option, index) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              className="flex flex-col items-center gap-2 group"
              style={{ 
                animationDelay: `${index * 50}ms`,
                animation: 'scale-in 0.3s ease-out forwards'
              }}
            >
              <div 
                className={cn(
                  "h-14 w-14 rounded-full flex items-center justify-center text-white shadow-lg",
                  "transform transition-all duration-200 hover:scale-110 active:scale-95",
                  option.color
                )}
              >
                <option.icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium text-foreground bg-background/90 px-2 py-1 rounded-full shadow-sm">
                {option.label}
              </span>
            </button>
          ))}
        </div>
      )}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-pb">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== "/" && item.href !== "/agents/new" && location.pathname.startsWith(item.href));
            
            // Main action button (create new agent)
            if (item.isMain) {
              return (
                <button
                  key="main-action"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center justify-center -mt-6"
                >
                  <div 
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 active:scale-95",
                      isMenuOpen 
                        ? "bg-muted text-foreground rotate-45" 
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {isMenuOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                  </div>
                </button>
              );
            }
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMenuOpen(false)}
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
    </>
  );
}
