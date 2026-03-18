import { useState, useCallback } from "react";
import { Activity, Cpu, Zap, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ImageUpload from "@/components/ImageUpload";
import FaceCard from "@/components/FaceCard";
import EmotionRadar from "@/components/EmotionRadar";
import EmotionBars from "@/components/EmotionBars";
import {
  EMOTIONS, EMOTION_COLORS, EMOTION_HSL,
  generateMockFace,
  type FaceData, type EmotionKey,
} from "@/lib/emotions";

const Index = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [faces, setFaces] = useState<FaceData[]>([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [dominantEmotion, setDominantEmotion] = useState<EmotionKey>("neutral");

  const analyzeImage = useCallback((_file: File, url: string) => {
    setPreviewUrl(url);
    setAnalyzing(true);
    setAnalyzed(false);
    setFaces([]);

    // Simulate analysis delay (mock mode — no real backend)
    setTimeout(() => {
      const numFaces = Math.random() > 0.7 ? 2 : 1;
      const mockFaces: FaceData[] = [];
      for (let i = 0; i < numFaces; i++) {
        mockFaces.push(generateMockFace(640, 480));
      }

      setFaces(mockFaces);
      const dominant = mockFaces[0]?.dominant_emotion || "neutral";
      setDominantEmotion(dominant);
      document.documentElement.style.setProperty("--dom-color", EMOTION_HSL[dominant]);
      setAnalyzing(false);
      setAnalyzed(true);
    }, 1500);
  }, []);

  const handleClear = useCallback(() => {
    setPreviewUrl(null);
    setFaces([]);
    setAnalyzed(false);
    setAnalyzing(false);
    setDominantEmotion("neutral");
    document.documentElement.style.setProperty("--dom-color", "185 100% 50%");
  }, []);

  const handleReanalyze = useCallback(() => {
    if (!previewUrl) return;
    setAnalyzing(true);
    setAnalyzed(false);
    setTimeout(() => {
      const numFaces = Math.random() > 0.7 ? 2 : 1;
      const mockFaces: FaceData[] = [];
      for (let i = 0; i < numFaces; i++) {
        mockFaces.push(generateMockFace(640, 480));
      }
      setFaces(mockFaces);
      const dominant = mockFaces[0]?.dominant_emotion || "neutral";
      setDominantEmotion(dominant);
      document.documentElement.style.setProperty("--dom-color", EMOTION_HSL[dominant]);
      setAnalyzing(false);
      setAnalyzed(true);
    }, 1200);
  }, [previewUrl]);

  const currentScores = faces[0]?.emotion || Object.fromEntries(EMOTIONS.map(e => [e, 0])) as Record<EmotionKey, number>;
  const emptyHistory = Object.fromEntries(EMOTIONS.map(e => [e, []])) as Record<EmotionKey, number[]>;

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
          <div className="flex items-center gap-3 rounded-full border border-border bg-secondary px-4 py-2 font-mono-tech text-xs">
            <span className={`inline-block h-2 w-2 rounded-full ${analyzed ? "bg-primary animate-pulse" : "bg-destructive"}`} />
            <span className="text-foreground">{analyzing ? "ANALYZING" : analyzed ? "COMPLETE" : "IDLE"}</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">{faces.length} face{faces.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6">
        {/* Controls */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {analyzed && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReanalyze}
              className="font-display text-xs tracking-wider"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              RE-ANALYZE
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2 font-mono-tech text-[10px] text-muted-foreground">
            <Zap className="h-3 w-3 text-primary" />
            MOCK MODE — Upload a photo to analyze
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Upload area - 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <ImageUpload
              onImageSelected={analyzeImage}
              onClear={handleClear}
              previewUrl={previewUrl}
              analyzing={analyzing}
            />

            {/* Dominant emotion banner */}
            {analyzed && (
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
                    color: "#000",
                  }}
                >
                  {currentScores[dominantEmotion]?.toFixed(1)}%
                </div>
              </div>
            )}
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
              <EmotionBars scores={currentScores} history={emptyHistory} />
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
              <div className="flex justify-between"><span>Mode</span><span className="text-primary">MOCK (Upload)</span></div>
              <div className="flex justify-between"><span>Model</span><span className="text-foreground">LBPH + DeepFace</span></div>
              <div className="flex justify-between"><span>Faces</span><span className="text-foreground">{faces.length}</span></div>
              <div className="flex justify-between"><span>Emotions</span><span className="text-foreground">{EMOTIONS.length}</span></div>
              <div className="flex justify-between"><span>Status</span><span className="text-foreground">{analyzing ? "Processing" : analyzed ? "Done" : "Waiting"}</span></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
