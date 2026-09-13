import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ScanLine, ArrowRight } from 'lucide-react';
import logoImg from '../assets/logo.png';
import { GlobalFooter } from '../components/ui/GlobalFooter';
import { AmbientBackground } from '../components/ui/AmbientBackground';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-slate-800 flex flex-col justify-between font-sans relative selection:bg-[#FFB800] selection:text-black">
      
      {/* ── Floating Animated Aurora Background ───────────────────────── */}
      <AmbientBackground />

      {/* ── Center Content / Portal Options (Header Removed) ──────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:py-16 relative z-10">
        <div className="max-w-5xl w-full mx-auto">
          
          {/* University Branding & Title Section */}
          <div className="text-center" style={{ marginBottom: '4.5rem' }}>
            
            {/* Official University Logo directly above Event Entry Manager */}
            <div className="flex justify-center" style={{ marginBottom: '2.25rem' }}>
              <div 
                className="inline-flex items-center justify-center gap-3.5 cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <img 
                  src={logoImg} 
                  alt="Graphic Era Emblem" 
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0" 
                />
                <div className="flex flex-col justify-center text-left">
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-[#A31D24] tracking-tight leading-none">
                    Graphic Era
                  </span>
                  <span className="font-serif text-xs sm:text-sm text-slate-900 leading-tight">
                    deemed to be <strong className="font-serif">University</strong>
                  </span>
                  <span className="text-[0.62rem] sm:text-[0.7rem] font-bold tracking-[0.25em] text-[#A31D24] uppercase leading-none mt-0.5">
                    DEHRADUN
                  </span>
                </div>
              </div>
            </div>

            <h1 
              className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight"
              style={{ marginTop: '0.5rem' }}
            >
              Event Entry Manager
            </h1>
          </div>

          {/* ── 2 Main Action Cards with Generous Spacing ────────────────── */}
          <div 
            className="grid grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto"
            style={{ gap: '4rem' }}
          >
            
            {/* 1. Admin Portal */}
            <div 
              onClick={() => navigate('/login?portal=admin')}
              className="bg-white/95 backdrop-blur-xl rounded-[28px] border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.1)] transition-all duration-300 p-8 sm:p-10 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1E2A78] border border-blue-100 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-xs">
                  <ShieldCheck size={28} />
                </div>
                
                <h2 className="text-2xl font-bold text-slate-900 group-hover:text-[#1E2A78] transition-colors">
                  Admin Portal
                </h2>
                
                <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                  Manage events, upload attendee roster CSVs, dispatch email passes with QR codes, and monitor live check-in stats.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/login?portal=admin'); }} 
                  className="btn btn-geu-yellow w-full py-3 text-sm font-black flex items-center justify-center gap-2 rounded-xl shadow-xs cursor-pointer"
                >
                  <span>Go to Admin Portal</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* 2. Volunteer Scanner */}
            <div 
              onClick={() => navigate('/login?portal=volunteer')}
              className="bg-white/95 backdrop-blur-xl rounded-[28px] border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.1)] transition-all duration-300 p-8 sm:p-10 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-[#B45309] border border-amber-200 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-xs">
                  <ScanLine size={28} />
                </div>
                
                <h2 className="text-2xl font-bold text-slate-900 group-hover:text-[#B45309] transition-colors">
                  Volunteer Scanner
                </h2>
                
                <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                  Fast camera QR scanner for volunteers stationed at campus entry gates, auditoriums, and food counters.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/login?portal=volunteer'); }} 
                  className="btn btn-geu-yellow w-full py-3 text-sm font-black flex items-center justify-center gap-2 rounded-xl shadow-xs cursor-pointer"
                >
                  <span>Open Scanner Terminal</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* ── Clean Global Footer ────────────────────────────────────────── */}
      <div className="relative z-10 bg-white/70 backdrop-blur-md">
        <GlobalFooter />
      </div>

    </div>
  );
}
