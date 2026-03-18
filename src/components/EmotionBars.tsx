import type { EmotionKey } from "@/lib/emotions";
import { EMOTIONS, EMOTION_COLORS } from "@/lib/emotions";
import Sparkline from "./Sparkline";

interface EmotionBarsProps {
  scores: Record<EmotionKey, number>;
  history: Record<EmotionKey, number[]>;
}

const EmotionBars = ({ scores, history }: EmotionBarsProps) => (
  <div className="space-y-2">
    {EMOTIONS.map((e) => (
      <div key={e} className="flex items-center gap-2 text-xs font-mono-tech">
        <span className="w-16 uppercase text-muted-foreground">{e}</span>
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${scores[e]}%`,
              background: EMOTION_COLORS[e],
            }}
          />
        </div>
        <span className="w-10 text-right text-foreground">{scores[e].toFixed(0)}%</span>
        <Sparkline data={history[e]?.slice(-20) || []} color={EMOTION_COLORS[e]} width={60} height={16} />
      </div>
    ))}
  </div>
);

export default EmotionBars;
