import React, { useState, useEffect, useRef } from "react";
import api from "../utils/api";
import { useToast } from "../context/ToastContext";
import { ArrowLeft, Play, Pause, XCircle, CheckCircle, Clock, Activity, Download, RefreshCw, Trash2 } from "lucide-react";

export default function CampaignConsole({ campaignId, onClose, onRedirectCleanup }) {
  const [campaign, setCampaign] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logFilter, setLogFilter] = useState("all");
  const [rate, setRate] = useState(0);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const logsEndRef = useRef(null);

  // Poll campaign stats
  useEffect(() => {
    let lastSent = 0;
    let lastTime = Date.now();
    
    const fetchStats = async () => {
      try {
        const res = await api.get(`/campaigns/${campaignId}`);
        const c = res.data;
        setCampaign(c);
        
        // Calculate rate
        const now = Date.now();
        if (c.sentCount > lastSent && lastSent > 0) {
          const diff = c.sentCount - lastSent;
          const timeDiffMins = (now - lastTime) / 60000;
          if (timeDiffMins > 0) {
            setRate(Math.round(diff / timeDiffMins));
          }
        } else if (c.status !== "RUNNING") {
          setRate(0);
        }
        lastSent = c.sentCount;
        lastTime = now;
      } catch (e) {
        console.error("Failed to fetch campaign stats", e);
        setError(e.response?.data?.error || e.message || "Failed to fetch campaign stats");
      }
    };
    
    fetchStats();
    const int = setInterval(fetchStats, 2000);
    return () => clearInterval(int);
  }, [campaignId]);

  // Poll recent jobs for live logs
  useEffect(() => {
    const fetchedJobIds = new Set();
    const fetchLogs = async () => {
      try {
        const res = await api.get(`/campaigns/${campaignId}/recent-jobs`);
        const jobs = res.data; 
        
        const newLogs = [];
        // Reverse so we process oldest first in the batch
        [...jobs].reverse().forEach(job => {
          const key = `${job.id}-${job.status}`;
          if (!fetchedJobIds.has(key)) {
            fetchedJobIds.add(key);
            
            let message = "";
            let type = "info";
            if (job.status === "PROCESSING") {
              message = `Sending email to ${job.attendee?.email || "Unknown"}`;
              type = "info";
            } else if (job.status === "SENT") {
              message = `Successfully dispatched to ${job.attendee?.email || "Unknown"}`;
              type = "success";
            } else if (job.status === "FAILED") {
              message = `Transmission failed for ${job.attendee?.email || "Unknown"}: ${job.error || "Network error"}`;
              type = "error";
            }
            
            if (message) {
              newLogs.push({
                id: key,
                time: new Date().toLocaleTimeString(),
                message,
                type
              });
            }
          }
        });
        
        if (newLogs.length > 0) {
          setLogs(prev => [...prev.slice(-300), ...newLogs]); // keep last 300 logs
        }
      } catch (e) {
        console.error("Failed to fetch recent jobs", e);
      }
    };
    
    fetchLogs();
    const int = setInterval(fetchLogs, 1500);
    return () => clearInterval(int);
  }, [campaignId]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleAction = async (action) => {
    try {
      if (action === "pause") {
        await api.post(`/attendees/campaigns/${campaignId}/pause`);
        toast({ type: "success", message: "Campaign paused." });
      } else if (action === "resume") {
        await api.post(`/attendees/campaigns/${campaignId}/resume`);
        toast({ type: "success", message: "Campaign resumed." });
      } else if (action === "cancel") {
        await api.post(`/attendees/campaigns/${campaignId}/cancel`);
        toast({ type: "success", message: "Campaign cancelled." });
      } else if (action === "retry") {
        await api.post(`/attendees/campaigns/${campaignId}/retry-failed`);
        toast({ type: "success", message: "Queued failed emails for retry." });
      }
    } catch (e) {
      toast({ type: "error", message: e.response?.data?.error || `Failed to ${action} campaign` });
    }
  };

  const exportLogs = () => {
    const text = logs.map(l => `[${l.time}] [${l.type.toUpperCase()}] ${l.message}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-${campaignId}-logs.txt`;
    a.click();
  };

  if (error) return <div className="p-8 text-center text-red-600 font-semibold"><XCircle className="mx-auto mb-2" /> {error}</div>;
  if (!campaign) return <div className="p-8 text-center text-slate-500 font-semibold"><RefreshCw className="animate-spin mx-auto mb-2" /> Loading Campaign Console...</div>;

  const pct = campaign.totalCount > 0 ? Math.round(((campaign.sentCount + campaign.failedCount) / campaign.totalCount) * 100) : 0;
  const etaMins = rate > 0 ? Math.ceil(campaign.pendingCount / rate) : "?";
  const filteredLogs = logs.filter(l => logFilter === "all" || l.type === logFilter);

  return (
    <div className="animate-fade-in flex flex-col gap-4 text-slate-800 text-xs">
      
      {/* ── Console Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded border border-slate-300 shadow-xs">
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary btn-sm" onClick={onClose} title="Back to campaigns">
            <ArrowLeft size={16} /> <span>Back</span>
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 m-0 leading-tight">{campaign.name}</h2>
            <div className="flex items-center gap-2 text-[0.7rem] text-slate-500 mt-0.5">
              <span className={`badge ${campaign.status === "RUNNING" ? "badge-amber" : campaign.status === "FAILED" ? "badge-red" : "badge-green"}`}>
                <Activity size={12} /> {campaign.status}
              </span>
              <span>Started: {new Date(campaign.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {campaign.failedCount > 0 && (
            <button className="btn btn-secondary btn-sm text-red-700 border-red-300 hover:bg-red-50" onClick={() => handleAction("retry")}>
              <RefreshCw size={13} className="mr-1" /> Retry {campaign.failedCount} Failed
            </button>
          )}
          <button className="btn btn-secondary btn-sm text-red-700 border-red-300 hover:bg-red-50" onClick={() => onRedirectCleanup({ type: 'campaign', id: campaignId, name: campaign.name, text: '' })}>
            <Trash2 size={13} className="mr-1" /> Delete Campaign
          </button>
        </div>
      </div>

      {/* ── Stats Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3 bg-white border border-slate-300 shadow-xs border-l-4 border-l-[#8B151B]">
          <span className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Recipients</span>
          <span className="text-xl font-black text-slate-900">{campaign.totalCount}</span>
        </div>
        <div className="card p-3 bg-white border border-slate-300 shadow-xs border-l-4 border-l-emerald-600">
          <span className="text-[0.68rem] font-bold text-emerald-800 uppercase tracking-wider block mb-1">Dispatched</span>
          <span className="text-xl font-black text-emerald-700">{campaign.sentCount}</span>
        </div>
        <div className="card p-3 bg-white border border-slate-300 shadow-xs border-l-4 border-l-amber-500">
          <span className="text-[0.68rem] font-bold text-amber-800 uppercase tracking-wider block mb-1">Pending</span>
          <span className="text-xl font-black text-amber-700">{campaign.pendingCount}</span>
        </div>
        <div className="card p-3 bg-white border border-slate-300 shadow-xs border-l-4 border-l-red-600">
          <span className="text-[0.68rem] font-bold text-red-800 uppercase tracking-wider block mb-1">Failed</span>
          <span className="text-xl font-black text-red-700">{campaign.failedCount}</span>
        </div>
      </div>

      {/* ── Progress & Rates ───────────────────────────────────────── */}
      <div className="card p-4 bg-white border border-slate-300 shadow-xs">
        <div className="flex justify-between items-center mb-1.5 font-bold text-xs">
          <span className="text-slate-700">Dispatch Progress</span>
          <span className="text-[#8B151B]">{pct}% Completed</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded overflow-hidden flex mb-3 border border-slate-200">
          <div className="h-full bg-emerald-600 transition-all duration-500" style={{ width: `${(campaign.sentCount / (campaign.totalCount || 1)) * 100}%` }} />
          <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${(campaign.failedCount / (campaign.totalCount || 1)) * 100}%` }} />
        </div>
        <div className="flex gap-4 text-slate-500 text-xs font-semibold">
          <span className="flex items-center gap-1.5"><Activity size={14} className="text-[#8B151B]" /> {rate} emails / min</span>
          <span className="flex items-center gap-1.5"><Clock size={14} className="text-amber-600" /> Est. Remaining: {etaMins} {etaMins === 1 ? "min" : "mins"}</span>
        </div>
      </div>

      {/* ── Live Transmission Log Terminal ─────────────────────────── */}
      <div className="card overflow-hidden bg-[#0F172A] text-slate-200 border border-slate-700 shadow-sm flex flex-col min-h-[300px]">
        <div className="px-4 py-2 bg-[#1E293B] border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-amber-300 uppercase">Live SMTP Dispatch Log</span>
            <div className="flex gap-1 ml-2">
              <button onClick={() => setLogFilter("all")} className={`px-2 py-0.5 rounded text-[0.65rem] font-bold ${logFilter === "all" ? "bg-slate-700 text-white" : "text-slate-400"}`}>All</button>
              <button onClick={() => setLogFilter("success")} className={`px-2 py-0.5 rounded text-[0.65rem] font-bold ${logFilter === "success" ? "bg-emerald-900 text-emerald-300" : "text-slate-400"}`}>Success</button>
              <button onClick={() => setLogFilter("error")} className={`px-2 py-0.5 rounded text-[0.65rem] font-bold ${logFilter === "error" ? "bg-red-900 text-red-300" : "text-slate-400"}`}>Failed</button>
            </div>
          </div>
          <button className="btn btn-secondary btn-xs bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700" onClick={exportLogs} title="Export raw logs">
            <Download size={12} className="mr-1" /> Export
          </button>
        </div>
        
        <div className="p-3 font-mono text-[0.72rem] leading-relaxed flex-1 overflow-y-auto max-h-[360px] space-y-1">
          {filteredLogs.map(l => (
            <div key={l.id} className={`flex gap-2 ${l.type === "success" ? "text-emerald-400" : l.type === "error" ? "text-red-400" : "text-slate-300"}`}>
              <span className="text-slate-500 shrink-0">[{l.time}]</span>
              <span className="break-all">{l.message}</span>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="text-slate-500 italic text-center py-8">Waiting for transmission events...</div>
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

    </div>
  );
}
