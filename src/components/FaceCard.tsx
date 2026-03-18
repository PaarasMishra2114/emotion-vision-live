import type { FaceData, EmotionKey } from "@/lib/emotions";
import { EMOTIONS, EMOTION_COLORS } from "@/lib/emotions";

interface FaceCardProps {
  face: FaceData;
  index: number;
}

const FaceCard = ({ face, index }: FaceCardProps) => {
  const sorted = [...EMOTIONS].sort((a, b) => face.emotion[b] - face.emotion[a]);
  const top4 = sorted.slice(0, 4);

  return (
    <div className="rounded-lg border border-border bg-secondary p-3 space-y-2">
      <div className="flex items-center justify-between font-display text-xs">
        <span className="text-muted-foreground">FACE #{index + 1}</span>
        <span
          className="rounded px-2 py-0.5 text-[10px] font-bold uppercase"
          style={{
            background: EMOTION_COLORS[face.dominant_emotion],
            color: '#000',
          }}
        >
          {face.dominant_emotion}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono-tech">
        <span>Age: {face.age}</span>
        <span>•</span>
        <span>{face.gender}</span>
      </div>
      <div className="space-y-1">
        {top4.map((e) => (
          <div key={e} className="flex items-center gap-2 text-[10px] font-mono-tech">
            <span className="w-14 text-muted-foreground uppercase">{e}</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${face.emotion[e]}%`,
                  background: EMOTION_COLORS[e],
                }}
              />
            </div>
            <span className="w-8 text-right text-foreground">{face.emotion[e].toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FaceCard;
