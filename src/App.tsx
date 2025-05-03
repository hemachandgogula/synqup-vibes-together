
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Room from "./pages/Room";
import Dashboard from "./pages/Dashboard";
import CreateTeam from "./pages/CreateTeam";
import JoinTeam from "./pages/JoinTeam";
import NotFound from "./pages/NotFound";
import { useAuth } from "./contexts/AuthContext";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import HelpCenter from "./pages/HelpCenter";
import Guides from "./pages/Guides";
import API from "./pages/API";
import Blog from "./pages/Blog";
import Careers from "./pages/Careers";

const queryClient = new QueryClient();

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Public routes that redirect to dashboard when logged in
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// App routes wrapped with auth provider
const AppRoutes = () => {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <Index />
          </PublicRoute>
        } 
      />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/signup" 
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/create-team" 
        element={
          <ProtectedRoute>
            <CreateTeam />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/join-team" 
        element={
          <ProtectedRoute>
            <JoinTeam />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/room" 
        element={
          <ProtectedRoute>
            <Room />
          </ProtectedRoute>
        } 
      />
      {/* New static pages */}
      <Route path="/features" element={<Features />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/integrations" element={<Features />} />
      <Route path="/help-center" element={<HelpCenter />} />
      <Route path="/guides" element={<Guides />} />
      <Route path="/api" element={<API />} />
      <Route path="/about" element={<About />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
