// Top-level switch + theme owner:
//   • no user  → Login
//   • user     → the chat shell
import { useAuth } from "./features/auth/useAuth.js";
import { useTheme } from "./shared/hooks/useTheme.js";
import LoginScreen from "./features/auth/LoginScreen.jsx";
import AppShell from "./app/AppShell.jsx";

export default function App() {
  const { user, login, logout } = useAuth();
  const { theme, toggle } = useTheme();

  if (!user) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <AppShell
      user={user}
      onLogout={logout}
      theme={theme}
      onToggleTheme={toggle}
    />
  );
}
