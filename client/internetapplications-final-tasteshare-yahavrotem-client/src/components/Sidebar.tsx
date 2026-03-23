import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import {
  AutoAwesome,
  EditNote,
  Home,
  Logout,
  Person,
  Restaurant,
} from "@mui/icons-material";
import type { SvgIconComponent } from "@mui/icons-material";
import { NavLink, useLocation } from "react-router-dom";

type SidebarProps = {
  onLogout: () => void;
};

type NavItem = {
  to: string;
  label: string;
  icon: SvgIconComponent;
};

const navItems: readonly NavItem[] = [
  { to: "/feed", label: "Feed", icon: Home },
  { to: "/search", label: "AI Search", icon: AutoAwesome },
  { to: "/create", label: "Add Recipe", icon: EditNote },
  { to: "/profile", label: "Profile", icon: Person },
] as const;

function Sidebar({ onLogout }: SidebarProps) {
  const location = useLocation();

  return (
    <Box
      component="aside"
      aria-label="Primary Navigation"
      sx={{
        position: "fixed",
        inset: "0 auto 0 0",
        zIndex: 50,
        width: 240,
        borderRight: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          px: 3,
          height: 72,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexShrink: 0,
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            background: "linear-gradient(135deg, #FF6B35 0%, #EF4444 100%)",
            boxShadow: "0 4px 12px rgba(255,107,53,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Restaurant sx={{ fontSize: 20, color: "common.white" }} />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 20,
            letterSpacing: "-0.02em",
            color: "text.primary",
          }}
        >
          TasteShare
        </Typography>
      </Box>

      <List sx={{ flex: 1, px: 1.5, pt: 1 }}>
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname.startsWith(to);

          return (
            <ListItemButton
              key={to}
              component={NavLink}
              to={to}
              sx={{
                height: 44,
                borderRadius: 2,
                mb: 0.5,
                bgcolor: isActive ? "rgba(255,107,53,0.08)" : "transparent",
                color: isActive ? "primary.main" : "text.secondary",
                "&:hover": {
                  bgcolor: isActive ? "rgba(255,107,53,0.12)" : "rgba(0,0,0,0.04)",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: isActive ? 500 : 400,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ px: 1.5, pb: 2.5 }}>
        <ListItemButton
          onClick={onLogout}
          sx={{
            height: 44,
            borderRadius: 2,
            color: "text.secondary",
            "&:hover": {
              bgcolor: "rgba(239,68,68,0.08)",
              color: "error.main",
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Sign Out"
            primaryTypographyProps={{ fontSize: 14 }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );
}

export default Sidebar;
