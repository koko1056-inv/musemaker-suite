import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Loader2 } from "lucide-react";

// Eagerly load auth page (needed immediately)
import Auth from "./pages/Auth";

// Lazy load all other pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Agents = lazy(() => import("./pages/Agents"));
const AgentEditor = lazy(() => import("./pages/AgentEditor"));
const Conversations = lazy(() => import("./pages/Conversations"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Usage = lazy(() => import("./pages/Usage"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const Team = lazy(() => import("./pages/Team"));
const Settings = lazy(() => import("./pages/Settings"));
const OutboundCalls = lazy(() => import("./pages/OutboundCalls"));
const PhoneNumbers = lazy(() => import("./pages/PhoneNumbers"));
const Guide = lazy(() => import("./pages/Guide"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/agents" element={<Agents />} />
                  <Route path="/agents/:id" element={<AgentEditor />} />
                  <Route path="/conversations" element={<Conversations />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/usage" element={<Usage />} />
                  <Route path="/audit-logs" element={<AuditLogs />} />
                  <Route path="/knowledge" element={<KnowledgeBase />} />
                  <Route path="/team" element={<Team />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/guide" element={<Guide />} />
                  <Route path="/outbound-calls" element={<OutboundCalls />} />
                  <Route path="/phone-numbers" element={<PhoneNumbers />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
