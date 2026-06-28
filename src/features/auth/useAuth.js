// "Who am I" — there is no real auth in V1, so we just remember the picked
// user in localStorage. A refresh keeps you logged in.
import { useLocalStorage } from "../../shared/hooks/useLocalStorage.js";

export function useAuth() {
  const [user, setUser] = useLocalStorage("chat_current_user", null);

  return {
    user,
    login: (u) => setUser(u),
    logout: () => setUser(null),
  };
}
