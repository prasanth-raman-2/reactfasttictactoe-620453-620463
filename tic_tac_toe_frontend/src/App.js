import React, { useState, useEffect } from 'react';
import './App.css';
import TicTacToe from "./TicTacToe";

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState("light");

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <div className="App">
      <header className="App-header" style={{ minHeight: "auto", background: "none", boxShadow: "none" }}>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
        <TicTacToe />
        <div style={{ marginTop: 16, color: "var(--text-secondary)", fontSize: 14 }}>
          Current theme: <strong>{theme}</strong>
        </div>
      </header>
    </div>
  );
}

export default App;
