import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { MetricsCard } from "@/components/dashboard/MetricsCard";
import { RiskHeatmap } from "@/components/dashboard/RiskHeatmap";
import { ProgramTimeline } from "@/components/dashboard/ProgramTimeline";
import { ActiveRisksTable } from "@/components/dashboard/ActiveRisksTable";
import { AdopterDashboard } from "@/components/dashboard/AdopterDashboard";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { EscalationModal } from "@/components/modals/EscalationModal";
// import { ProgramsList } from "@/components/dashboard/ProgramsList";
import { useState } from "react";
import { 
  ChartGantt, 
  AlertTriangle, 
  Flag, 
  Users 
} from "lucide-react";
import type { DashboardMetrics } from "@shared/schema";

export default function Dashboard() {
  const [showEscalationModal, setShowEscalationModal] = useState(false);

  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const handleNewProgram = () => {
    // Navigate to program creation or show modal
    console.log("Create new program");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Program Dashboard"
        subtitle="Overview of all active programs and initiatives"
        onNewClick={handleNewProgram}
      />

      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metricsLoading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))
          ) : (
            <>
              <MetricsCard
                title="All Programs"
                value={metrics?.activePrograms || 0}
                change="Active & Planning"
                changeType="neutral"
                icon={ChartGantt}
                iconColor="bg-primary-100"
                navigateTo="/programs"
              />
              <MetricsCard
                title="Critical Risks"
                value={metrics?.criticalRisks || 0}
                change="+1 this week"
                changeType="increase"
                icon={AlertTriangle}
                iconColor="bg-red-100"
                navigateTo="/risk-management"
              />
              <MetricsCard
                title="Upcoming Milestones"
                value={metrics?.upcomingMilestones || 0}
                change="5 due this week"
                changeType="neutral"
                icon={Flag}
                iconColor="bg-yellow-100"
                navigateTo="/milestones"
              />
              <MetricsCard
                title="Adopter Score"
                value={`${metrics?.adopterScore || 0}%`}
                change="+3% this month"
                changeType="increase"
                icon={Users}
                iconColor="bg-green-100"
                navigateTo="/adopter-support"
              />
            </>
          )}
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RiskHeatmap />
          <ProgramTimeline />
        </div>

        {/* Bottom Section: Tables and Additional Info */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <ActiveRisksTable />
          <AdopterDashboard />
        </div>

        {/* Programs List Section - Available through Programs page */}

        {/* AI Insights Panel */}
        <AIInsights />
      </main>

      <EscalationModal
        open={showEscalationModal}
        onOpenChange={setShowEscalationModal}
      />
    </div>
  );
}
