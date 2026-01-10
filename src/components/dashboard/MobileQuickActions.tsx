import { Link } from "react-router-dom";
import { Plus, History, Phone, Settings } from "lucide-react";

export function MobileQuickActions() {
  const actions = [
    { to: "/agents/new", icon: Plus, label: "作成", primary: true },
    { to: "/conversations", icon: History, label: "履歴" },
    { to: "/outbound-calls", icon: Phone, label: "発信" },
    { to: "/settings", icon: Settings, label: "設定" },
  ];

  return (
    <div className="lg:hidden grid grid-cols-4 gap-2 mb-6">
      {actions.map((action) => (
        <Link
          key={action.to}
          to={action.to}
          className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl transition-colors touch-target ${
            action.primary
              ? "bg-foreground text-background active:opacity-90"
              : "bg-muted/50 text-foreground active:bg-muted"
          }`}
        >
          <action.icon className="h-5 w-5" />
          <span className="text-xs font-medium">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
