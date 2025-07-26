import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ProgramPlanning() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Program & Project Planning"
        subtitle="Create and manage programs with OKRs, KPIs, and roadmaps"
        showNewButton={false}
      />

      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <Card>
          <CardHeader>
            <CardTitle>Program Planning Module</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              This module will include:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Create/manage programs with OKRs and KPIs</li>
              <li>• Roadmap builder with drag-and-drop interface</li>
              <li>• Document templates: kickoff decks, status reports, rollout plans</li>
              <li>• Program objectives and success criteria tracking</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
