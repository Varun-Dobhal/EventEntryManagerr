import React, { useState } from 'react';
import { Search, X, Mail, Loader2, RefreshCw, Trash2, ChevronRight, SlidersHorizontal, CheckCircle2, UserCircle } from 'lucide-react';

function StatusBadge({ done, doneLabel = "Done", pendingLabel = "Pending", time }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider rounded border ${
        done 
          ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
          : 'bg-slate-100 text-slate-600 border-slate-200'
      }`}>
        {done ? `✓ ${doneLabel}` : `○ ${pendingLabel}`}
      </span>
      {time && (
        <span className="text-[0.62rem] text-slate-500 font-mono font-medium">
          {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}

export default function AttendeeTable({
  filtered, stats, eventCheckpoints,
  searchTerm, setSearchTerm, sortOption, setSortOption,
  checkpointFilters, setCheckpointFilters, emailFilter, setEmailFilter,
  handleClearAttendees, fetchAttendees, handleSendEmail, emailLoading
}) {
  const [selectedAttendee, setSelectedAttendee] = useState(null);

  const getCheckpointStatus = (attendee, cpId) => {
    return attendee.checkpointStatuses?.find(cs => cs.checkpointId === cpId);
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] overflow-hidden relative">
      
      {/* ── Slide-out Details Drawer ───────────────────────────────── */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white border-l border-slate-200 shadow-2xl transition-transform duration-300 z-50 flex flex-col ${selectedAttendee ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedAttendee && (
          <>
            <div className="p-5 bg-[#0D1038] text-white flex items-center justify-between border-b border-white/10">
              <div>
                <h3 className="font-bold text-base tracking-tight">Student Details</h3>
                <p className="text-xs text-blue-200 font-mono mt-0.5">Roll: {selectedAttendee.roll}</p>
              </div>
              <button 
                onClick={() => setSelectedAttendee(null)} 
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18}/>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800">
              <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1E2A78] shrink-0">
                  <UserCircle size={28} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">{selectedAttendee.name}</h2>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200">
                    {selectedAttendee.roll}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Pass Delivery Status</h4>
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
                  <p className="text-xs font-medium text-slate-700 flex items-center gap-2 mb-3.5">
                    <Mail size={15} className="text-[#1E2A78]" /> {selectedAttendee.email || 'No registered email address'}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
                    <span className={`px-2.5 py-1 rounded-full text-[0.68rem] font-bold uppercase tracking-wider border ${
                      selectedAttendee.emailSent 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {selectedAttendee.emailSent ? 'Pass Dispatched ✓' : 'Pass Pending'}
                    </span>
                    <button
                      onClick={() => handleSendEmail(selectedAttendee.id)}
                      disabled={!selectedAttendee.email || emailLoading === selectedAttendee.id}
                      className="btn btn-sm btn-geu-yellow rounded-xl cursor-pointer"
                    >
                      {emailLoading === selectedAttendee.id ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                      <span>{selectedAttendee.emailSent ? 'Resend Pass' : 'Send Pass'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Gate Checkpoint Timeline</h4>
                <div className="space-y-2">
                  {eventCheckpoints.map((cp, idx) => {
                    const status = getCheckpointStatus(selectedAttendee, cp.id);
                    return (
                      <div key={cp.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs border ${
                          status?.status 
                            ? 'bg-emerald-600 text-white border-emerald-700' 
                            : 'bg-white text-slate-500 border-slate-300'
                        }`}>
                          {status?.status ? '✓' : idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{cp.name}</p>
                          <p className="text-[0.68rem] text-slate-500 mt-0.5">
                            {status?.status 
                              ? `Verified at ${new Date(status.scannedAt).toLocaleTimeString()}` 
                              : 'Pending Checkpoint Scan'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Table Toolbar ──────────────────────────────────────────── */}
      <div className="p-5 border-b border-slate-100 flex items-center flex-wrap gap-4 justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E2A78] border border-blue-100 flex items-center justify-center font-bold shrink-0">
            <UserCircle size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-black text-slate-900 tracking-tight m-0">
                Attendee &amp; Pass Roster
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                {filtered.length} of {stats.total} Attendees
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              Manage student attendees, QR access passes, and multi-checkpoint admission statuses
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleClearAttendees} 
            className="btn btn-sm btn-secondary text-red-600 border-red-200 hover:bg-red-50 rounded-xl cursor-pointer" 
            title="Clear all registered attendees for this event"
          >
            <Trash2 size={13} className="mr-1" /> Clear Roster
          </button>
          <button 
            onClick={fetchAttendees} 
            className="btn btn-sm btn-secondary rounded-xl cursor-pointer"
          >
            <RefreshCw size={13} className="mr-1" /> Refresh
          </button>
        </div>
      </div>

      {/* ── Search & Filters Ribbon ────────────────────────────────── */}
      <div className="p-3.5 border-b border-slate-100 flex gap-3 flex-wrap bg-slate-50/60 items-center">
        <div className="relative flex-grow min-w-[240px] max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            className="input w-full bg-white border-slate-200/90 focus:border-blue-500 rounded-xl text-xs sm:text-sm transition-all shadow-2xs"
            style={{ paddingLeft: '2.5rem', paddingTop: '0.6rem', paddingBottom: '0.6rem' }}
            type="text"
            placeholder="Search by student name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center bg-white rounded-xl border border-slate-200/90 px-2.5 py-1.5 shadow-2xs shrink-0">
            <SlidersHorizontal size={13} className="text-slate-400 mr-2" />
            <select 
              className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer" 
              value={sortOption} 
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="upload">Sort: Default</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="roll">Sort: University Roll No</option>
            </select>
          </div>

          <div className="flex items-center bg-white rounded-xl border border-slate-200/90 px-2.5 py-1.5 shadow-2xs shrink-0">
            <select 
              className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer" 
              value={emailFilter} 
              onChange={(e) => setEmailFilter(e.target.value)}
            >
              <option value="all">Email: All Records</option>
              <option value="sent">Email: Dispatched ✓</option>
              <option value="pending">Email: Pending</option>
            </select>
          </div>

          {eventCheckpoints.map(cp => (
            <div key={cp.id} className="flex items-center bg-white rounded-xl border border-slate-200/90 px-2.5 py-1.5 shadow-2xs shrink-0">
              <select
                className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer max-w-[130px] truncate"
                value={checkpointFilters[cp.id] || "all"}
                onChange={(e) => setCheckpointFilters(prev => ({...prev, [cp.id]: e.target.value}))}
              >
                <option value="all">{cp.name}: All</option>
                <option value="done">{cp.name}: Admitted ✓</option>
                <option value="pending">{cp.name}: Pending</option>
              </select>
            </div>
          ))}
          
          {(searchTerm || sortOption !== "upload" || emailFilter !== "all" || Object.values(checkpointFilters).some(v => v !== "all")) && (
            <button 
              className="btn btn-secondary btn-xs text-slate-600 hover:text-slate-900 rounded-lg shrink-0 cursor-pointer" 
              onClick={() => { setSearchTerm(""); setSortOption("upload"); setCheckpointFilters({}); setEmailFilter("all"); }}
              title="Reset all filters"
            >
              <X size={13} className="mr-1" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Table Container ────────────────────────────────────────── */}
      <div className="overflow-x-auto min-h-[350px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80">
              <th className="px-5 py-3 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider">
                Student Name &amp; Roll
              </th>
              <th className="px-5 py-3 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider">
                Email Address
              </th>
              <th className="px-5 py-3 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider text-center">
                QR Pass
              </th>
              {eventCheckpoints.map(c => (
                <th key={c.id} className="px-5 py-3 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider text-center">
                  {c.name}
                </th>
              ))}
              <th className="px-5 py-3 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={eventCheckpoints.length + 4} className="py-20 text-center">
                  <div className="inline-flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-50/80 border border-slate-200/80 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
                      <Search size={22} />
                    </div>
                    <p className="text-slate-700 font-bold text-sm">No student records found</p>
                    <p className="text-slate-400 text-xs mt-1">Try changing your search query or reset the filters above.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr 
                  key={a.id} 
                  className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedAttendee(a)}
                >
                  <td className="px-5 py-3">
                    <p className="font-bold text-slate-900 text-xs sm:text-sm leading-tight mb-0.5">{a.name}</p>
                    <span className="font-mono text-[0.68rem] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {a.roll}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-xs text-slate-600 font-medium truncate max-w-[200px]">
                      {a.email || "-"}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider border ${
                      a.emailSent 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {a.emailSent ? "Dispatched" : "Pending"}
                    </span>
                  </td>
                  {eventCheckpoints.map(cp => {
                    const status = getCheckpointStatus(a, cp.id);
                    return (
                      <td key={cp.id} className="px-5 py-3 text-center">
                        <StatusBadge done={status?.status} time={status?.scannedAt} />
                      </td>
                    );
                  })}
                  <td className="px-5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleSendEmail(a.id)}
                        disabled={!a.email || emailLoading === a.id}
                        className={`btn btn-xs rounded-lg cursor-pointer ${
                          a.emailSent 
                            ? 'btn-secondary text-slate-700' 
                            : 'btn-geu-yellow'
                        }`}
                      >
                        {emailLoading === a.id ? <Loader2 size={11} className="animate-spin" /> : <Mail size={11} />}
                        <span>{a.emailSent ? "Resend" : "Send Pass"}</span>
                      </button>
                      <button 
                        onClick={() => setSelectedAttendee(a)}
                        className="btn-icon w-6 h-6 rounded-lg bg-transparent hover:bg-slate-100 text-slate-400 hover:text-slate-800 border-none cursor-pointer"
                        title="View details"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
