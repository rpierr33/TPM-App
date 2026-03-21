import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./index.css";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Add global error handlers
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

const root = createRoot(document.getElementById("root")!);

if (CLERK_KEY) {
  root.render(
    <ClerkProvider publishableKey={CLERK_KEY}>
      <App />
    </ClerkProvider>
  );
} else {
  // Dev mode without Clerk — app works without auth
  root.render(<App />);
}
