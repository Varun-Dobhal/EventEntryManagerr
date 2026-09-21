import React from 'react';

export const GlobalFooter = () => (
  <footer className="w-full bg-white border-t border-slate-200/80 py-5 text-slate-600 font-sans z-10">
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">

      {/* Left branding */}
      <div className="flex items-center gap-2 text-slate-500 text-center sm:text-left">
        <span className="font-bold text-slate-800">Graphic Era (Deemed to be University)</span>
        <span>•</span>
        <span>Event Entry &amp; QR Pass Manager</span>
      </div>

      {/* Right Credits - Pushed to the far end */}
      <div className="text-slate-500 text-center sm:text-right">
        <span>Designed &amp; Developed by </span>
        <strong className="text-[#1E2A78] font-bold">Department of Computer Science and Engineering</strong>
      </div>

    </div>
  </footer>
);
