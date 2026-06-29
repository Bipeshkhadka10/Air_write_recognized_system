import { createContext, useContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

const getInitialTheme = () => {
  const saved = localStorage.getItem("theme");
  if (["Light", "Dark", "System"].includes(saved)) return saved;
  return "System";
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  // Remove old aw_theme key if it exists
  useEffect(() => {
    localStorage.removeItem("aw_theme");
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (isDark) => root.classList.toggle("dark", isDark);

    localStorage.setItem("theme", theme); // ← moved to top

    if (theme === "System") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mq.matches);
      const handler = (e) => applyTheme(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      applyTheme(theme === "Dark");
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
};