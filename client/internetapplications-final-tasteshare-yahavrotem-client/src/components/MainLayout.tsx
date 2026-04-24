import { Suspense, lazy, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { RecipeDetailRoute } from "../app/routes";
import { appRoutes } from "../app/routeConfig";
import type { AuthSession, AuthUser } from "../services/authService";
import Sidebar from "./Sidebar";

const FeedScreen = lazy(() => import("../pages/FeedScreen"));
const CreatePostScreen = lazy(() => import("../pages/CreatePostScreen"));
const ProfileScreen = lazy(() => import("../pages/ProfileScreen"));
const AISearchScreen = lazy(() => import("../pages/AISearchScreen"));

type MainLayoutProps = {
  session: AuthSession;
  notification: ReactNode;
  onLogout: () => void;
  onProfileUpdated: (updatedUser: AuthUser) => void;
};

function MainLayout({ session, notification, onLogout, onProfileUpdated }: MainLayoutProps) {
  const routeLoadingFallback = (
    <Box sx={{ minHeight: "40vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CircularProgress size={30} />
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Sidebar onLogout={onLogout} />
      <Box component="main" sx={{ ml: "240px", minHeight: "100vh", p: { xs: 2, md: 3 } }}>
        {notification}
        <Routes>
          <Route path="/" element={<Navigate to="/recipes" replace />} />
          <Route
            path="/recipes/:id"
            element={(
              <Suspense fallback={routeLoadingFallback}>
                <RecipeDetailRoute />
              </Suspense>
            )}
          />
          {appRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <Suspense fallback={routeLoadingFallback}>
                  {route.path === "/recipes" ? (
                    <FeedScreen token={session.token} userId={session.user.id} />
                  ) : route.path === "/create" ? (
                    <CreatePostScreen token={session.token} />
                  ) : route.path === "/profile" ? (
                    <ProfileScreen token={session.token} initialUser={session.user} onProfileUpdated={onProfileUpdated} />
                  ) : route.path === "/search" ? (
                    <AISearchScreen token={session.token} />
                  ) : (
                    null
                  )}
                </Suspense>
              }
            />
          ))}
          <Route path="*" element={<Navigate to="/recipes" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default MainLayout;
