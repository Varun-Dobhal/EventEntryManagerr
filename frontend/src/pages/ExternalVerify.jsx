import React from 'react';
import { ShieldAlert, QrCode, Award, ArrowLeft } from 'lucide-react';
import logoImg from '../assets/logo.png';
import { GlobalFooter } from '../components/ui/GlobalFooter';

export default function ExternalVerify() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      
      {/* ── Top Utility Bar ────────────────────────────────────────── */}
      <div className="geu-utility-bar">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-300 flex items-center gap-1">
              <Award size={13} /> NAAC A+ ACCREDITED
            </span>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="text-slate-300">Graphic Era (Deemed to be University)</span>
          </div>
          <span className="text-slate-300 text-[0.7rem]">Security Advisory</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="card max-w-md w-full bg-white border border-slate-300 shadow-md overflow-hidden animate-slide-up">
          {/* Top Maroon Accent */}
          <div className="h-1.5 bg-[#8B151B]" />

          <div className="p-6 sm:p-8 text-center">
            <img 
              src={logoImg} 
              alt="Graphic Era University Crest" 
              className="w-16 h-16 object-contain mx-auto mb-4" 
            />

            <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert size={28} />
            </div>

            <h1 className="text-xl font-bold text-slate-900 mb-2">
              Official Scanner Required
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-5">
              This event QR pass must be scanned exclusively by authorized volunteers using the official <span className="font-bold text-[#8B151B]">Graphic Era University Entry Terminal</span>.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded p-4 text-left mb-6 text-xs text-slate-600 space-y-2">
              <p className="font-bold text-slate-800 uppercase tracking-wider text-[0.68rem]">
                Notice for Students &amp; Guests
              </p>
              <p className="leading-relaxed">
                To preserve ticket integrity and prevent counterfeit entry, personal phone cameras cannot validate this code directly.
              </p>
              <p className="leading-relaxed font-semibold text-slate-700">
                Please display this QR pass on your screen at the designated campus entrance for volunteer scanning.
              </p>
            </div>

            <div className="text-[0.75rem] text-slate-500 font-medium">
              Need assistance? Approach any Gate Volunteer or the Helpdesk.
            </div>
          </div>
        </div>
      </div>

      <GlobalFooter />
    </div>
  );
}
