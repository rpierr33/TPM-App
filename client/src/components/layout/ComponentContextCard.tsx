import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Flag, 
  AlertTriangle, 
  Users, 
  GitBranch, 
  Eye,
  Calendar,
  ExternalLink
} from "lucide-react";

interface ComponentContextCardProps {
  title: string;
  items: any[];
  type: 'milestones' | 'risks' | 'dependencies' | 'adopters' | 'projects';
  onViewAll?: () => void;
  onViewItem?: (item: any) => void;
  analytics?: {
    total: number;
    critical?: number;
    overdue?: number;
    blocked?: number;
    ready?: number;
  };
}

export function ComponentContextCard({ 
  title, 
  items, 
  type, 
  onViewAll, 
  onViewItem,
  analytics 
}: ComponentContextCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'milestones': return <Flag className="h-4 w-4" />;
      case 'risks': return <AlertTriangle className="h-4 w-4" />;
      case 'dependencies': return <GitBranch className="h-4 w-4" />;
      case 'adopters': return <Users className="h-4 w-4" />;
      case 'projects': return <Calendar className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getStatusColor = (item: any, type: string) => {
    switch (type) {
      case 'milestones':
        switch (item.status) {
          case 'completed': return 'bg-green-100 text-green-800 border-green-200';
          case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
          case 'at_risk': return 'bg-red-100 text-red-800 border-red-200';
          case 'delayed': return 'bg-orange-100 text-orange-800 border-orange-200';
          default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
      case 'risks':
        switch (item.severity) {
          case 'critical': return 'bg-red-100 text-red-800 border-red-200';
          case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
          case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
          default: return 'bg-green-100 text-green-800 border-green-200';
        }
      case 'dependencies':
        switch (item.status) {
          case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
          case 'at_risk': return 'bg-orange-100 text-orange-800 border-orange-200';
          case 'on_track': return 'bg-green-100 text-green-800 border-green-200';
          case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
          default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
      case 'adopters':
        switch (item.status) {
          case 'ready': return 'bg-green-100 text-green-800 border-green-200';
          case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
          case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
          default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getAnalyticsBadge = () => {
    if (!analytics) return null;

    const { total, critical, overdue, blocked, ready } = analytics;
    
    if (critical && critical > 0) {
      return <Badge variant="destructive" className="text-xs">{critical} Critical</Badge>;
    }
    if (overdue && overdue > 0) {
      return <Badge variant="destructive" className="text-xs">{overdue} Overdue</Badge>;
    }
    if (blocked && blocked > 0) {
      return <Badge variant="destructive" className="text-xs">{blocked} Blocked</Badge>;
    }
    if (ready && ready > 0) {
      return <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">{ready} Ready</Badge>;
    }
    
    return <Badge variant="outline" className="text-xs">{total} Total</Badge>;
  };

  return (
    <Card className="border border-gray-200 hover:border-primary-300 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getTypeIcon(type)}
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getAnalyticsBadge()}
            {onViewAll && items.length > 3 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onViewAll}
                className="h-6 px-2 text-xs"
              >
                View All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <div className="text-xs">No {type} found</div>
          </div>
        ) : (
          <div className="space-y-2">
            {items.slice(0, 3).map((item: any) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-2 rounded-md border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors cursor-pointer"
                onClick={() => onViewItem?.(item)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {item.title || item.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(item, type)}`}
                    >
                      {item.status || item.severity}
                    </Badge>
                    {(item.dueDate || item.targetDate) && (
                      <span className="text-xs text-gray-500">
                        {formatDate(item.dueDate || item.targetDate)}
                      </span>
                    )}
                  </div>
                </div>
                <ExternalLink className="h-3 w-3 text-gray-400 ml-2 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}