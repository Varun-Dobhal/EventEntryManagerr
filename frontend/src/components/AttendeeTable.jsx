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
    <div className="card p-0 overflow-hidden relative bg-white border border-slate-300 shadow-sm">
      
      {/* ── Slide-out Details Drawer ───────────────────────────────── */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white border-l border-slate-300 shadow-2xl transition-transform duration-300 z-50 flex flex-col ${selectedAttendee ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedAttendee && (
          <>
            <div className="p-4 bg-[#8B151B] text-white flex items-center justify-between border-b-2 border-[#C59B27]">
              <div>
                <h3 className="font-bold text-base">Student Details</h3>
                <p className="text-[0.7rem] text-red-100 font-mono">Roll: {selectedAttendee.roll}</p>
              </div>
              <button 
                onClick={() => setSelectedAttendee(null)} 
                className="text-white hover:bg-white/20 p-1.5 rounded transition-colors"
                title="Close"
              >
                <X size={18}/>
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 space-y-6 text-slate-800">
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-200">
                <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-[#8B151B] shrink-0">
                  <UserCircle size={28} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">{selectedAttendee.name}</h2>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-300">
                    {selectedAttendee.roll}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Communication &amp; Pass Delivery</h4>
                <div className="bg-slate-50 rounded p-3.5 border border-slate-200">
                  <p className="text-xs font-medium text-slate-700 flex items-center gap-2 mb-3">
                    <Mail size={14} className="text-[#8B151B]" /> {selectedAttendee.email || 'No registered email address'}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <span className={`px-2.5 py-0.5 rounded text-[0.68rem] font-bold uppercase tracking-wider border ${
                      selectedAttendee.emailSent 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {selectedAttendee.emailSent ? 'Pass Dispatched ✓' : 'Pass Pending'}
                    </span>
                    <button
                      onClick={() => handleSendEmail(selectedAttendee.id)}
                      disabled={!selectedAttendee.email || emailLoading === selectedAttendee.id}
                      className="btn btn-primary btn-sm"
                    >
                      {emailLoading === selectedAttendee.id ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                      {selectedAttendee.emailSent ? 'Resend Pass' : 'Send Pass'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gate Checkpoint Timeline</h4>
                <div className="space-y-2">
                  {eventCheckpoints.map((cp, idx) => {
                    const status = getCheckpointStatus(selectedAttendee, cp.id);
                    return (
                      <div key={cp.id} className="flex items-center gap-3 p-3 rounded bg-slate-50 border border-slate-200">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs border ${
                          status?.status 
                            ? 'bg-emerald-600 text-white border-emerald-700' 
                            : 'bg-white text-slate-500 border-slate-300'
                        }`}>
                          {status?.status ? '✓' : idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{cp.name}</p>
                          <p className="text-[0.68rem] text-slate-500">
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
      <div className="p-4 border-b border-slate-200 flex items-center flex-wrap gap-3 justify-between bg-[#FAF5F5]">
        <div>
          <h2 className="text-base font-bold text-[#8B151B] font-serif uppercase tracking-tight m-0">
            Student &amp; Attendee Roster
          </h2>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            Displaying <strong>{filtered.length}</strong> of <strong>{stats.total}</strong> registered attendees
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleClearAttendees} 
            className="btn btn-sm btn-secondary text-red-700 border-red-300 hover:bg-red-50" 
            title="Clear all registered attendees for this event"
          >
            <Trash2 size={13} className="mr-1" /> Clear Roster
          </button>
          <button 
            onClick={fetchAttendees} 
            className="btn btn-sm btn-secondary"
          >
            <RefreshCw size={13} className="mr-1" /> Refresh
          </button>
        </div>
      </div>

      {/* ── Search & Filters Ribbon ────────────────────────────────── */}
      <div className="p-3 border-b border-slate-200 flex gap-2.5 flex-wrap bg-white items-center">
        <div className="relative flex-grow min-w-[220px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input w-full pl-9 py-1.5 text-xs bg-white border-slate-300 focus:border-[#8B151B]"
            type="text"
            placeholder="Search by student name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center bg-slate-50 rounded border border-slate-300 px-2 py-1 shrink-0">
            <SlidersHorizontal size={13} className="text-slate-500 mr-1.5" />
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

          <div className="flex items-center bg-slate-50 rounded border border-slate-300 px-2 py-1 shrink-0">
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
            <div key={cp.id} className="flex items-center bg-slate-50 rounded border border-slate-300 px-2 py-1 shrink-0">
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
              className="btn btn-secondary btn-xs text-slate-600 hover:text-slate-900 shrink-0" 
              onClick={() => { setSearchTerm(""); setSortOption("upload"); setCheckpointFilters({}); setEmailFilter("all"); }}
              title="Reset all filters"
            >
              <X size={13} className="mr-1" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Table Container (~2019 Classic University Table) ───────── */}
      <div className="overflow-x-auto min-h-[350px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300">
              <th className="px-4 py-2.5 text-[0.7rem] font-bold text-slate-700 uppercase tracking-wider">
                Student Name &amp; Roll
              </th>
              <th className="px-4 py-2.5 text-[0.7rem] font-bold text-slate-700 uppercase tracking-wider">
                Email Address
              </th>
              <th className="px-4 py-2.5 text-[0.7rem] font-bold text-slate-700 uppercase tracking-wider text-center">
                QR Pass
              </th>
              {eventCheckpoints.map(c => (
                <th key={c.id} className="px-4 py-2.5 text-[0.7rem] font-bold text-slate-700 uppercase tracking-wider text-center">
                  {c.name}
                </th>
              ))}
              <th className="px-4 py-2.5 text-[0.7rem] font-bold text-slate-700 uppercase tracking-wider text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={eventCheckpoints.length + 4} className="py-16 text-center">
                  <div className="inline-flex flex-col items-center justify-center p-6 rounded bg-slate-50 border border-slate-200">
                    <Search size={24} className="text-slate-400 mb-2" />
                    <p className="text-slate-600 font-semibold text-xs">No student records match the active search or filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr 
                  key={a.id} 
                  className="hover:bg-[#FFF9F9] transition-colors cursor-pointer"
                  onClick={() => setSelectedAttendee(a)}
                >
                  <td className="px-4 py-2.5">
                    <p className="font-bold text-slate-900 text-xs leading-tight mb-0.5">{a.name}</p>
                    <span className="font-mono text-[0.68rem] font-bold text-[#8B151B] bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                      {a.roll}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-xs text-slate-600 font-medium truncate max-w-[180px]">
                      {a.email || "-"}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider border ${
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
                      <td key={cp.id} className="px-4 py-2.5 text-center">
                        <StatusBadge done={status?.status} time={status?.scannedAt} />
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleSendEmail(a.id)}
                        disabled={!a.email || emailLoading === a.id}
                        className={`btn btn-xs ${
                          a.emailSent 
                            ? 'btn-secondary text-slate-700' 
                            : 'btn-primary'
                        }`}
                      >
                        {emailLoading === a.id ? <Loader2 size={11} className="animate-spin" /> : <Mail size={11} />}
                        <span>{a.emailSent ? "Resend" : "Send Pass"}</span>
                      </button>
                      <button 
                        onClick={() => setSelectedAttendee(a)}
                        className="btn-icon w-6 h-6 rounded bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-900 border-none"
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
