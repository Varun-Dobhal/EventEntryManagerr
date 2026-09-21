import React from 'react';

export const GlobalFooter = () => (
  <footer className="w-full py-6 text-slate-500 font-sans z-10">
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">

      {/* Left branding */}
      <div className="flex items-center gap-2 text-slate-500 text-center sm:text-left flex-wrap justify-center sm:justify-start">
        <span className="font-semibold text-slate-700">Graphic Era (Deemed to be University), Dehradun</span>
        <span>•</span>
        <span className="px-2 py-0.5 rounded text-[0.68rem] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">NAAC Grade 'A+'</span>
        <span>•</span>
        <span className="text-slate-400">Event Entry &amp; Pass Management System</span>
      </div>

      {/* Right Credits */}
      <div className="text-slate-400 text-center sm:text-right text-[0.72rem]">
        <span>Developed &amp; Managed by </span>
        <strong className="text-slate-700 font-semibold">Department of Computer Science &amp; Engineering</strong>
      </div>

    </div>
  </footer>
);
