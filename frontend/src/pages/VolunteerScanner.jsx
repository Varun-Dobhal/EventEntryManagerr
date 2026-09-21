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
  CameraOff,
  CheckCircle2,
  MapPin,
  ArrowRight,
  Copy,
  UploadCloud
} from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { GlobalFooter } from '../components/ui/GlobalFooter';
import { AmbientBackground } from '../components/ui/AmbientBackground';
import logoImg from '../assets/logo.png';

export default function VolunteerScanner({ role, onLogout }) {
  const [permState, setPermState]   = useState('asking');
  const [permReason, setPermReason] = useState('');
  const [showHttpGuide, setShowHttpGuide] = useState(false);
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
    setPermReason('');

    // Check for MediaDevices & getUserMedia support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const isInsecure = window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      if (isInsecure) {
        setPermState('insecure');
        setPermReason('Browsers restrict live camera video feeds over non-secure HTTP connections.');
        return;
      }
      setPermState('denied');
      setPermReason('Camera API is not supported on this browser or device.');
      return;
    }

    try {
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });
      } catch (err1) {
        // Fallback to any available webcam (e.g. laptop front camera)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Video play caught:', e));
      }
      setPermState('granted');
    } catch (err) {
      console.error('Camera initialization failed:', err);
      setPermState('denied');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermReason('Camera permission was blocked. Please allow camera in browser address bar settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermReason('No camera hardware found on this device.');
      } else {
        setPermReason(err.message || 'Unable to access camera.');
      }
    }
  };

  const handleImageFileScan = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const code = jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: "dontInvert",
        });

        setLoading(false);
        if (code?.data) {
          isScanRef.current = true;
          handleVerifyQR(code.data);
        } else {
          toast({
            type: "error",
            message: "No valid QR pass detected in image. Please try again or use Roll OTP.",
          });
        }
      };
      img.onerror = () => {
        setLoading(false);
        toast({ type: "error", message: "Failed to load image file." });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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
    e.preventDefault(); 
    if (!roll.trim()) {
      toast({ type: 'warning', message: 'Please enter student roll number.' });
      return;
    }
    setLoading(true); setScanResult(null); setErrorMsg(null);
    try { 
      const { data } = await api.post('/otp/send', { 
        roll: roll.trim(), 
        type: role === 'FOOD_VOLUNTEER' ? 'food' : 'entry' 
      }); 
      setOtpSent(true); 
      toast({ type: 'success', message: data.message || 'Verification OTP dispatched to student email.' }); 
    }
    catch (err) { 
      const m = err.response?.data?.error || err.message || 'Failed to send OTP.'; 
      setErrorMsg(m); 
      toast({ type: 'error', message: m }); 
    }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!selectedCheckpoint) {
      toast({ type: 'warning', message: 'Please select a checkpoint first!' });
      return;
    }
    if (!otp.trim()) {
      toast({ type: 'warning', message: 'Please enter 6-digit OTP.' });
      return;
    }
    setLoading(true); setScanResult(null); setErrorMsg(null);
    try {
      const { data } = await api.post('/otp/verify', { 
        roll: roll.trim(), 
        otp: otp.trim(), 
        checkpointId: selectedCheckpoint.id,
        type: role === 'FOOD_VOLUNTEER' ? 'food' : 'entry' 
      });

      // If not already marked admitted by verifyOtp, fallback to scan
      if (data.token && !data.admitted) {
        await api.post('/attendees/scan', { 
          token: data.token, 
          checkpointId: selectedCheckpoint.id,
          type: role === 'FOOD_VOLUNTEER' ? 'food' : 'entry'
        });
      }
      
      setScanResult({ name: data.name, roll: roll.trim() }); 
      setScanCount(c => c + 1); 
      triggerHaptic('success');
      playTone(880, 1320, 0.2);
      setFlash('success');
      setRoll(''); 
      setOtp(''); 
      setOtpSent(false);
      setUseOtp(false);
      setShowResult(true);
      toast({ type: 'success', message: data.message || `Admitted: ${data.name}` });
    } catch (err) { 
      const m = err.response?.data?.error || err.message || 'OTP verification failed.'; 
      setErrorMsg(m); 
      triggerHaptic('error');
      setFlash('error');
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

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="text-right text-[0.65rem] sm:text-[0.7rem] text-slate-300 flex items-center gap-1">
              <span className="hidden sm:inline">Admitted:</span>
              <strong className="text-white text-xs bg-white/15 px-1.5 py-0.5 rounded font-mono font-black" title="Admitted count">
                {scanCount}
              </strong>
            </div>

            <button 
              onClick={() => { setUseOtp(v => !v); readyForNext(); }} 
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                useOtp 
                  ? 'bg-[#FFB800] text-slate-950 font-black shadow-xs' 
                  : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
              }`}
            >
              {useOtp ? <><ScanLine size={13}/> <span className="hidden xs:inline">Scan QR</span><span className="xs:hidden">QR</span></> : <><Lock size={13}/> <span className="hidden xs:inline">Roll OTP</span><span className="xs:hidden">OTP</span></>}
            </button>

            {onLogout && (
              <button 
                onClick={onLogout} 
                className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-white/10 border border-white/20 text-white hover:bg-red-600 transition-all flex items-center justify-center cursor-pointer"
                title="Sign Out"
              >
                <LogOut size={13}/>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Scanner Viewport ─────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden bg-slate-950 flex flex-col items-center justify-center">
        {!useOtp && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Hidden file input for Photo Snap & QR scanning */}
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              id="qr-snap-input" 
              className="hidden" 
              onChange={handleImageFileScan} 
            />

            {/* Video element is always rendered so videoRef is attached */}
            <video 
              ref={videoRef} 
              onLoadedData={onVideoReady} 
              className={`w-full h-full object-cover ${permState === 'granted' ? 'block' : 'hidden'}`} 
              playsInline 
              muted 
              autoPlay
            />
            <canvas ref={canvasRef} className="hidden"/>

            {/* 1. Viewfinder Overlay when Camera is Active */}
            {permState === 'granted' && !showResult && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                <div className="w-64 h-64 border-2 border-white/30 rounded-2xl relative flex items-center justify-center shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]">
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

                {/* Quick snap fallback button at bottom */}
                <div className="absolute bottom-6 pointer-events-auto flex items-center gap-3">
                  <label 
                    htmlFor="qr-snap-input" 
                    className="flex items-center gap-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-all shadow-md"
                  >
                    <Camera size={14} className="text-[#FFB800]" /> Snap Photo
                  </label>
                  <button 
                    onClick={() => setUseOtp(true)} 
                    className="flex items-center gap-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-all shadow-md"
                  >
                    <Lock size={13} className="text-[#FFB800]" /> Roll OTP
                  </button>
                </div>
              </div>
            )}

            {/* 2. Insecure Context Warning (Over plain HTTP on remote IP) */}
            {permState === 'insecure' && !showResult && (
              <div className="relative z-10 w-full max-w-md p-6 mx-4 text-center bg-slate-900/95 border border-amber-500/40 rounded-3xl backdrop-blur-xl shadow-2xl text-white animate-fade-in">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3.5 shadow-xs">
                  <CameraOff size={28} />
                </div>

                <h3 className="text-lg font-bold text-white mb-1.5">
                  Live Camera Blocked by Browser (HTTP)
                </h3>
                <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                  Browsers require a secure connection (HTTPS) for continuous live video feeds. 
                  You can scan passes instantly using the phone camera button below or use Roll OTP!
                </p>

                <div className="space-y-2.5">
                  <label 
                    htmlFor="qr-snap-input" 
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#FFB800] to-amber-500 text-slate-950 font-black text-sm cursor-pointer shadow-lg hover:brightness-105 active:scale-98 transition-all"
                  >
                    <Camera size={18} />
                    <span>Take Photo &amp; Scan Pass</span>
                  </label>

                  <button 
                    type="button" 
                    onClick={() => setUseOtp(true)} 
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs cursor-pointer transition-all"
                  >
                    <Lock size={14} className="text-amber-400" />
                    <span>Use Manual Roll Number &amp; OTP</span>
                  </button>
                </div>

                {/* Chrome HTTP Permission Guide */}
                <div className="mt-5 pt-4 border-t border-slate-800 text-left">
                  <button 
                    type="button" 
                    onClick={() => setShowHttpGuide(v => !v)}
                    className="w-full flex items-center justify-between text-[11px] font-bold text-amber-400 hover:text-amber-300"
                  >
                    <span>How to enable continuous Live Camera on Chrome?</span>
                    <span>{showHttpGuide ? "▲" : "▼"}</span>
                  </button>
                  
                  {showHttpGuide && (
                    <div className="mt-2.5 p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-2">
                      <p>1. In Chrome, open: <code className="text-amber-300 font-mono bg-slate-800 px-1 py-0.5 rounded">chrome://flags/#unsafely-treat-insecure-origin-as-secure</code></p>
                      <p>2. Enable the flag and paste: <code className="text-emerald-400 font-mono bg-slate-800 px-1 py-0.5 rounded">http://3.109.178.209</code></p>
                      <p>3. Tap <strong>Relaunch Chrome</strong>. Live camera scanning will be active!</p>
                      <button 
                        type="button" 
                        onClick={() => {
                          navigator.clipboard.writeText("http://3.109.178.209");
                          toast({ type: 'success', message: 'Copied http://3.109.178.209 to clipboard!' });
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:underline pt-1"
                      >
                        <Copy size={11} /> Copy Server URL
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Camera Permission Denied / Error */}
            {permState === 'denied' && !showResult && (
              <div className="relative z-10 w-full max-w-md p-6 mx-4 text-center bg-slate-900/95 border border-red-500/40 rounded-3xl backdrop-blur-xl shadow-2xl text-white animate-fade-in">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-3.5 shadow-xs">
                  <CameraOff size={28} />
                </div>

                <h3 className="text-lg font-bold text-white mb-1.5">
                  Camera Access Not Available
                </h3>
                <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                  {permReason || "Camera permission is blocked or no camera was found on this device."}
                </p>

                <div className="space-y-2.5">
                  <button 
                    type="button" 
                    onClick={initCamera} 
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#FFB800] to-amber-500 text-slate-950 font-black text-sm cursor-pointer shadow-lg hover:brightness-105 transition-all"
                  >
                    <RefreshCw size={16} />
                    <span>Try Again / Grant Permission</span>
                  </button>

                  <label 
                    htmlFor="qr-snap-input" 
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs cursor-pointer transition-all"
                  >
                    <Camera size={14} className="text-amber-400" />
                    <span>Take Photo &amp; Scan Pass</span>
                  </label>

                  <button 
                    type="button" 
                    onClick={() => setUseOtp(true)} 
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs cursor-pointer transition-all"
                  >
                    <Lock size={14} className="text-amber-400" />
                    <span>Use Manual Roll Number &amp; OTP</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4. Requesting Permission */}
            {permState === 'asking' && !showResult && (
              <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center text-white">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-3 animate-pulse text-[#FFB800]">
                  <Camera size={28} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Starting Camera...</h3>
                <p className="text-xs text-slate-400">Please tap "Allow" if prompted for camera permission.</p>
              </div>
            )}

            {/* 5. Loading overlay */}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/85 backdrop-blur-sm z-20 text-white">
                <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-[#FFB800] animate-spin mb-3" />
                <p className="font-bold text-sm text-[#FFB800] uppercase tracking-wider">Verifying with Server...</p>
              </div>
            )}
          </div>
        )}

        {/* ── Manual OTP Fallback Panel ────────────────────────────────── */}
        {useOtp && (
          <div 
            className="absolute inset-0 z-30 bg-slate-50/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <AmbientBackground />
            
            <div className="w-full max-w-md bg-white/98 backdrop-blur-2xl rounded-[28px] sm:rounded-[32px] border border-white/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.09)] p-5 sm:p-8 md:p-10 relative z-10 animate-slide-up my-auto max-h-[92vh] overflow-y-auto">
              
              {/* Header with Icon, Title & Checkpoint */}
              <div className="flex flex-col items-center justify-center text-center pb-4 mb-4 sm:pb-6 sm:mb-6 border-b border-slate-100 w-full">
                <div 
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 text-[#1E2A78] border border-blue-100/90 flex items-center justify-center mb-2.5 sm:mb-3.5 shadow-xs"
                  style={{ margin: '0 auto' }}
                >
                  <KeyRound size={24} />
                </div>
                
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                  Manual Roll &amp; OTP
                </h2>
                
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 sm:mt-1">
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
        {showResult && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
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
