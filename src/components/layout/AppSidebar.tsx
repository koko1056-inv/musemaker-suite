import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import musaLogo from "@/assets/musa-logo.png";
import { LayoutDashboard, Bot, Settings, MessageSquare, BarChart3, Users, ChevronDown, Shield, Gauge, LogOut, BookOpen, PhoneOutgoing, Phone, HelpCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
const navigation = [{
  name: "ホーム",
  href: "/",
  icon: LayoutDashboard
}, {
  name: "エージェント",
  href: "/agents",
  icon: Bot
}, {
  name: "ナレッジ",
  href: "/knowledge",
  icon: BookOpen
}, {
  name: "電話番号",
  href: "/phone-numbers",
  icon: Phone
}, {
  name: "発信",
  href: "/outbound-calls",
  icon: PhoneOutgoing
}, {
  name: "会話履歴",
  href: "/conversations",
  icon: MessageSquare
}, {
  name: "分析",
  href: "/analytics",
  icon: BarChart3
}, {
  name: "利用量",
  href: "/usage",
  icon: Gauge
}, {
  name: "ログ",
  href: "/audit-logs",
  icon: Shield
}, {
  name: "チーム",
  href: "/team",
  icon: Users
}, {
  name: "設定",
  href: "/settings",
  icon: Settings
}, {
  name: "使い方",
  href: "/guide",
  icon: HelpCircle
}];
interface AppSidebarProps {
  onNavigate?: () => void;
}
export function AppSidebar({
  onNavigate
}: AppSidebarProps) {
  const currentLocation = useLocation();
  const navigate = useNavigate();
  const {
    user,
    signOut
  } = useAuth();
  const {
    workspace,
    isLoading: isWorkspaceLoading
  } = useWorkspace();
  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };
  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "U";
  const workspaceInitial = workspace?.name?.charAt(0).toUpperCase() || "W";
  const handleNavClick = () => {
    onNavigate?.();
  };
  return <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="flex h-20 items-center justify-center px-6">
        <img src={musaLogo} alt="MUSA" className="h-12 w-auto" />
      </div>

      {/* Workspace Selector */}
      {workspace}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map(item => {
          const isActive = currentLocation.pathname === item.href || item.href !== "/" && currentLocation.pathname.startsWith(item.href);
          return <Link key={item.name} to={item.href} onClick={handleNavClick} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-serif font-medium transition-all duration-200", isActive ? "bg-foreground text-background" : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent")}>
                <item.icon className="h-[18px] w-[18px]" />
                <span>{item.name}</span>
              </Link>;
        })}
        </div>
      </nav>

      {/* User Menu */}
      <div className="border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl p-2 transition-colors hover:bg-sidebar-accent">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-foreground/10 text-foreground text-xs font-serif font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-serif font-medium text-sidebar-foreground truncate">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "ユーザー"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate("/settings")} className="font-serif">
              プロフィール
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/usage")} className="font-serif">
              利用状況
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive font-serif">
              <LogOut className="mr-2 h-4 w-4" />
              ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>;
}