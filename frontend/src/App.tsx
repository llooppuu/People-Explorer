import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAuth } from "./context/AuthContext";
import { HomeView } from "./views/HomeView";
import { BrowseView } from "./views/BrowseView";
import { ProfileView } from "./views/ProfileView";
import { LoginView } from "./views/LoginView";
import { RegisterView } from "./views/RegisterView";
import { RequestView } from "./views/RequestView";
import { WatchlistView } from "./views/WatchlistView";
import { AdminView } from "./views/AdminView";
import { SourcesView } from "./views/SourcesView";
import type { JSX } from "react";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }: { children: JSX.Element }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/" replace />;
}

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/persons" element={<BrowseView />} />
        <Route path="/persons/:id" element={<ProfileView />} />
        <Route path="/sources" element={<SourcesView />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />
        <Route
          path="/requests/new"
          element={
            <RequireAuth>
              <RequestView />
            </RequireAuth>
          }
        />
        <Route
          path="/watchlist"
          element={
            <RequireAuth>
              <WatchlistView />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminView />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
