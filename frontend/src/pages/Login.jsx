import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  User,
  ArrowRight,
  Lock,
  AlertCircle,
  ShieldCheck,
  ScanLine
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

const persistSession = ({ token, role, rememberMe }) => {
  if (rememberMe) {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
  } else {
    // Keep in localStorage for session persistence across page refreshes
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
  }
};

export default function Login({ setRole }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
        rememberMe,
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
    <div className="min-h-[100dvh] text-slate-800 flex flex-col justify-between font-sans relative selection:bg-[#FFB800] selection:text-black">
      
      {/* Floating Animated Ambient Background */}
      <AmbientBackground />

      {/* Centered Responsive Sign-in Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12 relative z-10">
        <div className="w-full max-w-[480px] bg-white/95 backdrop-blur-xl rounded-[28px] sm:rounded-[34px] border border-white/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_25px_70px_rgba(0,0,0,0.12)] transition-all duration-300 p-6 sm:p-10">
          
          {/* University Branding Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div 
              className="inline-flex items-center justify-center gap-3 cursor-pointer hover:opacity-95 transition-opacity mb-4 sm:mb-5"
              onClick={() => navigate('/')}
            >
              <img 
                src={logoImg} 
                alt="Graphic Era University Logo" 
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0" 
              />
              <div className="flex flex-col justify-center text-left">
                <span className="font-serif text-xl sm:text-2xl font-bold text-[#A31D24] tracking-tight leading-none">
                  Graphic Era
                </span>
                <span className="font-serif text-[11px] sm:text-xs text-slate-900 leading-tight mt-0.5">
                  deemed to be <strong className="font-serif">University</strong>
                </span>
                <span className="text-[0.6rem] sm:text-[0.65rem] font-bold tracking-[0.22em] text-[#A31D24] uppercase leading-none mt-1">
                  DEHRADUN
                </span>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Sign In to Workspace
            </h2>
            
            {/* Unified Access Badge */}
            <div className="mt-2.5 inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-slate-100/90 text-slate-600 text-[11px] font-semibold border border-slate-200/70">
              <ShieldCheck size={13} className="text-[#1E2A78]" />
              <span>Admin Portal</span>
              <span className="text-slate-300">•</span>
              <ScanLine size={13} className="text-amber-600" />
              <span>Volunteer Scanner</span>
            </div>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50/95 border border-red-200 text-xs text-red-900 flex items-start gap-2.5 animate-shake shadow-xs">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            
            {/* Username field */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5" htmlFor="username">
                Username <span className="text-red-600">*</span>
              </label>
              <div className="relative flex items-center">
                <User size={18} className="absolute left-3.5 text-slate-400 pointer-events-none z-10" />
                <input
                  id="username"
                  className="w-full bg-slate-50/80 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-base text-slate-900 placeholder-slate-400 font-medium transition-all"
                  style={{ paddingLeft: '2.85rem', paddingTop: '0.8rem', paddingBottom: '0.8rem' }}
                  type="text"
                  placeholder="e.g. admin or volunteer_gate1"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5" htmlFor="password">
                Password <span className="text-red-600">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock size={18} className="absolute left-3.5 text-slate-400 pointer-events-none z-10" />
                <input
                  id="password"
                  className="w-full bg-slate-50/80 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-base text-slate-900 placeholder-slate-400 font-medium transition-all"
                  style={{ paddingLeft: '2.85rem', paddingRight: '2.85rem', paddingTop: '0.8rem', paddingBottom: '0.8rem' }}
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
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none p-1 z-10 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-slate-600 select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember session</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 sm:py-4 text-sm sm:text-base font-black text-slate-950 bg-gradient-to-r from-[#FFB800] to-amber-400 hover:brightness-105 active:scale-[0.99] rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
              className="w-full pt-1 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              &larr; Back to Home
            </button>

          </form>

        </div>
      </main>

      {/* Global University Footer */}
      <div className="relative z-10 bg-white/70 backdrop-blur-md">
        <GlobalFooter />
      </div>

    </div>
  );
}
