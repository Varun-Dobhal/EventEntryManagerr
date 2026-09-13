import { useEffect, useState, useRef } from 'react';
import jsQR from 'jsqr';
import { 
  BadgeCheck, 
  XCircle, 
  Lock, 
  LogOut, 
  ScanLine, 
  AlertTriangle, 
  RefreshCw, 
  ChevronDown, 
  Award,
  KeyRound,
  Hash,
  Send,
  Camera,
  CheckCircle2,
  MapPin,
  ArrowRight
} from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { GlobalFooter } from '../components/ui/GlobalFooter';
import { AmbientBackground } from '../components/ui/AmbientBackground';
import logoImg from '../assets/logo.png';

export default function VolunteerScanner({ role, onLogout }) {
  const [permState, setPermState]   = useState('asking');
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg]     = useState(null);
  const [loading, setLoading]       = useState(false);
  const [useOtp, setUseOtp]         = useState(false);
  const [roll, setRoll]             = useState('');
  const [otpSent, setOtpSent]       = useState(false);
  const [otp, setOtp]               = useState('');
  const [scanCount, setScanCount]   = useState(0);
  const [showResult, setShowResult] = useState(false);
  
  const [activeEvent, setActiveEvent] = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [showCpSelect, setShowCpSelect] = useState(false);

  // Haptic flash state
  const [flash, setFlash] = useState(null); // 'success' | 'error' | null

  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const rafRef     = useRef(null);
  const isScanRef  = useRef(false);
  const loadingRef = useRef(false);
  const timerRef   = useRef(null);

  const { toast } = useToast();

  useEffect(() => { loadingRef.current = loading; }, [loading]);

  useEffect(() => {
    fetchActiveEvent();
  }, []);

  const fetchActiveEvent = async () => {
    try {
      const { data } = await api.get('/events/active');
      setActiveEvent(data);
      if (data.checkpoints && data.checkpoints.length > 0) {
        setCheckpoints(data.checkpoints);
        const activeCp = data.checkpoints.find(c => c.isActive);
        if (activeCp) setSelectedCheckpoint(activeCp);
      }
    } catch (err) {
      console.error("Failed to fetch active event", err);
      toast({ type: 'error', message: 'No active event found. Checkpoints disabled.' });
    }
  };

  useEffect(() => {
    if (useOtp) { stopCamera(); return; }
    initCamera();
    return () => stopCamera();
  }, [useOtp]);

  const initCamera = async () => {
    setPermState('asking');
    try {
      const constraints = { video: { facingMode: 'environment' }, audio: false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
      setPermState('granted');
    } catch { setPermState('denied'); }
  };

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(timerRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    isScanRef.current = false;
  };

  const onVideoReady = () => { cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(scanFrame); };

  const scanFrame = () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c || v.readyState < v.HAVE_ENOUGH_DATA) { rafRef.current = requestAnimationFrame(scanFrame); return; }
    const scale = Math.min(1, 600 / (v.videoWidth || 640));
    c.width = (v.videoWidth || 640) * scale; 
    c.height = (v.videoHeight || 480) * scale;
    
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const imgData = ctx.getImageData(0, 0, c.width, c.height);
    
    const code = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'dontInvert' });
    if (code?.data && !isScanRef.current && !loadingRef.current) { 
      isScanRef.current = true; 
      handleVerifyQR(code.data); 
      return; 
    }
    rafRef.current = requestAnimationFrame(scanFrame);
  };

  const triggerHaptic = (type) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (type === 'success') navigator.vibrate([100]); // Short pop
      else navigator.vibrate([200, 100, 200]); // Buzz buzz
    }
    setFlash(type);
    setTimeout(() => setFlash(null), 800);
  };

  const readyForNext = () => {
    clearTimeout(timerRef.current);
    setScanResult(null); setErrorMsg(null); setShowResult(false); setFlash(null);
    setTimeout(() => { 
      isScanRef.current = false; 
      if (!useOtp) rafRef.current = requestAnimationFrame(scanFrame);
    }, 400);
  };

  const handleVerifyQR = async (rawToken) => {
    if (!selectedCheckpoint) {
      toast({ type: 'warning', message: 'Please select a checkpoint first!' });
      readyForNext();
      return;
    }

    let token = rawToken;
    try {
      if (rawToken.includes('verify/')) token = rawToken.split('verify/').pop();
      else if (rawToken.includes('token=')) token = new URL(rawToken).searchParams.get('token');
    } catch {}
    
    setLoading(true); setScanResult(null); setErrorMsg(null);
    try {
      const { data } = await api.post('/attendees/scan', { 
        token, 
        checkpointId: selectedCheckpoint.id,
        type: role === 'FOOD_VOLUNTEER' ? 'food' : 'entry'
      });
      
      setScanResult(data.attendee); setScanCount(c => c + 1); 
      triggerHaptic('success');
      playTone(880, 1320, 0.2);
      setShowResult(true);
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid ticket or already admitted.';
      setErrorMsg(msg); 
      triggerHaptic('error');
      playTone(440, 220, 0.3);
      setShowResult(true);
    } finally {
      setLoading(false);
      timerRef.current = setTimeout(readyForNext, 3500);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault(); setLoading(true); setScanResult(null); setErrorMsg(null);
    try { 
      await api.post('/otp/send', { roll: roll.trim(), type: role === 'FOOD_VOLUNTEER' ? 'food' : 'entry' }); 
      setOtpSent(true); 
      toast({ type: 'info', message: 'Verification OTP sent to registered student email.' }); 
    }
    catch (err) { const m = err.response?.data?.error || 'Failed to send OTP.'; setErrorMsg(m); toast({ type: 'error', message: m }); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!selectedCheckpoint) {
      toast({ type: 'warning', message: 'Please select a checkpoint first!' });
      return;
    }
    setLoading(true); setScanResult(null); setErrorMsg(null);
    try {
      const { data } = await api.post('/otp/verify', { roll: roll.trim(), otp: otp.trim(), type: role === 'FOOD_VOLUNTEER' ? 'food' : 'entry' });
      await api.post('/attendees/scan', { 
        token: data.token, 
        checkpointId: selectedCheckpoint.id,
        type: role === 'FOOD_VOLUNTEER' ? 'food' : 'entry'
      });
      
      setScanResult({ name: data.name, roll: roll.trim() }); setScanCount(c => c + 1); 
      triggerHaptic('success');
      playTone(880, 1320, 0.2);
      setRoll(''); setOtp(''); setOtpSent(false);
      setShowResult(true);
    } catch (err) { 
      const m = err.response?.data?.error || 'OTP verification failed.'; 
      setErrorMsg(m); 
      triggerHaptic('error');
      toast({ type: 'error', message: m }); 
    }
    finally { setLoading(false); }
  };

  const playTone = (f1, f2, dur) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(f1, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(f2, ctx.currentTime + 0.1);
      g.gain.setValueAtTime(0.6, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
      osc.connect(g); g.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + dur);
    } catch {}
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-[#F8FAFC] text-slate-800 overflow-hidden relative font-sans">

      {/* Screen Flashes for Haptic/Visual Feedback */}
      {flash === 'success' && <div className="absolute inset-0 bg-emerald-500/25 z-40 animate-fade-out pointer-events-none" />}
      {flash === 'error' && <div className="absolute inset-0 bg-red-600/30 z-40 animate-fade-out pointer-events-none" />}

      {/* ── Top University Header ────────────────────────────────────── */}
      <div className="shrink-0 bg-[#0D1038] text-white px-3 sm:px-4 py-2.5 border-b-2 border-[#FFB800] z-30 shadow-md">
        <div className="flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2.5">
            <img src={logoImg} alt="GEU Crest" className="w-8 h-8 object-contain bg-white rounded-full p-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs uppercase tracking-tight font-serif text-[#FFB800]">
                  Graphic Era University
                </span>
                <span className="text-[0.62rem] px-1.5 py-0.5 rounded-full bg-[#1E2A78] text-blue-100 border border-blue-400/50 font-bold uppercase">
                  {role === 'FOOD_VOLUNTEER' ? 'Food Desk' : 'Gate Entry'}
                </span>
              </div>
              
              {/* Checkpoint selector button */}
              <div className="relative mt-0.5">
                <button 
                  onClick={() => setShowCpSelect(!showCpSelect)}
                  className="flex items-center gap-1 text-xs font-bold text-white/90 hover:text-[#FFB800] transition-colors focus:outline-none"
                >
                  <span>Checkpoint: <u>{selectedCheckpoint ? selectedCheckpoint.name : 'Select Gate'}</u></span>
                  <ChevronDown size={12} className="opacity-80"/>
                </button>

                {showCpSelect && (
                  <div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-300 rounded shadow-xl p-1.5 min-w-[200px] z-50 animate-pop-in text-slate-800">
                    <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1">
                      Available Checkpoints
                    </p>
                    {checkpoints.length === 0 ? (
                      <p className="text-slate-500 text-xs p-2 text-center">No active checkpoints</p>
                    ) : (
                      checkpoints.filter(c => c.isActive).map(cp => (
                        <button 
                          key={cp.id}
                          onClick={() => { setSelectedCheckpoint(cp); setShowCpSelect(false); }}
                          className={`w-full text-left px-3 py-1.5 rounded text-xs font-bold transition-all ${
                            selectedCheckpoint?.id === cp.id 
                              ? 'bg-blue-50 text-[#1E2A78] font-black' 
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {cp.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block text-[0.7rem] text-slate-300">
              <span>Admitted: <strong className="text-white text-xs">{scanCount}</strong></span>
            </div>

            <button 
              onClick={() => { setUseOtp(v => !v); readyForNext(); }} 
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                useOtp 
                  ? 'bg-[#FFB800] text-slate-950 font-black shadow-xs' 
                  : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
              }`}
            >
              {useOtp ? <><ScanLine size={13}/> Scan QR</> : <><Lock size={13}/> Roll OTP</>}
            </button>

            {onLogout && (
              <button 
                onClick={onLogout} 
                className="w-8 h-8 rounded bg-white/10 border border-white/20 text-white hover:bg-red-600 transition-all flex items-center justify-center"
                title="Sign Out"
              >
                <LogOut size={14}/>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Scanner Viewport ─────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden bg-slate-900">
        {!useOtp && (
          <div className="absolute inset-0">
            <video ref={videoRef} onLoadedData={onVideoReady} className="w-full h-full object-cover" playsInline muted autoPlay/>
            <canvas ref={canvasRef} className="hidden"/>
            
            {/* Viewfinder Overlay with Graphic Era Gold Reticle */}
            {permState === 'granted' && !showResult && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                <div className="w-64 h-64 border-2 border-white/30 rounded-2xl relative flex items-center justify-center shadow-[0_0_0_9999px_rgba(15,23,42,0.6)]">
                  {/* Animated Gold Scan Line */}
                  <div className="scan-line" style={{ background: '#FFB800', boxShadow: '0 0 10px rgba(255, 184, 0, 0.9)' }} />
                  {/* Corner marks */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#FFB800] rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#FFB800] rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#FFB800] rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#FFB800] rounded-br-xl" />
                </div>
                <div className="mt-6 bg-[#0D1038] border border-[#FFB800]/50 text-white px-5 py-1.5 rounded-full shadow-lg text-xs font-bold tracking-wide uppercase">
                  Align Student QR Pass
                </div>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm z-20 text-white">
                <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-[#FFB800] animate-spin mb-3" />
                <p className="font-bold text-sm text-[#FFB800] uppercase tracking-wider">Verifying with Server...</p>
              </div>
            )}
          </div>
        )}

        {/* ── Manual OTP Fallback Panel ────────────────────────────────── */}
        {useOtp && (
          <div 
            className="absolute inset-0 z-30 bg-slate-50/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <AmbientBackground />
            
            <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-[32px] border border-white/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.09)] p-8 sm:p-10 relative z-10 animate-slide-up my-auto">
              
              {/* Header with Icon, Title & Checkpoint */}
              <div className="flex flex-col items-center justify-center text-center pb-6 mb-6 border-b border-slate-100 w-full">
                <div 
                  className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1E2A78] border border-blue-100/90 flex items-center justify-center mb-3.5 shadow-xs"
                  style={{ margin: '0 auto' }}
                >
                  <KeyRound size={28} />
                </div>
                
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Manual Roll &amp; OTP
                </h2>
                
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Verify &amp; admit student without camera QR pass
                </p>

                {/* Gate / Checkpoint indicator badge */}
                <div className="mt-3.5 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100/90 text-xs text-slate-700 font-semibold border border-slate-200/80">
                  <MapPin size={13} className="text-[#1E2A78]" />
                  <span>Checkpoint:</span>
                  {selectedCheckpoint ? (
                    <span className="font-bold text-slate-900">{selectedCheckpoint.name}</span>
                  ) : (
                    <span className="text-amber-800 font-bold bg-amber-100/80 px-2 py-0.5 rounded-md">
                      None Selected
                    </span>
                  )}
                </div>
              </div>

              {/* Checkpoint Quick-Picker if none selected */}
              {!selectedCheckpoint && checkpoints.length > 0 && (
                <div className="mb-5 p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-xs text-amber-900">
                  <p className="font-bold mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                    <span>Select gate checkpoint to enable verification:</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {checkpoints.filter(c => c.isActive).map(cp => (
                      <button
                        key={cp.id}
                        type="button"
                        onClick={() => setSelectedCheckpoint(cp)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 font-bold text-amber-900 hover:bg-amber-100/80 transition-colors shadow-2xs cursor-pointer"
                      >
                        {cp.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-50/95 text-red-900 rounded-2xl p-4 text-xs font-semibold flex items-start gap-2.5 mb-5 border border-red-200/80 shadow-xs animate-shake">
                  <AlertTriangle size={16} className="shrink-0 text-red-600 mt-0.5"/>
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
              )}

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2" htmlFor="otp-roll">
                      University Roll Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Hash size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
                      <input 
                        id="otp-roll" 
                        className="w-full bg-slate-50/80 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-sm sm:text-base font-semibold transition-all" 
                        style={{ paddingLeft: '3rem', paddingTop: '0.85rem', paddingBottom: '0.85rem' }}
                        type="text" 
                        placeholder="e.g. GEU/22/01482" 
                        value={roll} 
                        onChange={e => setRoll(e.target.value.toUpperCase())} 
                        required 
                        disabled={loading} 
                        autoCapitalize="characters" 
                      />
                    </div>
                    <p className="text-[0.72rem] text-slate-400 mt-1.5 pl-1">
                      A single-use 6-digit OTP will be dispatched to the student's registered university email.
                    </p>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-geu-yellow w-full py-3.5 text-sm font-black rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
                    disabled={loading || !selectedCheckpoint}
                  >
                    {loading ? (
                      <span>Sending OTP...</span>
                    ) : (
                      <>
                        <span>Send Verification OTP</span>
                        <Send size={15} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setUseOtp(false); readyForNext(); }}
                    className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Camera size={14} />
                    <span>Back to Camera Scanner</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="bg-blue-50/70 rounded-2xl p-4 text-xs text-slate-700 text-center border border-blue-100">
                    <p className="text-slate-500 mb-1">OTP sent for roll number:</p>
                    <span className="text-base font-black text-[#1E2A78] font-mono tracking-wide">{roll}</span>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 text-center" htmlFor="otp-code">
                      Enter 6-Digit Verification Code
                    </label>
                    <input 
                      id="otp-code" 
                      className="w-full bg-white border-2 border-slate-300 focus:border-[#1E2A78] rounded-2xl px-4 py-3.5 text-slate-900 text-2xl sm:text-3xl tracking-[0.4em] text-center font-black focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-slate-300" 
                      type="text" 
                      inputMode="numeric" 
                      pattern="[0-9]*" 
                      autoComplete="one-time-code" 
                      placeholder="------" 
                      value={otp} 
                      onChange={e => setOtp(e.target.value)} 
                      maxLength={6} 
                      required 
                      disabled={loading} 
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-3.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50" 
                    disabled={loading}
                  >
                    {loading ? (
                      <span>Verifying with Server...</span>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Verify &amp; Admit Student</span>
                      </>
                    )}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => { setOtpSent(false); setOtp(''); }} 
                    className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    &larr; Re-enter Roll Number
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ── Result Modal Card ─── */}
        {showResult && !useOtp && (
          <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-white/98 backdrop-blur-2xl rounded-[32px] border border-white/80 shadow-[0_25px_70px_rgba(0,0,0,0.25)] p-7 sm:p-8 text-center animate-pop-in relative overflow-hidden">
              
              {scanResult ? (
                <>
                  <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-500" />
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4 shadow-xs">
                    <BadgeCheck size={36} />
                  </div>
                  <span className="badge badge-green font-bold text-xs uppercase px-3 py-1 rounded-full mb-3 inline-block">
                    Verified &amp; Admitted ✓
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-1 mb-1">{scanResult.name}</h2>
                  <p className="text-sm font-bold text-slate-600 font-mono mb-4">
                    Roll: <span className="text-[#A31D24] bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">{scanResult.roll}</span>
                  </p>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 mb-5">
                    Checkpoint: <strong className="text-slate-900">{selectedCheckpoint?.name}</strong> • Entry Recorded
                  </div>
                  <button 
                    onClick={readyForNext} 
                    className="btn btn-geu-yellow w-full py-3.5 text-sm font-black rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Scan Next Student</span>
                    <ArrowRight size={16} />
                  </button>
                </>
              ) : (
                <>
                  <div className="absolute top-0 left-0 right-0 h-2 bg-rose-500" />
                  <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-4 shadow-xs">
                    <XCircle size={36} />
                  </div>
                  <span className="badge badge-red font-bold text-xs uppercase px-3 py-1 rounded-full mb-3 inline-block">
                    Entry Denied / Warning
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-1 mb-2">{errorMsg}</h2>
                  <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                    Please verify student identity or direct them to the university helpdesk.
                  </p>
                  <button 
                    onClick={readyForNext} 
                    className="w-full py-3.5 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={15} />
                    <span>Dismiss &amp; Try Again</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="hidden sm:block">
        <GlobalFooter />
      </div>
    </div>
  );
}
