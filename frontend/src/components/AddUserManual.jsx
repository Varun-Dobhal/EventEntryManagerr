import React, { useState } from 'react';
import { 
  UserPlus, Mail, Send, CheckCircle2, AlertCircle, Loader2, 
  RotateCcw, ArrowRight, UserCheck, ShieldCheck, Sparkles 
} from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function AddUserManual({ 
  activeEvent, 
  activeEventId, 
  events = [], 
  setActiveEventId, 
  fetchAttendees,
  onNavigateToRoster 
}) {
  const [name, setName] = useState('');
  const [roll, setRoll] = useState('');
  const [email, setEmail] = useState('');
  const [sendEmailImmediately, setSendEmailImmediately] = useState(true);
  const [customMessage, setCustomMessage] = useState('');
  const [showCustomMsg, setShowCustomMsg] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recentAdditions, setRecentAdditions] = useState([]);
  const [resendingId, setResendingId] = useState(null);

  const { toast } = useToast();

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ type: 'error', message: 'Please enter student full name.' });
      return;
    }
    if (!roll.trim()) {
      toast({ type: 'error', message: 'Please enter university roll number.' });
      return;
    }
    if (!activeEventId) {
      toast({ type: 'error', message: 'Please select an active event first.' });
      return;
    }
    if (sendEmailImmediately && !email.trim()) {
      toast({ type: 'error', message: 'Email address is required to dispatch pass email.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/attendees/manual', {
        name: name.trim(),
        roll: roll.trim().toUpperCase(),
        email: email.trim() || null,
        eventId: activeEventId,
        sendEmailImmediately,
        customMessage: customMessage.trim() || undefined,
      });

      toast({ 
        type: 'success', 
        message: res.data?.message || `Student ${name} added successfully!` 
      });

      if (res.data?.attendee) {
        setRecentAdditions(prev => [res.data.attendee, ...prev]);
      }

      // Reset form
      setName('');
      setRoll('');
      setEmail('');
      setCustomMessage('');
      setShowCustomMsg(false);

      // Refresh global roster
      if (fetchAttendees) {
        fetchAttendees();
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to add student.';
      toast({ type: 'error', message: errMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (attendeeId) => {
    setResendingId(attendeeId);
    try {
      await api.post(`/attendees/send-email/${attendeeId}`);
      toast({ type: 'success', message: 'Pass email resent successfully!' });
      setRecentAdditions(prev => prev.map(a => a.id === attendeeId ? { ...a, emailSent: true } : a));
      if (fetchAttendees) fetchAttendees();
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.error || 'Failed to resend pass.' });
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-slate-800">
      
      {/* ── Section Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-100 flex items-center justify-center shrink-0">
              <UserPlus size={18} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight m-0">
                Add Users / Manual Entry
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manually enroll individual students to the event roster and immediately dispatch verifiable digital QR access passes.
              </p>
            </div>
          </div>
        </div>

        {/* Event Selector Pill */}
        {events.length > 0 && (
          <div className="flex items-center gap-2 bg-white border border-[#E5EAF2] rounded-xl px-3 py-1.5 shadow-2xs self-start sm:self-auto">
            <span className="text-[0.68rem] font-semibold text-slate-500 shrink-0">Target Event:</span>
            <select
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer max-w-[150px] truncate"
              value={activeEventId}
              onChange={(e) => setActiveEventId(e.target.value)}
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Main Two-Column Layout ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form Card (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#E5EAF2] p-6 sm:p-7 shadow-[0_2px_10px_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-900">
                Student Enrollment Details
              </span>
              <span className="text-[0.68rem] font-bold text-[#2563EB] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {activeEvent?.name || "Active Event"}
              </span>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="student-name">
                  Student Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="student-name"
                  type="text"
                  placeholder="e.g. Siddhant Thapliyal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EAF2] text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium bg-white"
                  required
                  disabled={submitting}
                />
              </div>

              {/* University Roll Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="student-roll">
                  University Roll Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="student-roll"
                  type="text"
                  placeholder="e.g. 2115001 or 21TA111382"
                  value={roll}
                  onChange={(e) => setRoll(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EAF2] text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-mono uppercase focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium bg-white"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Student Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="student-email">
                  Student Email Address {sendEmailImmediately && <span className="text-red-500">*</span>}
                </label>
                <input
                  id="student-email"
                  type="email"
                  placeholder="e.g. student@geu.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EAF2] text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium bg-white"
                  required={sendEmailImmediately}
                  disabled={submitting}
                />
              </div>

              {/* Send Pass Email Immediately Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sendEmailImmediately}
                    onChange={(e) => setSendEmailImmediately(e.target.checked)}
                    className="w-4 h-4 rounded text-[#2563EB] focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Dispatch QR Entry Pass via email immediately upon registration
                  </span>
                </label>
              </div>

              {/* Custom Email Note Accordion */}
              {sendEmailImmediately && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCustomMsg(prev => !prev)}
                    className="text-[0.72rem] font-bold text-[#2563EB] hover:underline focus:outline-none cursor-pointer"
                  >
                    {showCustomMsg ? "− Hide custom message" : "+ Add custom announcement note for pass email (optional)"}
                  </button>
                  {showCustomMsg && (
                    <div className="mt-2 animate-fade-in">
                      <textarea
                        rows={3}
                        placeholder="Enter optional specific instructions or reporting time to display in the student pass email..."
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-[#E5EAF2] text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/10 transition-all bg-white"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Form Action Buttons */}
              <div className="pt-4 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-[#2563EB] hover:bg-blue-700 transition-colors shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Registering &amp; Dispatching...</span>
                    </>
                  ) : (
                    <>
                      {sendEmailImmediately ? <Send size={14} /> : <UserPlus size={14} />}
                      <span>{sendEmailImmediately ? "Register & Send Pass Email" : "Register Student"}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setName(''); setRoll(''); setEmail(''); setCustomMessage(''); }}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-[#E5EAF2] transition-colors cursor-pointer shadow-2xs"
                >
                  Clear Form
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Right Column: Session Activity & Recent Additions (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#E5EAF2] p-6 sm:p-7 shadow-[0_2px_10px_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-900">
                Recent Manual Additions
              </span>
              <span className="text-[0.68rem] font-semibold text-slate-500">
                {recentAdditions.length} in this session
              </span>
            </div>

            {recentAdditions.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <UserCheck size={20} />
                </div>
                <p className="text-xs font-bold text-slate-700">No students added yet</p>
                <p className="text-[0.72rem] text-slate-400 mt-1 max-w-xs mx-auto">
                  Newly enrolled attendees and their real-time email dispatch statuses will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {recentAdditions.map((att) => (
                  <div 
                    key={att.id}
                    className="p-3.5 rounded-xl bg-slate-50/70 border border-[#E5EAF2] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 leading-tight">{att.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[0.68rem] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                          {att.roll}
                        </span>
                        <span className="text-[0.7rem] text-slate-500 truncate max-w-[140px]">
                          {att.email || "No email"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider border ${
                        att.emailSent 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {att.emailSent ? "Pass Sent ✓" : "Pending"}
                      </span>
                      
                      {att.email && !att.emailSent && (
                        <button
                          onClick={() => handleResend(att.id)}
                          disabled={resendingId === att.id}
                          className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs cursor-pointer"
                          title="Send pass now"
                        >
                          {resendingId === att.id ? (
                            <Loader2 size={12} className="animate-spin text-[#2563EB]" />
                          ) : (
                            <Send size={12} className="text-[#2563EB]" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Roster Link */}
          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={onNavigateToRoster}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>View complete event roster in Dashboard</span>
              <ArrowRight size={13} className="text-slate-400" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
