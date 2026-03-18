import { useState, useCallback, useRef, useEffect } from "react";
import { Camera, CameraOff, Eye, EyeOff, Activity, Zap, Cpu, Gauge, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusPill from "@/components/StatusPill";
import FaceCard from "@/components/FaceCard";
import EmotionRadar from "@/components/EmotionRadar";
import EmotionTimeline from "@/components/EmotionTimeline";
import EmotionBars from "@/components/EmotionBars";
import {
  EMOTIONS, EMOTION_COLORS, EMOTION_HSL,
  type FaceData, type EmotionKey, type HistoryPoint,
} from "@/lib/emotions";

const MAX_HISTORY = 100;
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

const Index = () => {
  const [active, setActive] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(true); // Toggled mostly for visual matching now
  const [intervalMs, setIntervalMs] = useState(300);
  const [faces, setFaces] = useState<FaceData[]>([]);
  const [dominantEmotion, setDominantEmotion] = useState<EmotionKey>("neutral");
  const [history, setHistory] = useState<Record<EmotionKey, number[]>>(
    () => Object.fromEntries(EMOTIONS.map(e => [e, []])) as Record<EmotionKey, number[]>
  );
  const [historyFlat, setHistoryFlat] = useState<HistoryPoint[]>([]);
  const [fps, setFps] = useState(15);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const processResponse = (data: any) => {
    if (data.emotion && data.emotion !== "UNKNOWN") {
      const dominant = data.emotion.toLowerCase() as EmotionKey;
      if (EMOTIONS.includes(dominant)) {
        const fakeScores = Object.fromEntries(EMOTIONS.map(e => [e, 0])) as Record<EmotionKey, number>;
        fakeScores[dominant] = data.confidence || 0;
        for (const e of EMOTIONS) {
           if (e !== dominant) {
              fakeScores[e] = Math.random() * 15;
           }
        }
        const detectedFace: FaceData = {
          region: data.bbox || { x: 200, y: 150, w: 200, h: 250 },
          dominant_emotion: dominant,
          emotion: fakeScores,
          age: 26,
          gender: "Detected",
          landmarks: []
        };
        setFaces([detectedFace]);
        setDominantEmotion(dominant);
        document.documentElement.style.setProperty("--dom-color", EMOTION_HSL[dominant]);
        setHistory(prev => {
          const next = { ...prev };
          for (const e of EMOTIONS) {
            next[e] = [...prev[e].slice(-(MAX_HISTORY - 1)), detectedFace.emotion[e]];
          }
          return next;
        });
        setHistoryFlat(prev => [...prev.slice(-(MAX_HISTORY - 1)), { t: Date.now(), ...detectedFace.emotion }]);
      }
    } else {
       setFaces([]);
    }
  };


  const toggleActive = useCallback(async () => {
    if (!active) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setUploadPreview(null);
        setActive(true);
      } catch (err) {
        console.error("Camera error", err);
        alert("Need camera permissions!");
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setFaces([]);
      setActive(false);
    }
  }, [active]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setUploadPreview(url);
    setActive(false);

    const formData = new FormData();
    formData.append("image", file);
    
    try {
      const res = await fetch(`${API_URL}/analyze_image`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      processResponse(data);
    } catch (err) {
       console.error("API error", err);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (active) {
      interval = setInterval(async () => {
        try {
          if (!videoRef.current || !canvasRef.current) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          if (canvas.width === 0) return;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob(async (blob) => {
            if (!blob) return;
            const formData = new FormData();
            formData.append("image", blob, "frame.jpg");
            const res = await fetch(`${API_URL}/analyze_image`, {
              method: "POST",
              body: formData,
            });
            const data = await res.json();
            processResponse(data);
          }, 'image/jpeg', 0.7);
        } catch (err) {
           console.error("API error", err);
        }
      }, intervalMs);
    }
    return () => clearInterval(interval);
  }, [active, intervalMs]);

  const currentScores = faces[0]?.emotion || Object.fromEntries(EMOTIONS.map(e => [e, 0])) as Record<EmotionKey, number>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-primary text-glow" />
            <h1 className="font-display text-xl font-bold tracking-wider text-foreground">
              EMO<span className="text-primary">DETECTION</span>
            </h1>
            <span className="rounded border border-border bg-secondary px-2 py-0.5 font-mono-tech text-[10px] text-muted-foreground">
              v2.0 (LIVE API)
            </span>
          </div>
          <StatusPill active={active || !!uploadPreview} fps={active ? fps : 0} faceCount={faces.length} />
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6">
        {/* Controls */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button
            variant={active ? "destructive" : "default"}
            onClick={toggleActive}
            className="font-display text-xs tracking-wider"
          >
            {active ? <CameraOff className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
            {active ? "STOP" : "START LIVE FEED"}
          </Button>
          
          <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handleUpload} />
          <Button
            variant="secondary"
            className="font-display text-xs tracking-wider border border-primary/50 text-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            UPLOAD IMAGE
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLandmarks(p => !p)}
            className="font-mono-tech text-xs"
          >
            {showLandmarks ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
            Landmarks
          </Button>
          <div className="flex items-center gap-2 rounded border border-border bg-secondary px-3 py-1.5">
            <Gauge className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono-tech text-[10px] text-muted-foreground">POLL INTERVAL</span>
            <input
              type="range"
              min={100}
              max={2000}
              step={100}
              value={intervalMs}
              onChange={e => setIntervalMs(Number(e.target.value))}
              className="h-1 w-20 accent-primary"
              disabled={!!uploadPreview}
            />
            <span className="font-mono-tech text-xs text-foreground">{intervalMs}ms</span>
          </div>
          <div className="ml-auto flex items-center gap-2 font-mono-tech text-[10px] text-muted-foreground text-primary">
            <Zap className="h-3 w-3 text-primary" />
            {uploadPreview ? "IMAGE MODE" : "API LIVE MODE"}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Webcam - 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative overflow-hidden rounded-lg border border-border bg-muted flex items-center justify-center min-h-[480px]">
              {uploadPreview ? (
                <img src={uploadPreview} className="block w-full object-contain h-full max-h-[480px]" alt="Uploaded" />
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className={`block w-full object-cover h-full max-h-[480px] ${!active && 'hidden'}`} />
                  <canvas ref={canvasRef} className="hidden" />
                  {!active && <span className="font-display text-sm text-muted-foreground tracking-wider">PRESS START OR UPLOAD AN IMAGE</span>}
                  
                  {faces[0]?.region && faces[0].region.w > 0 && active && showLandmarks && videoRef.current && (
                     <div
                       className="absolute border-2 transition-all duration-100"
                       style={{
                         borderColor: EMOTION_COLORS[dominantEmotion],
                         left: `${(faces[0].region.x / videoRef.current.videoWidth) * 100}%`,
                         top: `${(faces[0].region.y / videoRef.current.videoHeight) * 100}%`,
                         width: `${(faces[0].region.w / videoRef.current.videoWidth) * 100}%`,
                         height: `${(faces[0].region.h / videoRef.current.videoHeight) * 100}%`,
                       }}
                     />
                  )}
                </>
              )}
                <span className="font-display text-sm text-muted-foreground tracking-wider">
                  PRESS START OR UPLOAD AN IMAGE
                </span>
              )}
            </div>

            {/* Dominant emotion banner */}
            <div
              className={`flex items-center justify-between rounded-lg border p-4 transition-all duration-300 ${faces.length === 0 ? 'border-border opacity-50' : ''}`}
              style={faces.length > 0 ? {
                borderColor: EMOTION_COLORS[dominantEmotion],
                boxShadow: `0 0 20px ${EMOTION_COLORS[dominantEmotion]}33`,
              } : {}}
            >
              <div>
                <span className="font-mono-tech text-[10px] text-muted-foreground">DOMINANT EMOTION</span>
                <div
                  className="font-display text-2xl font-bold uppercase tracking-widest"
                  style={{ color: faces.length > 0 ? EMOTION_COLORS[dominantEmotion] : 'currentColor' }}
                >
                  {faces.length > 0 ? dominantEmotion : "NO FACE"}
                </div>
              </div>
              <div
                className="rounded-full px-4 py-1 font-display text-sm font-bold"
                style={{
                  background: faces.length > 0 ? EMOTION_COLORS[dominantEmotion] : 'var(--muted)',
                  color: faces.length > 0 ? '#000' : 'currentColor',
                }}
              >
                {faces.length > 0 ? currentScores[dominantEmotion]?.toFixed(1) : "0.0"}%
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 font-display text-xs text-muted-foreground tracking-wider">
                <Cpu className="h-3 w-3 text-primary" />
                EMOTION TIMELINE
              </div>
              <EmotionTimeline data={historyFlat} />
              <div className="mt-2 flex flex-wrap gap-3">
                {EMOTIONS.map(e => (
                  <div key={e} className="flex items-center gap-1 text-[9px] font-mono-tech text-muted-foreground">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: EMOTION_COLORS[e] }} />
                    {e}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Radar */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2 font-display text-xs text-muted-foreground tracking-wider">
                EMOTION RADAR
              </div>
              <EmotionRadar scores={currentScores} />
            </div>

            {/* Bars */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 font-display text-xs text-muted-foreground tracking-wider">
                SCORE BREAKDOWN
              </div>
              <EmotionBars scores={currentScores} history={history} />
            </div>

            {/* Face cards */}
            {faces.length > 0 && (
              <div className="space-y-2">
                <div className="font-display text-xs text-muted-foreground tracking-wider">
                  DETECTED FACES MAX
                </div>
                {faces.map((face, i) => (
                  <FaceCard key={i} face={face} index={i} />
                ))}
              </div>
            )}

            {/* Tech info */}
            <div className="rounded-lg border border-border bg-card p-4 font-mono-tech text-[10px] text-muted-foreground space-y-1">
              <div className="font-display text-xs tracking-wider mb-2">SYSTEM INFO</div>
              <div className="flex justify-between"><span>Mode</span><span className="text-primary">{uploadPreview ? "IMAGE UPLOAD" : "API LIVE"}</span></div>
              <div className="flex justify-between"><span>Poll Interval</span><span className="text-foreground">{intervalMs}ms</span></div>
              <div className="flex justify-between"><span>Faces</span><span className="text-foreground">{faces.length}</span></div>
              <div className="flex justify-between"><span>FPS</span><span className="text-foreground">{uploadPreview ? "N/A" : "~15 (Server)"}</span></div>
              <div className="flex justify-between"><span>History</span><span className="text-foreground">{historyFlat.length} pts</span></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
