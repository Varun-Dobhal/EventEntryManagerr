import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { useToast } from "../context/ToastContext";
import { PlayCircle, Plus, RefreshCw, X, AlertCircle, Download, Edit2, Trash2, Send, FileCode2, Inbox, MailWarning, LayoutTemplate, Loader2, Image, Upload, Eye, QrCode, Sparkles } from "lucide-react";
import { categorizeEmailError } from "../utils/errorCategorization";
import CampaignConsole from "./CampaignConsole";
import DeleteModal from "./DeleteModal";
import { EmptyState } from "./ui/EmptyState";

const compressPosterImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxWidth = 700;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function compilePassTemplateHtml({ name, subject, posterImage, instructions }) {
  const config = JSON.stringify({
    posterImage: posterImage || "",
    instructions: instructions || "",
  });
  const configComment = `<!-- TEMPLATE_CONFIG: ${config} -->`;

  const posterBlock = posterImage ? `
        <tr>
          <td style="padding: 0; background: #0D1038; text-align: center; line-height: 0;">
            <img src="${posterImage}" alt="Event Banner" style="width: 100%; max-width: 560px; max-height: 380px; object-fit: cover; display: block; margin: 0 auto; border-bottom: 3px solid #8B151B;" />
          </td>
        </tr>
  ` : `
        <tr>
          <td style="background: linear-gradient(135deg, #8B151B 0%, #5E0E12 100%); padding: 26px 20px; text-align: center; color: #ffffff;">
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #F59E0B; text-transform: uppercase;">Graphic Era (Deemed to be University)</div>
            <h1 style="margin: 8px 0 0 0; font-size: 20px; font-weight: 800; color: #ffffff; font-family: serif; letter-spacing: 0.5px;">{{event_name}}</h1>
            <div style="margin-top: 4px; font-size: 12px; color: #FECDD3; font-weight: 500;">Official University Digital Entry Pass</div>
          </td>
        </tr>
  `;

  const instructionsBlock = instructions && instructions.trim() ? `
        <tr>
          <td style="padding: 0 24px 24px 24px;">
            <div style="background: #FFFBEB; border-left: 4px solid #D97706; border-radius: 8px; padding: 16px; border-top: 1px solid #FEF3C7; border-right: 1px solid #FEF3C7; border-bottom: 1px solid #FEF3C7;">
              <div style="font-size: 12px; font-weight: 800; color: #92400E; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                📌 Event Instructions &amp; Entry Guidelines
              </div>
              <div style="font-size: 13px; color: #78350F; line-height: 1.6; white-space: pre-wrap; word-break: break-word;">
${instructions.trim()}
              </div>
            </div>
          </td>
        </tr>
  ` : "";

  return `${configComment}
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject || "Official Event Entry Pass"}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F1F5F9; padding: 24px 10px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); border: 1px solid #E2E8F0;">
          
          ${posterBlock}

          <!-- Pass Holder Info Header -->
          <tr>
            <td style="padding: 24px 24px 12px 24px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px 18px;">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 1px;">Verified Pass Holder</div>
                    <div style="font-size: 17px; font-weight: 800; color: #0F172A; margin-top: 2px;">{{name}}</div>
                    <div style="font-size: 12px; font-weight: 600; color: #475569; margin-top: 2px;">University Roll: <strong style="color: #8B151B; font-family: monospace; font-size: 13px;">{{roll}}</strong></div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background: #DCFCE7; border: 1px solid #86EFAC; color: #166534; font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
                      ● VALID PASS
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Single Official QR Code Section -->
          <tr>
            <td align="center" style="padding: 12px 24px 20px 24px;">
              <div style="background: #FFFFFF; border: 2px dashed #94A3B8; border-radius: 16px; padding: 22px; text-align: center; max-width: 320px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
                <div style="font-size: 11px; font-weight: 800; color: #0D1038; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px;">
                  SCAN AT GATE CHECKPOINT
                </div>
                <div style="display: inline-block; padding: 10px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px;">
                  {{qr_code}}
                </div>
                <div style="margin-top: 14px;">
                  <a href="{{qr_link}}" style="display: inline-block; background: #8B151B; color: #FFFFFF; text-decoration: none; padding: 10px 22px; border-radius: 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.3px;">
                    Open Online Pass Link →
                  </a>
                </div>
              </div>
            </td>
          </tr>

          ${instructionsBlock}

          <!-- Footer -->
          <tr>
            <td style="background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 18px 24px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #475569;">Graphic Era (Deemed to be University) • Official Entry Management</p>
              <p style="margin: 0; font-size: 10px; color: #94A3B8;">Designed &amp; Developed by Department Of Computer Science and Engineering</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function parseTemplate(t) {
  if (!t) return { name: "", subject: "", posterImage: "", instructions: "", isCodeMode: false, htmlBody: "" };

  let posterImage = "";
  let instructions = "";
  let isCodeMode = false;

  if (t.htmlBody) {
    const configMatch = t.htmlBody.match(/<!-- TEMPLATE_CONFIG:\s*({.*?})\s*-->/s);
    if (configMatch) {
      try {
        const parsed = JSON.parse(configMatch[1]);
        posterImage = parsed.posterImage || "";
        instructions = parsed.instructions || "";
      } catch (e) {
        console.error("Failed to parse template config", e);
      }
    } else {
      isCodeMode = true;
    }
  }

  return {
    id: t.id,
    name: t.name || "",
    subject: t.subject || "",
    posterImage,
    instructions,
    isCodeMode,
    htmlBody: t.htmlBody || "",
  };
}

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
      let finalHtmlBody = "";
      if (templateForm.isCodeMode) {
        finalHtmlBody = templateForm.htmlBody;
      } else {
        finalHtmlBody = compilePassTemplateHtml(templateForm);
      }

      const payload = {
        name: templateForm.name,
        subject: templateForm.subject,
        htmlBody: finalHtmlBody,
      };

      if (templateForm.id) {
        await api.put(`/campaigns/templates/${templateForm.id}`, payload);
        toast({ type: "success", message: "Pass template updated successfully." });
      } else {
        await api.post(`/campaigns/templates`, { ...payload, eventId: activeEventId });
        toast({ type: "success", message: "Pass template created successfully." });
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
      const scheduledIso = campaignForm?.scheduledAt ? new Date(campaignForm.scheduledAt).toISOString() : null;
      await api.post(`/campaigns/start`, { 
        ...campaignForm, 
        scheduledAt: scheduledIso,
        eventId: activeEventId 
      });
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
            <div className="card p-0 overflow-hidden border border-slate-300 shadow-sm mb-6 max-w-5xl mx-auto bg-white">
              <div className="bg-[#8B151B] text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#C59B27]">
                <div className="flex items-center gap-2">
                  <LayoutTemplate size={18} />
                  <div>
                    <h3 className="text-sm font-bold">
                      {templateForm.id ? "Edit Pass Template" : "New Visual Pass Template"}
                    </h3>
                    <p className="text-[11px] text-red-100 font-normal">
                      Upload event poster, set entry instructions, and preview your verified QR pass in real-time.
                    </p>
                  </div>
                </div>
                <button onClick={() => setTemplateForm(null)} className="text-white hover:bg-white/20 p-1.5 rounded transition-colors">
                  <X size={18}/>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                {/* Form Controls Column */}
                <form onSubmit={saveTemplate} className="lg:col-span-7 p-6 space-y-4 text-xs flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <label className="input-label">Template Name <span className="text-red-600">*</span></label>
                      <input 
                        className="input font-medium" 
                        required 
                        value={templateForm.name} 
                        onChange={e => setTemplateForm({...templateForm, name: e.target.value})} 
                        placeholder="e.g. Engineering Freshers 2026 - Evolve Pass" 
                      />
                    </div>

                    <div>
                      <label className="input-label">Email Subject Line <span className="text-red-600">*</span></label>
                      <input 
                        className="input font-medium" 
                        required 
                        value={templateForm.subject} 
                        onChange={e => setTemplateForm({...templateForm, subject: e.target.value})} 
                        placeholder="e.g. Official Entry Pass: Engineering Freshers 2026 - Evolve" 
                      />
                    </div>

                    {!templateForm.isCodeMode ? (
                      <>
                        {/* Event Poster / Banner Image */}
                        <div>
                          <label className="input-label flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-bold text-slate-700">
                              <Image size={14} className="text-[#8B151B]" /> Event Poster / Banner Image
                            </span>
                            {templateForm.posterImage && (
                              <button 
                                type="button" 
                                onClick={() => setTemplateForm({...templateForm, posterImage: ""})}
                                className="text-red-600 hover:text-red-800 text-[11px] font-semibold"
                              >
                                Remove Poster
                              </button>
                            )}
                          </label>

                          {templateForm.posterImage ? (
                            <div className="relative rounded-lg border border-slate-300 overflow-hidden bg-slate-900 group">
                              <img 
                                src={templateForm.posterImage} 
                                alt="Uploaded poster" 
                                className="w-full max-h-48 object-cover" 
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <label className="btn btn-secondary btn-xs cursor-pointer shadow-md">
                                  <Upload size={12} className="mr-1" /> Change Image
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={async (e) => {
                                      if (e.target.files?.[0]) {
                                        try {
                                          const dataUrl = await compressPosterImage(e.target.files[0]);
                                          setTemplateForm(prev => ({ ...prev, posterImage: dataUrl }));
                                        } catch (err) {
                                          toast({ type: "error", message: "Failed to load image." });
                                        }
                                      }
                                    }} 
                                  />
                                </label>
                                <button 
                                  type="button" 
                                  onClick={() => setTemplateForm({...templateForm, posterImage: ""})}
                                  className="btn btn-secondary btn-xs text-red-600 shadow-md"
                                >
                                  <Trash2 size={12} className="mr-1" /> Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="border-2 border-dashed border-slate-300 hover:border-[#8B151B] bg-slate-50 hover:bg-red-50/20 rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer transition-all text-center group">
                              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#8B151B] mb-2 group-hover:scale-105 transition-transform shadow-xs">
                                <Upload size={18} />
                              </div>
                              <span className="font-bold text-slate-800 text-xs">Click to Upload Event Poster</span>
                              <span className="text-slate-500 text-[11px] mt-0.5">PNG, JPG, or WEBP (Optimized automatically for email passes)</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={async (e) => {
                                  if (e.target.files?.[0]) {
                                    try {
                                      const dataUrl = await compressPosterImage(e.target.files[0]);
                                      setTemplateForm(prev => ({ ...prev, posterImage: dataUrl }));
                                    } catch (err) {
                                      toast({ type: "error", message: "Failed to process image file." });
                                    }
                                  }
                                }} 
                              />
                            </label>
                          )}

                          <div className="mt-2">
                            <input 
                              type="text" 
                              className="input text-[11px] py-1.5 text-slate-600 placeholder:text-slate-400"
                              placeholder="Or enter direct image URL (https://...)" 
                              value={templateForm.posterImage?.startsWith("data:") ? "" : (templateForm.posterImage || "")}
                              onChange={e => setTemplateForm({...templateForm, posterImage: e.target.value})}
                            />
                          </div>
                        </div>

                        {/* Event Instructions & Guidelines */}
                        <div>
                          <label className="input-label flex items-center justify-between">
                            <span className="font-bold text-slate-700">Event Instructions &amp; Guidelines</span>
                            <span className="text-[10px] text-slate-400 font-normal">Plain text / bullet points</span>
                          </label>
                          <textarea 
                            className="input text-xs text-slate-800 bg-slate-50 border-slate-300 focus:bg-white leading-relaxed" 
                            rows={6} 
                            value={templateForm.instructions || ""} 
                            onChange={e => setTemplateForm({...templateForm, instructions: e.target.value})} 
                            placeholder={"1. Reporting Time: 4:00 PM at Main Ground.\n2. Dress Code: Ethnic Wear.\n3. Entry strictly allowed on showing this verified QR pass & College ID card.\n4. Pass is strictly non-transferable."}
                          />
                          <p className="text-[11px] text-slate-500 mt-1">
                            These instructions will be cleanly formatted into a highlighted box directly under the QR code in each student's pass.
                          </p>
                        </div>
                      </>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="input-label mb-0">Raw HTML Code Mode <span className="text-red-600">*</span></label>
                          <div className="flex gap-1">
                            {['{{name}}', '{{roll}}', '{{event_name}}', '{{qr_code}}', '{{qr_link}}'].map(tag => (
                              <span key={tag} className="px-1 py-0.5 rounded bg-red-50 text-[#8B151B] text-[0.6rem] font-mono font-bold border border-red-200">{tag}</span>
                            ))}
                          </div>
                        </div>
                        <textarea 
                          className="input font-mono text-xs text-slate-800 bg-slate-50 border-slate-300 focus:bg-white" 
                          required 
                          rows={12} 
                          value={templateForm.htmlBody} 
                          onChange={e => setTemplateForm({...templateForm, htmlBody: e.target.value})} 
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                    <button 
                      type="button" 
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                      onClick={() => setTemplateForm(prev => ({ ...prev, isCodeMode: !prev.isCodeMode }))}
                    >
                      {templateForm.isCodeMode ? "← Back to Visual Builder" : "Switch to Raw HTML Mode"}
                    </button>

                    <div className="flex gap-2">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setTemplateForm(null)}>Cancel</button>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                        {loading ? "Saving..." : "Save Template"}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Live Email Pass Preview Column */}
                <div className="lg:col-span-5 bg-slate-100/70 p-5 flex flex-col items-center justify-start">
                  <div className="w-full mb-2 flex items-center justify-between text-slate-600 text-xs font-bold px-1">
                    <span className="flex items-center gap-1.5">
                      <Eye size={14} className="text-[#8B151B]" /> Live Email Pass Preview
                    </span>
                    <span className="text-[10px] uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500 font-mono">
                      Mobile Pass View
                    </span>
                  </div>

                  {/* Email Pass Mockup Container */}
                  <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden text-slate-800 font-sans">
                    
                    {/* Email Header Simulation */}
                    <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                      <span className="font-bold text-slate-700">Subject:</span>
                      <span className="truncate">{templateForm.subject || "Official Event Entry Pass - Graphic Era"}</span>
                    </div>

                    {/* Poster or University Top Banner */}
                    {templateForm.posterImage ? (
                      <div className="w-full max-h-44 bg-slate-950 overflow-hidden border-b-2 border-[#8B151B]">
                        <img 
                          src={templateForm.posterImage} 
                          alt="Banner preview" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-[#8B151B] to-[#5E0E12] p-4 text-center text-white border-b-2 border-[#C59B27]">
                        <div className="text-[9px] font-extrabold tracking-widest uppercase text-amber-300">
                          GRAPHIC ERA (DEEMED TO BE UNIVERSITY)
                        </div>
                        <div className="font-serif font-bold text-sm text-white mt-1">
                          {templateForm.name || "Event Entry Pass"}
                        </div>
                        <div className="text-[10px] text-red-200 mt-0.5">Official University Digital Ticket</div>
                      </div>
                    )}

                    <div className="p-4 space-y-3.5">
                      {/* Student Info Card */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pass Holder</span>
                          <span className="font-bold text-slate-900 text-xs block">Varun Dobhal</span>
                          <span className="text-[11px] text-slate-500">Roll: <strong className="text-[#8B151B] font-mono">2115001</strong></span>
                        </div>
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          ● VALID PASS
                        </span>
                      </div>

                      {/* Exactly ONE Prominent Entry QR Code */}
                      <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-4 text-center shadow-2xs">
                        <span className="text-[9px] font-extrabold text-[#0D1038] uppercase tracking-widest block mb-2">
                          SCAN AT GATE CHECKPOINT
                        </span>
                        <div className="inline-block p-2 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
                          <div className="w-32 h-32 bg-white flex flex-col items-center justify-center border border-slate-100 rounded-lg p-1">
                            {/* High visual fidelity QR icon simulation */}
                            <div className="w-28 h-28 border-4 border-[#0D1038] p-1 flex flex-col justify-between rounded-sm">
                              <div className="flex justify-between">
                                <div className="w-7 h-7 bg-[#0D1038] p-1"><div className="w-full h-full bg-white p-0.5"><div className="w-full h-full bg-[#0D1038]"></div></div></div>
                                <div className="w-7 h-7 bg-[#0D1038] p-1"><div className="w-full h-full bg-white p-0.5"><div className="w-full h-full bg-[#0D1038]"></div></div></div>
                              </div>
                              <div className="flex justify-center items-center py-1">
                                <div className="w-8 h-4 bg-slate-300 rounded-xs flex items-center justify-center text-[7px] font-bold text-[#8B151B]">PASS</div>
                              </div>
                              <div className="flex justify-between">
                                <div className="w-7 h-7 bg-[#0D1038] p-1"><div className="w-full h-full bg-white p-0.5"><div className="w-full h-full bg-[#0D1038]"></div></div></div>
                                <div className="w-6 h-6 border-2 border-dashed border-slate-400 flex items-center justify-center text-[7px] font-mono font-bold">2115</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2.5">
                          <span className="inline-block bg-[#8B151B] text-white text-[10px] font-bold px-3 py-1 rounded-md shadow-xs">
                            Open Online Pass Link →
                          </span>
                        </div>
                      </div>

                      {/* Event Instructions & Guidelines Block */}
                      {templateForm.instructions?.trim() ? (
                        <div className="bg-amber-50/80 border-l-4 border-amber-500 border-y border-r border-amber-200 rounded-lg p-3 text-left">
                          <div className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wide mb-1 flex items-center gap-1">
                            📌 Important Instructions &amp; Guidelines
                          </div>
                          <div className="text-[11px] text-amber-950 whitespace-pre-wrap leading-relaxed">
                            {templateForm.instructions.trim()}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg p-3 text-center text-slate-400 text-[11px] italic">
                          No extra instructions added yet. Enter instructions on the left to display event rules &amp; timings here.
                        </div>
                      )}

                      {/* University Pass Footer */}
                      <div className="pt-2 text-center border-t border-slate-100 text-[9px] text-slate-400">
                        <p className="font-semibold text-slate-600 mb-0.5">Graphic Era (Deemed to be University) • Gate Entry</p>
                        <p>Dept. Of Computer Science and Engineering</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={() => setTemplateForm({ name: "", subject: "", posterImage: "", instructions: "", isCodeMode: false, htmlBody: "" })}
                >
                  <Plus size={14} className="mr-1"/> Create Template
                </button>
              </div>

              {templates.length === 0 ? (
                <EmptyState 
                  icon={LayoutTemplate} 
                  title="No Templates Configured" 
                  description="Design visual email pass templates with poster images and instructions for your Graphic Era events."
                  actionLabel="Create First Template"
                  onAction={() => setTemplateForm({ name: "", subject: "", posterImage: "", instructions: "", isCodeMode: false, htmlBody: "" })}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {templates.map(t => {
                    const meta = parseTemplate(t);
                    return (
                      <div key={t.id} className="card p-0 overflow-hidden bg-white border border-slate-300 shadow-xs hover:shadow-sm transition-all flex flex-col">
                        {meta.posterImage ? (
                          <div className="w-full h-32 bg-slate-900 overflow-hidden relative border-b border-slate-200">
                            <img src={meta.posterImage} alt={t.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2.5">
                              <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                                Banner Attached
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-20 bg-gradient-to-r from-[#8B151B] to-[#5E0E12] flex items-center justify-between px-4 border-b border-[#C59B27]">
                            <div className="text-white">
                              <span className="text-[9px] font-bold tracking-wider uppercase text-amber-300 block">Graphic Era</span>
                              <span className="text-xs font-serif font-bold text-white">Default Pass Layout</span>
                            </div>
                            <LayoutTemplate size={24} className="text-white/40" />
                          </div>
                        )}
                        
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-[#8B151B] mb-1.5 font-bold text-sm">
                              <h4 className="line-clamp-1">{t.name}</h4>
                            </div>
                            <div className="bg-slate-50 rounded p-2 mb-2 border border-slate-200 text-xs">
                              <span className="text-[0.65rem] font-bold text-slate-500 uppercase block mb-0.5">Subject:</span>
                              <p className="text-slate-700 font-medium line-clamp-1">{t.subject}</p>
                            </div>
                            {meta.instructions && (
                              <div className="text-[11px] text-slate-600 line-clamp-2 bg-amber-50/60 border border-amber-200/60 rounded p-1.5 mb-2">
                                <span className="font-bold text-amber-900">Instructions: </span>
                                {meta.instructions}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 pt-3 border-t border-slate-200 mt-2">
                            <button className="btn btn-secondary btn-xs flex-1" onClick={() => setTemplateForm(parseTemplate(t))}>
                              <Edit2 size={12} className="mr-1"/> Edit
                            </button>
                            <button className="btn btn-secondary btn-xs text-red-600 hover:bg-red-50 flex-1" onClick={() => setDeleteModal({ isOpen: true, templateId: t.id, isDeleting: false })}>
                              <Trash2 size={12} className="mr-1"/> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                      {camp.status === "SCHEDULED" && (
                        <button 
                          className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                          onClick={async () => {
                            try {
                              await api.post(`/campaigns/${camp.id}/dispatch-now`);
                              toast({ type: "success", message: "Dispatch started!" });
                              fetchCampaigns();
                            } catch(e) {
                              toast({ type: "error", message: "Failed to dispatch" });
                            }
                          }}
                        >
                          <PlayCircle size={13} className="mr-1" /> Dispatch Now
                        </button>
                      )}
                      <button className="btn btn-sm btn-primary cursor-pointer" onClick={() => setActiveConsoleId(camp.id)}>
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
