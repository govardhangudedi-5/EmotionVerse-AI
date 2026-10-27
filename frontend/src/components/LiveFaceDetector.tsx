import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Eye,
  RefreshCw,
  Activity,
  Layers,
  Settings2,
  Radio,
  Square,
} from "lucide-react";
import { EmotionType, EMOTION_META, FaceAnalysisResponse } from "../types/emotion";
import { realtimeDetector, FaceDetectionResult } from "../services/faceEmotionDetector"; // v2.1
import { analyzeFaceBase64 } from "../services/api";

interface LiveFaceDetectorProps {
  onEmotionUpdate?: (result: FaceAnalysisResponse) => void;
  compact?: boolean;
}

export const LiveFaceDetector: React.FC<LiveFaceDetectorProps> = ({
  onEmotionUpdate,
  compact = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Settings
  const [showSquare, setShowSquare] = useState<boolean>(true);
  const [showMesh, setShowMesh] = useState<boolean>(true);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [smoothingFactor, setSmoothingFactor] = useState<number>(0.35);
  const [syncBackend, setSyncBackend] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Live State
  const [liveResult, setLiveResult] = useState<FaceDetectionResult | null>(null);
  const [backendSyncing, setBackendSyncing] = useState<boolean>(false);
  const [historyLog, setHistoryLog] = useState<
    { time: string; emotion: EmotionType; confidence: number }[]
  >([]);

  const lastEmotionRef = useRef<EmotionType | null>(null);
  const lastBackendSyncTime = useRef<number>(0);

  // Start webcam stream
  const startCamera = async () => {
    setPermissionError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
          frameRate: { ideal: 30 },
        },
      });

      setStream(mediaStream);
      setIsActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((e) => console.error("Video play error:", e));
      }
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      const msg =
        err instanceof Error && err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera permissions in your browser to enable live emotion detection."
          : "Webcam not found or inaccessible. Please verify camera connection.";
      setPermissionError(msg);
      setIsActive(false);
    }
  };

  // Stop webcam stream
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setLiveResult(null);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Adjust smoothing in detector
  useEffect(() => {
    realtimeDetector.setSmoothingAlpha(smoothingFactor);
  }, [smoothingFactor]);

  // Real-time processing loop running at 30 FPS
  useEffect(() => {
    if (!isActive) return;

    let isProcessing = false;

    const processFrame = async () => {
      if (!videoRef.current || !canvasRef.current || !isActive) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState >= 2 && !isProcessing) {
        isProcessing = true;

        // Perform real-time client-side face and emotion analysis
        const result = realtimeDetector.analyzeFrame(
          video,
          canvas,
          true,
          showSquare,
          showMesh,
          isMirrored
        );
        setLiveResult(result);

        // Notify parent if face is detected
        if (result.faceDetected) {
          const faceResponse: FaceAnalysisResponse = {
            modality: "face",
            emotion: result.emotion,
            confidence: result.confidence,
            probabilities: result.smoothedProbabilities,
            mood_category:
              result.emotion === "happy"
                ? "positive"
                : result.emotion === "neutral"
                ? "neutral"
                : "negative",
            face_detected: true,
            bounding_box: result.boundingBox,
            processed_image_base64: null,
            is_fallback: false,
            model_name: "EmotionVerse-ClientVision-v2 (FACS Action Units)",
            metadata: {
              fps: result.fps,
              latency_ms: result.latencyMs,
              action_units: result.actionUnits,
            },
          };

          if (onEmotionUpdate) {
            onEmotionUpdate(faceResponse);
          }

          // Log emotion transitions
          if (lastEmotionRef.current !== result.emotion) {
            lastEmotionRef.current = result.emotion;
            const logEntry = {
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
              emotion: result.emotion,
              confidence: result.confidence,
            };
            setHistoryLog((prev) => [logEntry, ...prev.slice(0, 7)]);
          }

          // Optional background backend sync every 1500ms
          const now = performance.now();
          if (syncBackend && now - lastBackendSyncTime.current > 1500) {
            lastBackendSyncTime.current = now;
            try {
              setBackendSyncing(true);
              const b64 = canvas.toDataURL("image/jpeg", 0.7);
              analyzeFaceBase64(b64).catch(() => {});
            } catch {
              // ignore
            } finally {
              setBackendSyncing(false);
            }
          }
        } else {
          lastEmotionRef.current = null;
        }

        isProcessing = false;
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, showMesh, syncBackend, onEmotionUpdate]);

  const emotionMeta = liveResult?.faceDetected
    ? EMOTION_META[liveResult.emotion]
    : EMOTION_META.neutral;

  const emotionsList: EmotionType[] = [
    "happy",
    "neutral",
    "surprise",
    "sad",
    "angry",
    "fear",
    "disgust",
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Top Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              isActive
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                : "bg-rose-500/15 text-rose-300 border-rose-500/30"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isActive
                  ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"
                  : "bg-rose-500"
              }`}
            />
            <span>{isActive ? "🟢 Live Emotion Detection" : "🔴 Camera Off"}</span>
          </div>

          {isActive && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span
                className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 ${
                  liveResult?.faceDetected
                    ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                    : "bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    liveResult?.faceDetected ? "bg-cyan-400" : "bg-amber-400"
                  }`}
                />
                {liveResult?.faceDetected ? "● Face Detected" : "● No Face Detected"}
              </span>

              <span className="hidden sm:inline text-slate-500">|</span>
              <span className="hidden sm:inline text-slate-400 text-[11px]">
                Inference: <span className="text-cyan-300 font-bold">{liveResult?.fps || 30} FPS</span>
              </span>
              <span className="hidden sm:inline text-slate-500">|</span>
              <span className="hidden sm:inline text-slate-400 text-[11px]">
                Engine:{" "}
                <span className="text-purple-300 font-bold">
                  {liveResult?.engine === "mediapipe" ? "MediaPipe 3D FACS" : "Portrait CV"}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Face Square Box Toggle */}
          <button
            onClick={() => setShowSquare(!showSquare)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              showSquare
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/10"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            }`}
            title="Toggle Square Face Detection Bounding Box"
          >
            <Square className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Face Square</span>
          </button>

          {/* Landmarks Mesh Toggle */}
          <button
            onClick={() => setShowMesh(!showMesh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              showMesh
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            }`}
            title="Toggle Facial Landmark Mesh Points"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mesh</span>
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
              showSettings
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
            }`}
            title="Vision Detection Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          {!isActive ? (
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
            >
              <Camera className="w-4 h-4 text-slate-950" />
              <span>Start Live Camera</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs tracking-wide transition-all"
            >
              <CameraOff className="w-4 h-4 text-rose-400" />
              <span>Stop Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* Settings Accordion */}
      {showSettings && (
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-800 pb-2">
            <span className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Real-time Vision & Smoothing Controls
            </span>
            <span className="text-[11px] font-normal text-slate-400">
              Zero-latency client inference
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Smoothing Alpha Slider */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Emotion Stability (Alpha):</span>
                <span className="font-mono text-cyan-300">
                  {smoothingFactor < 0.25
                    ? "Very Stable"
                    : smoothingFactor > 0.5
                    ? "Ultra-responsive"
                    : "Balanced"}
                  ({smoothingFactor.toFixed(2)})
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={smoothingFactor}
                onChange={(e) => setSmoothingFactor(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Exponential smoothing filters out micro-noise while maintaining responsiveness.
              </p>
            </div>

            {/* Mesh & Mirror Toggles */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showMesh}
                  onChange={(e) => setShowMesh(e.target.checked)}
                  className="rounded accent-cyan-400"
                />
                <span>Show Facial Landmarks & ROI Box</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={isMirrored}
                  onChange={(e) => setIsMirrored(e.target.checked)}
                  className="rounded accent-cyan-400"
                />
                <span>Mirror Camera Video</span>
              </label>
            </div>

            {/* Backend Sync Toggle */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={syncBackend}
                  onChange={(e) => setSyncBackend(e.target.checked)}
                  className="rounded accent-cyan-400"
                />
                <span>Sync with Python OpenCV Backend</span>
              </label>
              <p className="text-[10px] text-slate-500 mt-1">
                Asynchronously sends frames to FastAPI backend (/api/analyze-face) at 1 Hz for dual validation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Permission / Hardware Error */}
      {permissionError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* Main Dual Grid: Video Stream vs Live Emotion Dashboard */}
      <div className={`grid grid-cols-1 ${compact ? "lg:grid-cols-1" : "lg:grid-cols-12"} gap-6 items-start`}>
        {/* CAMERA FEED (7 cols) */}
        <div className={`${compact ? "w-full" : "lg:col-span-7"} flex flex-col gap-3`}>
          <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">
            {/* Hidden native video element (supplying frames) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
            />

            {/* Rendered Canvas with Visual Overlays */}
            <canvas
              ref={canvasRef}
              className={`w-full h-full object-cover ${isActive ? "block" : "hidden"}`}
            />

            {/* Camera Offline Placeholder */}
            {!isActive && (
              <div className="text-center p-8 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
                  <Camera className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-white mb-1">Camera Stream Standby</h4>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  Sit facing your webcam and click Start Live Camera to continuously detect facial emotions in real time.
                </p>
                <button
                  onClick={startCamera}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs tracking-wide shadow-lg shadow-cyan-500/25 transition-all hover:scale-105"
                >
                  Enable Camera
                </button>
              </div>
            )}

            {/* No Face Warning Banner */}
            {isActive && !liveResult?.faceDetected && (
              <div className="absolute inset-x-4 bottom-4 p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-amber-500/40 text-amber-200 text-xs flex items-center gap-3 animate-fade-in shadow-xl">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold">No face detected</div>
                  <div className="text-[11px] text-amber-300/80">
                    Please position your face clearly in front of the camera with adequate lighting.
                  </div>
                </div>
              </div>
            )}

            {/* Backend Sync Indicator */}
            {backendSyncing && (
              <div className="absolute top-3 right-3 px-2 py-1 rounded bg-slate-900/80 border border-cyan-500/40 text-[10px] text-cyan-300 font-mono flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                <span>Backend Sync</span>
              </div>
            )}
          </div>

          {/* Action Units Real-time Telemetry Bar */}
          {isActive && liveResult?.faceDetected && (
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px]">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Facial Action Units (FACS)
                </span>
                <span className="font-mono text-[10px] text-cyan-400">
                  AU12 (Smile) &bull; AU4 (Furrow) &bull; AU26 (Jaw)
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Smile AU12</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {((liveResult.actionUnits.smile) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Furrow AU4</span>
                  <span className="font-bold text-rose-400 font-mono">
                    {((liveResult.actionUnits.browFurrow) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Raise AU1</span>
                  <span className="font-bold text-amber-400 font-mono">
                    {((liveResult.actionUnits.browRaise) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Jaw AU26</span>
                  <span className="font-bold text-purple-400 font-mono">
                    {((liveResult.actionUnits.jawOpen) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Frown AU15</span>
                  <span className="font-bold text-blue-400 font-mono">
                    {((liveResult.actionUnits.mouthFrown) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Eye AU5</span>
                  <span className="font-bold text-cyan-400 font-mono">
                    {((liveResult.actionUnits.eyeWide) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* LIVE EMOTION & PROBABILITIES CARD (5 cols) */}
        <div className={`${compact ? "w-full" : "lg:col-span-5"} flex flex-col gap-5`}>
          {/* Hero Live Emotion Card */}
          <div className="glass-card rounded-2xl p-6 border border-cyan-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950 relative overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span className="font-bold tracking-wider uppercase text-cyan-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                Live Detected Emotion
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Continuous Analysis
              </span>
            </div>

            {liveResult?.faceDetected ? (
              <div className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-4">
                  <span className="text-6xl sm:text-7xl filter drop-shadow-[0_0_15px_rgba(0,240,255,0.3)] animate-scale-in">
                    {emotionMeta.emoji}
                  </span>
                  <div>
                    <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
                      {liveResult.emotion}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">Model Confidence:</span>
                      <span className="text-base font-extrabold text-cyan-300 font-mono">
                        {(liveResult.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border capitalize ${emotionMeta.bgBadge}`}
                >
                  {liveResult.emotion}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center flex flex-col items-center justify-center">
                <span className="text-5xl text-slate-600 mb-2">👤</span>
                <span className="text-sm font-bold text-slate-400">
                  {isActive ? "Detecting face in frame..." : "Camera offline"}
                </span>
                <span className="text-xs text-slate-500 mt-1 max-w-xs">
                  {isActive
                    ? "Ensure proper lighting and face the camera directly"
                    : "Turn on camera to start continuous emotion tracking"}
                </span>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Status: {liveResult?.faceDetected ? "Tracking 1 Face" : "Waiting for Face"}</span>
              <span>Updates: Live (~30 FPS)</span>
            </div>
          </div>

          {/* Emotion Probability Distribution Bars */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Emotion Probability Distribution
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">7 Canonical Emotions</span>
            </div>

            <div className="space-y-2.5">
              {emotionsList.map((emo) => {
                const meta = EMOTION_META[emo];
                const prob = liveResult?.faceDetected
                  ? liveResult.smoothedProbabilities[emo] || 0
                  : emo === "neutral"
                  ? 0.7
                  : 0.05;
                const percent = Math.round(prob * 100);
                const isDominant = liveResult?.faceDetected && liveResult.emotion === emo;

                return (
                  <div key={emo} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 font-medium text-slate-300">
                        <span className="text-sm">{meta.emoji}</span>
                        <span className={`capitalize ${isDominant ? "text-white font-bold" : ""}`}>
                          {meta.label}
                        </span>
                      </span>
                      <span
                        className={`font-mono text-xs ${
                          isDominant ? "text-cyan-300 font-bold" : "text-slate-400"
                        }`}
                      >
                        {percent}%
                      </span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800/80">
                      <div
                        className="h-full rounded-full transition-all duration-150 ease-out"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: isDominant ? "#00f0ff" : meta.color,
                          boxShadow: isDominant ? "0 0 10px rgba(0, 240, 255, 0.5)" : "none",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Emotion Transitions Log */}
          {historyLog.length > 0 && (
            <div className="glass-card rounded-2xl p-4 border border-slate-800">
              <h5 className="text-xs font-bold text-slate-300 mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Recent Emotion Transitions
              </h5>
              <div className="space-y-1.5">
                {historyLog.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/60"
                  >
                    <div className="flex items-center gap-2">
                      <span>{EMOTION_META[item.emotion]?.emoji}</span>
                      <span className="capitalize font-medium text-white">{item.emotion}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-slate-400 text-[10px]">
                      <span className="text-cyan-400 font-bold">
                        {(item.confidence * 100).toFixed(0)}%
                      </span>
                      <span>&bull;</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
