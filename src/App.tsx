import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthProvider";
import { useAuth } from "./features/auth/useAuth";
import { useProfileQuery } from "./features/auth/useProfileQuery";
import { Toaster } from "./components/ui/toaster";
// import { useTheme } from "./hooks/useTheme";
import LoginScreen from "./features/auth/LoginScreen";
import { Home } from "lucide-react";
import MainLayout from "./components/layout/MainLayout";
import TodayScreen from "./features/tasks/TodayScreen";
import HistoryScreen from "./features/gamification/HistoryScreen";
import RankingScreen from "./features/gamification/RankingScreen";
import RewardsScreen from "./features/rewards/RewardsScreen";
import { RewardsManagementScreen } from "./features/rewards/RewardsManagementScreen";
import { MembersManagementScreen } from "./features/households/MembersManagementScreen";
import { TasksTrashScreen } from "./features/tasks/TasksTrashScreen";
import { OnboardingScreen } from "./features/households/OnboardingScreen";
import { ShoppingScreen } from "./features/shopping/ShoppingScreen";
import { WeekViewScreen } from "./features/tasks/WeekViewScreen";
import { ExpensesScreen } from "./features/expenses/ExpensesScreen";
// import { MaintenanceScreen } from "./features/maintenance/MaintenanceScreen";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfileQuery(
    user?.id
  );

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-6 animate-in">
          <div className="relative">
            <div className="h-16 w-16 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 animate-pulse"></div>
              <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Home className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-base font-medium text-foreground">
              Carregando...
            </p>
            <p className="text-sm text-muted-foreground">
              Preparando sua experiência
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user doesn't have a household, show onboarding
  if (!profile?.household_id) {
    return <OnboardingScreen />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-6 animate-in">
          <div className="relative">
            <div className="h-16 w-16 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 animate-pulse"></div>
              <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Home className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-base font-medium text-foreground">
              Carregando...
            </p>
            <p className="text-sm text-muted-foreground">
              Preparando sua experiência
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginScreen />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TodayScreen />} />
        <Route path="expenses" element={<ExpensesScreen />} />
        <Route path="shopping" element={<ShoppingScreen />} />
        {/* <Route path="maintenance" element={<MaintenanceScreen />} /> */}
        <Route path="tasks/week" element={<WeekViewScreen />} />
        <Route path="history" element={<HistoryScreen />} />
        <Route path="ranking" element={<RankingScreen />} />
        <Route path="rewards" element={<RewardsScreen />} />
        <Route path="rewards/manage" element={<RewardsManagementScreen />} />
        <Route path="members" element={<MembersManagementScreen />} />
        <Route path="tasks/trash" element={<TasksTrashScreen />} />
      </Route>
    </Routes>
  );
}

function App() {
  // Initialize theme - TEMPORARIAMENTE DESABILITADO
  // useTheme();

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
