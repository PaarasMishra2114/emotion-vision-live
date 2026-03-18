import { useState, useCallback, useRef } from "react";
import { Camera, CameraOff, Eye, EyeOff, Activity, Zap, Cpu, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import WebcamCanvas, { type WebcamCanvasHandle } from "@/components/WebcamCanvas";
import StatusPill from "@/components/StatusPill";
import FaceCard from "@/components/FaceCard";
import EmotionRadar from "@/components/EmotionRadar";
import EmotionTimeline from "@/components/EmotionTimeline";
import EmotionBars from "@/components/EmotionBars";
import {
  EMOTIONS, EMOTION_COLORS, EMOTION_HSL,
  generateMockFace,
  type FaceData, type EmotionKey, type HistoryPoint,
} from "@/lib/emotions";

const MAX_HISTORY = 100;

const Index = () => {
  const [active, setActive] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [intervalMs, setIntervalMs] = useState(300);
  const [faces, setFaces] = useState<FaceData[]>([]);
  const [dominantEmotion, setDominantEmotion] = useState<EmotionKey>("neutral");
  const [history, setHistory] = useState<Record<EmotionKey, number[]>>(
    () => Object.fromEntries(EMOTIONS.map(e => [e, []])) as Record<EmotionKey, number[]>
  );
  const [historyFlat, setHistoryFlat] = useState<HistoryPoint[]>([]);
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const fpsIntervalRef = useRef<ReturnType<typeof setInterval>>();

  // Start FPS counter when activated
  const toggleActive = useCallback(() => {
    setActive(prev => {
      if (!prev) {
        frameCountRef.current = 0;
        fpsIntervalRef.current = setInterval(() => {
          setFps(frameCountRef.current);
          frameCountRef.current = 0;
        }, 1000);
      } else {
        clearInterval(fpsIntervalRef.current);
        setFps(0);
      }
      return !prev;
    });
  }, []);

  const handleFrame = useCallback((video: HTMLVideoElement) => {
    frameCountRef.current++;
    // Mock mode: generate 1-2 faces
    const numFaces = Math.random() > 0.85 ? 2 : 1;
    const mockFaces: FaceData[] = [];
    for (let i = 0; i < numFaces; i++) {
      mockFaces.push(generateMockFace(video.videoWidth || 640, video.videoHeight || 480));
    }

    setFaces(mockFaces);

    const primary = mockFaces[0];
    if (primary) {
      setDominantEmotion(primary.dominant_emotion);

      // Update --dom-color CSS var
      document.documentElement.style.setProperty(
        "--dom-color",
        EMOTION_HSL[primary.dominant_emotion]
      );

      setHistory(prev => {
        const next = { ...prev };
        for (const e of EMOTIONS) {
          next[e] = [...prev[e].slice(-(MAX_HISTORY - 1)), primary.emotion[e]];
        }
        return next;
      });

      setHistoryFlat(prev => {
        const point: HistoryPoint = {
          t: Date.now(),
          ...primary.emotion,
        };
        return [...prev.slice(-(MAX_HISTORY - 1)), point];
      });
    }
  }, []);

  const currentScores = faces[0]?.emotion || Object.fromEntries(EMOTIONS.map(e => [e, 0])) as Record<EmotionKey, number>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-primary text-glow" />
            <h1 className="font-display text-xl font-bold tracking-wider text-foreground">
              EMOTION<span className="text-primary">VISION</span>
            </h1>
            <span className="rounded border border-border bg-secondary px-2 py-0.5 font-mono-tech text-[10px] text-muted-foreground">
              v2.0
            </span>
          </div>
          <StatusPill active={active} fps={fps} faceCount={faces.length} />
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
            {active ? "STOP" : "START"}
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
            <span className="font-mono-tech text-[10px] text-muted-foreground">INTERVAL</span>
            <input
              type="range"
              min={100}
              max={1000}
              step={50}
              value={intervalMs}
              onChange={e => setIntervalMs(Number(e.target.value))}
              className="h-1 w-20 accent-primary"
            />
            <span className="font-mono-tech text-xs text-foreground">{intervalMs}ms</span>
          </div>
          <div className="ml-auto flex items-center gap-2 font-mono-tech text-[10px] text-muted-foreground">
            <Zap className="h-3 w-3 text-primary" />
            MOCK MODE
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Webcam - 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <WebcamCanvas
              onFrame={handleFrame}
              faces={faces}
              active={active}
              showLandmarks={showLandmarks}
              intervalMs={intervalMs}
            />

            {/* Dominant emotion banner */}
            <div
              className="flex items-center justify-between rounded-lg border border-border p-4 transition-all duration-300"
              style={{
                borderColor: EMOTION_COLORS[dominantEmotion],
                boxShadow: `0 0 20px ${EMOTION_COLORS[dominantEmotion]}33`,
              }}
            >
              <div>
                <span className="font-mono-tech text-[10px] text-muted-foreground">DOMINANT EMOTION</span>
                <div
                  className="font-display text-2xl font-bold uppercase tracking-widest"
                  style={{ color: EMOTION_COLORS[dominantEmotion] }}
                >
                  {dominantEmotion}
                </div>
              </div>
              <div
                className="rounded-full px-4 py-1 font-display text-sm font-bold"
                style={{
                  background: EMOTION_COLORS[dominantEmotion],
                  color: '#000',
                }}
              >
                {currentScores[dominantEmotion]?.toFixed(1)}%
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
                  DETECTED FACES
                </div>
                {faces.map((face, i) => (
                  <FaceCard key={i} face={face} index={i} />
                ))}
              </div>
            )}

            {/* Tech info */}
            <div className="rounded-lg border border-border bg-card p-4 font-mono-tech text-[10px] text-muted-foreground space-y-1">
              <div className="font-display text-xs tracking-wider mb-2">SYSTEM INFO</div>
              <div className="flex justify-between"><span>Mode</span><span className="text-primary">MOCK (Client)</span></div>
              <div className="flex justify-between"><span>Interval</span><span className="text-foreground">{intervalMs}ms</span></div>
              <div className="flex justify-between"><span>Faces</span><span className="text-foreground">{faces.length}</span></div>
              <div className="flex justify-between"><span>FPS</span><span className="text-foreground">{fps}</span></div>
              <div className="flex justify-between"><span>History</span><span className="text-foreground">{historyFlat.length} pts</span></div>
              <div className="flex justify-between"><span>Landmarks</span><span className="text-foreground">{showLandmarks ? 'ON' : 'OFF'}</span></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
