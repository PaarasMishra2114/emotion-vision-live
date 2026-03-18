import { useRef, useEffect, useCallback } from "react";
import type { FaceData, EmotionKey } from "@/lib/emotions";
import { EMOTION_COLORS } from "@/lib/emotions";

interface WebcamCanvasProps {
  onFrame: (videoEl: HTMLVideoElement) => void;
  faces: FaceData[];
  active: boolean;
  showLandmarks: boolean;
  intervalMs: number;
}

const WebcamCanvas = ({ onFrame, faces, active, showLandmarks, intervalMs }: WebcamCanvasProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastSendRef = useRef(0);
  const rafRef = useRef(0);

  // Start webcam
  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(console.error);

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Frame loop
  useEffect(() => {
    if (!active) return;

    const loop = () => {
      const now = performance.now();
      if (now - lastSendRef.current >= intervalMs && videoRef.current && videoRef.current.readyState >= 2) {
        lastSendRef.current = now;
        onFrame(videoRef.current);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, intervalMs, onFrame]);

  // Draw overlays
  useEffect(() => {
    const canvas = overlayRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const face of faces) {
      const { x, y, w, h } = face.region;
      const color = EMOTION_COLORS[face.dominant_emotion];

      // Glow rect
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      ctx.shadowBlur = 0;

      // Corner brackets
      const br = 12;
      ctx.lineWidth = 3;
      ctx.strokeStyle = color;
      // TL
      ctx.beginPath(); ctx.moveTo(x, y + br); ctx.lineTo(x, y); ctx.lineTo(x + br, y); ctx.stroke();
      // TR
      ctx.beginPath(); ctx.moveTo(x + w - br, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + br); ctx.stroke();
      // BL
      ctx.beginPath(); ctx.moveTo(x, y + h - br); ctx.lineTo(x, y + h); ctx.lineTo(x + br, y + h); ctx.stroke();
      // BR
      ctx.beginPath(); ctx.moveTo(x + w - br, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - br); ctx.stroke();

      // Pill label
      const label = face.dominant_emotion.toUpperCase();
      ctx.font = "bold 11px 'Orbitron'";
      const tw = ctx.measureText(label).width;
      const px = 6, py = 3;
      ctx.fillStyle = color;
      ctx.beginPath();
      const rx = x, ry = y - 22;
      ctx.roundRect(rx, ry, tw + px * 2, 18, 4);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.fillText(label, rx + px, ry + 13);

      // Age/gender
      ctx.font = "10px 'Share Tech Mono'";
      ctx.fillStyle = "hsl(190, 100%, 80%)";
      ctx.fillText(`${face.age}y ${face.gender}`, x, y + h + 14);

      // Landmarks
      if (showLandmarks && face.landmarks.length > 0) {
        ctx.fillStyle = color;
        for (const pt of face.landmarks) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }, [faces, showLandmarks]);

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="block w-full"
        style={{ transform: "scaleX(-1)" }}
      />
      <canvas
        ref={overlayRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ transform: "scaleX(-1)" }}
      />
      {/* Scanline overlay */}
      <div className="absolute inset-0 scanline pointer-events-none" />
    </div>
  );
};

export default WebcamCanvas;
