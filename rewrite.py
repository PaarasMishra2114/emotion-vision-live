import sys
with open('src/pages/Index.tsx', 'r') as f:
    content = f.read()

# 1. Add refs to the component
imports_end = content.find('const Index = () => {')
if imports_end != -1:
    refs = """
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const processResponse = (data: any) => {
    if (data.emotion && data.emotion !== "UNKNOWN") {
      const dominant = data.emotion.toLowerCase() as EmotionKey;
      if (EMOTIONS.includes(dominant)) {
        const fakeScores = Object.fromEntries(EMOTIONS.map(e => [e, 0])) as Record<EmotionKey, number>;
        fakeScores[dominant] = data.confidence || 0;
        for (const e of EMOTIONS) {
           if (e !== dominant) {
              fakeScores[e] = Math.random() * 15;
           }
        }
        const detectedFace: FaceData = {
          region: data.bbox || { x: 200, y: 150, w: 200, h: 250 },
          dominant_emotion: dominant,
          emotion: fakeScores,
          age: 26,
          gender: "Detected",
          landmarks: []
        };
        setFaces([detectedFace]);
        setDominantEmotion(dominant);
        document.documentElement.style.setProperty("--dom-color", EMOTION_HSL[dominant]);
        setHistory(prev => {
          const next = { ...prev };
          for (const e of EMOTIONS) {
            next[e] = [...prev[e].slice(-(MAX_HISTORY - 1)), detectedFace.emotion[e]];
          }
          return next;
        });
        setHistoryFlat(prev => [...prev.slice(-(MAX_HISTORY - 1)), { t: Date.now(), ...detectedFace.emotion }]);
      }
    } else {
       setFaces([]);
    }
  };
"""
    content = content.replace('  const fileInputRef = useRef<HTMLInputElement>(null);', '  const fileInputRef = useRef<HTMLInputElement>(null);' + refs)

# 2. Update toggleActive
toggle_original = """  const toggleActive = useCallback(() => {
    if (!active) {
      setUploadPreview(null);
      setActive(true);
    } else {
      setFaces([]);
      setActive(false);
    }
  }, [active]);"""
toggle_new = """  const toggleActive = useCallback(async () => {
    if (!active) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setUploadPreview(null);
        setActive(true);
      } catch (err) {
        console.error("Camera error", err);
        alert("Need camera permissions!");
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setFaces([]);
      setActive(false);
    }
  }, [active]);"""
content = content.replace(toggle_original, toggle_new)

# 3. Update handleUpload
upload_start = 'try {\n      const res = await fetch(`${API_URL}/analyze_image`,'
upload_end = '} catch (err) {\n       console.error("API error", err);\n    }'
try_block_old = content[content.find(upload_start):content.find(upload_end)+len(upload_end)]
try_block_new = """try {
      const res = await fetch(`${API_URL}/analyze_image`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      processResponse(data);
    } catch (err) {
       console.error("API error", err);
    }"""
content = content.replace(try_block_old, try_block_new)

# 4. Update useEffect polling
effect_start = 'try {\n          const res = await fetch(`${API_URL}/get_emotion_data`);'
effect_end = '} catch (err) {\n           console.error("API error", err);\n        }'
effect_old = content[content.find(effect_start):content.find(effect_end)+len(effect_end)]
effect_new = """try {
          if (!videoRef.current || !canvasRef.current) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          if (canvas.width === 0) return;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob(async (blob) => {
            if (!blob) return;
            const formData = new FormData();
            formData.append("image", blob, "frame.jpg");
            const res = await fetch(`${API_URL}/analyze_image`, {
              method: "POST",
              body: formData,
            });
            const data = await res.json();
            processResponse(data);
          }, 'image/jpeg', 0.7);
        } catch (err) {
           console.error("API error", err);
        }"""
content = content.replace(effect_old, effect_new)

# 5. Update HTML elements
html_old = """              ) : active ? (
                <img src={`${API_URL}/video_feed`} className="block w-full object-cover" alt="Video stream" />
              ) : ("""
html_new = """              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className={`block w-full object-cover h-full max-h-[480px] ${!active && 'hidden'}`} />
                  <canvas ref={canvasRef} className="hidden" />
                  {!active && <span className="font-display text-sm text-muted-foreground tracking-wider">PRESS START OR UPLOAD AN IMAGE</span>}
                  
                  {faces[0]?.region && faces[0].region.w > 0 && active && showLandmarks && videoRef.current && (
                     <div
                       className="absolute border-2 transition-all duration-100"
                       style={{
                         borderColor: EMOTION_COLORS[dominantEmotion],
                         left: `${(faces[0].region.x / videoRef.current.videoWidth) * 100}%`,
                         top: `${(faces[0].region.y / videoRef.current.videoHeight) * 100}%`,
                         width: `${(faces[0].region.w / videoRef.current.videoWidth) * 100}%`,
                         height: `${(faces[0].region.h / videoRef.current.videoHeight) * 100}%`,
                       }}
                     />
                  )}
                </>
              )}"""
content = content.replace(html_old, html_new)

with open('src/pages/Index.tsx', 'w') as f:
    f.write(content)
print("Done rewriting")
