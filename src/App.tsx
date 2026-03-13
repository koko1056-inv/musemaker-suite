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
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="min-h-screen bg-background">
      {/* Simulated sidebar space on desktop */}
      <div className="lg:pl-64">
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
          {/* Content skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
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
