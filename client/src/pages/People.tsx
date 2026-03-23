import { useState } from "react";
import { Header } from "@/components/layout/Header";
import AdopterSupport from "@/pages/AdopterSupport";
import Stakeholders from "@/pages/Stakeholders";

export default function People() {
  const [tab, setTab] = useState<'adopters' | 'stakeholders'>('adopters');

  return (
    <div className="flex-1 flex flex-col overflow-hidden page-transition">
      <Header
        title="People"
        subtitle="Adopter teams and stakeholder management"
        showNewButton={false}
      />

      {/* Tab bar */}
      <div className="px-5 pt-3 bg-white dark:bg-gray-900 border-b border-gray-200/60 dark:border-white/[0.06]">
        <div className="flex gap-1">
          <button
            onClick={() => setTab('adopters')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === 'adopters'
                ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white border-b-2 border-blue-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Adopter Teams
          </button>
          <button
            onClick={() => setTab('stakeholders')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === 'stakeholders'
                ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white border-b-2 border-blue-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Stakeholders
          </button>
        </div>
      </div>

      {/* Render active tab's page — each page has its own header, so we hide it via CSS */}
      <div className="flex-1 overflow-hidden">
        <div className={`h-full ${tab === 'adopters' ? '' : 'hidden'}`}>
          <div className="h-full [&>div>header]:hidden overflow-auto">
            <AdopterSupport />
          </div>
        </div>
        <div className={`h-full ${tab === 'stakeholders' ? '' : 'hidden'}`}>
          <div className="h-full [&>div>header]:hidden overflow-auto">
            <Stakeholders />
          </div>
        </div>
      </div>
    </div>
  );
}
