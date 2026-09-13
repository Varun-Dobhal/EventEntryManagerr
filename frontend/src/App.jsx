import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import api from "./utils/api";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import VolunteerScanner from "./pages/VolunteerScanner";
import ExternalVerify from "./pages/ExternalVerify";
import LandingPage from "./pages/LandingPage";

function App() {
  const [role, setRole] = useState(localStorage.getItem("role") || null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        handleLogout();
        setIsInitializing(false);
        return;
      }


      try {
        const { data } = await api.get("/auth/validate");
        const currentRole = localStorage.getItem("role");
        if (data.role !== currentRole) {
          localStorage.setItem("role", data.role);
          setRole(data.role);
        }
      } catch (err) {
        handleLogout();
      } finally {
        setIsInitializing(false);
      }
    };
    validateSession();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setRole(null);
  };

  const isVolunteer = role === "ENTRY_VOLUNTEER" || role === "FOOD_VOLUNTEER";

  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <div className="app-bg relative min-h-screen text-slate-800">
            {isInitializing ? (
              <div
                style={{
                  height: "100dvh",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#F8FAFC",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: "3px solid rgba(139, 21, 27, 0.15)",
                    borderTopColor: "#8B151B",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              </div>
            ) : (
              <div className="relative z-10">
                <Routes>
                <Route
                  path="/"
                  element={
                    !role ? <LandingPage /> : <Navigate to={role === "ADMIN" ? "/admin" : "/volunteer"} replace />
                  }
                />
                <Route
                  path="/login"
                  element={
                    !role ? <Login setRole={setRole} /> : <Navigate to={role === "ADMIN" ? "/admin" : "/volunteer"} replace />
                  }
                />
                <Route
                  path="/admin"
                  element={
                    role === "ADMIN" ? (
                      <AdminDashboard onLogout={handleLogout} />
                    ) : role ? (
                      <Navigate to="/volunteer" replace />
                    ) : (
                      <Navigate to="/login?portal=admin" replace />
                    )
                  }
                />
                <Route
                  path="/volunteer"
                  element={
                    isVolunteer ? (
                      <VolunteerScanner role={role} onLogout={handleLogout} />
                    ) : role === "ADMIN" ? (
                      <Navigate to="/admin" replace />
                    ) : (
                      <Navigate to="/login?portal=volunteer" replace />
                    )
                  }
                />
                <Route path="/verify/:token" element={<ExternalVerify />} />
              </Routes>
              </div>
            )}
          </div>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
