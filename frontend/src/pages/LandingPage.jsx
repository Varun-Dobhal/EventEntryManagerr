import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ScanLine, ArrowRight, Sparkles } from 'lucide-react';
import logoImg from '../assets/logo.png';
import { GlobalFooter } from '../components/ui/GlobalFooter';
import { AmbientBackground } from '../components/ui/AmbientBackground';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] text-slate-800 flex flex-col justify-between font-sans relative selection:bg-[#FFB800] selection:text-black">
      
      {/* Floating Animated Aurora Background */}
      <AmbientBackground />

      {/* Main Hero & Navigation Options */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12 relative z-10">
        <div className="max-w-4xl w-full mx-auto">
          
          {/* University Branding & Title Section */}
          <div className="text-center mb-8 sm:mb-12">
            
            {/* Official University Crest */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div 
                className="inline-flex items-center justify-center gap-3 cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <img 
                  src={logoImg} 
                  alt="Graphic Era Emblem" 
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain shrink-0" 
                />
                <div className="flex flex-col justify-center text-left">
                  <span className="font-serif text-xl sm:text-3xl font-bold text-[#A31D24] tracking-tight leading-none">
                    Graphic Era
                  </span>
                  <span className="font-serif text-xs sm:text-sm text-slate-900 leading-tight mt-0.5">
                    deemed to be <strong className="font-serif">University</strong>
                  </span>
                  <span className="text-[0.6rem] sm:text-[0.7rem] font-bold tracking-[0.25em] text-[#A31D24] uppercase leading-none mt-1">
                    DEHRADUN
                  </span>
                </div>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2 sm:mb-3">
              Event Entry Manager
            </h1>
            
            <p className="text-xs sm:text-base text-slate-600 font-medium max-w-xl mx-auto px-2">
              High-speed barcode verification, automated pass dispatch &amp; real-time attendance tracking for campus events.
            </p>

            {/* Quick Central Login Button */}
            <div className="mt-5 sm:mt-6 flex justify-center">
              <button 
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-[#FFB800] to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
              >
                <Sparkles size={16} />
                <span>Sign In to Unified Workspace</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* 2 Main Role Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto">
            
            {/* 1. Admin Portal Card */}
            <div 
              onClick={() => navigate('/login')}
              className="bg-white/95 backdrop-blur-xl rounded-[24px] sm:rounded-[28px] border border-white/80 shadow-[0_15px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-[#1E2A78] border border-blue-100 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-105 transition-transform shadow-xs">
                  <ShieldCheck size={26} />
                </div>
                
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-[#1E2A78] transition-colors">
                  Admin Portal
                </h2>
                
                <p className="text-slate-500 text-xs sm:text-sm mt-2 sm:mt-3 leading-relaxed">
                  Manage events, upload attendee roster CSVs, dispatch email passes with QR codes, and monitor live check-in stats.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/login'); }} 
                  className="btn btn-geu-yellow w-full py-2.5 sm:py-3 text-xs sm:text-sm font-black flex items-center justify-center gap-2 rounded-xl shadow-xs cursor-pointer"
                >
                  <span>Go to Admin Portal</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* 2. Volunteer Scanner Card */}
            <div 
              onClick={() => navigate('/login')}
              className="bg-white/95 backdrop-blur-xl rounded-[24px] sm:rounded-[28px] border border-white/80 shadow-[0_15px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-50 text-[#B45309] border border-amber-200 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-105 transition-transform shadow-xs">
                  <ScanLine size={26} />
                </div>
                
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-[#B45309] transition-colors">
                  Volunteer Scanner
                </h2>
                
                <p className="text-slate-500 text-xs sm:text-sm mt-2 sm:mt-3 leading-relaxed">
                  Fast camera QR scanner for volunteers stationed at campus entry gates, auditoriums, and food counters.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/login'); }} 
                  className="btn btn-geu-yellow w-full py-2.5 sm:py-3 text-xs sm:text-sm font-black flex items-center justify-center gap-2 rounded-xl shadow-xs cursor-pointer"
                >
                  <span>Open Scanner Terminal</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Global Footer */}
      <div className="relative z-10 bg-white/70 backdrop-blur-md">
        <GlobalFooter />
      </div>

    </div>
  );
}
