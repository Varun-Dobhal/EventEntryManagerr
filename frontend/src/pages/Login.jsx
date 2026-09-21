import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import api from "../utils/api";
import logoImg from "../assets/logo.png";
import { GlobalFooter } from "../components/ui/GlobalFooter";

const ALLOWED_ROLES = ["ADMIN", "ENTRY_VOLUNTEER", "FOOD_VOLUNTEER"];

const getRoleHome = (role) => {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "ENTRY_VOLUNTEER":
    case "FOOD_VOLUNTEER":
      return "/volunteer";
    default:
      return "/";
  }
};

const persistSession = ({ token, role }) => {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
};

export default function Login({ setRole }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", {
        username: cleanUser,
        password: cleanPass,
      });

      if (!data?.token || !data?.role) {
        throw new Error("Invalid response received from authentication server.");
      }

      if (!ALLOWED_ROLES.includes(data.role)) {
        throw new Error("Your account does not have access permissions.");
      }

      persistSession({
        token: data.token,
        role: data.role,
      });

      setRole(data.role);
      navigate(getRoleHome(data.role), { replace: true });
    } catch (err) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");

      setError(
        err.response?.data?.error ||
        err.message ||
        "Invalid username or password. Please verify your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 flex flex-col justify-between font-sans">
      
      {/* ── Top Header Bar ─────────────────────────────────────────── */}
      <header className="w-full bg-white border-b border-[#E5E7EB] sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <img 
              src={logoImg} 
              alt="Graphic Era Emblem" 
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0" 
            />
            <div className="flex flex-col justify-center text-left">
              <span className="font-serif text-base font-bold text-slate-900 tracking-tight leading-none">
                Graphic Era
              </span>
              <span className="text-[0.6rem] text-slate-500 leading-tight mt-0.5">
                deemed to be <strong className="text-slate-800 font-medium">University</strong>
              </span>
              <span className="text-[0.52rem] font-bold tracking-[0.2em] text-[#A31D24] uppercase leading-none mt-0.5">
                DEHRADUN
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block mx-2" />
            <span className="text-sm font-semibold text-slate-800 hidden sm:inline">
              Event Entry &amp; Pass Management
            </span>
          </div>

          <button
            onClick={() => navigate('/')}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Back to Role Selection
          </button>
        </div>
      </header>

      {/* ── Clean Institutional Login Card ─────────────────────────── */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[400px] bg-white rounded-xl border border-[#E5EAF2] p-7 sm:p-8 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
          
          {/* Crest & Portal Title */}
          <div className="text-center mb-6">
            <img 
              src={logoImg} 
              alt="Graphic Era University" 
              className="w-12 h-12 object-contain mx-auto mb-3" 
            />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Portal Sign In
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter credentials to access your assigned workspace
            </p>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200 font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="username">
                Username / Faculty ID
              </label>
              <input
                id="username"
                type="text"
                placeholder="e.g. admin or volunteer_gate1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EAF2] text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium bg-white"
                autoCapitalize="none"
                autoComplete="username"
                required
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#E5EAF2] text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium bg-white"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-[#2563EB] hover:bg-blue-700 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn size={14} />
                <span>{loading ? "Authenticating..." : "Sign In to Workspace"}</span>
              </button>
            </div>

          </form>

        </div>
      </main>

      {/* ── Global Footer ────────────────────────────────────────────── */}
      <GlobalFooter />

    </div>
  );
}
