import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import musaLogo from "@/assets/musa-logo.png";
import {
  LayoutDashboard,
  Bot,
  Settings,
  MessageSquare,
  BarChart3,
  Users,
  ChevronDown,
  Shield,
  Gauge,
  LogOut,
  BookOpen,
  PhoneOutgoing,
  Phone,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navigation = [
  { name: "ホーム", href: "/", icon: LayoutDashboard },
  { name: "エージェント", href: "/agents", icon: Bot },
  { name: "ナレッジ", href: "/knowledge", icon: BookOpen },
  { name: "電話番号", href: "/phone-numbers", icon: Phone },
  { name: "発信", href: "/outbound-calls", icon: PhoneOutgoing },
  { name: "会話履歴", href: "/conversations", icon: MessageSquare },
  { name: "分析", href: "/analytics", icon: BarChart3 },
  { name: "利用量", href: "/usage", icon: Gauge },
  { name: "ログ", href: "/audit-logs", icon: Shield },
  { name: "チーム", href: "/team", icon: Users },
  { name: "設定", href: "/settings", icon: Settings },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const currentLocation = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "U";

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <img 
          src={musaLogo} 
          alt="MUSA" 
          className="h-8 w-auto"
        />
      </div>

      {/* Workspace Selector */}
      <div className="px-4 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl bg-sidebar-accent/50 p-3 text-left transition-colors hover:bg-sidebar-accent">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/10 text-foreground">
              <span className="text-xs font-medium">S</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                株式会社サンプル
              </p>
              <p className="text-xs text-muted-foreground">Pro</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem>株式会社サンプル</DropdownMenuItem>
            <DropdownMenuItem>個人ワークスペース</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = currentLocation.pathname === item.href || 
              (item.href !== "/" && currentLocation.pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Menu */}
      <div className="border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl p-2 transition-colors hover:bg-sidebar-accent">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-foreground/10 text-foreground text-xs font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "ユーザー"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              プロフィール
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/usage")}>
              利用状況
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
