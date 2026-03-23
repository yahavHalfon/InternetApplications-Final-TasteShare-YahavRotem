import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#FF6B35",
      light: "#FF8A5C",
      dark: "#E55A2B",
      contrastText: "#fff",
    },
    secondary: {
      main: "#F7931E",
      light: "#FFAD4D",
      dark: "#D97D14",
      contrastText: "#fff",
    },
    error: {
      main: "#EF4444",
    },
    success: {
      main: "#22C55E",
    },
    warning: {
      main: "#F59E0B",
    },
    background: {
      default: "#f8f8fa",
      paper: "#ffffff",
    },
    text: {
      primary: "#111827",
      secondary: "#6B7280",
    },
    divider: "#f3f4f6",
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h1: { fontFamily: "'Poppins', sans-serif", fontWeight: 600 },
    h2: { fontFamily: "'Poppins', sans-serif", fontWeight: 600 },
    h3: { fontFamily: "'Poppins', sans-serif", fontWeight: 600 },
    h4: { fontFamily: "'Poppins', sans-serif", fontWeight: 600 },
    h5: { fontFamily: "'Poppins', sans-serif", fontWeight: 600 },
    h6: { fontFamily: "'Poppins', sans-serif", fontWeight: 500 },
    button: { textTransform: "none" },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #FF6B35 0%, #EF4444 100%)",
          boxShadow: "0 4px 14px rgba(255,107,53,0.3)",
          "&:hover": {
            background: "linear-gradient(135deg, #E55A2B 0%, #DC2626 100%)",
            boxShadow: "0 6px 20px rgba(255,107,53,0.4)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid #f3f4f6",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            backgroundColor: "#f9fafb",
            "& fieldset": {
              borderColor: "#f3f4f6",
            },
            "&:hover fieldset": {
              borderColor: "#d1d5db",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#FF6B35",
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 500,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
        },
      },
    },
  },
});
