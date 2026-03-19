import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { useLocation } from "wouter";

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  icon: LucideIcon;
  iconColor: string;
  onClick?: () => void;
  navigateTo?: string;
}

export function MetricsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor,
  onClick,
  navigateTo
}: MetricsCardProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    if (navigateTo) {
      setLocation(navigateTo);
    } else if (onClick) {
      onClick();
    }
  };
  const getTrendIcon = () => {
    if (changeType === "increase") return TrendingUp;
    if (changeType === "decrease") return TrendingDown;
    return null;
  };

  const getTrendColor = () => {
    if (changeType === "increase") return "text-emerald-600";
    if (changeType === "decrease") return "text-red-500";
    return "text-gray-500";
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card
      className={`border border-gray-200/80 bg-white shadow-sm ${(onClick || navigateTo) ? 'cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200 card-hover' : ''}`}
      onClick={handleClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-500 font-medium mb-1">{title}</p>
            <p className="text-lg font-bold text-gray-900 tracking-tight">{value}</p>
            {change && (
              <p className={`text-[10px] mt-0.5 flex items-center gap-1 ${getTrendColor()}`}>
                {TrendIcon && <TrendIcon size={9} />}
                {change}
              </p>
            )}
          </div>
          <div className={`w-8 h-8 ${iconColor} rounded-lg flex items-center justify-center`}>
            <Icon size={14} className="text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
