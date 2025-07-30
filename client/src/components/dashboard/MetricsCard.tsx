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
    if (changeType === "increase") return "text-success";
    if (changeType === "decrease") return "text-danger";
    return "text-gray-500";
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card 
      className={`border border-gray-200 ${(onClick || navigateTo) ? 'cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200' : ''}`}
      onClick={handleClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {change && (
              <p className={`text-sm mt-1 flex items-center gap-1 ${getTrendColor()}`}>
                {TrendIcon && <TrendIcon size={14} />}
                {change}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 ${iconColor} rounded-lg flex items-center justify-center`}>
            <Icon size={24} className="text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
