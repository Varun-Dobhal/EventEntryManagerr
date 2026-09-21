import { useState, useEffect } from "react";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  Mail,
  CheckCircle2,
  Users,
  Send,
  RefreshCw,
  Search,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  ScanLine,
  Utensils,
  AlertCircle,
  X,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Filter,
  Trash2,
  Plus,
  MailCheck,
  Bell,
  LayoutDashboard,
  Menu,
  LayoutGrid,
  Globe,
  ExternalLink,
  QrCode,
  UserPlus,
} from "lucide-react";
import api from "../utils/api";
import { useToast } from "../context/ToastContext";
import logoImg from "../assets/logo.png";
import EventManagement from "../components/EventManagement";
import CampaignManagement from "../components/CampaignManagement";
import DataCleanup from "../components/DataCleanup";
import DeleteModal from "../components/DeleteModal";
import { GlobalFooter } from "../components/ui/GlobalFooter";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import AttendeeTable from "../components/AttendeeTable";
import DashboardAnalytics from "../components/DashboardAnalytics";
import MailSentRecords from "../components/MailSentRecords";
import AddUserManual from "../components/AddUserManual";

function StatCard({ label, value, total, color, icon, statColor, subtitle, badge, theme = "neutral" }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  
  // Exact styling matching Screenshot 3 horizontal cards
  const themes = {
    neutral: {
      card: "bg-white border-slate-200",
      label: "text-slate-500",
      value: "text-slate-900",
      sub: "text-slate-400",
    },
    blue: {
      card: "bg-[#EFF6FF] border-[#BFDBFE]",
      label: "text-[#2563EB]",
      value: "text-[#2563EB]",
      sub: "text-blue-600/80",
    },
    green: {
      card: "bg-[#ECFDF5] border-[#A7F3D0]",
      label: "text-[#059669]",
      value: "text-[#059669]",
      sub: "text-emerald-600/80",
    },
    amber: {
      card: "bg-[#FFFBEB] border-[#FDE68A]",
      label: "text-[#D97706]",
      value: "text-[#D97706]",
      sub: "text-amber-600/80",
    },
    rose: {
      card: "bg-[#FEF2F2] border-[#FECDD3]",
      label: "text-[#DC2626]",
      value: "text-[#DC2626]",
      sub: "text-rose-600/80",
    },
    purple: {
      card: "bg-[#FAF5FF] border-[#DDD6FE]",
      label: "text-[#7C3AED]",
      value: "text-[#7C3AED]",
      sub: "text-purple-600/80",
    }
  };

  const t = themes[theme] || themes.neutral;

  return (
    <div className={`rounded-xl border py-3 px-4 flex flex-col justify-between transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)] text-center ${t.card}`}>
      <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate ${t.label}`}>
        {label}
      </p>
      <h3 className={`text-2xl sm:text-[28px] font-bold tracking-tight leading-none my-1.5 ${t.value}`}>
        {value}
      </h3>
      <p className={`text-[11px] font-normal truncate mt-0.5 ${t.sub}`}>
        {subtitle || (total > 0 ? `${pct}% of roster` : "Registered")}
      </p>
    </div>
  );
}
function StatusBadge({
  done,
  doneLabel = "Done",
  pendingLabel = "Pending",
  time,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
      }}
    >
      {" "}
      <span className={`badge ${done ? "badge-green" : "badge-muted"}`}>
        {" "}
        {done ? `✓ ${doneLabel}` : `○ ${pendingLabel}`}{" "}
      </span>{" "}
      {time && (
        <span
          style={{
            fontSize: "0.6rem",
            color: "var(--text-muted)",
            fontWeight: 600,
          }}
        >
          {" "}
          {new Date(time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
        </span>
      )}{" "}
    </div>
  );
}
export default function AdminDashboard({ onLogout }) {
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({ name: "", roll: "", email: "" });
  const [step, setStep] = useState(1);
  const [eventName, setEventName] = useState("");
  const [validationSummary, setValidationSummary] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [providers, setProviders] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settingsProvider, setSettingsProvider] = useState("RESEND");
  const [settingsSender, setSettingsSender] = useState("");
  const [settingsCreds, setSettingsCreds] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [emailLoading, setEmailLoading] = useState(null);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [campaignReport, setCampaignReport] = useState(null);
  const [campaignActionLoading, setCampaignActionLoading] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("upload");
  const [checkpointFilters, setCheckpointFilters] = useState({});
  const [emailFilter, setEmailFilter] = useState("all");
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const [events, setEvents] = useState([]);
  const [activeEventId, setActiveEventId] = useState("");
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null, isProcessing: false });
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  const activeEvent = events.find(e => e.id === activeEventId);
  const eventCheckpoints = activeEvent?.checkpoints || [];
  
  const { toast } = useToast();
  
  const fetchGlobalEvents = async () => {
    try {
      const res = await api.get("/events");
      setEvents(res.data);
      const active = res.data.find(e => e.isActive) || res.data[0];
      if (active && !activeEventId) {
        setActiveEventId(active.id);
        if (!eventName) setEventName(active.name);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGlobalEvents();
  }, []);

  useEffect(() => {
    if (activeEventId) {
      fetchAttendees();
      fetchActiveCampaign();
    }
  }, [activeEventId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeEventId) fetchActiveCampaign();
    }, 3000);
    return () => clearInterval(interval);
  }, [activeEventId]);

  const fetchActiveCampaign = async () => {
    if (!activeEventId) return;
    try {
      const res = await api.get(`/attendees/campaigns/active?eventId=${activeEventId}`);
      setActiveCampaign(res.data || null);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === "settings") {
      fetchSettings();
    }
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      const [provRes, logRes] = await Promise.all([
        api.get("/settings/email-providers"),
        api.get("/settings/audit-logs")
      ]);
      setProviders(provRes.data);
      setAuditLogs(logRes.data);
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  const fetchAttendees = async () => {
    if (!activeEventId) return;
    try {
      const [attRes, dsRes] = await Promise.all([
        api.get(`/attendees?eventId=${activeEventId}`),
        api.get(`/attendees/datasets?eventId=${activeEventId}`)
      ]);
      setAttendees(Array.isArray(attRes.data) ? attRes.data : []);
      setDatasets(Array.isArray(dsRes.data) ? dsRes.data : []);
    } catch (err) {
      console.error(err);
      setAttendees([]);
      setDatasets([]);
    }
  };
  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", selected);
      const { data } = await api.post("/attendees/parse-excel", fd);
      setHeaders(data.headers || []);
      const m = { name: "", roll: "", email: "" };
      (data.headers || []).forEach((h) => {
        const l = h.toLowerCase();
        if (l.includes("name")) m.name = h;
        if (l.includes("roll") || l.includes("id")) m.roll = h;
        if (l.includes("mail")) m.email = h;
      });
      setMapping(m);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to parse file.");
      setFile(null);
    } finally {
      setLoading(false);
    }
  };
  const handleValidate = async () => {
    if (!mapping.name || !mapping.roll) {
      setError("Name and Roll are required!");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mapping", JSON.stringify(mapping));
      const res = await api.post("/attendees/validate-excel", fd);
      setValidationSummary(res.data);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || "Validation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!eventName.trim() && !activeEventId) {
      setError("Please enter an Event Name!");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      let targetEventId = activeEventId;

      // If no active event exists, auto-create event from the entered Event Name!
      if (!targetEventId) {
        let targetEvent = events.find(e => e.name.toLowerCase() === eventName.trim().toLowerCase());
        if (!targetEvent) {
          const createRes = await api.post("/events", {
            name: eventName.trim(),
            type: "Campus Event",
            date: new Date().toISOString(),
            venue: "Graphic Era Campus"
          });
          targetEvent = createRes.data;
          await fetchGlobalEvents();
        }
        targetEventId = targetEvent.id;
        setActiveEventId(targetEvent.id);
      }

      const fd = new FormData();
      fd.append("file", file);
      fd.append("mapping", JSON.stringify(mapping));
      fd.append("eventName", eventName.trim() || activeEvent?.name || "Campus Event");
      fd.append("eventId", targetEventId);
      
      const res = await api.post("/attendees/upload-excel", fd, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", `QR_Codes_${Date.now()}.zip`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setStep(4);
      await fetchAttendees();
    } catch (err) {
      const errMsg = err.response && err.response.data instanceof Blob 
        ? await err.response.data.text().then(t => { try { return JSON.parse(t).error; } catch { return "Upload failed."; } })
        : (err.response?.data?.error || "Upload failed.");
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreDataset = async (id) => {
    if (!window.confirm("Restore this dataset? It will become the active dataset.")) return;
    try {
      await api.post(`/attendees/datasets/${id}/restore`);
      toast({ type: "success", message: "Dataset restored!" });
      await fetchAttendees();
    } catch (err) {
      toast({ type: "error", message: "Failed to restore dataset." });
    }
  };

  const handleClearAttendees = () => {
    if (!activeEventId) return toast({ type: "error", message: "Select an event first!" });
    setDeleteModal({ isOpen: true, type: "clearAttendees", id: activeEventId, isProcessing: false });
  };

  const handleDeleteDataset = (id) => {
    setDeleteModal({ isOpen: true, type: "deleteDataset", id, isProcessing: false });
  };

  const processModalConfirm = async () => {
    setDeleteModal(prev => ({ ...prev, isProcessing: true }));
    try {
      if (deleteModal.type === "clearAttendees") {
        await api.delete(`/attendees/clear?eventId=${deleteModal.id}`);
        toast({ type: "success", message: "All attendees cleared successfully!" });
        await fetchAttendees();
      } else if (deleteModal.type === "deleteDataset") {
        await api.delete(`/attendees/datasets/${deleteModal.id}`);
        toast({ type: "success", message: "Dataset deleted!" });
        await fetchAttendees();
      }
    } catch (err) {
      toast({ type: "error", message: err.response?.data?.error || "Operation failed" });
    } finally {
      setDeleteModal({ isOpen: false, type: null, id: null, isProcessing: false });
    }
  };

  const handleSaveSettings = async () => {
    if (!settingsSender) {
      toast({ type: "error", message: "Sender email is required!" });
      return;
    }
    setSettingsLoading(true);
    try {
      await api.post("/settings/email-providers", {
        name: settingsProvider,
        senderEmail: settingsSender,
        credentials: settingsCreds
      });
      toast({ type: "success", message: "Provider settings saved and active!" });
      setSettingsCreds({}); // Clear inputs
      await fetchSettings();
    } catch (err) {
      toast({ type: "error", message: err.response?.data?.error || "Failed to save settings." });
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    const activeProvider = providers.find(p => p.isActive);
    if (!activeProvider) {
      toast({ 
        type: "warning", 
        message: "No active email provider configured yet. Please configure a provider below and click 'Save & Set Active' first." 
      });
      return;
    }

    setTestLoading(true);
    try {
      const res = await api.post("/settings/test-email", {
        recipient: activeProvider.senderEmail
      });
      toast({ 
        type: "success", 
        message: res.data?.message || `Connection test successful! Sent test email to ${activeProvider.senderEmail}.` 
      });
    } catch (err) {
      toast({ 
        type: "error", 
        message: err.response?.data?.error || "Connection test failed." 
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSendEmail = async (id) => {
    setEmailLoading(id);
    try {
      await api.post(`/attendees/send-email/${id}`, { message: customMessage });
      await fetchAttendees();
      toast({ type: "success", message: "Email sent!" });
    } catch (err) {
      toast({
        type: "error",
        message: err.response?.data?.error || "Failed to send email",
      });
    } finally {
      setEmailLoading(null);
    }
  };
  const handleStartCampaign = async () => {
    if (!window.confirm(`Start background email campaign?`)) return;
    setCampaignActionLoading(true);
    try {
      const activeProv = providers.find(p => p.isActive);
      const delayMs = activeProv?.name === "GOOGLE" ? 1500 : activeProv?.name === "AWS_SES" ? 100 : 10000;
      await api.post(`/attendees/campaigns/start`, {
        batchSize: 50,
        delayMs,
        providerName: activeProv?.name || "RESEND",
        eventId: activeEventId
      });
      toast({ type: "success", message: "Campaign started successfully!" });
      await fetchActiveCampaign();
    } catch (err) {
      toast({ type: "error", message: err.response?.data?.error || "Failed to start campaign" });
    } finally {
      setCampaignActionLoading(false);
    }
  };

  const handlePauseCampaign = async () => {
    if (!activeCampaign) return;
    setCampaignActionLoading(true);
    try {
      await api.post(`/attendees/campaigns/${activeCampaign.id}/pause`);
      toast({ type: "success", message: "Campaign paused." });
      await fetchActiveCampaign();
    } catch (err) {
      toast({ type: "error", message: "Failed to pause campaign." });
    } finally {
      setCampaignActionLoading(false);
    }
  };

  const handleResumeCampaign = async () => {
    if (!activeCampaign) return;
    setCampaignActionLoading(true);
    try {
      await api.post(`/attendees/campaigns/${activeCampaign.id}/resume`);
      toast({ type: "success", message: "Campaign resumed." });
      await fetchActiveCampaign();
    } catch (err) {
      toast({ type: "error", message: "Failed to resume campaign." });
    } finally {
      setCampaignActionLoading(false);
    }
  };

  const handleCancelCampaign = async () => {
    if (!activeCampaign) return;
    if (!window.confirm("Cancel this campaign? Pending emails will NOT be sent.")) return;
    setCampaignActionLoading(true);
    try {
      await api.post(`/attendees/campaigns/${activeCampaign.id}/cancel`);
      toast({ type: "success", message: "Campaign cancelled." });
      await fetchActiveCampaign();
    } catch (err) {
      toast({ type: "error", message: "Failed to cancel campaign." });
    } finally {
      setCampaignActionLoading(false);
    }
  };
  const resetState = () => {
    setFile(null);
    setHeaders([]);
    setStep(1);
    setError(null);
  };
  let filtered = attendees.filter((a) => {
    const s = searchTerm.toLowerCase();
    if (!(a.name.toLowerCase().includes(s) || a.roll.toLowerCase().includes(s))) return false;
    
    for (const cp of eventCheckpoints) {
      const filterValue = checkpointFilters[cp.id] || "all";
      if (filterValue !== "all") {
        const statusObj = a.checkpointStatuses?.find(cs => cs.checkpointId === cp.id);
        const isDone = !!statusObj?.status;
        if (filterValue === "done" && !isDone) return false;
        if (filterValue === "pending" && isDone) return false;
      }
    }
    
    if (emailFilter === "sent" && !a.emailSent) return false;
    if (emailFilter === "pending" && a.emailSent) return false;

    return true;
  });
  filtered = filtered.sort((a, b) => {
    if (sortOption === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortOption === "roll") {
      return a.roll.localeCompare(b.roll, undefined, { numeric: true, sensitivity: 'base' });
    }
    return 0; // upload order
  });

  const stats = {
    total: attendees.length,
  };

  return (
    <div className="min-h-screen w-full flex flex-col font-sans bg-[#F7F9FC]">
      
      {/* ── Graphic Era Executive Topbar (Screenshot 3 Philosophy) ── */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E5E7EB]">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Hamburger (mobile), Graphic Era Logo Crest, Portal Title */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200"
              title="Open Navigation"
            >
              <Menu size={18} />
            </button>

            {/* Logo and Crest */}
            <div 
              className="flex items-center gap-2.5 cursor-pointer group" 
              onClick={() => setActiveTab("dashboard")}
            >
              <img 
                src={logoImg} 
                alt="Graphic Era Crest" 
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0" 
              />
              <div className="flex flex-col justify-center">
                <span className="font-serif text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                  Graphic Era
                </span>
                <span className="text-[0.6rem] sm:text-[0.65rem] text-slate-500 leading-tight mt-0.5">
                  deemed to be <strong className="text-slate-800 font-medium">University</strong>
                </span>
                <span className="text-[0.52rem] font-bold tracking-[0.2em] text-[#A31D24] uppercase leading-none mt-0.5">
                  DEHRADUN
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1" />

            {/* Portal Title */}
            <span className="text-sm font-semibold text-slate-800 hidden sm:inline">
              Event Entry Portal
            </span>
          </div>

          {/* Right: Actions, App Grid, Notifications & Profile Avatar (Screenshot 3 Style) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* App Grid Icon */}
            <button 
              onClick={() => setActiveTab("dashboard")}
              className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shadow-2xs cursor-pointer"
              title="Workspaces & Services"
            >
              <LayoutGrid size={15} />
            </button>

            {/* Circular Refresh Button */}
            <button 
              onClick={activeTab === "settings" ? fetchSettings : fetchAttendees} 
              className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shadow-2xs cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw size={14} />
            </button>

            {/* Circular Bell Button */}
            <button 
              className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shadow-2xs cursor-pointer"
              title="Notifications"
            >
              <Bell size={14} />
            </button>

            {/* User Profile Avatar & Sign Out */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div 
                className="w-8 h-8 rounded-full bg-[#1E2A78] text-white flex items-center justify-center font-bold text-xs shadow-xs relative shrink-0" 
                title="Admin Console (Faculty / Event Incharge)"
              >
                <span>A</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 ring-2 ring-white" />
              </div>
              <button 
                onClick={onLogout} 
                className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut size={16} /> 
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* ── Main Layout Body: Left Sidebar + Main Content Canvas ── */}
      <div className="flex-1 flex w-full">

        {/* ── Desktop Left Sidebar (Exact Screenshot 3 Match) ── */}
        <aside className="w-60 shrink-0 bg-white border-r border-[#E5E7EB] hidden md:flex flex-col justify-between py-5 px-3 min-h-[calc(100vh-64px)]">
          <div className="space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
              { id: "mail-sent", label: "Mail Sent", icon: <MailCheck size={17} /> },
              { id: "add-user", label: "Add Users", icon: <UserPlus size={17} /> },
              { id: "events", label: "Events & Gates", icon: <ScanLine size={17} /> },
              { id: "campaigns", label: "Email Passes", icon: <Send size={17} /> },
              { id: "settings", label: "System Settings", icon: <Settings size={17} /> },
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors text-left cursor-pointer ${
                    isActive
                      ? "bg-[#2563EB] text-white font-medium shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <span className={isActive ? "text-white" : "text-slate-500"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Mobile Sidebar Drawer (Screens < 768px) ── */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
              onClick={() => setMobileSidebarOpen(false)} 
            />
            <div className="relative w-64 bg-white flex flex-col p-4 shadow-xl z-10 animate-fade-in">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <span className="font-bold text-sm text-slate-900">Event Portal Menu</span>
                  <button 
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="space-y-1">
                  {[
                    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
                    { id: "mail-sent", label: "Mail Sent", icon: <MailCheck size={17} /> },
                    { id: "add-user", label: "Add Users", icon: <UserPlus size={17} /> },
                    { id: "events", label: "Events & Gates", icon: <ScanLine size={17} /> },
                    { id: "campaigns", label: "Email Passes", icon: <Send size={17} /> },
                    { id: "settings", label: "System Settings", icon: <Settings size={17} /> },
                  ].map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-left ${
                          isActive
                            ? "bg-[#2563EB] text-white font-medium"
                            : "text-slate-600 hover:bg-slate-50 font-medium"
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Main Workspace Content Area ──────────── */}
        <main className="flex-1 min-w-0 bg-[#F7F9FC] p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto w-full">
        {activeTab === "add-user" ? (
          <AddUserManual
            activeEvent={activeEvent}
            activeEventId={activeEventId}
            events={events}
            setActiveEventId={setActiveEventId}
            fetchAttendees={fetchAttendees}
            onNavigateToRoster={() => setActiveTab("dashboard")}
          />
        ) : activeTab === "events" ? (
          <EventManagement activeEventId={activeEventId} setActiveEventId={setActiveEventId} />
        ) : activeTab === "campaigns" ? (
          <CampaignManagement activeEventId={activeEventId} />
        ) : activeTab === "settings" ? (
          <div className="flex flex-col gap-6">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 sm:p-7">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight m-0">Email Provider Settings</h2>
                    {providers.some(p => p.isActive) ? (
                      <span className="badge badge-green text-[0.68rem] px-2.5 py-0.5 rounded-full font-bold">
                        {providers.find(p => p.isActive)?.name} Active
                      </span>
                    ) : (
                      <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-[0.68rem] px-2.5 py-0.5 rounded-full font-bold">
                        No Provider Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Configure authentication and delivery service for automated pass emails</p>
                </div>
                <button 
                  onClick={handleTestConnection} 
                  disabled={testLoading}
                  title={!providers.some(p => p.isActive) ? "Configure and save an email provider first" : "Send test email"}
                  className="btn btn-sm btn-secondary rounded-xl text-xs cursor-pointer shadow-2xs"
                >
                  {testLoading ? "Testing..." : "Test Connection"}
                </button>
              </div>

              {!providers.some(p => p.isActive) && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-amber-800 text-xs mb-5 max-w-xl">
                  <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 animate-pulse"></span>
                  <span><strong>Setup Required:</strong> Select your preferred email provider below, fill in credentials, and click <strong>Save &amp; Set Active</strong> before testing.</span>
                </div>
              )}

              <div className="mb-5 max-w-xl">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Provider</label>
                <select 
                  className="input select w-full bg-white border border-slate-200 rounded-xl text-xs sm:text-sm shadow-2xs" 
                  value={settingsProvider} 
                  onChange={(e) => {
                    setSettingsProvider(e.target.value);
                    setSettingsCreds({});
                  }}
                >
                  <option value="RESEND">Resend</option>
                  <option value="GOOGLE">Google OAuth (Gmail API)</option>
                  <option value="AWS_SES">AWS SES</option>
                  <option value="SMTP">Custom SMTP (e.g. Gmail App Password)</option>
                </select>
              </div>

              <div className="mb-5 max-w-xl">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Verified Sender Email</label>
                <input 
                  type="email" 
                  className="input w-full bg-white border border-slate-200 rounded-xl text-xs sm:text-sm shadow-2xs" 
                  value={settingsSender} 
                  onChange={(e) => setSettingsSender(e.target.value)} 
                  placeholder="e.g. events@graphicera.edu.in" 
                />
              </div>

              {settingsProvider === "RESEND" && (
                <div className="mb-5 max-w-xl">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">API Key</label>
                  <input 
                    type="password" 
                    className="input w-full bg-white border border-slate-200 rounded-xl text-xs sm:text-sm shadow-2xs" 
                    placeholder="re_..." 
                    value={settingsCreds.apiKey || ""} 
                    onChange={(e) => setSettingsCreds({ ...settingsCreds, apiKey: e.target.value })} 
                  />
                </div>
              )}

              {settingsProvider === "GOOGLE" && (
                <div className="space-y-4 max-w-xl mb-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Client ID</label>
                    <input type="password" className="input w-full bg-white border border-slate-200 rounded-xl text-xs sm:text-sm shadow-2xs" value={settingsCreds.clientId || ""} onChange={(e) => setSettingsCreds({ ...settingsCreds, clientId: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Client Secret</label>
                    <input type="password" className="input w-full bg-white border border-slate-200 rounded-xl text-xs sm:text-sm shadow-2xs" value={settingsCreds.clientSecret || ""} onChange={(e) => setSettingsCreds({ ...settingsCreds, clientSecret: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Refresh Token</label>
                    <input type="password" className="input w-full bg-white border border-slate-200 rounded-xl text-xs sm:text-sm shadow-2xs" value={settingsCreds.refreshToken || ""} onChange={(e) => setSettingsCreds({ ...settingsCreds, refreshToken: e.target.value })} />
                  </div>
                </div>
              )}

              {settingsProvider === "AWS_SES" && (
                <div className="space-y-4 max-w-xl mb-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Access Key ID / SMTP Username
                    </label>
                    <input 
                      type="text" 
                      className="input w-full bg-white border border-slate-200 rounded-xl text-xs sm:text-sm shadow-2xs font-mono" 
                      placeholder="e.g. AKIA..." 
                      value={settingsCreds.accessKey || ""} 
                      onChange={(e) => setSettingsCreds({ ...settingsCreds, accessKey: e.target.value.trim() })} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Secret Access Key / SES SMTP Password
                    </label>
                    <input 
                      type="password" 
                      className="input w-full bg-white border border-slate-200 rounded-xl text-xs sm:text-sm shadow-2xs" 
                      placeholder="40-char IAM Secret or 44-char SMTP Password" 
                      value={settingsCreds.secretKey || ""} 
                      onChange={(e) => setSettingsCreds({ ...settingsCreds, secretKey: e.target.value.trim() })} 
                    />
                    <span className="text-[0.68rem] text-slate-400 mt-1 block">
                      Supports both IAM Secret Access Key and generated SES SMTP Password.
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      AWS Region
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        className="input select w-full bg-white border border-slate-200 rounded-xl text-xs shadow-2xs"
                        value={["ap-south-1", "us-east-1", "us-east-2", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1"].includes(settingsCreds.region) ? settingsCreds.region : (settingsCreds.region ? "custom" : "ap-south-1")}
                        onChange={(e) => {
                          if (e.target.value !== "custom") {
                            setSettingsCreds({ ...settingsCreds, region: e.target.value });
                          } else {
                            setSettingsCreds({ ...settingsCreds, region: "" });
                          }
                        }}
                      >
                        <option value="ap-south-1">Asia Pacific (Mumbai) - ap-south-1</option>
                        <option value="us-east-1">US East (N. Virginia) - us-east-1</option>
                        <option value="us-east-2">US East (Ohio) - us-east-2</option>
                        <option value="us-west-2">US West (Oregon) - us-west-2</option>
                        <option value="eu-west-1">Europe (Ireland) - eu-west-1</option>
                        <option value="eu-central-1">Europe (Frankfurt) - eu-central-1</option>
                        <option value="ap-southeast-1">Asia Pacific (Singapore) - ap-southeast-1</option>
                        <option value="custom">Other / Custom Region...</option>
                      </select>
                      <input 
                        type="text" 
                        className="input w-full bg-white border border-slate-200 rounded-xl text-xs shadow-2xs font-mono" 
                        placeholder="Region code (e.g. ap-south-1)" 
                        value={settingsCreds.region !== undefined ? settingsCreds.region : "ap-south-1"} 
                        onChange={(e) => setSettingsCreds({ ...settingsCreds, region: e.target.value.trim().toLowerCase() })} 
                      />
                    </div>
                    <span className="text-[0.68rem] text-slate-400 mt-1 block">
                      Must match the AWS Region where your SES identity exists.
                    </span>
                  </div>
                </div>
              )}

              {settingsProvider === "SMTP" && (
                <div className="space-y-4 max-w-xl mb-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">SMTP Host</label>
                    <input type="text" className="input w-full bg-white border border-slate-200 rounded-xl text-xs sm:text-sm shadow-2xs" placeholder="e.g. smtp.gmail.com" value={settingsCreds.host || ""} onChange={(e) => setSettingsCreds({ ...settingsCreds, host: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">SMTP Port</label>
                    <input type="text" className="input w-full bg-white border border-slate-200 rounded-xl text-xs sm:text-sm shadow-2xs" placeholder="e.g. 465 or 587" value={settingsCreds.port || ""} onChange={(e) => setSettingsCreds({ ...settingsCreds, port: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Username (Email)</label>
                    <input type="text" className="input w-full bg-white border border-slate-200 rounded-xl text-xs sm:text-sm shadow-2xs" placeholder="e.g. you@gmail.com" value={settingsCreds.username || ""} onChange={(e) => setSettingsCreds({ ...settingsCreds, username: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Password (App Password)</label>
                    <input type="password" className="input w-full bg-white border border-slate-200 rounded-xl text-xs sm:text-sm shadow-2xs" placeholder="16-letter App Password" value={settingsCreds.password || ""} onChange={(e) => setSettingsCreds({ ...settingsCreds, password: e.target.value })} />
                  </div>
                </div>
              )}

              <button 
                onClick={handleSaveSettings} 
                disabled={settingsLoading} 
                className="btn btn-geu-yellow font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-md cursor-pointer"
              >
                {settingsLoading ? "Saving..." : "Save & Set Active"}
              </button>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Current Active Configuration</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  {providers.filter(p => p.isActive).map(p => (
                    <div key={p.id} className="space-y-1.5 text-xs">
                      <p className="text-slate-700"><strong>Provider:</strong> {p.name}</p>
                      <p className="text-slate-700"><strong>Sender:</strong> {p.senderEmail}</p>
                      {p.fields?.region && (
                        <p className="text-slate-700"><strong>AWS Region:</strong> <code className="px-1.5 py-0.5 bg-slate-200/70 rounded text-slate-800 font-mono text-[0.72rem]">{p.fields.region}</code></p>
                      )}
                      <p className="text-slate-700"><strong>Status:</strong> <span className="badge badge-green ml-1">Connected &amp; Active</span></p>
                    </div>
                  ))}
                  {providers.filter(p => p.isActive).length === 0 && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                      <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>
                      <span>No provider active yet. Enter credentials above and click <strong>Save &amp; Set Active</strong>.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 sm:p-7">
              <h2 className="text-base font-bold text-slate-900 tracking-tight mb-4">System Audit Logs</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-2.5 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider">Time</th>
                      <th className="px-4 py-2.5 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider">Admin</th>
                      <th className="px-4 py-2.5 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                      <th className="px-4 py-2.5 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-8 text-slate-400 font-medium">No logs recorded yet.</td></tr>
                    ) : auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-2.5 text-slate-500 font-mono">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">{log.admin?.name || "System"}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-700">{log.action}</td>
                        <td className="px-4 py-2.5 text-slate-500">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === "mail-sent" ? (
          <MailSentRecords
            attendees={attendees}
            eventCheckpoints={eventCheckpoints}
            activeEvent={activeEvent}
            onResendEmail={handleSendEmail}
            emailLoading={emailLoading}
            fetchAttendees={fetchAttendees}
            datasets={datasets}
            onRestoreDataset={handleRestoreDataset}
            onDeleteDataset={handleDeleteDataset}
          />
        ) : (
          <>
        {/* ── Page Header & Quick Action Toolbar (Screenshot 3 Style) ──── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight m-0">
                {activeEvent?.name || "Attendee & Pass Roster"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {eventCheckpoints.length} Checkpoints
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active Session
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <span>Campus: Graphic Era Deemed to be University</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">{attendees.length} Attendees Enrolled</span>
            </p>
          </div>

          {/* Quick CTAs / Event Selector */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {events.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
                <span className="text-[0.68rem] font-semibold text-slate-500 shrink-0">Event:</span>
                <select 
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer max-w-[140px] truncate"
                  value={activeEventId}
                  onChange={(e) => setActiveEventId(e.target.value)}
                >
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
                <button
                  onClick={() => setActiveTab("events")}
                  title="Manage / Create Events"
                  className="text-slate-400 hover:text-[#2563EB] p-0.5 rounded transition-colors cursor-pointer"
                >
                  <Plus size={13} />
                </button>
              </div>
            )}

            <button
              onClick={() => setIsImportOpen(prev => !prev)}
              className={`btn btn-sm text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                isImportOpen 
                  ? "bg-slate-900 text-white hover:bg-slate-800" 
                  : "bg-[#2563EB] hover:bg-blue-700 text-white"
              }`}
            >
              <Upload size={13} />
              <span>{isImportOpen ? "Close Importer" : "Import Excel Roster"}</span>
            </button>

            <button
              onClick={() => setShowEmailConfig(prev => !prev)}
              className="btn btn-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Mail size={13} />
              <span>Pass Delivery ({attendees.filter(a => !a.emailSent && a.email).length} Pending)</span>
            </button>
          </div>
        </div>

        {/* ── High-Density Executive Stat Cards (Image 2 PBL Style) ──── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-6">
          <StatCard
            label="Total Attendees"
            value={stats.total}
            theme="neutral"
            subtitle="Registered in Roster"
          />
          <StatCard
            label="Passes Dispatched"
            value={attendees.filter(a => a.emailSent).length}
            total={stats.total}
            theme="blue"
            subtitle={`${stats.total > 0 ? Math.round((attendees.filter(a => a.emailSent).length / stats.total) * 100) : 0}% Delivered`}
          />
          {eventCheckpoints.map((cp, idx) => {
            const passed = attendees.filter(a => a.checkpointStatuses?.find(cs => cs.checkpointId === cp.id)?.status).length;
            const themes = ["green", "purple", "amber", "blue"];
            const cardTheme = themes[idx % themes.length];
            return (
              <StatCard
                key={cp.id}
                label={cp.name}
                value={passed}
                total={stats.total}
                theme={cardTheme}
                subtitle={`${stats.total > 0 ? Math.round((passed / stats.total) * 100) : 0}% Admitted`}
              />
            );
          })}
          {eventCheckpoints.length > 0 && (
            <StatCard
              label="Pending Admission"
              value={Math.max(0, stats.total - attendees.filter(a => a.checkpointStatuses?.[0]?.status).length)}
              total={stats.total}
              theme="rose"
              subtitle="Yet to enter gate"
            />
          )}
        </div>

        {/* Analytics Dashboard */}
        <DashboardAnalytics attendees={attendees} eventCheckpoints={eventCheckpoints} />

        {/* Campaign Monitor */}
        {activeCampaign && (
          <div className="card animate-pop-in" style={{ padding: "1.5rem", marginBottom: "1.25rem", border: "2px solid var(--brand)", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
                  Live Email Campaign
                </h3>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.125rem 0 0" }}>
                  Status: <strong style={{ color: activeCampaign.status === "RUNNING" ? "var(--green)" : activeCampaign.status === "PAUSED" ? "var(--amber)" : "inherit" }}>{activeCampaign.status}</strong>
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {activeCampaign.status === "RUNNING" && (
                  <button onClick={handlePauseCampaign} disabled={campaignActionLoading} className="btn btn-sm btn-secondary" style={{ background: "var(--amber-light)", color: "var(--amber)" }}>
                    Pause
                  </button>
                )}
                {activeCampaign.status === "PAUSED" && (
                  <button onClick={handleResumeCampaign} disabled={campaignActionLoading} className="btn btn-sm btn-secondary" style={{ background: "var(--green-light)", color: "var(--green)" }}>
                    Resume
                  </button>
                )}
                <button onClick={handleCancelCampaign} disabled={campaignActionLoading} className="btn btn-sm btn-secondary" style={{ background: "var(--red-light)", color: "var(--red)" }}>
                  Cancel
                </button>
              </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                {activeCampaign.totalCount - activeCampaign.pendingCount} of {activeCampaign.totalCount}
              </span>
              <span style={{ fontSize: "1.125rem", fontWeight: 900, color: "var(--brand)" }}>
                {activeCampaign.totalCount > 0 ? Math.round(((activeCampaign.totalCount - activeCampaign.pendingCount) / activeCampaign.totalCount) * 100) : 0}%
              </span>
            </div>
            
            <div className="progress-bar" style={{ height: 10, marginBottom: "1.25rem" }}>
              <div
                className="progress-bar-fill"
                style={{ width: `${activeCampaign.totalCount > 0 ? ((activeCampaign.totalCount - activeCampaign.pendingCount) / activeCampaign.totalCount) * 100 : 0}%`, background: "var(--brand)" }}
              />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", marginBottom: "1.5rem" }}>
              <div style={{ background: "var(--green-light)", borderRadius: 12, padding: "0.875rem", border: "1px solid var(--green)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--green)", marginBottom: "0.25rem" }}>
                  <CheckCircle size={14} />
                  <span style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase" }}>Success</span>
                </div>
                <p style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--green)", margin: 0 }}>{activeCampaign.sentCount}</p>
              </div>
              <div style={{ background: "var(--red-light)", borderRadius: 12, padding: "0.875rem", border: "1px solid var(--red)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--red)", marginBottom: "0.25rem" }}>
                  <XCircle size={14} />
                  <span style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase" }}>Failed</span>
                </div>
                <p style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--red)", margin: 0 }}>{activeCampaign.failedCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Import Attendee Roster (Collapsible Drawer) */}
        {!activeCampaign && (isImportOpen || (attendees.length === 0 && step > 1)) && (
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-5 sm:p-6 mb-6 animate-fade-in">
            <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E2A78] border border-blue-100 flex items-center justify-center font-bold shrink-0">
                  <Upload size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight m-0">
                    Bulk Import Attendee Roster
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Upload .xlsx or .xls spreadsheet with attendee details
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Step indicator */}
                <div className="flex items-center gap-1 bg-slate-100/90 rounded-xl p-1 border border-slate-200/70">
                  {[
                    { num: 1, label: "Upload" },
                    { num: 2, label: "Map" },
                    { num: 3, label: "Validate" },
                    { num: 4, label: "Done" },
                  ].map((s) => (
                    <div
                      key={s.num}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        step === s.num
                          ? "bg-[#0D1038] text-white shadow-xs"
                          : step > s.num
                          ? "bg-emerald-100 text-emerald-800"
                          : "text-slate-400"
                      }`}
                    >
                      <span>{step > s.num ? "✓" : s.num}</span>
                      <span className="hidden sm:inline text-[0.7rem]">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Close Button */}
                <button
                  onClick={() => { setIsImportOpen(false); resetState(); }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Close Importer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-shake">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {step === 1 && (
              <div>
                <label className="block border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3 text-[#1E2A78] group-hover:scale-105 group-hover:border-blue-300 transition-all shadow-xs">
                    {loading ? (
                      <Loader2 size={24} className="animate-spin text-blue-600" />
                    ) : (
                      <FileSpreadsheet size={24} />
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-1">
                    Upload Attendee Spreadsheet
                  </h3>
                  <p className="text-slate-500 text-xs max-w-md mx-auto mb-4 leading-relaxed">
                    Drop your Excel file (.xlsx, .xls) here or click to browse. Features automatic column detection for Name, Roll No, and Email.
                  </p>
                  <span className="btn btn-geu-yellow font-bold text-xs px-5 py-2 rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-2 pointer-events-none">
                    <Upload size={14} /> Choose Excel File
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    disabled={loading}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {step === 2 && (
              <div
                className="animate-fade-in"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <h3
                  style={{
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.9375rem",
                  }}
                >
                  <Filter size={15} style={{ color: "var(--brand)" }} /> Map
                  Columns
                </h3>
                <div
                  style={{
                    background: "var(--surface-2)",
                    borderRadius: 12,
                    padding: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    border: "1px solid var(--border)",
                  }}
                >
                  {Object.keys(mapping).map((key) => (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <label
                        style={{
                          width: 56,
                          fontWeight: 700,
                          color: "var(--text-secondary)",
                          fontSize: "0.8125rem",
                          textTransform: "capitalize",
                          flexShrink: 0,
                        }}
                      >
                        {key}
                        {key !== "email" && (
                          <span style={{ color: "var(--red)" }}>*</span>
                        )}
                      </label>
                      <select
                        className="input select"
                        style={{ flex: 1, minWidth: 130 }}
                        value={mapping[key]}
                        onChange={(e) =>
                          setMapping({ ...mapping, [key]: e.target.value })
                        }
                      >
                        <option value="">-- Select --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    onClick={resetState}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleValidate}
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ flex: 2 }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />{" "}
                        Validating…
                      </>
                    ) : (
                      <>Validate</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && validationSummary && (
              <div className="animate-fade-in" style={{ padding: "1rem" }}>
                <h3 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>Validation Summary</h3>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{ flex: 1, padding: "1rem", background: "var(--surface-2)", borderRadius: 8 }}>
                    <strong>Total Rows:</strong> {validationSummary.totalRows}
                  </div>
                  <div style={{ flex: 1, padding: "1rem", background: "var(--green-light)", color: "var(--green)", borderRadius: 8 }}>
                    <strong>Valid:</strong> {validationSummary.validRows}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div style={{ flex: 1, padding: "1rem", background: "var(--amber-light)", color: "var(--amber)", borderRadius: 8 }}>
                    <strong>Duplicate Rolls:</strong> {validationSummary.duplicateRolls}
                  </div>
                  <div style={{ flex: 1, padding: "1rem", background: "var(--red-light)", color: "var(--red)", borderRadius: 8 }}>
                    <strong>Invalid/Duplicate Emails:</strong> {validationSummary.invalidEmails + validationSummary.duplicateEmails}
                  </div>
                </div>
                <label className="input-label">Event Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Annual Tech Summit 2026"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  style={{ marginBottom: "1.5rem" }}
                />
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button onClick={() => setStep(2)} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
                  <button onClick={handleUpload} disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>
                    {loading ? <><Loader2 size={15} className="animate-spin" /> Uploading…</> : <>Confirm Replace & Upload</>}
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div
                className="animate-pop-in"
                style={{ textAlign: "center", padding: "1.25rem 1rem" }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    background: "var(--green-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 0.875rem",
                    color: "var(--green)",
                  }}
                >
                  <CheckCircle2 size={32} />
                </div>
                <h3
                  style={{
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    margin: "0 0 0.25rem",
                  }}
                >
                  QR Codes Ready!
                </h3>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.875rem",
                    margin: "0 0 1.25rem",
                  }}
                >
                  ZIP downloaded. Send emails from the list below.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    justifyContent: "center",
                  }}
                >
                  <button
                    onClick={resetState}
                    className="btn btn-secondary btn-sm"
                  >
                    Upload Another
                  </button>
                  <button
                    onClick={() => {
                      setIsImportOpen(false);
                      document
                        .getElementById("alist")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    View List ↓
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Email Config */}
        {!loading && (
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6 overflow-hidden">
            <button
              onClick={() => setShowEmailConfig((v) => !v)}
              className="w-full flex items-center justify-between p-4 sm:p-5 bg-white hover:bg-slate-50/80 transition-colors cursor-pointer text-left focus:outline-none"
            >
              <span className="flex items-center gap-2.5 font-bold text-sm text-slate-900">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E2A78] flex items-center justify-center shrink-0">
                  <MessageSquare size={16} />
                </div>
                <span>Campaign &amp; Pass Email Delivery Settings</span>
              </span>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform duration-200 ${showEmailConfig ? "rotate-180" : ""}`}
              />
            </button>
            {showEmailConfig && (
              <div className="p-5 pt-0 border-t border-slate-100 bg-slate-50/40 animate-fade-in">
                <div className="pt-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="custom-msg">
                    Custom Email Message (Optional)
                  </label>
                  <textarea
                    id="custom-msg"
                    className="input w-full bg-white border-slate-200 rounded-xl text-xs sm:text-sm p-3 focus:border-blue-500 transition-all shadow-2xs"
                    style={{ height: 85, resize: "vertical" }}
                    placeholder="Enter custom announcement or instructions to display above the QR code in the email..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                  />
                  <p className="text-slate-400 text-xs mt-1 mb-4">
                    This message will appear directly above the unique QR pass banner in the dispatched emails.
                  </p>
                  <button
                    onClick={handleStartCampaign}
                    disabled={
                      activeCampaign || campaignActionLoading ||
                      !attendees.filter((a) => !a.emailSent && a.email).length
                    }
                    className="btn bg-[#1E2A78] hover:bg-[#151e56] text-white font-semibold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    <Send size={14} /> 
                    <span>{activeCampaign ? "Campaign Active" : "Start Email Campaign"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Attendee Table Component */}
        <div id="alist" className="mb-6">
          <AttendeeTable 
            filtered={filtered}
            stats={stats}
            eventCheckpoints={eventCheckpoints}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortOption={sortOption}
            setSortOption={setSortOption}
            checkpointFilters={checkpointFilters}
            setCheckpointFilters={setCheckpointFilters}
            emailFilter={emailFilter}
            setEmailFilter={setEmailFilter}
            handleClearAttendees={handleClearAttendees}
            fetchAttendees={fetchAttendees}
            handleSendEmail={handleSendEmail}
            emailLoading={emailLoading}
            onOpenImport={() => setIsImportOpen(true)}
          />
        </div>
        </>
        )}
          </div>
        </main>
      </div>

      {/* ── Full Width Global Footer ───────────────────────────────── */}
      <GlobalFooter />
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: null, id: null, isProcessing: false })}
        onConfirm={processModalConfirm}
        title={deleteModal.type === "clearAttendees" ? "Clear All Attendees" : "Delete Dataset"}
        message={deleteModal.type === "clearAttendees" ? "Are you sure you want to permanently delete all attendees for this event? This action cannot be undone." : "Are you sure you want to permanently delete this dataset? This action cannot be undone."}
        isDeleting={deleteModal.isProcessing}
      />
    </div>
  );
}
