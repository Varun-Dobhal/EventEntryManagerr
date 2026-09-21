import React, { useState, useMemo } from 'react';
import { 
  Search, Mail, CheckCircle2, Clock, RefreshCw, Download, 
  UserCircle, ExternalLink, X, AlertCircle, Send, CheckCircle, 
  FileText, ShieldCheck, ChevronRight, Filter, SlidersHorizontal, 
  Archive, Loader2
} from 'lucide-react';

export default function MailSentRecords({ 
  attendees = [], 
  eventCheckpoints = [], 
  activeEvent = null, 
  onResendEmail, 
  emailLoading, 
  fetchAttendees,
  datasets = [],
  onRestoreDataset,
  onDeleteDataset
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, sent, pending, admitted
  const [sortOption, setSortOption] = useState('newest');
  const [selectedProof, setSelectedProof] = useState(null);
  const [showDatasetModal, setShowDatasetModal] = useState(false);

  // Filter sent attendees
  const sentAttendees = useMemo(() => {
    return attendees.filter(a => a.emailSent);
  }, [attendees]);

  // Apply search and status filters
  const filteredRecords = useMemo(() => {
    return attendees.filter(a => {
      // Must have email
      if (!a.email) return false;

      // Status filter
      if (statusFilter === 'sent' && !a.emailSent) return false;
      if (statusFilter === 'pending' && a.emailSent) return false;
      if (statusFilter === 'admitted') {
        const isAdmitted = a.checkpointStatuses?.some(cs => cs.status);
        if (!isAdmitted) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = a.name?.toLowerCase().includes(term);
        const matchesRoll = a.roll?.toLowerCase().includes(term);
        const matchesEmail = a.email?.toLowerCase().includes(term);
        if (!matchesName && !matchesRoll && !matchesEmail) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOption === 'newest') {
        const timeA = a.emailSentAt ? new Date(a.emailSentAt).getTime() : 0;
        const timeB = b.emailSentAt ? new Date(b.emailSentAt).getTime() : 0;
        return timeB - timeA;
      }
      if (sortOption === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortOption === 'roll') {
        return (a.roll || '').localeCompare(b.roll || '');
      }
      return 0;
    });
  }, [attendees, searchTerm, statusFilter, sortOption]);

  // Statistics
  const totalWithEmail = attendees.filter(a => a.email).length;
  const totalSent = sentAttendees.length;
  const totalPending = Math.max(0, totalWithEmail - totalSent);
  const deliveryPct = totalWithEmail > 0 ? Math.round((totalSent / totalWithEmail) * 100) : 0;

  // Latest send time
  const latestSentRecord = useMemo(() => {
    const withTime = sentAttendees.filter(a => a.emailSentAt);
    if (withTime.length === 0) return null;
    return withTime.reduce((latest, a) => {
      const aTime = new Date(a.emailSentAt).getTime();
      const latestTime = new Date(latest.emailSentAt).getTime();
      return aTime > latestTime ? a : latest;
    }, withTime[0]);
  }, [sentAttendees]);

  // Export CSV of Sent Records
  const handleExportCSV = () => {
    const recordsToExport = filteredRecords.filter(a => a.emailSent);
    if (recordsToExport.length === 0) {
      alert("No sent records to export.");
      return;
    }

    const headers = ["University Roll No", "Student Name", "Email Address", "Dispatch Timestamp", "Status", "Gate Admission Status"];
    const rows = recordsToExport.map(a => {
      const isAdmitted = a.checkpointStatuses?.some(cs => cs.status);
      const sentTimeStr = a.emailSentAt ? new Date(a.emailSentAt).toLocaleString() : "Confirmed";
      return [
        `"${a.roll}"`,
        `"${a.name}"`,
        `"${a.email}"`,
        `"${sentTimeStr}"`,
        `"Delivered"`,
        `"${isAdmitted ? 'Admitted' : 'Pending Entry'}"`
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GEU_Pass_Sent_Records_${activeEvent?.name || 'Event'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* ── Top Header Banner & Stats ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E5EAF2] shadow-[0_2px_10px_rgba(15,23,42,0.04)] p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold shrink-0">
                <CheckCircle size={20} />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight m-0">
                  Mail Sent &amp; Pass Delivery Records
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Searchable audit trail of students issued entry QR passes. Verify dispatch timestamps and resend passes on demand.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="btn btn-sm btn-secondary text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-slate-100"
              title="Download CSV report of sent emails"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={fetchAttendees}
              className="btn btn-sm btn-secondary text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-slate-100"
              title="Refresh Records"
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowDatasetModal(true)}
              className="btn btn-sm bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="View Upload Dataset History"
            >
              <Archive size={13} />
              <span className="hidden sm:inline">Upload History</span>
            </button>
          </div>
        </div>

        {/* ── KPI Metric Cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-5">
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70">
            <p className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider mb-1">Passes Sent</p>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{totalSent}</h3>
              <span className="text-xs font-semibold text-slate-400">/ {totalWithEmail}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[0.7rem] text-slate-500 font-medium">
              <span>{deliveryPct}% Delivered</span>
              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${deliveryPct}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70">
            <p className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Passes</p>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-2xl sm:text-3xl font-black text-amber-800 tracking-tight">{totalPending}</h3>
              <span className="text-xs font-semibold text-slate-400">students</span>
            </div>
            <p className="mt-2 text-[0.7rem] text-slate-500 font-medium">Yet to dispatch</p>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70">
            <p className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider mb-1">Event Target</p>
            <h3 className="text-lg sm:text-xl font-black text-[#1E2A78] tracking-tight truncate">
              {activeEvent?.name || "Active Event"}
            </h3>
            <p className="mt-2 text-[0.7rem] text-slate-500 font-medium truncate">
              {activeEvent?.venue || "Graphic Era Campus"}
            </p>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70">
            <p className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider mb-1">Latest Dispatch</p>
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight mt-1 truncate">
              {latestSentRecord?.emailSentAt ? new Date(latestSentRecord.emailSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "No sends yet"}
            </h3>
            <p className="mt-1 text-[0.7rem] text-slate-500 font-medium truncate">
              {latestSentRecord?.emailSentAt ? new Date(latestSentRecord.emailSentAt).toLocaleDateString() : "Pending campaign"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Search, Filters & Records Table ───────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E5EAF2] shadow-[0_2px_10px_rgba(15,23,42,0.04)] overflow-hidden">
        
        {/* Search & Filter Ribbon */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white">
          <div className="relative flex-grow max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              className="input w-full bg-slate-50 hover:bg-white focus:bg-white border-slate-200/90 focus:border-blue-500 rounded-xl text-xs sm:text-sm transition-all shadow-2xs"
              style={{ paddingLeft: '2.5rem', paddingTop: '0.65rem', paddingBottom: '0.65rem' }}
              type="text"
              placeholder="Search by student name, roll number, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Status Filter */}
            <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 px-2.5 py-1.5 shadow-2xs shrink-0">
              <Filter size={13} className="text-slate-400 mr-2" />
              <select 
                className="bg-transparent text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Status: All Students ({attendees.filter(a => a.email).length})</option>
                <option value="sent">Status: Mail Sent ({totalSent}) ✓</option>
                <option value="pending">Status: Mail Pending ({totalPending})</option>
                <option value="admitted">Status: Admitted at Gate</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 px-2.5 py-1.5 shadow-2xs shrink-0">
              <SlidersHorizontal size={13} className="text-slate-400 mr-2" />
              <select 
                className="bg-transparent text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="newest">Sort: Latest Dispatched</option>
                <option value="name">Sort: Name (A-Z)</option>
                <option value="roll">Sort: University Roll No</option>
              </select>
            </div>

            {(searchTerm || statusFilter !== 'all' || sortOption !== 'newest') && (
              <button 
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setSortOption('newest'); }}
                className="btn btn-secondary btn-xs text-slate-600 rounded-lg shrink-0 cursor-pointer"
              >
                <X size={12} className="mr-1" /> Reset
              </button>
            )}
          </div>
        </div>

        {/* ── Table ─────────────────────────────────────────────────── */}
        <div className="overflow-x-auto min-h-[350px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 sticky top-0 z-10 backdrop-blur">
                <th className="px-5 py-3.5 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider">
                  Student Name &amp; University Roll
                </th>
                <th className="px-5 py-3.5 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider">
                  Registered Email Address
                </th>
                <th className="px-5 py-3.5 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider text-center">
                  Dispatch Status
                </th>
                <th className="px-5 py-3.5 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider text-center">
                  Sent Timestamp
                </th>
                <th className="px-5 py-3.5 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider text-center">
                  Gate Admission
                </th>
                <th className="px-5 py-3.5 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider text-center">
                  Delivery Proof &amp; Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="inline-flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-50/80 border border-slate-200/80 max-w-md mx-auto text-center">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1E2A78] mb-3 shadow-2xs">
                        <Mail size={24} />
                      </div>
                      <p className="text-slate-900 font-bold text-base">No Matching Mail Records Found</p>
                      <p className="text-slate-500 text-xs mt-1 max-w-xs leading-relaxed">
                        {searchTerm 
                          ? `No student matching "${searchTerm}" was found. Check the spelling or roll number.`
                          : "No passes have been dispatched yet for this event."}
                      </p>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="btn btn-secondary btn-xs mt-3 text-slate-700 rounded-lg cursor-pointer"
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((a) => {
                  const isAdmitted = a.checkpointStatuses?.some(cs => cs.status);
                  const admittedCheckpoint = a.checkpointStatuses?.find(cs => cs.status)?.checkpoint?.name || 'Main Gate';
                  const initials = a.name ? a.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "ST";
                  
                  return (
                    <tr 
                      key={a.id} 
                      className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedProof(a)}
                    >
                      {/* Name & Roll */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-slate-700 text-[0.68rem] shrink-0 group-hover:bg-blue-100 group-hover:text-blue-800 transition-colors shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm leading-tight mb-0.5 group-hover:text-[#1E2A78] transition-colors">
                              {a.name}
                            </p>
                            <span className="font-mono text-[0.68rem] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                              {a.roll}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium truncate max-w-[220px]">
                          <Mail size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate">{a.email}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold uppercase tracking-wider border ${
                          a.emailSent 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${a.emailSent ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                          <span>{a.emailSent ? 'Delivered ✓' : 'Pending'}</span>
                        </span>
                      </td>

                      {/* Sent Time */}
                      <td className="px-5 py-3.5 text-center">
                        {a.emailSentAt ? (
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-slate-800 font-mono">
                              {new Date(a.emailSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[0.65rem] text-slate-400 font-medium">
                              {new Date(a.emailSentAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">—</span>
                        )}
                      </td>

                      {/* Checkpoint / Gate */}
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider border ${
                          isAdmitted 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {isAdmitted ? `✓ ${admittedCheckpoint}` : '○ Pending Entry'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onResendEmail(a.id)}
                            disabled={!a.email || emailLoading === a.id}
                            className="btn btn-xs btn-geu-yellow font-bold rounded-xl cursor-pointer shadow-2xs flex items-center gap-1"
                            title="Resend QR Pass Email"
                          >
                            {emailLoading === a.id ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                            <span>{a.emailSent ? 'Resend' : 'Send Pass'}</span>
                          </button>
                          
                          <button
                            onClick={() => setSelectedProof(a)}
                            className="btn btn-xs btn-secondary rounded-xl text-slate-700 cursor-pointer flex items-center gap-1"
                            title="View Delivery Proof"
                          >
                            <ShieldCheck size={12} className="text-[#1E2A78]" />
                            <span>Proof</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Delivery Proof Modal ─────────────────────────────────────── */}
      {selectedProof && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-pop-in">
            {/* Modal Topbar */}
            <div className="p-5 bg-[#0B0F28] text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight leading-tight">Official Delivery Record Proof</h3>
                  <p className="text-[0.68rem] text-slate-300 font-mono mt-0.5">Verification ID: {selectedProof.token?.slice(0, 18)}...</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProof(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs text-slate-700">
              
              {/* Student Header */}
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E2A78] border border-blue-100 flex items-center justify-center font-bold text-sm shrink-0">
                  <UserCircle size={26} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 leading-tight">{selectedProof.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Roll: {selectedProof.roll}
                    </span>
                    <span className="text-[0.7rem] text-slate-500 font-medium">
                      Event: {activeEvent?.name || "Official Event"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Metadata */}
              <div className="space-y-2.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/70">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="font-semibold text-slate-500">Recipient Email</span>
                  <span className="font-mono font-bold text-slate-900">{selectedProof.email}</span>
                </div>
                
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="font-semibold text-slate-500">Pass Delivery Status</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold uppercase tracking-wider ${
                    selectedProof.emailSent 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-50 text-amber-800 border border-amber-300'
                  }`}>
                    {selectedProof.emailSent ? 'Delivered Successfully ✓' : 'Pending Dispatch'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="font-semibold text-slate-500">Dispatched Timestamp</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedProof.emailSentAt ? new Date(selectedProof.emailSentAt).toLocaleString() : 'Not Yet Dispatched'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="font-semibold text-slate-500">Gate Entry Status</span>
                  <span className="font-bold text-slate-800">
                    {selectedProof.checkpointStatuses?.some(cs => cs.status) ? 'Admitted At Gate ✓' : 'Pending Gate Scan'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">QR Access Token</span>
                  <span className="font-mono text-[0.68rem] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 truncate max-w-[200px]">
                    {selectedProof.token}
                  </span>
                </div>
              </div>

              {/* Security Statement */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/60 text-blue-950 flex items-start gap-2.5 text-[0.72rem] leading-relaxed">
                <CheckCircle2 size={16} className="text-blue-700 shrink-0 mt-0.5" />
                <span>
                  <strong>University Verified Record:</strong> This digital dispatch timestamp serves as official proof of QR entry pass generation and electronic delivery.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => onResendEmail(selectedProof.id)}
                disabled={!selectedProof.email || emailLoading === selectedProof.id}
                className="btn btn-sm btn-geu-yellow font-bold text-xs px-4 py-2 rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
              >
                {emailLoading === selectedProof.id ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                <span>Resend Pass Now</span>
              </button>

              <button
                onClick={() => setSelectedProof(null)}
                className="btn btn-sm btn-secondary text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dataset History Modal (Preserving Existing Dataset Features) ─ */}
      {showDatasetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-pop-in">
            <div className="p-5 bg-[#0B0F28] text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Archive size={18} className="text-[#FFB800]" />
                <h3 className="font-bold text-base tracking-tight leading-tight">Spreadsheet Upload &amp; Dataset Batches</h3>
              </div>
              <button 
                onClick={() => setShowDatasetModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[450px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-2.5 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider">Event Name</th>
                    <th className="px-4 py-2.5 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2.5 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider text-center">Records</th>
                    <th className="px-4 py-2.5 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                    <th className="px-4 py-2.5 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {datasets.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-8 text-slate-400 font-medium">No previous uploads found.</td></tr>
                  ) : datasets.map(ds => (
                    <tr key={ds.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">{ds.eventName}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(ds.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{ds.totalRecords}</td>
                      <td className="px-4 py-3 text-center">
                        {ds.isActive ? <span className="badge badge-green">Active</span> : <span className="badge badge-muted">Archived</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {!ds.isActive && (
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => onRestoreDataset(ds.id)} className="btn btn-xs btn-geu-yellow rounded-lg cursor-pointer">Restore</button>
                            <button onClick={() => onDeleteDataset(ds.id)} className="btn btn-xs btn-secondary text-red-600 rounded-lg cursor-pointer">Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowDatasetModal(false)}
                className="btn btn-sm btn-secondary rounded-xl text-xs px-4 py-2 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
