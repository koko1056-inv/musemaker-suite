import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

const glassIconVariants = cva(
  "flex items-center justify-center rounded-xl border border-white/20 backdrop-blur-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-white/10 text-foreground",
        primary: "bg-primary/10 border-primary/20 text-primary",
        success: "bg-green-500/10 border-green-500/20 text-green-600",
        warning: "bg-amber-500/10 border-amber-500/20 text-amber-600",
        danger: "bg-red-500/10 border-red-500/20 text-red-600",
        info: "bg-blue-500/10 border-blue-500/20 text-blue-600",
        purple: "bg-purple-500/10 border-purple-500/20 text-purple-600",
        muted: "bg-muted/50 border-border/50 text-muted-foreground",
      },
      size: {
        xs: "h-6 w-6",
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-14 w-14",
        "2xl": "h-16 w-16",
      },
      iconSize: {
        xs: "[&>svg]:h-3 [&>svg]:w-3",
        sm: "[&>svg]:h-4 [&>svg]:w-4",
        md: "[&>svg]:h-5 [&>svg]:w-5",
        lg: "[&>svg]:h-6 [&>svg]:w-6",
        xl: "[&>svg]:h-7 [&>svg]:w-7",
        "2xl": "[&>svg]:h-8 [&>svg]:w-8",
      },
      hover: {
        true: "hover:bg-white/20 hover:border-white/30 hover:scale-105",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      iconSize: "md",
      hover: false,
    },
  }
);

export interface GlassIconProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassIconVariants> {
  icon: LucideIcon;
  iconClassName?: string;
}

const GlassIcon = React.forwardRef<HTMLDivElement, GlassIconProps>(
  ({ className, variant, size, iconSize, hover, icon: Icon, iconClassName, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(glassIconVariants({ variant, size, iconSize, hover }), className)}
        {...props}
      >
        <Icon className={iconClassName} />
      </div>
    );
  }
);
GlassIcon.displayName = "GlassIcon";

export { GlassIcon, glassIconVariants };
