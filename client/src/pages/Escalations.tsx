import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EscalationModal } from "@/components/modals/EscalationModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Plus, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  Mail,
  FileText,
  ExternalLink
} from "lucide-react";

export default function Escalations() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: escalations = [], isLoading } = useQuery({
    queryKey: ["/api/escalations"],
  });

  const updateEscalationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PUT", `/api/escalations/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/escalations"] });
      toast({
        title: "Success",
        description: "Escalation status updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update escalation",
        variant: "destructive",
      });
    },
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case "critical": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved": 
      case "closed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "open": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved":
      case "closed": return CheckCircle;
      case "in_progress": return Clock;
      case "open": return AlertCircle;
      default: return AlertCircle;
    }
  };

  const filteredEscalations = escalations.filter((escalation: any) => {
    const statusMatch = filterStatus === "all" || escalation.status === filterStatus;
    const urgencyMatch = filterUrgency === "all" || escalation.urgency === filterUrgency;
    return statusMatch && urgencyMatch;
  });

  const handleNewEscalation = () => {
    setShowCreateModal(true);
  };

  const handleStatusChange = (escalationId: string, newStatus: string) => {
    updateEscalationMutation.mutate({ id: escalationId, status: newStatus });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEscalationMetrics = () => {
    const open = escalations.filter((e: any) => e.status === "open").length;
    const inProgress = escalations.filter((e: any) => e.status === "in_progress").length;
    const resolved = escalations.filter((e: any) => e.status === "resolved" || e.status === "closed").length;
    const critical = escalations.filter((e: any) => e.urgency === "critical").length;
    
    return { open, inProgress, resolved, critical };
  };

  const metrics = getEscalationMetrics();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Escalation Workflow"
        subtitle="Structured escalation management with multi-channel communication"
        onNewClick={handleNewEscalation}
      />

      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="escalations">Escalations</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Open</p>
                      <p className="text-3xl font-bold text-gray-900">{metrics.open}</p>
                    </div>
                    <AlertCircle className="text-yellow-500" size={24} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">In Progress</p>
                      <p className="text-3xl font-bold text-gray-900">{metrics.inProgress}</p>
                    </div>
                    <Clock className="text-blue-500" size={24} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Resolved</p>
                      <p className="text-3xl font-bold text-gray-900">{metrics.resolved}</p>
                    </div>
                    <CheckCircle className="text-green-500" size={24} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Critical</p>
                      <p className="text-3xl font-bold text-gray-900">{metrics.critical}</p>
                    </div>
                    <TrendingUp className="text-red-500" size={24} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Escalations */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle>Recent Escalations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {escalations.slice(0, 5).map((escalation: any) => {
                    const StatusIcon = getStatusIcon(escalation.status);
                    return (
                      <div key={escalation.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <StatusIcon size={20} className={
                            escalation.status === 'resolved' || escalation.status === 'closed' ? 'text-green-500' :
                            escalation.status === 'in_progress' ? 'text-blue-500' : 'text-yellow-500'
                          } />
                          <div>
                            <h4 className="font-medium text-gray-900">{escalation.summary}</h4>
                            <p className="text-sm text-gray-600">
                              Created {formatDate(escalation.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getUrgencyColor(escalation.urgency)} font-medium capitalize`}>
                            {escalation.urgency}
                          </Badge>
                          <Badge className={`${getStatusColor(escalation.status)} font-medium capitalize`}>
                            {escalation.status?.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                  {escalations.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No escalations yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="escalations" className="space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-500" />
                <Label className="text-sm font-medium">Status:</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Urgency:</Label>
                <Select value={filterUrgency} onValueChange={setFilterUrgency}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Escalations Table */}
            <Card className="border border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Escalation Management</CardTitle>
                  <Button size="sm" onClick={handleNewEscalation} className="bg-primary-500 text-white hover:bg-primary-600">
                    <Plus size={14} className="mr-1" />
                    New Escalation
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6">
                    <div className="animate-pulse space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                ) : filteredEscalations.length === 0 ? (
                  <div className="p-12 text-center">
                    <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No escalations found</h3>
                    <p className="text-gray-500 mb-4">
                      {filterStatus === "all" && filterUrgency === "all"
                        ? "Create an escalation to track and manage critical program issues."
                        : "No escalations match the selected filters."
                      }
                    </p>
                    <Button onClick={handleNewEscalation} className="bg-primary-500 text-white hover:bg-primary-600">
                      <Plus size={16} className="mr-2" />
                      Create Escalation
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Escalation
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Urgency
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Owner
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Channels
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredEscalations.map((escalation: any) => (
                          <tr key={escalation.id}>
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{escalation.summary}</div>
                                <div className="text-sm text-gray-500">
                                  {formatDate(escalation.createdAt)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={`${getUrgencyColor(escalation.urgency)} font-semibold capitalize`}>
                                {escalation.urgency}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {escalation.owner?.name || "Unassigned"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex gap-1">
                                {escalation.sendToSlack && (
                                  <MessageSquare size={14} className="text-blue-500" title="Slack" />
                                )}
                                {escalation.sendToTeams && (
                                  <MessageSquare size={14} className="text-purple-500" title="Teams" />
                                )}
                                {escalation.sendToEmail && (
                                  <Mail size={14} className="text-green-500" title="Email" />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Select 
                                value={escalation.status} 
                                onValueChange={(value) => handleStatusChange(escalation.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue>
                                    <Badge className={`${getStatusColor(escalation.status)} font-medium capitalize`}>
                                      {escalation.status?.replace("_", " ")}
                                    </Badge>
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm">Edit</Button>
                                <Button variant="ghost" size="sm">
                                  <ExternalLink size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Escalation Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-1">Technical Issue Escalation</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Template for technical problems affecting program delivery
                      </p>
                      <Button variant="outline" size="sm">Use Template</Button>
                    </div>
                    
                    <div className="p-3 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-1">Resource Constraint</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Template for resource allocation and capacity issues
                      </p>
                      <Button variant="outline" size="sm">Use Template</Button>
                    </div>
                    
                    <div className="p-3 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-1">Timeline Delay</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Template for milestone delays and schedule impacts
                      </p>
                      <Button variant="outline" size="sm">Use Template</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Communication Channels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="text-blue-500" size={16} />
                        <span className="font-medium text-blue-700">Slack Integration</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="text-purple-500" size={16} />
                        <span className="font-medium text-purple-700">Teams Integration</span>
                      </div>
                      <Badge className="bg-gray-100 text-gray-800">Disconnected</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Mail className="text-green-500" size={16} />
                        <span className="font-medium text-green-700">Email Notifications</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="text-gray-500" size={16} />
                        <span className="font-medium text-gray-700">PDF Export</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Available</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Resolution Time Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                    <div className="text-center">
                      <TrendingUp size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">Resolution time analytics would be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Escalation Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Technical Issues:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded">
                          <div className="w-3/4 h-2 bg-blue-500 rounded"></div>
                        </div>
                        <span className="text-sm font-medium">45%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Resource Constraints:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded">
                          <div className="w-1/2 h-2 bg-yellow-500 rounded"></div>
                        </div>
                        <span className="text-sm font-medium">30%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Timeline Delays:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded">
                          <div className="w-1/4 h-2 bg-red-500 rounded"></div>
                        </div>
                        <span className="text-sm font-medium">25%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <EscalationModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
}
