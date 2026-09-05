import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import React from "react";
import { Route, Switch } from "wouter";

import { Toaster } from "sonner";

// Common Components
import ErrorBoundary from "@/components/common/ErrorBoundary";

// Page Views
import LandingPage from "@/pages/landing/LandingPage";
import AuthPage from "@/pages/auth/AuthPage";
import OAuthCallback from "@/pages/auth/OAuthCallback";
import DashboardLayout from "@/pages/dashboard/DashboardLayout";
import NotFound from "@/pages/not-found/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard" component={DashboardLayout} />
      <Route path="/operations" component={DashboardLayout} />
      <Route path="/commit-analysis" component={DashboardLayout} />
      <Route path="/signup">
        {() => <AuthPage initialMode="signup" />}
      </Route>
      <Route path="/signin">
        {() => <AuthPage initialMode="signin" />}
      </Route>
      <Route path="/login">
        {() => <AuthPage initialMode="signin" />}
      </Route>
      <Route path="/oauth/callback" component={OAuthCallback} />
      <Route path="/api/oauth/callback" component={OAuthCallback} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <Router />
          <Toaster position="top-right" theme="dark" richColors />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
