import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthProvider";
import { useAuth } from "./features/auth/useAuth";
import { useProfileQuery } from "./features/auth/useProfileQuery";
import { Toaster } from "./components/ui/toaster";
import { useTheme } from "./hooks/useTheme";
import LoginScreen from "./features/auth/LoginScreen";
import MainLayout from "./components/layout/MainLayout";
import { AppLoadingSkeleton } from "./components/skeletons/AppLoadingSkeleton";
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
import { FinancialDashboard } from "./features/expenses/FinancialDashboard";
import { DocumentsScreen } from "./features/documents/DocumentsScreen";
// import { MaintenanceScreen } from "./features/maintenance/MaintenanceScreen";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfileQuery(
    user?.id
  );

  if (loading || profileLoading) {
    return <AppLoadingSkeleton />;
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

  useTheme();

  if (loading) {
    return <AppLoadingSkeleton />;
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
        <Route path="expenses" element={<FinancialDashboard />} />
        {/* Rota legada redirecionando para o novo dashboard */}
        <Route path="expenses/planning" element={<Navigate to="/expenses" replace />} />
        <Route path="shopping" element={<ShoppingScreen />} />
        <Route path="documents" element={<DocumentsScreen />} />
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
