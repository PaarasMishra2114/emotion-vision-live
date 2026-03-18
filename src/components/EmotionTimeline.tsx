import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import type { HistoryPoint, EmotionKey } from "@/lib/emotions";
import { EMOTIONS, EMOTION_COLORS } from "@/lib/emotions";

interface EmotionTimelineProps {
  data: HistoryPoint[];
}

const EmotionTimeline = ({ data }: EmotionTimelineProps) => {
  const sliced = data.slice(-60);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={sliced}>
        <XAxis dataKey="t" hide />
        <YAxis domain={[0, 100]} hide />
        <Tooltip
          contentStyle={{
            background: 'hsl(220, 20%, 10%)',
            border: '1px solid hsl(200, 30%, 18%)',
            borderRadius: 8,
            fontFamily: 'Share Tech Mono',
            fontSize: 11,
          }}
          labelFormatter={() => ''}
        />
        {EMOTIONS.map((e) => (
          <Line
            key={e}
            type="monotone"
            dataKey={e}
            stroke={EMOTION_COLORS[e]}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default EmotionTimeline;
