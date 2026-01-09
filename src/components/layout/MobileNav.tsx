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
    gradient: "from-blue-500 to-cyan-400",
    shadowColor: "shadow-blue-500/30",
    position: { x: -80, y: -100 }
  },
  { 
    id: "scratch", 
    label: "ゼロから", 
    icon: Sparkles, 
    gradient: "from-violet-500 to-purple-400",
    shadowColor: "shadow-violet-500/30",
    position: { x: 0, y: -130 }
  },
  { 
    id: "ai", 
    label: "AIアシスト", 
    icon: Wand2, 
    gradient: "from-emerald-500 to-teal-400",
    shadowColor: "shadow-emerald-500/30",
    position: { x: 80, y: -100 }
  },
];

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleOptionClick = (optionId: string) => {
    setIsMenuOpen(false);
    navigate(`/agents/new?method=${optionId}`);
  };

  return (
    <>
      {/* Overlay with blur */}
      <div 
        className={cn(
          "lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-md transition-all duration-300",
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Floating radial menu */}
      <div className="lg:hidden fixed bottom-16 left-1/2 -translate-x-1/2 z-50">
        {createOptions.map((option, index) => (
          <button
            key={option.id}
            onClick={() => handleOptionClick(option.id)}
            className={cn(
              "absolute flex flex-col items-center gap-2 transition-all duration-500 ease-out",
              isMenuOpen 
                ? "opacity-100 scale-100" 
                : "opacity-0 scale-0"
            )}
            style={{ 
              transform: isMenuOpen 
                ? `translate(calc(-50% + ${option.position.x}px), ${option.position.y}px)` 
                : 'translate(-50%, 0)',
              transitionDelay: isMenuOpen ? `${index * 80}ms` : '0ms',
              left: '50%',
            }}
          >
            {/* Glow effect */}
            <div 
              className={cn(
                "absolute inset-0 rounded-full blur-xl opacity-60 bg-gradient-to-br",
                option.gradient
              )}
              style={{ transform: 'scale(1.2)' }}
            />
            
            {/* Button */}
            <div 
              className={cn(
                "relative h-16 w-16 rounded-full flex items-center justify-center text-white shadow-2xl",
                "bg-gradient-to-br transform transition-transform duration-200 hover:scale-110 active:scale-95",
                "border border-white/20",
                option.gradient,
                option.shadowColor
              )}
            >
              <option.icon className="h-7 w-7 drop-shadow-lg" />
            </div>
            
            {/* Label with glassmorphism */}
            <span className="text-xs font-semibold text-white bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 shadow-lg whitespace-nowrap">
              {option.label}
            </span>
          </button>
        ))}
      </div>

      {/* Bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-pb">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== "/" && item.href !== "/agents/new" && location.pathname.startsWith(item.href));
            
            // Main action button
            if (item.isMain) {
              return (
                <button
                  key="main-action"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center justify-center -mt-6"
                >
                  {/* Outer glow ring */}
                  <div 
                    className={cn(
                      "absolute h-16 w-16 rounded-full transition-all duration-500",
                      isMenuOpen 
                        ? "bg-gradient-to-br from-violet-500/30 to-purple-500/30 animate-pulse scale-110" 
                        : "scale-100"
                    )}
                  />
                  
                  {/* Main button */}
                  <div 
                    className={cn(
                      "relative flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-300 active:scale-95",
                      isMenuOpen 
                        ? "bg-gradient-to-br from-violet-600 to-purple-500 rotate-45" 
                        : "bg-gradient-to-br from-primary to-primary/80 hover:shadow-primary/30 hover:shadow-2xl"
                    )}
                  >
                    <Plus 
                      className={cn(
                        "h-6 w-6 text-white transition-transform duration-300",
                        isMenuOpen && "rotate-0"
                      )} 
                    />
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
