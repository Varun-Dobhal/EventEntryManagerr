import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "../utils/api";
import logoImg from "../assets/logo.png";
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
    <div className="min-h-[100dvh] text-slate-800 flex flex-col justify-center items-center px-4 py-8 relative font-sans selection:bg-blue-600 selection:text-white bg-[#F8FAFC]">
      
      {/* Subtle Ambient Aurora Background */}
      <AmbientBackground />

      {/* Centered Clean Card matching PBL Connect design */}
      <div className="w-full max-w-[420px] bg-white rounded-[28px] sm:rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.07)] border border-slate-100 p-8 sm:p-10 relative z-10 animate-pop-in">
        
        {/* Graphic Era University Emblem */}
        <div className="flex justify-center mb-5">
          <img 
            src={logoImg} 
            alt="Graphic Era University" 
            className="w-18 h-18 sm:w-20 sm:h-20 object-contain drop-shadow-xs" 
          />
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-2xl sm:text-[27px] font-black text-slate-900 tracking-tight text-center mb-1.5">
          Event Entry Manager
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 text-center font-medium mb-7 sm:mb-8">
          Sign in to your unified workspace
        </p>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 font-medium animate-shake">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
          
          {/* Username */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="Enter your Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium bg-white"
              autoCapitalize="none"
              autoComplete="username"
              required
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium bg-white"
                autoComplete="current-password"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.99] transition-all shadow-md shadow-blue-600/25 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
