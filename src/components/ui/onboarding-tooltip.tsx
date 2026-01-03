import { ReactNode, useState } from "react";
import { X, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingTooltipProps {
  id: string;
  children: ReactNode;
  tip: string;
  className?: string;
  position?: "top" | "bottom" | "left" | "right";
}

export function OnboardingTooltip({
  id,
  children,
  tip,
  className,
  position = "bottom",
}: OnboardingTooltipProps) {
  const storageKey = `onboarding_dismissed_${id}`;
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem(storageKey) === "true";
  });

  const dismiss = () => {
    localStorage.setItem(storageKey, "true");
    setIsDismissed(true);
  };

  if (isDismissed) {
    return <>{children}</>;
  }

  const positionClasses = {
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-primary/90",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-primary/90",
    left: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-primary/90",
    right: "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-primary/90",
  };

  return (
    <div className={cn("relative inline-block", className)}>
      {children}
      <div
        className={cn(
          "absolute z-50 w-64 animate-fade-in",
          positionClasses[position]
        )}
      >
        <div className="bg-primary/90 text-primary-foreground rounded-lg p-3 shadow-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed flex-1">{tip}</p>
            <button
              onClick={dismiss}
              className="shrink-0 hover:bg-primary-foreground/20 rounded p-0.5 transition-colors"
              aria-label="閉じる"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div
          className={cn(
            "absolute w-0 h-0 border-[6px]",
            arrowClasses[position]
          )}
        />
      </div>
    </div>
  );
}
