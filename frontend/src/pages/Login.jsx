import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  User,
  ArrowRight,
  Lock,
  AlertCircle
} from "lucide-react";
import api from "../utils/api";
import logoImg from "../assets/logo.png";
import { GlobalFooter } from "../components/ui/GlobalFooter";
import { AmbientBackground } from "../components/ui/AmbientBackground";

const ALLOWED_ROLES = ["ADMIN", "ENTRY_VOLUNTEER", "FOOD_VOLUNTEER"];

const getRoleHome = (role) => {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "ENTRY_VOLUNTEER":
    case "FOOD_VOLUNTEER":
      return "/volunteer";
    default:
      return "/login";
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
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError("Username and password are required.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", {
        username: cleanUser,
        password: cleanPass,
      });

      if (!data?.token || !data?.role) {
        throw new Error("Invalid authentication response.");
      }

      if (!ALLOWED_ROLES.includes(data.role)) {
        throw new Error("Unauthorized role received.");
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
        "Invalid credentials. Please verify your username and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-800 flex flex-col justify-between font-sans relative selection:bg-[#FFB800] selection:text-black">
      
      {/* ── Floating Animated Aurora Background ───────────────────────── */}
      <AmbientBackground />

      {/* ── Centered Spacious Card ───────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-10 relative z-10">
        <div className="w-full max-w-[580px] bg-white/95 backdrop-blur-xl rounded-[36px] border border-white/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] hover:shadow-[0_25px_70px_rgba(0,0,0,0.1)] transition-all duration-300 p-8 sm:p-14 md:p-16">
          
          {/* Header Section: Logo, Title & Subtitle with Generous Spacing */}
          <div className="text-center pt-2" style={{ marginBottom: '3.25rem' }}>
            
            {/* Official University Logo with clean margin */}
            <div className="flex justify-center" style={{ marginBottom: '2.25rem' }}>
              <div 
                className="inline-flex items-center justify-center gap-3.5 cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => navigate('/')}
              >
                <img 
                  src={logoImg} 
                  alt="Graphic Era Emblem" 
                  className="w-13 h-13 sm:w-16 sm:h-16 object-contain shrink-0" 
                />
                <div className="flex flex-col justify-center text-left">
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-[#A31D24] tracking-tight leading-none">
                    Graphic Era
                  </span>
                  <span className="font-serif text-xs sm:text-sm text-slate-900 leading-tight mt-0.5">
                    deemed to be <strong className="font-serif">University</strong>
                  </span>
                  <span className="text-[0.62rem] sm:text-[0.7rem] font-bold tracking-[0.25em] text-[#A31D24] uppercase leading-none mt-1">
                    DEHRADUN
                  </span>
                </div>
              </div>
            </div>

            {/* Title & Subtitle shifted down with generous space in between */}
            <h2 
              className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
              style={{ marginTop: '0.5rem', marginBottom: '0.85rem' }}
            >
              Event Entry Manager
            </h2>
            <p 
              className="text-xs sm:text-sm text-slate-500 font-medium"
              style={{ marginTop: '0.65rem' }}
            >
              Sign in to your unified workspace
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50/90 border border-red-200 text-xs text-red-800 flex items-start gap-2.5 animate-shake">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6 sm:space-y-7">
            
            {/* Username field */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2.5" htmlFor="username">
                Username <span className="text-red-600">*</span>
              </label>
              <div className="relative flex items-center">
                <User size={19} className="absolute left-4 text-slate-400 pointer-events-none z-10" />
                <input
                  id="username"
                  className="input w-full bg-slate-50/70 border border-slate-200/90 focus:bg-white focus:border-blue-500 rounded-2xl text-sm sm:text-base transition-all"
                  style={{ paddingLeft: '3.25rem', paddingTop: '0.95rem', paddingBottom: '0.95rem' }}
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2.5" htmlFor="password">
                Password <span className="text-red-600">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock size={19} className="absolute left-4 text-slate-400 pointer-events-none z-10" />
                <input
                  id="password"
                  className="input w-full bg-slate-50/70 border border-slate-200/90 focus:bg-white focus:border-blue-500 rounded-2xl text-sm sm:text-base transition-all"
                  style={{ paddingLeft: '3.25rem', paddingRight: '3.25rem', paddingTop: '0.95rem', paddingBottom: '0.95rem' }}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 focus:outline-none p-1 z-10 cursor-pointer"
                  tabIndex={-1}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm text-slate-600 select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember session</span>
              </label>
            </div>

            {/* Sign In Button shifted down */}
            <div style={{ marginTop: '2rem' }}>
              <button
                type="submit"
                className="w-full py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>

            {/* Back to Home Link */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full mt-4 py-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              &larr; Back to Home
            </button>

          </form>

        </div>
      </main>

      {/* ── Global Footer ──────────────────────────────────────────────── */}
      <div className="relative z-10 bg-white/70 backdrop-blur-md">
        <GlobalFooter />
      </div>

    </div>
  );
}
