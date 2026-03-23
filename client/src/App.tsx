import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { setTokenGetter } from "./lib/authFetch";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAppStore } from "@/stores/appStore";
import { useEffect } from "react";
import { useAuth, SignIn } from "@clerk/clerk-react";
import Dashboard from "@/pages/Dashboard";

import AIAssistant from "@/pages/AIAssistant";
import Programs from "@/pages/Programs";
import ProgramDetails from "@/pages/ProgramDetails";
import Milestones from "@/pages/Milestones";
import RiskManagement from "@/pages/RiskManagement";
import Dependencies from "@/pages/Dependencies";
import AdopterSupport from "@/pages/AdopterSupport";
import People from "@/pages/People";
import Escalations from "@/pages/Escalations";
import ExecutiveReports from "@/pages/ExecutiveReports";
import Stakeholders from "@/pages/Stakeholders";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

const CLERK_ENABLED = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function AuthGate({ children }: { children: React.ReactNode }) {
  if (!CLERK_ENABLED) return <>{children}</>;

  const { isSignedIn, isLoaded, getToken } = useAuth();

  // Wire up the token getter for API requests
  useEffect(() => {
    if (getToken) {
      setTokenGetter(() => getToken());
    }
  }, [getToken]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md p-8">
          <SignIn routing="hash" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/ai" component={AIAssistant} />
          <Route path="/programs" component={Programs} />
          <Route path="/programs/:id">
            {(params) => <ProgramDetails programId={params.id} />}
          </Route>
          <Route path="/milestones" component={Milestones} />
          <Route path="/risk-management" component={RiskManagement} />
          <Route path="/dependencies" component={Dependencies} />
          <Route path="/adopter-support" component={AdopterSupport} />
          <Route path="/people" component={People} />
          <Route path="/escalations" component={Escalations} />
          <Route path="/executive-reports" component={ExecutiveReports} />
          <Route path="/stakeholders" component={Stakeholders} />
          <Route path="/settings" component={Settings} />
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
        <AuthGate>
          <Router />
        </AuthGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
