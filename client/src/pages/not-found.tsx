import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex-1 flex items-center justify-center bg-[hsl(220,14%,96%)] page-transition">
      <div className="text-center max-w-md mx-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center mx-auto mb-6">
          <Compass className="h-8 w-8 text-blue-500" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">404</h1>
        <p className="text-lg text-gray-500 mb-6">
          This page doesn't exist or has been moved.
        </p>
        <Button
          onClick={() => setLocation("/")}
          className="bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}
