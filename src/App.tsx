import { Navigate, Route, Routes } from "react-router-dom";
import { AppProvider, useApp } from "./store/AppContext";
import PhoneShell from "./components/PhoneShell";
import BottomNav from "./components/BottomNav";
import LoginPage from "./pages/LoginPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import OnboardingPage from "./pages/OnboardingPage";
import HomePage from "./pages/HomePage";
import ItineraryPage from "./pages/ItineraryPage";
import ExplorePage from "./pages/ExplorePage";
import RegionDetailPage from "./pages/RegionDetailPage";
import MyPage from "./pages/MyPage";
import TripResultPage from "./pages/TripResultPage";

function Gate({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, hasOnboarded, authLoading } = useApp();
  // 앱 부팅 시 저장된 토큰으로 /api/users/me 조회가 끝날 때까지는 리다이렉트를 보류한다.
  // (안 그러면 새로고침할 때마다 로그인 화면으로 잠깐 튕기는 깜빡임이 생김)
  if (authLoading) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!hasOnboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route
        path="/home"
        element={
          <Gate>
            <HomePage />
          </Gate>
        }
      />
      <Route
        path="/itinerary/:regionId"
        element={
          <Gate>
            <ItineraryPage />
          </Gate>
        }
      />
      <Route
        path="/trip-result/:tripIndex"
        element={
          <Gate>
            <TripResultPage />
          </Gate>
        }
      />
      <Route
        path="/explore"
        element={
          <Gate>
            <ExplorePage />
          </Gate>
        }
      />
      <Route
        path="/region/:regionId"
        element={
          <Gate>
            <RegionDetailPage />
          </Gate>
        }
      />
      <Route
        path="/my"
        element={
          <Gate>
            <MyPage />
          </Gate>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function Shell() {
  return (
    <PhoneShell>
      <AppRoutes />
    </PhoneShell>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

// re-export for pages that want bottom nav easily
export { BottomNav };
