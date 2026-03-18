export const EMOTIONS = ['angry', 'happy', 'sad', 'neutral'] as const;
export type EmotionKey = typeof EMOTIONS[number];

export const EMOTION_COLORS: Record<EmotionKey, string> = {
  angry: 'hsl(0, 85%, 55%)',
  happy: 'hsl(45, 100%, 55%)',
  sad: 'hsl(210, 70%, 45%)',
  neutral: 'hsl(200, 20%, 50%)',
};

export const EMOTION_HSL: Record<EmotionKey, string> = {
  angry: '0 85% 55%',
  happy: '45 100% 55%',
  sad: '210 70% 45%',
  neutral: '200 20% 50%',
};

export interface FaceData {
  region: { x: number; y: number; w: number; h: number };
  dominant_emotion: EmotionKey;
  emotion: Record<EmotionKey, number>;
  age: number;
  gender: string;
  landmarks: { x: number; y: number }[];
}

export interface HistoryPoint {
  t: number;
  angry: number;
  happy: number;
  sad: number;
  neutral: number;
}

/** Generate mock face data simulating real detection */
export function generateMockFace(videoWidth: number, videoHeight: number): FaceData {
  const w = 120 + Math.random() * 80;
  const h = w * 1.2;
  const x = videoWidth * 0.3 + Math.random() * videoWidth * 0.3;
  const y = videoHeight * 0.2 + Math.random() * videoHeight * 0.2;

  const scores: Record<string, number> = {};
  let total = 0;
  for (const e of EMOTIONS) {
    scores[e] = Math.random() * 50;
    total += scores[e];
  }
  // Boost one randomly
  const boost = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
  scores[boost] += 40;
  total += 40;
  // Normalize
  for (const e of EMOTIONS) {
    scores[e] = parseFloat(((scores[e] / total) * 100).toFixed(1));
  }

  const dominant = EMOTIONS.reduce((a, b) => (scores[a] > scores[b] ? a : b));

  // Generate fake landmarks (approximate face shape)
  const landmarks: { x: number; y: number }[] = [];
  for (let i = 0; i < 68; i++) {
    landmarks.push({
      x: x + Math.random() * w,
      y: y + Math.random() * h,
    });
  }

  return {
    region: { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) },
    dominant_emotion: dominant,
    emotion: scores as Record<EmotionKey, number>,
    age: 20 + Math.floor(Math.random() * 40),
    gender: Math.random() > 0.5 ? 'Man' : 'Woman',
    landmarks,
  };
}
