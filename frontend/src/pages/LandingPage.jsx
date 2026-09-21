import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ScanLine, ArrowRight, Check, LogIn } from 'lucide-react';
import logoImg from '../assets/logo.png';
import { GlobalFooter } from '../components/ui/GlobalFooter';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 flex flex-col justify-between font-sans">
      
      {/* ── Top University Header (Screenshot 3 Style) ──────────────── */}
      <header className="w-full bg-white border-b border-[#E5E7EB] sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <img 
              src={logoImg} 
              alt="Graphic Era Emblem" 
              className="w-9 h-9 object-contain shrink-0" 
            />
            <div className="flex flex-col justify-center text-left">
              <span className="font-serif text-base font-bold text-slate-900 tracking-tight leading-none">
                Graphic Era
              </span>
              <span className="text-[0.6rem] text-slate-500 leading-tight mt-0.5">
                deemed to be <strong className="text-slate-800 font-medium">University</strong>
              </span>
              <span className="text-[0.52rem] font-bold tracking-[0.2em] text-[#A31D24] uppercase leading-none mt-0.5">
                DEHRADUN
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block mx-2" />
            <span className="text-sm font-semibold text-slate-800 hidden sm:inline">
              Event Entry &amp; Pass Management
            </span>
          </div>

          <div>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-[#E5EAF2] text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <LogIn size={13} />
              <span>Unified Login</span>
            </button>
          </div>

        </div>
      </header>

      {/* ── Main Role Selection Canvas (Screenshot Section 12 Specification) ── */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 sm:py-12 max-w-[1200px] mx-auto w-full">
        
        {/* Contextual Title Area */}
        <div className="w-full max-w-3xl mb-8 sm:mb-10 text-center sm:text-left">
          <span className="text-[0.72rem] font-bold tracking-wider uppercase text-[#2563EB] mb-1.5 inline-block">
            CAMPUS EVENT OPERATIONS
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Portal Workspace Selection
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Please select your active workspace to manage student entry rosters, verify digital QR passes, or track live gate check-in telemetry.
          </p>
        </div>

        {/* 2 Clean Enterprise Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 w-full max-w-3xl">
          
          {/* Card 1: Admin Workspace */}
          <div 
            onClick={() => navigate('/login')}
            className="bg-white rounded-xl border border-[#E5EAF2] p-6 sm:p-7 flex flex-col justify-between shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-100 flex items-center justify-center shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/80">
                  FACULTY / INCHARGE
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors mb-1.5">
                Event Administrator
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed mb-5">
                Central console for uploading attendee rosters, configuring multi-checkpoint gates, and automated pass dispatch.
              </p>

              <div className="space-y-2.5 pt-4 border-t border-slate-100 mb-6 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-[#2563EB] shrink-0 mt-0.5" />
                  <span>Excel / CSV attendee roster import &amp; field auto-mapping</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-[#2563EB] shrink-0 mt-0.5" />
                  <span>Real-time multi-checkpoint gate admission telemetry</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-[#2563EB] shrink-0 mt-0.5" />
                  <span>Direct email pass campaign delivery &amp; audit records</span>
                </div>
              </div>
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); navigate('/login'); }} 
              className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <span>Enter Admin Workspace</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Card 2: Volunteer Scanner Terminal */}
          <div 
            onClick={() => navigate('/login')}
            className="bg-white rounded-xl border border-[#E5EAF2] p-6 sm:p-7 flex flex-col justify-between shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
                  <ScanLine size={22} />
                </div>
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/80">
                  GATE &amp; VENUE STAFF
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors mb-1.5">
                Volunteer Scanner Terminal
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed mb-5">
                Camera-based QR pass scanner for volunteers on gate duty to verify and admit student passes with sub-second latency.
              </p>

              <div className="space-y-2.5 pt-4 border-t border-slate-100 mb-6 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-[#2563EB] shrink-0 mt-0.5" />
                  <span>Hardware-accelerated camera barcode scanning</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-[#2563EB] shrink-0 mt-0.5" />
                  <span>Multi-checkpoint check-in (Main Gate, Audi, Food Desk)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-[#2563EB] shrink-0 mt-0.5" />
                  <span>Roll number lookup &amp; emergency OTP backup</span>
                </div>
              </div>
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); navigate('/login'); }} 
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-[#E5EAF2] font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
            >
              <span>Enter Scanner Workspace</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </div>

      </main>

      {/* ── Global Footer ────────────────────────────────────────────── */}
      <GlobalFooter />

    </div>
  );
}
