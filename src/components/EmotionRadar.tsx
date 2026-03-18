import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer,
} from "recharts";
import type { EmotionKey } from "@/lib/emotions";
import { EMOTIONS, EMOTION_COLORS } from "@/lib/emotions";

interface EmotionRadarProps {
  scores: Record<EmotionKey, number>;
}

const EmotionRadar = ({ scores }: EmotionRadarProps) => {
  const data = EMOTIONS.map((e) => ({
    emotion: e.charAt(0).toUpperCase() + e.slice(1),
    value: scores[e] || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="hsl(200, 30%, 18%)" />
        <PolarAngleAxis
          dataKey="emotion"
          tick={{ fill: 'hsl(190, 100%, 80%)', fontSize: 10, fontFamily: 'Share Tech Mono' }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={false}
          axisLine={false}
        />
        <Radar
          dataKey="value"
          stroke="hsl(185, 100%, 50%)"
          fill="hsl(185, 100%, 50%)"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default EmotionRadar;
