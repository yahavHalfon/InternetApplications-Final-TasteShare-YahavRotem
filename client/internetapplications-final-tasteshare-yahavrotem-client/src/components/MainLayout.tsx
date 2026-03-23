import { Suspense, lazy, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import { RecipeDetailRoute } from "../app/routes";
import { appRoutes } from "../app/routeConfig";
import type { AuthSession, AuthUser } from "../services/authService";
import Sidebar from "./Sidebar";

const FeedScreen = lazy(() => import("../pages/FeedScreen"));
const CreatePostScreen = lazy(() => import("../pages/CreatePostScreen"));
const ProfileScreen = lazy(() => import("../pages/ProfileScreen"));

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
          <Route path="/" element={<Navigate to="/feed" replace />} />
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
                  {route.path === "/feed" ? (
                    <FeedScreen token={session.token} userId={session.user.id} />
                  ) : route.path === "/create" ? (
                    <CreatePostScreen token={session.token} />
                  ) : route.path === "/profile" ? (
                    <ProfileScreen token={session.token} initialUser={session.user} onProfileUpdated={onProfileUpdated} />
                  ) : (
                    <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 3 }}>
                      <Typography variant="h5" sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, mb: 1 }}>
                        {route.title}
                      </Typography>
                      <Typography color="text.secondary">{route.description}</Typography>
                    </Paper>
                  )}
                </Suspense>
              }
            />
          ))}
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default MainLayout;
