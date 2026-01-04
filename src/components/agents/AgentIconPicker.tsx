import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Bot,
  Headphones,
  Phone,
  MessageCircle,
  UserRound,
  Sparkles,
  Heart,
  Star,
  Zap,
  Coffee,
  ShoppingCart,
  Calendar,
  Clock,
  Bell,
  Mail,
  Settings,
  HelpCircle,
  Shield,
  Briefcase,
  GraduationCap,
  Stethoscope,
  Car,
  Home,
  Plane,
  Utensils,
  Music,
  Camera,
  Gamepad2,
  Palette,
  Cpu,
  Globe,
  type LucideIcon,
} from "lucide-react";

// Available icons for agents
const AGENT_ICONS: { name: string; icon: LucideIcon; label: string }[] = [
  { name: "bot", icon: Bot, label: "ボット" },
  { name: "headphones", icon: Headphones, label: "ヘッドフォン" },
  { name: "phone", icon: Phone, label: "電話" },
  { name: "message-circle", icon: MessageCircle, label: "メッセージ" },
  { name: "user-round", icon: UserRound, label: "ユーザー" },
  { name: "sparkles", icon: Sparkles, label: "スパークル" },
  { name: "heart", icon: Heart, label: "ハート" },
  { name: "star", icon: Star, label: "スター" },
  { name: "zap", icon: Zap, label: "稲妻" },
  { name: "coffee", icon: Coffee, label: "コーヒー" },
  { name: "shopping-cart", icon: ShoppingCart, label: "ショッピング" },
  { name: "calendar", icon: Calendar, label: "カレンダー" },
  { name: "clock", icon: Clock, label: "時計" },
  { name: "bell", icon: Bell, label: "ベル" },
  { name: "mail", icon: Mail, label: "メール" },
  { name: "settings", icon: Settings, label: "設定" },
  { name: "help-circle", icon: HelpCircle, label: "ヘルプ" },
  { name: "shield", icon: Shield, label: "シールド" },
  { name: "briefcase", icon: Briefcase, label: "ビジネス" },
  { name: "graduation-cap", icon: GraduationCap, label: "教育" },
  { name: "stethoscope", icon: Stethoscope, label: "医療" },
  { name: "car", icon: Car, label: "車" },
  { name: "home", icon: Home, label: "ホーム" },
  { name: "plane", icon: Plane, label: "飛行機" },
  { name: "utensils", icon: Utensils, label: "レストラン" },
  { name: "music", icon: Music, label: "音楽" },
  { name: "camera", icon: Camera, label: "カメラ" },
  { name: "gamepad-2", icon: Gamepad2, label: "ゲーム" },
  { name: "palette", icon: Palette, label: "パレット" },
  { name: "cpu", icon: Cpu, label: "CPU" },
  { name: "globe", icon: Globe, label: "グローブ" },
];

// Preset colors
const PRESET_COLORS = [
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#f97316", // Orange
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f59e0b", // Amber
  "#6366f1", // Indigo
  "#ef4444", // Red
  "#84cc16", // Lime
  "#14b8a6", // Teal
  "#a855f7", // Violet
];

interface AgentIconPickerProps {
  iconName: string;
  iconColor: string;
  onIconChange: (iconName: string) => void;
  onColorChange: (color: string) => void;
}

export function AgentIconPicker({
  iconName,
  iconColor,
  onIconChange,
  onColorChange,
}: AgentIconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(iconColor);

  const selectedIcon = AGENT_ICONS.find((i) => i.name === iconName) || AGENT_ICONS[0];
  const IconComponent = selectedIcon.icon;

  return (
    <div className="space-y-3">
      <Label>アイコン & カラー</Label>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-20 flex items-center justify-center gap-4 border-2 border-dashed hover:border-primary/50 transition-colors"
          >
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center transition-transform hover:scale-105"
              style={{ backgroundColor: iconColor }}
            >
              <IconComponent className="h-7 w-7 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">{selectedIcon.label}</p>
              <p className="text-xs text-muted-foreground">クリックして変更</p>
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            {/* Icon Selection */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                アイコンを選択
              </Label>
              <ScrollArea className="h-40">
                <div className="grid grid-cols-6 gap-2">
                  {AGENT_ICONS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.name}
                        onClick={() => onIconChange(item.name)}
                        className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center transition-all",
                          iconName === item.name
                            ? "ring-2 ring-primary ring-offset-2"
                            : "hover:bg-muted"
                        )}
                        style={
                          iconName === item.name
                            ? { backgroundColor: iconColor }
                            : {}
                        }
                        title={item.label}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            iconName === item.name
                              ? "text-white"
                              : "text-muted-foreground"
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Color Selection */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                カラーを選択
              </Label>
              <div className="grid grid-cols-6 gap-2 mb-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      onColorChange(color);
                      setCustomColor(color);
                    }}
                    className={cn(
                      "h-8 w-8 rounded-lg transition-all",
                      iconColor === color
                        ? "ring-2 ring-offset-2 ring-foreground/50 scale-110"
                        : "hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              
              {/* Custom Color */}
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    onColorChange(e.target.value);
                  }}
                  className="h-8 w-12 p-0.5 cursor-pointer"
                />
                <Input
                  type="text"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      onColorChange(e.target.value);
                    }
                  }}
                  placeholder="#10b981"
                  className="flex-1 h-8 text-xs font-mono"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="pt-2 border-t">
              <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                プレビュー
              </Label>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: iconColor }}
                >
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">エージェント名</p>
                  <p className="text-xs text-muted-foreground">
                    このように表示されます
                  </p>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Export icon getter for use in other components
export function getAgentIcon(iconName: string): LucideIcon {
  const found = AGENT_ICONS.find((i) => i.name === iconName);
  return found?.icon || Bot;
}

export { AGENT_ICONS, PRESET_COLORS };
