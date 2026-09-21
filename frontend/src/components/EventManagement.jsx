import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { useToast } from "../context/ToastContext";
import { Calendar, MapPin, Image as ImageIcon, Clock, Plus, Trash2, Edit2, PlayCircle, ArrowUp, ArrowDown, ChevronRight, CheckCircle2, ListFilter, Users, ScanLine, X, Award } from "lucide-react";
import DeleteModal from "./DeleteModal";
import { EmptyState } from "./ui/EmptyState";

export default function EventManagement({ activeEventId, setActiveEventId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState(1); // Wizard step
  const [formData, setFormData] = useState({
    name: "", type: "Farewell", date: "", venue: "", bannerImage: "", description: "", entryTiming: "", exitTiming: "", isSequential: false
  });
  const [checkpoints, setCheckpoints] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, eventId: null, isDeleting: false });
  const { toast } = useToast();

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get("/events");
      setEvents(res.data);
    } catch (err) { toast({ type: "error", message: "Failed to fetch events." }); }
  };

  const handleEdit = async (ev) => {
    try {
      const res = await api.get(`/events/${ev.id}`);
      setFormData(res.data);
      setCheckpoints(res.data.checkpoints || []);
      setStep(1);
      setIsCreating(true);
    } catch (e) { toast({ type: "error", message: "Failed to fetch event details." }); }
  };

  const addCheckpoint = () => setCheckpoints([...checkpoints, { name: "", isActive: true, order: checkpoints.length, _isNew: true }]);
  
  const updateCheckpoint = (index, field, value) => {
    const cps = [...checkpoints];
    cps[index][field] = value;
    setCheckpoints(cps);
  };
  
  const removeCheckpoint = (index) => {
    const cps = [...checkpoints];
    if (cps[index].id) cps[index]._isDeleted = true;
    else cps.splice(index, 1);
    setCheckpoints(cps);
  };
  
  const moveCheckpoint = (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === checkpoints.length - 1) return;
    const cps = [...checkpoints];
    const temp = cps[index];
    cps[index] = cps[index + direction];
    cps[index + direction] = temp;
    cps.forEach((c, i) => c.order = i);
    setCheckpoints(cps);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData };
      let savedEventId = null;
      if (formData.id) {
        await api.put(`/events/${formData.id}`, payload);
        savedEventId = formData.id;
        toast({ type: "success", message: "Event updated successfully." });
      } else {
        payload.checkpoints = checkpoints.filter(c => !c._isDeleted);
        const res = await api.post("/events", payload);
        savedEventId = res.data.id;
        toast({ type: "success", message: "Event created successfully." });
      }
      
      if (formData.id) {
         await api.post(`/checkpoints/event/${formData.id}/batch`, { checkpoints });
      }
      
      closeWizard();
      fetchEvents();
    } catch (err) { toast({ type: "error", message: "Failed to save event." }); } 
    finally { setLoading(false); }
  };

  const closeWizard = () => {
    setIsCreating(false);
    setStep(1);
    setFormData({ name: "", type: "Farewell", date: "", venue: "", bannerImage: "", description: "", entryTiming: "", exitTiming: "", isSequential: false });
    setCheckpoints([]);
  };

  const confirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      await api.delete(`/events/${deleteModal.eventId}`);
      toast({ type: "success", message: "Event deleted." });
      fetchEvents();
    } catch (err) { toast({ type: "error", message: "Failed to delete event." }); }
    finally { setDeleteModal({ isOpen: false, eventId: null, isDeleting: false }); }
  };

  const handleActivate = async (id) => {
    try {
      await api.post(`/events/${id}/activate`);
      setActiveEventId(id);
      toast({ type: "success", message: "Event activated." });
      fetchEvents();
    } catch (err) { toast({ type: "error", message: "Failed to activate event." }); }
  };

  const activeCheckpointsCount = checkpoints.filter(c => !c._isDeleted).length;

  return (
    <div className="w-full text-slate-800">
      
      {/* ── Section Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-0.5">
            Campus Event &amp; Checkpoint Directory
          </h2>
          <p className="text-slate-500 text-xs font-medium">
            Create, configure, and assign gate checkpoints for Graphic Era University events.
          </p>
        </div>
        <button 
          className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer" 
          onClick={() => { setFormData({ name: "", type: "Farewell", date: "", venue: "", bannerImage: "", description: "", entryTiming: "", exitTiming: "", isSequential: false }); setCheckpoints([]); setStep(1); setIsCreating(true); }}
        >
          <Plus size={14} className="mr-1"/> Create New Event
        </button>
      </div>

      {/* ── Event Creation / Edit Wizard ───────────────────────────── */}
      {isCreating ? (
        <div className="rounded-xl overflow-hidden mb-8 bg-white border border-[#E5EAF2] shadow-[0_2px_10px_rgba(15,23,42,0.04)] animate-slide-up">
          
          {/* Wizard Header */}
          <div className="bg-[#1E2A78] text-white px-6 py-4 flex items-center justify-between border-b border-white/10">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <Calendar size={18} />
                <span>{formData.id ? "Edit Event Configuration" : "New University Event Setup"}</span>
              </h3>
              <p className="text-[0.7rem] text-red-100 font-medium mt-0.5">Step {step} of 3</p>
            </div>
            
            {/* Step Pills */}
            <div className="flex items-center gap-1 text-xs">
              {[
                { num: 1, label: "Basic Details" },
                { num: 2, label: "Checkpoints" },
                { num: 3, label: "Review & Publish" }
              ].map(s => (
                <div 
                  key={s.num} 
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    step === s.num 
                      ? 'bg-white text-[#8B151B]' 
                      : 'bg-[#6E0E13] text-red-200'
                  }`}
                >
                  {s.num}. {s.label}
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-white">
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in text-xs">
                <div className="md:col-span-2">
                  <label className="input-label">Event Name <span className="text-red-600">*</span></label>
                  <input 
                    className="input" 
                    placeholder="e.g. Grafest 2026, Annual Convocation, Department Farewell" 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <label className="input-label">Event Classification</label>
                  <select 
                    className="input" 
                    value={formData.type} 
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Farewell">Department Farewell</option>
                    <option value="Grafest">Grafest (Cultural Fest)</option>
                    <option value="Convocation">Annual Convocation</option>
                    <option value="TechFest">National Tech Symposium</option>
                    <option value="Induction">Student Induction Program</option>
                    <option value="Sports">Inter-Collegiate Sports Meet</option>
                    <option value="Conference">International Academic Conference</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Event Date</label>
                  <input 
                    className="input" 
                    type="date" 
                    value={formData.date ? formData.date.split("T")[0] : ""} 
                    onChange={e => setFormData({ ...formData, date: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="input-label">Campus Venue</label>
                  <input 
                    className="input" 
                    placeholder="e.g. Silver Jubilee Convention Centre, Ground A" 
                    value={formData.venue} 
                    onChange={e => setFormData({ ...formData, venue: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="input-label">Gate Reporting Time</label>
                  <input 
                    className="input" 
                    type="time" 
                    value={formData.entryTiming} 
                    onChange={e => setFormData({ ...formData, entryTiming: e.target.value })} 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="input-label">Banner Image URL (Optional)</label>
                  <input 
                    className="input" 
                    placeholder="https://..." 
                    value={formData.bannerImage} 
                    onChange={e => setFormData({ ...formData, bannerImage: e.target.value })} 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="input-label">Event Overview / Guidelines</label>
                  <textarea 
                    className="input resize-none" 
                    placeholder="Brief description for attendees and student volunteers..." 
                    rows={3} 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in text-xs">
                <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-200">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Gate &amp; Counter Checkpoints
                    </h4>
                    <p className="text-slate-500 text-xs">Define where passes will be scanned across campus grounds.</p>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addCheckpoint}>
                    <Plus size={14} className="mr-1"/> Add Checkpoint
                  </button>
                </div>

                <div className="p-3 mb-4 rounded bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">Enforce Sequential Entry Flow</span>
                    <span className="text-[0.68rem] text-amber-700">Attendees must scan earlier checkpoints (e.g. Main Gate) before subsequent ones (e.g. Food Counter).</span>
                  </div>
                  <input 
                    type="checkbox" 
                    className="rounded text-[#8B151B] focus:ring-[#8B151B]" 
                    checked={formData.isSequential || false} 
                    onChange={e => setFormData({...formData, isSequential: e.target.checked})} 
                  />
                </div>

                {activeCheckpointsCount === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-300 rounded bg-slate-50">
                    <MapPin size={28} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-slate-600 font-semibold text-xs">No checkpoints added yet. Click 'Add Checkpoint' above.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {checkpoints.map((cp, idx) => {
                      if (cp._isDeleted) return null;
                      return (
                        <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded border border-slate-200">
                          <div className="w-7 h-7 rounded bg-[#8B151B] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {cp.order + 1}
                          </div>
                          <div className="flex-1">
                            <input 
                              className="input bg-white py-1 text-xs" 
                              placeholder="e.g. Main Campus Gate, Auditorium Entrance, Food Stall A" 
                              value={cp.name} 
                              onChange={e => updateCheckpoint(idx, 'name', e.target.value)} 
                              required 
                            />
                          </div>
                          
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="rounded text-[#8B151B]" 
                              checked={cp.isActive} 
                              onChange={e => updateCheckpoint(idx, 'isActive', e.target.checked)} 
                            />
                            Active
                          </label>

                          <div className="flex items-center gap-1 border-l border-slate-300 pl-2">
                            <button type="button" className="btn-icon w-6 h-6 text-slate-500 hover:text-slate-900 border-none" onClick={() => moveCheckpoint(idx, -1)} disabled={idx === 0} title="Move Up"><ArrowUp size={14} /></button>
                            <button type="button" className="btn-icon w-6 h-6 text-slate-500 hover:text-slate-900 border-none" onClick={() => moveCheckpoint(idx, 1)} disabled={idx === checkpoints.length - 1} title="Move Down"><ArrowDown size={14} /></button>
                            <button type="button" className="btn-icon w-6 h-6 text-red-600 hover:text-red-800 border-none ml-1" onClick={() => removeCheckpoint(idx)} title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in text-xs space-y-4">
                <div className="bg-slate-50 rounded p-4 border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 pb-2 border-b border-slate-200">
                    Configuration Summary
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-y-3 text-xs">
                    <div><span className="text-slate-500 block">Event Title:</span><strong className="text-slate-900 text-sm">{formData.name || 'Untitled'}</strong></div>
                    <div><span className="text-slate-500 block">Classification:</span><strong className="text-[#8B151B]">{formData.type}</strong></div>
                    <div><span className="text-slate-500 block">Date:</span><strong className="text-slate-800">{formData.date || 'TBD'}</strong></div>
                    <div><span className="text-slate-500 block">Campus Venue:</span><strong className="text-slate-800">{formData.venue || 'TBD'}</strong></div>
                    <div><span className="text-slate-500 block">Configured Checkpoints:</span><strong className="text-slate-800">{activeCheckpointsCount} Gates</strong></div>
                    <div><span className="text-slate-500 block">Flow Mode:</span><strong className="text-slate-800">{formData.isSequential ? 'Sequential Order' : 'Standard Parallel'}</strong></div>
                  </div>
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={() => step > 1 ? setStep(step - 1) : closeWizard()}
              >
                {step === 1 ? 'Cancel' : '← Back'}
              </button>
              
              {step < 3 ? (
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm" 
                  onClick={() => {
                    if (step === 1 && !formData.name) return toast({ type: 'error', message: 'Event Name is required' });
                    setStep(step + 1);
                  }}
                >
                  Continue &rarr;
                </button>
              ) : (
                <button 
                  type="button" 
                  className="btn btn-success btn-sm" 
                  onClick={handleSave} 
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save & Publish Event'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Events Grid ────────────────────────────────────────────── */}
      {!isCreating && events.length === 0 ? (
        <EmptyState 
          icon={Calendar} 
          title="No Campus Events Configured" 
          description="Get started by setting up the first event for Graphic Era University."
          actionLabel="Create First Event"
          onAction={() => { setFormData({ name: "", type: "Farewell", date: "", venue: "", bannerImage: "", description: "", entryTiming: "", exitTiming: "", isSequential: false }); setCheckpoints([]); setStep(1); setIsCreating(true); }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {events.map(ev => (
            <div 
              key={ev.id} 
              className={`card p-0 overflow-hidden bg-white border transition-all hover:shadow-md ${
                ev.isActive 
                  ? 'border-[#8B151B] shadow-sm' 
                  : 'border-slate-300'
              }`}
            >
              {/* Event Header Banner */}
              <div className="bg-[#8B151B] text-white p-4 relative flex items-center justify-between border-b-2 border-[#C59B27]">
                <div>
                  <span className="badge bg-white/20 text-white border-white/30 text-[0.62rem] font-bold uppercase mb-1">
                    {ev.type}
                  </span>
                  <h3 className="text-base font-bold text-white leading-snug line-clamp-1">{ev.name}</h3>
                </div>
                {ev.isActive && (
                  <span className="badge bg-emerald-600 text-white font-bold text-[0.62rem] uppercase shrink-0">
                    Live Active
                  </span>
                )}
              </div>

              {/* Event Card Body */}
              <div className="p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <Calendar size={14} className="text-[#8B151B]" /> 
                  <span>{new Date(ev.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <MapPin size={14} className="text-[#8B151B]" /> 
                  <span className="truncate">{ev.venue || "Campus Venue TBD"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <ScanLine size={14} className="text-[#8B151B]" /> 
                  <span>{ev.checkpoints ? ev.checkpoints.length : 0} Active Checkpoints</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200 mt-3">
                  <div className="flex items-center gap-1.5">
                    <button 
                      className="btn btn-secondary btn-xs" 
                      title="Edit Event" 
                      onClick={() => handleEdit(ev)}
                    >
                      <Edit2 size={12} className="mr-1" /> Edit
                    </button>
                    <button 
                      className="btn btn-secondary btn-xs text-red-600 hover:bg-red-50" 
                      title="Delete Event" 
                      onClick={() => setDeleteModal({ isOpen: true, eventId: ev.id, isDeleting: false })}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  
                  {!ev.isActive && (
                    <button 
                      className="btn btn-primary btn-xs" 
                      onClick={() => handleActivate(ev.id)}
                    >
                      <PlayCircle size={12} className="mr-1"/> Set Active
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, eventId: null, isDeleting: false })}
        onConfirm={confirmDelete}
        title="Delete University Event"
        message="Are you sure you want to delete this event? All associated attendees and scan logs will be removed."
        isDeleting={deleteModal.isDeleting}
      />
    </div>
  );
}
