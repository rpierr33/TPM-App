import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/Sidebar";
import Dashboard from "@/pages/Dashboard";
import Programs from "@/pages/Programs";
import AIAssistant from "@/pages/AIAssistant";
import ProgramPlanning from "@/pages/ProgramPlanning";
import Milestones from "@/pages/Milestones";
import RiskManagement from "@/pages/RiskManagement";
import Dependencies from "@/pages/Dependencies";
import AdopterSupport from "@/pages/AdopterSupport";
import Escalations from "@/pages/Escalations";
import ExecutiveReports from "@/pages/ExecutiveReports";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Switch>
          <Route path="/" component={AIAssistant} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/programs" component={Programs} />
          <Route path="/program-planning" component={ProgramPlanning} />
          <Route path="/milestones" component={Milestones} />
          <Route path="/risk-management" component={RiskManagement} />
          <Route path="/dependencies" component={Dependencies} />
          <Route path="/adopter-support" component={AdopterSupport} />
          <Route path="/escalations" component={Escalations} />
          <Route path="/executive-reports" component={ExecutiveReports} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
