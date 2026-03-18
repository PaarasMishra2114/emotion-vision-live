import { cn } from "@/lib/utils";

interface StatusPillProps {
  active: boolean;
  fps: number;
  faceCount: number;
}

const StatusPill = ({ active, fps, faceCount }: StatusPillProps) => (
  <div className="flex items-center gap-3 rounded-full border border-border bg-secondary px-4 py-2 font-mono-tech text-xs">
    <span className={cn(
      "inline-block h-2 w-2 rounded-full",
      active ? "bg-primary animate-pulse" : "bg-destructive"
    )} />
    <span className="text-foreground">{active ? "ANALYZING" : "IDLE"}</span>
    <span className="text-muted-foreground">|</span>
    <span className="text-muted-foreground">{fps} FPS</span>
    <span className="text-muted-foreground">|</span>
    <span className="text-muted-foreground">{faceCount} face{faceCount !== 1 ? 's' : ''}</span>
  </div>
);

export default StatusPill;
