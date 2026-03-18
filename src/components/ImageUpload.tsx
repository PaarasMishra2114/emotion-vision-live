import { useRef, useState, useCallback } from "react";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  onImageSelected: (file: File, previewUrl: string) => void;
  onClear: () => void;
  previewUrl: string | null;
  analyzing: boolean;
}

const ImageUpload = ({ onImageSelected, onClear, previewUrl, analyzing }: ImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    onImageSelected(file, url);
  }, [onImageSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="relative rounded-lg border border-border bg-card overflow-hidden" style={{ minHeight: 400 }}>
      {previewUrl ? (
        <>
          <img
            src={previewUrl}
            alt="Uploaded photo"
            className="w-full h-full object-contain"
            style={{ maxHeight: 500 }}
          />
          {analyzing && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="font-display text-xs tracking-wider text-primary">ANALYZING...</span>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="icon"
            className="absolute top-3 right-3 h-8 w-8 bg-background/80"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="absolute inset-0 scanline pointer-events-none" />
        </>
      ) : (
        <div
          className={`flex flex-col items-center justify-center h-full min-h-[400px] cursor-pointer transition-colors ${
            dragOver ? "bg-primary/10 border-primary" : ""
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <div className="rounded-full border-2 border-dashed border-border p-6">
              <Upload className="h-10 w-10" />
            </div>
            <div className="text-center">
              <p className="font-display text-sm tracking-wider text-foreground">DROP IMAGE HERE</p>
              <p className="font-mono-tech text-xs mt-1">or click to browse</p>
            </div>
            <div className="flex items-center gap-2 font-mono-tech text-[10px]">
              <ImageIcon className="h-3 w-3" />
              JPG, PNG, WEBP supported
            </div>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
};

export default ImageUpload;
