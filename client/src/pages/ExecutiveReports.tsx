import { useState } from "react";
import { useSearch, useLocation } from "wouter";
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
  CheckCircle,
  Trash2,
  Copy,
  Mail,
  MessageSquare,
  Shield,
  Activity,
  Target
} from "lucide-react";
export default function ExecutiveReports() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(search);
  const defaultTab = searchParams.get("tab") || "dashboard";

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [viewingReport, setViewingReport] = useState<any>(null);
  const [selectedReportType, setSelectedReportType] = useState("weekly");
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportTypeFilter, setReportTypeFilter] = useState("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading: reportsLoading } = useQuery<any[]>({
    queryKey: ["/api/reports"],
  });

  const { data: programs = [] } = useQuery<any[]>({
    queryKey: ["/api/programs"],
  });

  const { data: dashboardMetrics } = useQuery<any>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: risks = [] } = useQuery<any[]>({
    queryKey: ["/api/risks"],
  });

  const generateReportMutation = useMutation({
    mutationFn: async (data: { programId: string; type: string }) => {
      return await apiRequest("/api/reports/generate", "POST", data);
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

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      return await apiRequest(`/api/reports/${reportId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Deleted",
        description: "Report deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive",
      });
    },
  });

  const filteredReports = reportTypeFilter === "all"
    ? reports
    : reports.filter((r: any) => r.type?.toLowerCase() === reportTypeFilter);

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

  // Real data derived from live metrics
  const totalRisks = risks.length;
  const criticalCount = risks.filter((r: any) => r.severity === "critical").length;
  const highCount = risks.filter((r: any) => r.severity === "high").length;
  const mediumCount = risks.filter((r: any) => r.severity === "medium").length;
  const lowCount = risks.filter((r: any) => r.severity === "low").length;
  const mitigatedCount = risks.filter((r: any) => r.status === "mitigated").length;
  const pct = (n: number) => totalRisks > 0 ? Math.round((n / totalRisks) * 100) : 0;

  const riskMgmtScore = totalRisks > 0
    ? Math.max(0, Math.round(100 - ((criticalCount * 25 + highCount * 15) / totalRisks * 10)))
    : 100;
  const onTrackPrograms = programs.filter((p: any) => p.status === "active").length;
  const timelineScore = programs.length > 0
    ? Math.round((onTrackPrograms / programs.length) * 100)
    : 0;

  const programHealthData = {
    overall: dashboardMetrics?.adopterScore ?? 0,
    areas: [
      { name: "Risk Management", score: riskMgmtScore, status: riskMgmtScore >= 80 ? "excellent" : riskMgmtScore >= 60 ? "good" : "at risk" },
      { name: "Adopter Readiness", score: dashboardMetrics?.adopterScore ?? 0, status: (dashboardMetrics?.adopterScore ?? 0) >= 80 ? "excellent" : (dashboardMetrics?.adopterScore ?? 0) >= 60 ? "good" : "at risk" },
      { name: "Active Programs", score: programs.length > 0 ? Math.round(((dashboardMetrics?.activePrograms ?? 0) / programs.length) * 100) : 0, status: "good" },
    ]
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden page-transition">
      <Header
        title="Executive Reports"
        subtitle="Auto-generated status reports with shareable dashboards and analytics"
        onNewClick={handleNewReport}
      />

      <main className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Executive Dashboard</TabsTrigger>
            <TabsTrigger value="reports">Generated Reports</TabsTrigger>
            <TabsTrigger value="analytics">Program Analytics</TabsTrigger>
            <TabsTrigger value="distribution">Auto-Distribution</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Executive Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border border-gray-200/80 bg-white shadow-sm cursor-pointer hover:shadow-md hover:border-green-300 transition-all" onClick={() => setLocation("/programs")}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Program Health</p>
                      <p className="text-3xl font-bold text-gray-900">{programHealthData.overall > 0 ? `${programHealthData.overall}%` : "—"}</p>
                      <p className="text-sm text-success mt-1">
                        <TrendingUp size={14} className="inline mr-1" />
                        +3% this month
                      </p>
                    </div>
                    <CheckCircle className="text-green-500" size={24} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200/80 bg-white shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 transition-all" onClick={() => setLocation("/programs?filter=active")}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Active Programs</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardMetrics?.activePrograms ?? programs.length}</p>
                      <p className="text-sm text-blue-600 mt-1">
                        <Users size={14} className="inline mr-1" />
                        On track
                      </p>
                    </div>
                    <BarChart3 className="text-blue-500" size={24} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200/80 bg-white shadow-sm cursor-pointer hover:shadow-md hover:border-yellow-300 transition-all" onClick={() => setLocation("/risk-management")}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Critical Issues</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardMetrics?.criticalRisks ?? 0}</p>
                      <p className="text-sm text-warning mt-1">
                        <AlertTriangle size={14} className="inline mr-1" />
                        Requires attention
                      </p>
                    </div>
                    <AlertTriangle className="text-yellow-500" size={24} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200/80 bg-white shadow-sm cursor-pointer hover:shadow-md hover:border-purple-300 transition-all" onClick={() => setLocation("/milestones")}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Upcoming Milestones</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardMetrics?.upcomingMilestones ?? 0}</p>
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
              <Card className="border border-gray-200/80 bg-white shadow-sm">
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

              <Card className="border border-gray-200/80 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Risk Profile Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {totalRisks === 0 ? (
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center text-gray-500">
                        <PieChart size={48} className="mx-auto text-gray-400 mb-2" />
                        No risks tracked yet
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500">{totalRisks} total risks</p>
                      {[
                        { label: "Critical", count: criticalCount, color: "bg-red-500" },
                        { label: "High", count: highCount, color: "bg-orange-400" },
                        { label: "Medium", count: mediumCount, color: "bg-yellow-400" },
                        { label: "Low", count: lowCount, color: "bg-green-400" },
                        { label: "Mitigated", count: mitigatedCount, color: "bg-gray-300" },
                      ].map(({ label, count, color }) => (
                        <div key={label} className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${color} shrink-0`}></div>
                          <span className="text-sm text-gray-700 w-20">{label}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div className={`${color} h-2 rounded-full`} style={{ width: `${pct(count)}%` }}></div>
                          </div>
                          <span className="text-sm font-medium w-12 text-right">{count} ({pct(count)}%)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Live Executive Insights */}
            <Card className="gradient-purple-blue border border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Brain className="text-purple-500" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Executive Insights</h3>
                    {programs.length === 0 && risks.length === 0 ? (
                      <p className="text-sm text-gray-500">No insights available yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                        {/* Program RAG Status */}
                        <div className="space-y-2">
                          <div className="font-medium text-purple-700">Program Status</div>
                          {programs.length === 0 ? (
                            <p className="text-sm text-gray-400">No programs yet</p>
                          ) : (
                            <ul className="space-y-1">
                              {programs.map((p: any) => (
                                <li key={p.id} className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                                    p.status === "active" ? "bg-green-500" :
                                    p.status === "at_risk" ? "bg-yellow-500" :
                                    p.status === "blocked" ? "bg-red-500" :
                                    "bg-gray-400"
                                  }`} />
                                  <span
                                    className="text-purple-600 truncate cursor-pointer hover:text-purple-800 hover:underline"
                                    onClick={() => setLocation(`/programs/${p.id}`)}
                                  >{p.name}</span>
                                  <span className="text-purple-400 capitalize text-xs">({p.status?.replace("_", " ") || "unknown"})</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Top Critical Risks */}
                        <div className="space-y-2">
                          <div className="font-medium text-purple-700">Top Critical Risks</div>
                          {(() => {
                            const criticalRisks = risks
                              .filter((r: any) => r.severity === "critical" || r.severity === "high")
                              .slice(0, 3);
                            return criticalRisks.length === 0 ? (
                              <p className="text-sm text-gray-400">No critical risks</p>
                            ) : (
                              <ul className="space-y-1">
                                {criticalRisks.map((r: any) => (
                                  <li key={r.id} className="flex items-center gap-2">
                                    <AlertTriangle size={12} className={r.severity === "critical" ? "text-red-500" : "text-orange-400"} />
                                    <span
                                      className="text-purple-600 truncate cursor-pointer hover:text-purple-800 hover:underline"
                                      onClick={() => setLocation("/risk-management")}
                                    >{r.title}</span>
                                  </li>
                                ))}
                              </ul>
                            );
                          })()}
                        </div>

                        {/* Upcoming Milestones */}
                        <div className="space-y-2">
                          <div className="font-medium text-purple-700">Upcoming Milestones</div>
                          <p className="text-purple-600">
                            {dashboardMetrics?.upcomingMilestones != null
                              ? `${dashboardMetrics.upcomingMilestones} milestone${dashboardMetrics.upcomingMilestones === 1 ? "" : "s"} due in next 30 days`
                              : "No milestone data available"}
                          </p>
                          <p className="text-purple-600">
                            {dashboardMetrics?.completedMilestones != null && dashboardMetrics?.totalMilestones != null
                              ? `${dashboardMetrics.completedMilestones}/${dashboardMetrics.totalMilestones} milestones completed`
                              : ""}
                          </p>
                        </div>
                      </div>
                    )}
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
                <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
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
            <Card className="border border-gray-200/80 bg-white shadow-sm">
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
                ) : filteredReports.length === 0 ? (
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
                        {filteredReports.map((report: any) => (
                          <tr key={report.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setViewingReport(report)}>
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900 hover:text-blue-600">{report.title}</div>
                                <div className="text-sm text-gray-500">
                                  Generated by AI System
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
                              {report.programName || "All Programs"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(`/api/reports/${report.id}/pdf`, "_blank")}
                                >
                                  <Download size={14} className="mr-1" />
                                  PDF
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled
                                  title="Smartsheet integration not configured"
                                >
                                  <ExternalLink size={14} className="mr-1" />
                                  Smartsheet
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled
                                  title="Confluence integration not configured"
                                >
                                  <ExternalLink size={14} className="mr-1" />
                                  Confluence
                                </Button>
                                <Button variant="ghost" size="sm" disabled title="Share not yet available">
                                  <Share2 size={14} className="mr-1" />
                                  Share
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteReportMutation.mutate(report.id);
                                  }}
                                >
                                  <Trash2 size={14} />
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
            {/* Report Generation Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border border-gray-200/80 bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Reports</p>
                      <p className="text-3xl font-bold text-gray-900">{reports.length}</p>
                    </div>
                    <FileText className="text-blue-500" size={24} />
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-gray-200/80 bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Reports This Month</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {reports.filter((r: any) => {
                          const d = new Date(r.createdAt);
                          const now = new Date();
                          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        }).length}
                      </p>
                    </div>
                    <Calendar className="text-green-500" size={24} />
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-gray-200/80 bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Programs Tracked</p>
                      <p className="text-3xl font-bold text-gray-900">{programs.length}</p>
                    </div>
                    <Activity className="text-purple-500" size={24} />
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-gray-200/80 bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Risk Mgmt Score</p>
                      <p className="text-3xl font-bold text-gray-900">{riskMgmtScore}%</p>
                    </div>
                    <Shield className="text-orange-500" size={24} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reports by Type + Program Coverage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-gray-200/80 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-blue-500" />
                    Reports by Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reports.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">No reports generated yet</p>
                  ) : (
                    <div className="space-y-4">
                      {["weekly", "monthly", "quarterly"].map((type) => {
                        const count = reports.filter((r: any) => r.type?.toLowerCase() === type).length;
                        const percentage = reports.length > 0 ? Math.round((count / reports.length) * 100) : 0;
                        return (
                          <div key={type} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                              <span className="text-sm text-gray-500">{count} reports ({percentage}%)</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-gray-200/80 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target size={18} className="text-purple-500" />
                    Program Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {programs.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">No programs created yet</p>
                  ) : (
                    <div className="space-y-3">
                      {programs.map((program: any) => {
                        const hasReports = reports.some((r: any) => r.programId === program.id || r.programName === program.name);
                        const reportCount = reports.filter((r: any) => r.programId === program.id || r.programName === program.name).length;
                        return (
                          <div key={program.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${hasReports ? "bg-green-500" : "bg-gray-300"}`} />
                              <span className="text-sm font-medium text-gray-700">{program.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasReports ? (
                                <Badge className="bg-green-100 text-green-800">{reportCount} report{reportCount !== 1 ? "s" : ""}</Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-500">No reports</Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Risk Trend + Milestone Completion */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-gray-200/80 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-yellow-500" />
                    Risk Trend Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {totalRisks === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">No risks tracked yet</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Critical", count: criticalCount, color: "border-red-300 bg-red-50", textColor: "text-red-700", icon: "bg-red-500" },
                        { label: "High", count: highCount, color: "border-orange-300 bg-orange-50", textColor: "text-orange-700", icon: "bg-orange-400" },
                        { label: "Medium", count: mediumCount, color: "border-yellow-300 bg-yellow-50", textColor: "text-yellow-700", icon: "bg-yellow-400" },
                        { label: "Low", count: lowCount, color: "border-green-300 bg-green-50", textColor: "text-green-700", icon: "bg-green-400" },
                      ].map(({ label, count, color, textColor, icon }) => (
                        <div key={label} className={`p-4 rounded-lg border ${color}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-3 h-3 rounded-full ${icon}`} />
                            <span className={`text-sm font-medium ${textColor}`}>{label}</span>
                          </div>
                          <p className={`text-2xl font-bold ${textColor}`}>{count}</p>
                          <p className="text-xs text-gray-500">{pct(count)}% of total</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-gray-200/80 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-500" />
                    Milestone Completion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const completed = dashboardMetrics?.completedMilestones ?? 0;
                    const total = dashboardMetrics?.totalMilestones ?? 0;
                    const upcoming = dashboardMetrics?.upcomingMilestones ?? 0;
                    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                    return (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                            <span className="text-sm font-semibold text-gray-900">{completed}/{total} completed</span>
                          </div>
                          <Progress value={percentage} className="h-3" />
                          <p className="text-xs text-gray-500 text-right">{percentage}% complete</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4 pt-2">
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-700">{completed}</p>
                            <p className="text-xs text-green-600">Completed</p>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-700">{upcoming}</p>
                            <p className="text-xs text-blue-600">Upcoming</p>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-gray-700">{total > 0 ? total - completed : 0}</p>
                            <p className="text-xs text-gray-600">Remaining</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-6">
            {/* Integration Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {(() => {
                const integrationConfigs = [
                  { name: "slack", label: "Slack", icon: <MessageSquare size={24} className="text-purple-500" />, color: "border-purple-300" },
                  { name: "teams", label: "Microsoft Teams", icon: <Users size={24} className="text-blue-500" />, color: "border-blue-300" },
                  { name: "email", label: "Email (SMTP)", icon: <Mail size={24} className="text-green-500" />, color: "border-green-300" },
                  { name: "confluence", label: "Confluence", icon: <ExternalLink size={24} className="text-orange-500" />, color: "border-orange-300" },
                ];
                return integrationConfigs.map((config) => (
                  <Card key={config.name} className={`border bg-white shadow-sm hover:shadow-md transition-all ${config.color}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        {config.icon}
                        <Badge className="bg-gray-100 text-gray-500">Not Connected</Badge>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900">{config.label}</h3>
                      <p className="text-xs text-gray-500 mt-1">Configure in Settings to enable auto-distribution</p>
                    </CardContent>
                  </Card>
                ));
              })()}
            </div>

            {/* Share Reports */}
            <Card className="border border-gray-200/80 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 size={18} className="text-blue-500" />
                  Share Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reports to share</h3>
                    <p className="text-sm text-gray-500 mb-4">Generate a report first to share it with your team.</p>
                    <Button onClick={handleNewReport} className="bg-primary-500 text-white hover:bg-primary-600">
                      <Plus size={16} className="mr-2" />
                      Generate Report
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...reports].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10).map((report: any) => (
                      <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <FileText size={20} className="text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{report.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`${getReportTypeColor(report.type)} text-xs capitalize`}>{report.type}</Badge>
                              <span className="text-xs text-gray-500">{formatDate(report.createdAt)}</span>
                              <span className="text-xs text-gray-400">{report.programName || "All Programs"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/executive-reports?tab=reports&view=${report.id}`);
                              toast({ title: "Copied", description: "Report link copied to clipboard" });
                            }}
                          >
                            <Copy size={14} className="mr-1" />
                            Copy Link
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/api/reports/${report.id}/pdf`, "_blank")}
                          >
                            <Download size={14} className="mr-1" />
                            PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const subject = encodeURIComponent(report.title);
                              const body = encodeURIComponent(`Please review the following report: ${report.title}\n\nGenerated on ${formatDate(report.createdAt)}\nProgram: ${report.programName || "All Programs"}\n\nView report: ${window.location.origin}/executive-reports?tab=reports&view=${report.id}`);
                              window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
                            }}
                          >
                            <Mail size={14} className="mr-1" />
                            Email
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schedule Distribution */}
            <Card className="border border-gray-200/80 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock size={18} className="text-purple-500" />
                  Scheduled Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-6 text-center bg-gray-50 rounded-lg">
                  <Send size={32} className="mx-auto text-gray-400 mb-3" />
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">No active schedules</h3>
                  <p className="text-xs text-gray-500 mb-4">Connect an integration above to set up automatic report distribution on a recurring schedule.</p>
                  <Button variant="outline" size="sm" onClick={handleScheduleDistribution}>
                    <Plus size={14} className="mr-1" />
                    Create Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
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

      {/* Report Viewer Modal */}
      <Dialog open={!!viewingReport} onOpenChange={() => setViewingReport(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {viewingReport && (() => {
            const c = viewingReport.content as any;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{viewingReport.title}</DialogTitle>
                  <p className="text-sm text-gray-500">
                    {viewingReport.programName || "Portfolio"} &middot; {formatDate(viewingReport.createdAt)}
                  </p>
                </DialogHeader>
                <div className="space-y-6 pt-2">
                  {/* RAG + Summary */}
                  {c?.ragStatus && (
                    <div className="flex items-center gap-3">
                      <Badge className={
                        c.ragStatus === "Green" ? "bg-green-100 text-green-800" :
                        c.ragStatus === "Amber" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }>
                        RAG: {c.ragStatus}
                      </Badge>
                    </div>
                  )}
                  {c?.executiveSummary && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Executive Summary</h4>
                      <p className="text-sm text-gray-700">{c.executiveSummary}</p>
                    </div>
                  )}

                  {/* Program Breakdowns (portfolio reports) */}
                  {c?.programBreakdowns?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Program Breakdown</h4>
                      <div className="space-y-2">
                        {c.programBreakdowns.map((pb: any, i: number) => (
                          <div key={i} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                            <div>
                              <span className="font-medium text-gray-900">{pb.name}</span>
                              <span className="text-sm text-gray-500 ml-2">({pb.status})</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <Badge className={
                                pb.rag === "Green" ? "bg-green-100 text-green-800" :
                                pb.rag === "Amber" ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                              }>{pb.rag}</Badge>
                              <span>{pb.risks?.criticalHigh || 0} critical risks</span>
                              <span>{pb.milestones?.completed || 0}/{pb.milestones?.total || 0} milestones</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Metrics */}
                  {c?.keyMetrics && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Key Metrics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <div className="text-xl font-bold">{c.keyMetrics.totalRisks}</div>
                          <div className="text-xs text-gray-500">Total Risks</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <div className="text-xl font-bold">{c.keyMetrics.criticalRisks}</div>
                          <div className="text-xs text-gray-500">Critical/High</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <div className="text-xl font-bold">{c.keyMetrics.milestoneCompletion}%</div>
                          <div className="text-xs text-gray-500">Milestones Done</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <div className="text-xl font-bold">{c.keyMetrics.adopterReadiness}%</div>
                          <div className="text-xs text-gray-500">Adopter Readiness</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Risk Summary */}
                  {c?.riskSummary?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Top Risks</h4>
                      <div className="space-y-1">
                        {c.riskSummary.map((r: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Badge className={
                              r.severity === "critical" ? "bg-red-100 text-red-800" :
                              r.severity === "high" ? "bg-orange-100 text-orange-800" :
                              "bg-yellow-100 text-yellow-800"
                            }>{r.severity}</Badge>
                            <span className="text-gray-700">{r.title}</span>
                            <span className="text-gray-400">({r.status})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Milestone Progress */}
                  {c?.milestoneProgress?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Milestone Progress</h4>
                      <div className="space-y-1">
                        {c.milestoneProgress.map((m: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{m.title}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{m.status}</Badge>
                              {m.dueDate && <span className="text-gray-400">{formatDate(m.dueDate)}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  {c?.nextSteps?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Next Steps</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                        {c.nextSteps.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
