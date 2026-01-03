import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface ActionCardProps {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
  className?: string;
}

export function ActionCard({
  to,
  icon,
  title,
  description,
  highlight,
  className,
}: ActionCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex flex-col items-center p-6 rounded-xl border transition-all duration-200",
        "hover:shadow-lg hover:border-primary/30 hover:-translate-y-1",
        highlight
          ? "bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20"
          : "bg-card border-border",
        className
      )}
    >
      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-xl mb-4 transition-colors",
          highlight ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        )}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground text-center">{description}</p>
      <div
        className={cn(
          "absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity",
          "text-muted-foreground group-hover:text-primary"
        )}
      >
        <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
