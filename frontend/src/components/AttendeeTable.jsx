import React, { useState } from 'react';
import { Search, X, Mail, Loader2, RefreshCw, Trash2, ChevronRight, SlidersHorizontal, CheckCircle2, UserCircle, Upload, FileSpreadsheet, Sparkles } from 'lucide-react';

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
  handleClearAttendees, fetchAttendees, handleSendEmail, emailLoading,
  onOpenImport
}) {
  const [selectedAttendee, setSelectedAttendee] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOption, checkpointFilters, emailFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedAttendees = filtered.slice(startIndex, startIndex + pageSize);

  const getCheckpointStatus = (attendee, cpId) => {
    return attendee.checkpointStatuses?.find(cs => cs.checkpointId === cpId);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_12px_rgba(15,23,42,0.03)] overflow-hidden relative">
      
      {/* ── Slide-out Details Drawer ───────────────────────────────── */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white border-l border-slate-200 shadow-2xl transition-transform duration-300 z-50 flex flex-col ${selectedAttendee ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedAttendee && (
          <>
            <div className="p-5 bg-[#2563EB] text-white flex items-center justify-between border-b border-white/10">
              <div>
                <h3 className="font-bold text-base tracking-tight">Student Details</h3>
                <p className="text-xs text-blue-100 font-mono mt-0.5">Roll: {selectedAttendee.roll}</p>
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
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
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
                    <Mail size={15} className="text-[#2563EB]" /> {selectedAttendee.email || 'No registered email address'}
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
                      className="btn btn-sm bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl cursor-pointer shadow-xs text-xs font-semibold"
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
      <div className="px-6 py-4.5 border-b border-slate-100 flex items-center flex-wrap gap-4 justify-between bg-white">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-slate-800">
            Registered Attendees
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {filtered.length} of {stats.total} Attendees
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={handleClearAttendees} 
            className="btn btn-sm bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl cursor-pointer text-xs font-semibold px-3 py-1.5" 
            title="Clear all registered attendees for this event"
          >
            <Trash2 size={13} className="mr-1" /> Clear Roster
          </button>
          <button 
            onClick={fetchAttendees} 
            className="btn btn-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl cursor-pointer text-xs font-semibold px-3 py-1.5"
          >
            <RefreshCw size={13} className="mr-1" /> Refresh
          </button>
        </div>
      </div>

      {/* ── Search & Filters Ribbon ────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-slate-100 flex gap-3.5 flex-wrap bg-slate-50/50 items-center justify-between">
        <div className="relative w-full sm:w-auto flex-grow max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            className="input w-full h-10 bg-white border-slate-200/90 focus:border-blue-500 rounded-xl text-xs sm:text-sm transition-all shadow-2xs"
            style={{ paddingLeft: '2.5rem' }}
            type="text"
            placeholder="Search by student name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2.5 overflow-x-auto">
          <div className="flex items-center bg-white rounded-xl border border-slate-200/90 px-3 py-1.5 h-10 shadow-2xs shrink-0">
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

          <div className="flex items-center bg-white rounded-xl border border-slate-200/90 px-3 py-1.5 h-10 shadow-2xs shrink-0">
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
            <div key={cp.id} className="flex items-center bg-white rounded-xl border border-slate-200/90 px-3 py-1.5 h-10 shadow-2xs shrink-0">
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
              className="btn btn-secondary btn-xs text-slate-600 hover:text-slate-900 rounded-lg shrink-0 cursor-pointer h-10 px-3" 
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
              <th className="px-6 py-3.5 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider">
                Student Name &amp; Roll
              </th>
              <th className="px-6 py-3.5 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider">
                Email Address
              </th>
              <th className="px-6 py-3.5 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider text-center">
                QR Pass
              </th>
              {eventCheckpoints.map(c => (
                <th key={c.id} className="px-6 py-3.5 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider text-center">
                  {c.name}
                </th>
              ))}
              <th className="px-6 py-3.5 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={eventCheckpoints.length + 4} className="py-20 text-center">
                  {stats.total === 0 ? (
                    <div className="inline-flex flex-col items-center justify-center p-10 rounded-2xl bg-slate-50/60 border border-slate-200/80 max-w-md mx-auto text-center animate-fade-in">
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] mb-4 shadow-2xs">
                        <FileSpreadsheet size={28} />
                      </div>
                      <p className="text-slate-900 font-bold text-base">No Attendees in Roster Yet</p>
                      <p className="text-slate-500 text-xs mt-1.5 max-w-xs leading-relaxed">
                        Upload an Excel spreadsheet with student details (Name, University Roll No, Email) to generate QR passes.
                      </p>
                      {onOpenImport && (
                        <button
                          onClick={onOpenImport}
                          className="btn bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs cursor-pointer flex items-center gap-2 mt-5"
                        >
                          <Upload size={14} />
                          <span>Import Excel Roster</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="inline-flex flex-col items-center justify-center p-10 rounded-2xl bg-slate-50/60 border border-slate-200/80 max-w-sm mx-auto text-center animate-fade-in">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-4 shadow-2xs">
                        <Search size={24} />
                      </div>
                      <p className="text-slate-700 font-bold text-sm">No matching student records</p>
                      <p className="text-slate-400 text-xs mt-1">Try changing your search query or reset the filters above.</p>
                      <button 
                        className="btn btn-secondary btn-xs mt-4 text-slate-600 rounded-lg cursor-pointer px-3 py-1.5"
                        onClick={() => { setSearchTerm(""); setSortOption("upload"); setCheckpointFilters({}); setEmailFilter("all"); }}
                      >
                        Reset All Filters
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              paginatedAttendees.map((a) => (
                <tr 
                  key={a.id} 
                  className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  onClick={() => setSelectedAttendee(a)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-slate-700 text-[0.68rem] shrink-0 group-hover:bg-blue-100 group-hover:text-blue-800 transition-colors shadow-2xs">
                        {a.name ? a.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "ST"}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs sm:text-sm leading-tight mb-0.5 group-hover:text-[#2563EB] transition-colors">{a.name}</p>
                        <span className="font-mono text-[0.68rem] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {a.roll}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-600 font-medium truncate max-w-[200px]">
                      {a.email || "-"}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider border ${
                      a.emailSent 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {a.emailSent ? "Dispatched ✓" : "Pending"}
                    </span>
                  </td>
                  {eventCheckpoints.map(cp => {
                    const status = getCheckpointStatus(a, cp.id);
                    return (
                      <td key={cp.id} className="px-6 py-4 text-center">
                        <StatusBadge done={status?.status} time={status?.scannedAt} />
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleSendEmail(a.id)}
                        disabled={!a.email || emailLoading === a.id}
                        className={`btn btn-xs rounded-xl cursor-pointer text-[0.68rem] font-semibold transition-all ${
                          a.emailSent 
                            ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/80' 
                            : 'bg-[#2563EB] hover:bg-blue-700 text-white shadow-2xs'
                        }`}
                      >
                        {emailLoading === a.id ? <Loader2 size={11} className="animate-spin" /> : <Mail size={11} />}
                        <span>{a.emailSent ? "Resend" : "Send Pass"}</span>
                      </button>
                      <button 
                        onClick={() => setSelectedAttendee(a)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-transparent hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                        title="View details"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Table Pagination Bar ──────────────────────────────────── */}
      {filtered.length > pageSize && (
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <span className="font-bold text-slate-800">{startIndex + 1}</span> to{" "}
            <span className="font-bold text-slate-800">{Math.min(startIndex + pageSize, filtered.length)}</span> of{" "}
            <span className="font-bold text-slate-800">{filtered.length}</span> students
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 transition-colors"
            >
              Previous
            </button>
            <div className="px-2 font-mono text-slate-500 font-semibold">
              Page {safeCurrentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
