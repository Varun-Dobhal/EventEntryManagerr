import React, { useState } from "react";
import api from "../utils/api";
import { useToast } from "../context/ToastContext";
import { AlertTriangle, X } from "lucide-react";

export default function DataCleanup({ activeEventId, cleanupTarget, setCleanupTarget, onRefresh }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!cleanupTarget) return null;

  const executeDelete = async () => {
    if (cleanupTarget.text !== "DELETE") {
      toast({ type: "error", message: "Please type DELETE to confirm." });
      return;
    }

    setLoading(true);
    try {
      if (cleanupTarget.type === "campaign") {
        await api.delete(`/campaigns/${cleanupTarget.id}`);
        toast({ type: "success", message: "Campaign deleted permanently." });
      } else if (cleanupTarget.type === "template") {
        await api.delete(`/campaigns/templates/${cleanupTarget.id}`);
        toast({ type: "success", message: "Template deleted permanently." });
      } else if (cleanupTarget.type === "dataset") {
        await api.delete(`/attendees/datasets/${cleanupTarget.id}`);
        toast({ type: "success", message: "Dataset deleted permanently." });
      } else if (cleanupTarget.type === "attendees") {
        await api.delete(`/attendees/clear?eventId=${activeEventId}`);
        toast({ type: "success", message: "All attendees cleared for this event." });
      }
      setCleanupTarget(null);
      if (onRefresh) onRefresh(cleanupTarget.type);
    } catch (err) {
      toast({ type: "error", message: err.response?.data?.error || "Failed to perform deletion." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setCleanupTarget(null)}>
      <div className="card animate-pop-in w-full max-w-md p-6 bg-white border border-slate-300 shadow-xl relative text-slate-800">
        <button
          onClick={() => setCleanupTarget(null)}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 text-red-700 mb-3 pb-2 border-b border-slate-200">
          <AlertTriangle size={22} className="shrink-0 text-red-600" />
          <h3 className="text-base font-bold m-0 uppercase tracking-tight">Confirm Permanent Deletion</h3>
        </div>

        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Are you sure you want to permanently delete <strong className="text-slate-900 font-bold">{cleanupTarget.name}</strong>? This action cannot be reversed.
        </p>
        
        <div className="mb-5 bg-red-50 border border-red-200 rounded p-3 text-xs">
          <label className="block text-[0.68rem] font-bold text-red-800 uppercase tracking-wider mb-1.5">
            Type DELETE to confirm:
          </label>
          <input 
            type="text"
            value={cleanupTarget.text || ""}
            onChange={(e) => setCleanupTarget({ ...cleanupTarget, text: e.target.value })}
            placeholder="DELETE"
            className="input bg-white border-red-300 text-slate-900 font-bold tracking-widest text-xs"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2 text-xs">
          <button 
            onClick={() => setCleanupTarget(null)}
            className="btn btn-secondary btn-sm"
          >
            Cancel
          </button>
          <button 
            onClick={executeDelete} 
            disabled={cleanupTarget.text !== "DELETE" || loading}
            className="btn btn-danger btn-sm"
          >
            {loading ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
