import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  Plus, 
  Download, 
  Send, 
  Calendar, 
  FileText,
  Share2,
  ExternalLink,
  TrendingUp,
  PieChart,
  Brain,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { useMode } from "@/hooks/useMode";

export default function ExecutiveReports() {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState("weekly");
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [generatingReport, setGeneratingReport] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isTestMode } = useMode();

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/reports"],
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["/api/programs"],
  });

  const { data: dashboardMetrics } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const generateReportMutation = useMutation({
    mutationFn: async (data: { programId: string; type: string }) => {
      return await apiRequest("POST", "/api/reports/generate", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Report generated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      setShowGenerateModal(false);
      setGeneratingReport(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
      setGeneratingReport(false);
    },
  });

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    generateReportMutation.mutate({
      programId: selectedProgram,
      type: selectedReportType,
    });
  };

  const handleNewReport = () => {
    setShowGenerateModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getReportTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "weekly": return "bg-blue-100 text-blue-800";
      case "monthly": return "bg-green-100 text-green-800";
      case "quarterly": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleExportToSmartsheet = async (reportId: string) => {
    try {
      toast({
        title: "Exporting",
        description: "Exporting report to Smartsheet...",
      });
      // In live mode, this would make actual API call to Smartsheet
      console.log("Exporting to Smartsheet:", reportId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export to Smartsheet",
        variant: "destructive",
      });
    }
  };

  const handleExportToConfluence = async (reportId: string) => {
    try {
      toast({
        title: "Exporting",
        description: "Exporting report to Confluence...",
      });
      // In live mode, this would make actual API call to Confluence
      console.log("Exporting to Confluence:", reportId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export to Confluence",
        variant: "destructive",
      });
    }
  };

  const handleScheduleDistribution = () => {
    toast({
      title: "Scheduling",
      description: "Setting up auto-distribution...",
    });
  };

  // Mock dashboard data for visualization
  const programHealthData = {
    overall: dashboardMetrics?.adopterScore || 87,
    areas: [
      { name: "Technical Progress", score: 92, status: "excellent" },
      { name: "Risk Management", score: 78, status: "good" },
      { name: "Timeline Adherence", score: 85, status: "good" },
      { name: "Stakeholder Satisfaction", score: 90, status: "excellent" },
    ]
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Executive Reports"
        subtitle="Auto-generated status reports with shareable dashboards and analytics"
        onNewClick={handleNewReport}
      />

      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Executive Dashboard</TabsTrigger>
            <TabsTrigger value="reports">Generated Reports</TabsTrigger>
            <TabsTrigger value="analytics">Program Analytics</TabsTrigger>
            <TabsTrigger value="distribution">Auto-Distribution</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Executive Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Program Health</p>
                      <p className="text-3xl font-bold text-gray-900">{programHealthData.overall}%</p>
                      <p className="text-sm text-success mt-1">
                        <TrendingUp size={14} className="inline mr-1" />
                        +3% this month
                      </p>
                    </div>
                    <CheckCircle className="text-green-500" size={24} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Active Programs</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardMetrics?.activePrograms || 12}</p>
                      <p className="text-sm text-blue-600 mt-1">
                        <Users size={14} className="inline mr-1" />
                        On track
                      </p>
                    </div>
                    <BarChart3 className="text-blue-500" size={24} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Critical Issues</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardMetrics?.criticalRisks || 7}</p>
                      <p className="text-sm text-warning mt-1">
                        <AlertTriangle size={14} className="inline mr-1" />
                        Requires attention
                      </p>
                    </div>
                    <AlertTriangle className="text-yellow-500" size={24} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Upcoming Milestones</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardMetrics?.upcomingMilestones || 23}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        <Clock size={14} className="inline mr-1" />
                        Next 30 days
                      </p>
                    </div>
                    <Calendar className="text-purple-500" size={24} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Program Health Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Program Health Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {programHealthData.areas.map((area, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{area.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{area.score}%</span>
                            <Badge className={
                              area.status === 'excellent' ? 'bg-green-100 text-green-800' :
                              area.status === 'good' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {area.status}
                            </Badge>
                          </div>
                        </div>
                        <Progress value={area.score} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Risk Profile Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <PieChart size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Risk Distribution</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                          <div className="w-4 h-4 bg-danger rounded mx-auto mb-1"></div>
                          <div className="font-medium">High: 15%</div>
                        </div>
                        <div className="text-center">
                          <div className="w-4 h-4 bg-warning rounded mx-auto mb-1"></div>
                          <div className="font-medium">Medium: 35%</div>
                        </div>
                        <div className="text-center">
                          <div className="w-4 h-4 bg-success rounded mx-auto mb-1"></div>
                          <div className="font-medium">Low: 40%</div>
                        </div>
                        <div className="text-center">
                          <div className="w-4 h-4 bg-gray-300 rounded mx-auto mb-1"></div>
                          <div className="font-medium">Mitigated: 10%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights for Executives */}
            <Card className="gradient-purple-blue border border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Brain className="text-purple-500" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Executive AI Insights</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                      <div className="space-y-2">
                        <div className="font-medium text-purple-700">Strategic Recommendations</div>
                        <ul className="space-y-1 text-purple-600">
                          <li>• Accelerate mobile integration to maintain Q2 delivery</li>
                          <li>• Allocate additional resources to security compliance</li>
                          <li>• Schedule stakeholder alignment meeting for API changes</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <div className="font-medium text-purple-700">Performance Outlook</div>
                        <ul className="space-y-1 text-purple-600">
                          <li>• 92% probability of on-time Q2 delivery</li>
                          <li>• Revenue impact: $2.3M if delayed beyond Q2</li>
                          <li>• Recommend 15% budget increase for risk mitigation</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* Quick Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Label className="text-sm font-medium">Filter by type:</Label>
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleNewReport} className="bg-primary-500 text-white hover:bg-primary-600">
                <Plus size={16} className="mr-2" />
                Generate Report
              </Button>
            </div>

            {/* Reports Table */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle>Generated Reports</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {reportsLoading ? (
                  <div className="p-6">
                    <div className="animate-pulse space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="p-12 text-center">
                    <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reports generated yet</h3>
                    <p className="text-gray-500 mb-4">
                      Generate your first executive report to track program progress and insights.
                    </p>
                    <Button onClick={handleNewReport} className="bg-primary-500 text-white hover:bg-primary-600">
                      <Plus size={16} className="mr-2" />
                      Generate Report
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Report
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Generated
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Program
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reports.map((report: any) => (
                          <tr key={report.id}>
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{report.title}</div>
                                <div className="text-sm text-gray-500">
                                  Generated by {report.generatedBy?.name || "AI System"}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={`${getReportTypeColor(report.type)} font-medium capitalize`}>
                                {report.type}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(report.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {report.program?.name || "All Programs"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <Download size={14} className="mr-1" />
                                  PDF
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleExportToSmartsheet(report.id)}
                                >
                                  <ExternalLink size={14} className="mr-1" />
                                  Smartsheet
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleExportToConfluence(report.id)}
                                >
                                  <ExternalLink size={14} className="mr-1" />
                                  Confluence
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Share2 size={14} className="mr-1" />
                                  Share
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

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Program Velocity Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Velocity Analytics</h3>
                      <p className="text-sm text-gray-600">
                        Sprint velocity, burndown rates, and completion trends would be visualized here
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Resource Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Engineering Teams:</span>
                      <div className="flex items-center gap-2">
                        <Progress value={85} className="w-24 h-2" />
                        <span className="text-sm font-medium">85%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">QA Resources:</span>
                      <div className="flex items-center gap-2">
                        <Progress value={92} className="w-24 h-2" />
                        <span className="text-sm font-medium">92%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">DevOps Capacity:</span>
                      <div className="flex items-center gap-2">
                        <Progress value={78} className="w-24 h-2" />
                        <span className="text-sm font-medium">78%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Product Management:</span>
                      <div className="flex items-center gap-2">
                        <Progress value={95} className="w-24 h-2" />
                        <span className="text-sm font-medium">95%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Stakeholder Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-green-700">Executive Leadership</span>
                        <Badge className="bg-green-100 text-green-800">Highly Engaged</Badge>
                      </div>
                      <p className="text-sm text-green-600 mt-1">Regular updates, active participation</p>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-blue-700">Product Teams</span>
                        <Badge className="bg-blue-100 text-blue-800">Engaged</Badge>
                      </div>
                      <p className="text-sm text-blue-600 mt-1">Good collaboration, minor coordination needs</p>
                    </div>
                    
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-yellow-700">External Partners</span>
                        <Badge className="bg-yellow-100 text-yellow-800">Moderate</Badge>
                      </div>
                      <p className="text-sm text-yellow-600 mt-1">Requires more frequent check-ins</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>ROI & Business Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-1">$4.2M</div>
                      <div className="text-sm text-gray-600">Projected Annual Savings</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-xl font-semibold text-blue-600">156%</div>
                        <div className="text-xs text-gray-600">ROI</div>
                      </div>
                      <div>
                        <div className="text-xl font-semibold text-purple-600">8.3 mo</div>
                        <div className="text-xs text-gray-600">Payback Period</div>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200">
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>• 35% reduction in manual processes</div>
                        <div>• 50% faster time-to-market</div>
                        <div>• 90% improvement in compliance</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Auto-Distribution Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Weekly Executive Summary</h4>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Every Monday at 9:00 AM</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Pause</Button>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Monthly Program Review</h4>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">First Monday of each month</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Pause</Button>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Quarterly Business Review</h4>
                        <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">End of each quarter</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Configure</Button>
                        <Button variant="outline" size="sm">Activate</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Distribution Channels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Send className="text-blue-500" size={16} />
                        <span className="font-medium text-blue-700">Slack #executives</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Send className="text-purple-500" size={16} />
                        <span className="font-medium text-purple-700">Teams Leadership</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Send className="text-green-500" size={16} />
                        <span className="font-medium text-green-700">Email Distribution</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="text-gray-500" size={16} />
                        <span className="font-medium text-gray-700">Confluence Publication</span>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Limited</Badge>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <Button 
                      onClick={handleScheduleDistribution}
                      className="w-full bg-primary-500 text-white hover:bg-primary-600"
                    >
                      <Calendar size={16} className="mr-2" />
                      Schedule New Distribution
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Generate Report Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Executive Report</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly Status Report</SelectItem>
                  <SelectItem value="monthly">Monthly Program Review</SelectItem>
                  <SelectItem value="quarterly">Quarterly Business Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="program">Program Scope</Label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map((program: any) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowGenerateModal(false)}
                disabled={generatingReport}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleGenerateReport}
                className="bg-primary-500 text-white hover:bg-primary-600"
                disabled={generatingReport}
              >
                {generatingReport ? (
                  <>
                    <Brain size={16} className="mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText size={16} className="mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
