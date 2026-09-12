import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { useToast } from "../context/ToastContext";
import { PlayCircle, Plus, RefreshCw, X, AlertCircle, Download, Edit2, Trash2, Send, FileCode2, Inbox, MailWarning, LayoutTemplate, Loader2 } from "lucide-react";
import { categorizeEmailError } from "../utils/errorCategorization";
import CampaignConsole from "./CampaignConsole";
import DeleteModal from "./DeleteModal";
import { EmptyState } from "./ui/EmptyState";

export default function CampaignManagement({ activeEventId, onRedirectCleanup }) {
  const [activeTab, setActiveTab] = useState("monitor");
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [templateForm, setTemplateForm] = useState(null);
  const [campaignForm, setCampaignForm] = useState(null);
  const [activeFailureModal, setActiveFailureModal] = useState(null);
  const [campaignFailures, setCampaignFailures] = useState([]);
  const [activeConsoleId, setActiveConsoleId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, templateId: null, isDeleting: false });

  useEffect(() => {
    if (activeEventId) {
      fetchTemplates();
      fetchCampaigns();
    }
  }, [activeEventId]);

  const fetchTemplates = async () => {
    try {
      const res = await api.get(`/campaigns/templates?eventId=${activeEventId}`);
      setTemplates(res.data);
    } catch (e) {
      console.error("Failed to fetch templates");
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await api.get(`/campaigns?eventId=${activeEventId}`);
      setCampaigns(res.data);
    } catch (e) {
      console.error("Failed to fetch campaigns");
    }
  };

  const saveTemplate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (templateForm.id) {
        await api.put(`/campaigns/templates/${templateForm.id}`, templateForm);
        toast({ type: "success", message: "Template updated successfully." });
      } else {
        await api.post(`/campaigns/templates`, { ...templateForm, eventId: activeEventId });
        toast({ type: "success", message: "Template created successfully." });
      }
      setTemplateForm(null);
      fetchTemplates();
    } catch (err) {
      toast({ type: "error", message: "Failed to save template." });
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteTemplate = async () => {
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      await api.delete(`/campaigns/templates/${deleteModal.templateId}`);
      toast({ type: "success", message: "Template deleted." });
      fetchTemplates();
    } catch (err) {
      toast({ type: "error", message: "Failed to delete template." });
    } finally {
      setDeleteModal({ isOpen: false, templateId: null, isDeleting: false });
    }
  };

  const startCampaign = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/campaigns/start`, { ...campaignForm, eventId: activeEventId });
      toast({ type: "success", message: "Campaign successfully initiated." });
      setCampaignForm(null);
      setActiveTab("monitor");
      fetchCampaigns();
    } catch (err) {
      toast({ type: "error", message: err.response?.data?.error || "Failed to start campaign." });
    } finally {
      setLoading(false);
    }
  };

  const retryCampaign = async (id) => {
    try {
      await api.post(`/attendees/campaigns/${id}/retry-failed`);
      toast({ type: "success", message: "Failed emails queued for retry." });
      fetchCampaigns();
    } catch (err) {
      toast({ type: "error", message: "Failed to retry campaign." });
    }
  };

  const viewFailures = async (camp) => {
    try {
      const res = await api.get(`/attendees/campaigns/${camp.id}/failures`);
      setCampaignFailures(res.data);
      setActiveFailureModal(camp);
    } catch (err) {
      toast({ type: "error", message: "Failed to fetch campaign failures." });
    }
  };

  const downloadReport = (camp) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Metric,Count\n"
      + `Total,${camp.totalCount}\n`
      + `Sent,${camp.sentCount}\n`
      + `Opened,${camp.openedCount}\n`
      + `Bounced,${camp.bouncedCount}\n`
      + `Failed,${camp.failedCount}\n`
      + `Pending,${camp.pendingCount}\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Campaign_Report_${camp.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  if (!activeEventId) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-white border border-slate-300 rounded p-6">
        <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-3 text-amber-700">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-base font-bold text-slate-900 mb-1">No Active Event Selected</h2>
        <p className="text-slate-500 text-xs">Please select an event from the top header to manage passes and email campaigns.</p>
      </div>
    );
  }

  if (activeConsoleId) {
    return <CampaignConsole campaignId={activeConsoleId} onClose={() => { setActiveConsoleId(null); fetchCampaigns(); }} onRedirectCleanup={onRedirectCleanup} />;
  }

  return (
    <div className="w-full text-slate-800">
      
      {/* ── Section Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-[#8B151B] font-serif uppercase tracking-tight mb-0.5">
            Email Pass Campaigns &amp; Delivery Engine
          </h2>
          <p className="text-slate-500 text-xs font-medium">
            Dispatch official Graphic Era QR passes directly to student university mailboxes.
          </p>
        </div>
        
        {/* Segmented Control Buttons (~2019 Classic UI) */}
        <div className="bg-slate-100 p-1 rounded border border-slate-300 flex gap-1 self-start sm:self-auto">
          {[
            { id: 'monitor', label: 'Monitor Queue', icon: PlayCircle },
            { id: 'builder', label: 'New Dispatch', icon: Send },
            { id: 'templates', label: 'Pass Templates', icon: LayoutTemplate }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-[#8B151B] text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <tab.icon size={14} /> <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Template Studio Tab ─────────────────────────────────────── */}
      {activeTab === 'templates' && (
        <div className="animate-fade-in">
          {templateForm ? (
            <div className="card p-0 overflow-hidden border border-slate-300 shadow-sm mb-6 max-w-3xl mx-auto bg-white">
              <div className="bg-[#8B151B] text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#C59B27]">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <LayoutTemplate size={16} />
                  <span>{templateForm.id ? "Edit Pass Template" : "New Email Pass Template"}</span>
                </h3>
                <button onClick={() => setTemplateForm(null)} className="text-white hover:bg-white/20 p-1 rounded transition-colors">
                  <X size={16}/>
                </button>
              </div>

              <form onSubmit={saveTemplate} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Template Name <span className="text-red-600">*</span></label>
                    <input className="input" required value={templateForm.name} onChange={e => setTemplateForm({...templateForm, name: e.target.value})} placeholder="e.g. Grafest Official Pass" />
                  </div>
                  <div>
                    <label className="input-label">Email Subject Line <span className="text-red-600">*</span></label>
                    <input className="input" required value={templateForm.subject} onChange={e => setTemplateForm({...templateForm, subject: e.target.value})} placeholder="e.g. Graphic Era: Your Event Entry Pass" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="input-label mb-0">HTML Content <span className="text-red-600">*</span></label>
                    <div className="flex gap-1.5">
                      {['{{name}}', '{{roll}}', '{{event_name}}', '{{qr_link}}'].map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded bg-red-50 text-[#8B151B] text-[0.65rem] font-mono font-bold border border-red-200">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <textarea 
                    className="input font-mono text-xs text-slate-800 bg-slate-50 border-slate-300 focus:bg-white" 
                    required 
                    rows={10} 
                    value={templateForm.htmlBody} 
                    onChange={e => setTemplateForm({...templateForm, htmlBody: e.target.value})} 
                    placeholder="<html><body><h1>Hello {{name}} (Roll: {{roll}})</h1><p>Your pass: {{qr_link}}</p></body></html>" 
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setTemplateForm(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                    {loading ? "Saving..." : "Save Template"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <button className="btn btn-primary btn-sm" onClick={() => setTemplateForm({ name: "", subject: "", htmlBody: "" })}>
                  <Plus size={14} className="mr-1"/> Create Template
                </button>
              </div>

              {templates.length === 0 ? (
                <EmptyState 
                  icon={LayoutTemplate} 
                  title="No Templates Configured" 
                  description="Design HTML email templates for your Graphic Era event passes."
                  actionLabel="Create First Template"
                  onAction={() => setTemplateForm({ name: "", subject: "", htmlBody: "" })}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {templates.map(t => (
                    <div key={t.id} className="card p-4 bg-white border border-slate-300 shadow-xs hover:shadow-sm transition-all">
                      <div className="flex items-center gap-2 text-[#8B151B] mb-2 font-bold text-sm">
                        <FileCode2 size={16} />
                        <h4 className="line-clamp-1">{t.name}</h4>
                      </div>
                      <div className="bg-slate-50 rounded p-2.5 mb-4 border border-slate-200 text-xs">
                        <span className="text-[0.68rem] font-bold text-slate-500 uppercase block mb-0.5">Subject:</span>
                        <p className="text-slate-700 font-medium line-clamp-1">{t.subject}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                        <button className="btn btn-secondary btn-xs flex-1" onClick={() => setTemplateForm(t)}>
                          <Edit2 size={12} className="mr-1"/> Edit
                        </button>
                        <button className="btn btn-secondary btn-xs text-red-600 hover:bg-red-50 flex-1" onClick={() => setDeleteModal({ isOpen: true, templateId: t.id, isDeleting: false })}>
                          <Trash2 size={12} className="mr-1"/> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── New Dispatch / Campaign Builder ─────────────────────────── */}
      {activeTab === 'builder' && (
        <div className="animate-fade-in flex justify-center">
          <div className="card w-full max-w-xl p-0 overflow-hidden border border-slate-300 shadow-sm bg-white">
            <div className="bg-[#8B151B] text-white p-5 text-center border-b-2 border-[#C59B27]">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2 text-amber-300">
                <Send size={24} />
              </div>
              <h2 className="text-lg font-bold text-white uppercase tracking-tight">Initiate Bulk Pass Dispatch</h2>
              <p className="text-red-100 text-xs mt-0.5">Send unique QR tickets to student emails via active SMTP provider.</p>
            </div>
            
            <form onSubmit={startCampaign} className="p-6 space-y-4 text-xs">
              <div>
                <label className="input-label">Campaign Identifier <span className="text-red-600">*</span></label>
                <input className="input text-sm font-bold" required value={campaignForm?.name || ""} onChange={e => setCampaignForm({...campaignForm, name: e.target.value})} placeholder="e.g. Grafest Pass Dispatch - Batch 1" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Recipient Filter <span className="text-red-600">*</span></label>
                  <select className="input" value={campaignForm?.target || "all"} onChange={e => setCampaignForm({...campaignForm, target: e.target.value})}>
                    <option value="all">All Registered Students</option>
                    <option value="pending">Only Students Pending Pass</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Select Pass Template</label>
                  <select className="input" value={campaignForm?.templateId || ""} onChange={e => setCampaignForm({...campaignForm, templateId: e.target.value})}>
                    <option value="">Default University Pass Layout</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label">Scheduled Time (Optional)</label>
                <div className="flex gap-2 items-center">
                  <input className="input flex-1" type="datetime-local" value={campaignForm?.scheduledAt || ""} onChange={e => setCampaignForm({...campaignForm, scheduledAt: e.target.value})} />
                  {campaignForm?.scheduledAt && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCampaignForm({...campaignForm, scheduledAt: ""})} title="Clear schedule">
                      <X size={14} /> Clear
                    </button>
                  )}
                </div>
                <p className="text-[0.68rem] text-slate-500 mt-1">Leave empty to start sending immediately upon submission.</p>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <button type="submit" className="btn btn-primary w-full py-2.5 text-xs shadow-xs" disabled={loading}>
                  {loading ? "Initializing..." : (campaignForm?.scheduledAt ? "Lock Campaign Schedule" : "Begin Email Dispatch Now")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Monitor Queue Tab ────────────────────────────────────────── */}
      {activeTab === 'monitor' && (
        <div className="animate-fade-in">
          <div className="flex justify-end mb-4">
            <button className="btn btn-secondary btn-sm" onClick={fetchCampaigns}>
              <RefreshCw size={13} className="mr-1.5" /> Refresh Queue
            </button>
          </div>
          
          <div className="space-y-4">
            {campaigns.map(camp => {
              const total = camp.totalCount || 1;
              const sentPct = (camp.sentCount / total) * 100;
              const failPct = (camp.failedCount / total) * 100;
              const isRunning = camp.status === "RUNNING";
              const isFailed = camp.status === "FAILED";

              return (
                <div key={camp.id} className="card p-5 bg-white border border-slate-300 shadow-xs relative overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-[3.5px] ${isRunning ? 'bg-amber-500' : isFailed ? 'bg-red-600' : 'bg-emerald-600'}`} />

                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-slate-900 m-0">{camp.name}</h3>
                        <span className={`badge ${isRunning ? 'badge-amber' : isFailed ? 'badge-red' : 'badge-green'}`}>
                          {camp.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Inbox size={13} /> Started: {new Date(camp.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      <button className="btn btn-sm btn-primary" onClick={() => setActiveConsoleId(camp.id)}>
                        <PlayCircle size={13} className="mr-1" /> Live Console
                      </button>
                      {camp.failedCount > 0 && (
                        <>
                          <button className="btn btn-sm btn-secondary text-amber-800 border-amber-300 hover:bg-amber-50" onClick={() => viewFailures(camp)}>
                            <AlertCircle size={13} className="mr-1" /> Diagnostics
                          </button>
                          <button className="btn btn-sm btn-secondary text-red-700 border-red-300 hover:bg-red-50" onClick={() => retryCampaign(camp.id)}>
                            <RefreshCw size={13} className="mr-1" /> Retry Failed ({camp.failedCount})
                          </button>
                        </>
                      )}
                      <button className="btn btn-sm btn-secondary" onClick={() => downloadReport(camp)} title="Download Report CSV">
                        <Download size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-100 rounded overflow-hidden flex mb-4 border border-slate-200">
                    <div className="h-full bg-emerald-600 transition-all duration-500" style={{ width: `${sentPct}%` }} />
                    <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${failPct}%` }} />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                    {[
                      { label: 'Total', value: camp.totalCount, color: 'text-slate-900' },
                      { label: 'Sent', value: camp.sentCount, color: 'text-emerald-700' },
                      { label: 'Opened', value: camp.openedCount, color: 'text-blue-700' },
                      { label: 'Failed', value: camp.failedCount, color: 'text-red-700' },
                      { label: 'Bounced', value: camp.bouncedCount, color: 'text-amber-700' },
                      { label: 'Pending', value: camp.pendingCount, color: 'text-slate-500' }
                    ].map((stat, i) => (
                      <div key={i} className="rounded p-2 bg-slate-50 border border-slate-200">
                        <div className={`text-base font-black ${stat.color}`}>{stat.value}</div>
                        <div className="text-[0.65rem] font-bold text-slate-500 uppercase">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {campaigns.length === 0 && (
              <EmptyState 
                icon={Send} 
                title="No Campaigns Initiated" 
                description="Start a new pass delivery campaign from the New Dispatch tab."
                actionLabel="Go to New Dispatch"
                onAction={() => setActiveTab('builder')}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Diagnostics Modal ────────────────────────────────────────── */}
      {activeFailureModal && (
        <div className="modal-backdrop animate-fade-in">
          <div className="card w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-0 shadow-lg bg-white border border-slate-300" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-[#8B151B] text-white">
              <h3 className="font-bold text-sm flex items-center gap-2 m-0">
                <MailWarning size={16} /> <span>Diagnostics: {activeFailureModal.name}</span>
              </h3>
              <button className="text-white hover:bg-white/20 p-1 rounded" onClick={() => setActiveFailureModal(null)}>
                <X size={16} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 bg-slate-50 text-xs">
              <p className="text-slate-600 mb-3 font-semibold">
                Recorded {campaignFailures.length} failed delivery attempts for this campaign:
              </p>

              <div className="space-y-2">
                {campaignFailures.map((failure) => {
                  const cat = categorizeEmailError(failure.errorMessage);
                  return (
                    <div key={failure.id} className="bg-white border border-slate-200 rounded p-3 text-xs">
                      <div className="flex items-start justify-between mb-1.5">
                        <div>
                          <strong className="text-slate-900 block font-bold">{failure.attendee.name}</strong>
                          <span className="text-slate-500 font-mono text-[0.7rem]">{failure.attendee.email}</span>
                        </div>
                        <span className="badge badge-red text-[0.62rem]">{cat.type}</span>
                      </div>
                      <div className="p-2 rounded bg-red-50 border border-red-100 font-mono text-[0.68rem] text-red-800">
                        {failure.errorMessage}
                      </div>
                    </div>
                  );
                })}
                {campaignFailures.length === 0 && (
                  <div className="py-8 text-center text-slate-500">
                    No failed transmissions logged.
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-white flex justify-end gap-2">
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveFailureModal(null)}>Close</button>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => { retryCampaign(activeFailureModal.id); setActiveFailureModal(null); }}
              >
                <RefreshCw size={13} className="mr-1"/> Retry Failed Emails
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, templateId: null, isDeleting: false })}
        onConfirm={confirmDeleteTemplate}
        title="Delete Template"
        message="Are you sure you want to permanently delete this email template?"
        isDeleting={deleteModal.isDeleting}
      />
    </div>
  );
}
