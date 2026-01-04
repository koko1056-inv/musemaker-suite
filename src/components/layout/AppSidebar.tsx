import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Bot,
  Settings,
  MessageSquare,
  BarChart3,
  Users,
  ChevronDown,
  Mic,
  Zap,
  Shield,
  Gauge,
  LogOut,
  BookOpen,
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
  { name: "ホーム", href: "/", icon: LayoutDashboard, description: "概要を見る" },
  { name: "エージェント", href: "/agents", icon: Bot, description: "AI作成・管理" },
  { name: "ナレッジ", href: "/knowledge", icon: BookOpen, description: "知識を登録" },
  { name: "会話履歴", href: "/conversations", icon: MessageSquare, description: "通話記録" },
  { name: "分析", href: "/analytics", icon: BarChart3, description: "データ分析" },
  { name: "利用量", href: "/usage", icon: Gauge, description: "使用状況" },
  { name: "ログ", href: "/audit-logs", icon: Shield, description: "操作履歴" },
  { name: "チーム", href: "/team", icon: Users, description: "メンバー管理" },
  { name: "設定", href: "/settings", icon: Settings, description: "各種設定" },
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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar flex flex-col lg:w-64">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
          <Mic className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold text-sidebar-foreground tracking-tight">VoiceForge</span>
      </div>

      {/* Workspace Selector */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg bg-sidebar-accent p-3 text-left transition-colors hover:bg-sidebar-accent/80">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Zap className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">株式会社サンプル</p>
              <p className="text-xs text-muted-foreground">Proプラン</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem>
              <Zap className="mr-2 h-4 w-4" />
              株式会社サンプル
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Zap className="mr-2 h-4 w-4" />
              個人ワークスペース
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = currentLocation.pathname === item.href || 
            (item.href !== "/" && currentLocation.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 min-h-[52px]",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="block">{item.name}</span>
                {!isActive && (
                  <span className="block text-xs text-muted-foreground/80 truncate">{item.description}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Menu */}
      <div className="border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-sidebar-accent">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">{userInitials}</AvatarFallback>
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
            <DropdownMenuItem onClick={() => navigate("/settings")}>プロフィール</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/usage")}>利用状況</DropdownMenuItem>
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
