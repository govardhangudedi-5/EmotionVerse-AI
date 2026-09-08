import React, { useRef, useState, useEffect } from "react";
import { Camera, CameraOff, Upload, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { FaceAnalysisResponse, EMOTION_META } from "../types/emotion";
import { analyzeFaceBase64, analyzeFaceFile } from "../services/api";

interface FaceAnalyzerProps {
  onResult: (result: FaceAnalysisResponse) => void;
  savedResult: FaceAnalysisResponse | null;
}

export const FaceAnalyzer: React.FC<FaceAnalyzerProps> = ({ onResult, savedResult }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isLiveContinuous, setIsLiveContinuous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Start webcam
  const startWebcam = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });
      setStream(mediaStream);
      setIsWebcamActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Webcam access error:", err);
      setError("Webcam permission denied or camera not found. You can upload an image file instead.");
    }
  };

  // Stop webcam
  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsWebcamActive(false);
    setIsLiveContinuous(false);
  };

  // Capture frame from video to base64
  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  // Trigger analysis of current frame
  const handleCaptureAndAnalyze = async () => {
    const frameBase64 = captureFrame();
    if (!frameBase64) {
      setError("Failed to capture video frame.");
      return;
    }
    setPreviewImage(frameBase64);
    setIsLoading(true);
    setError(null);

    try {
      const result = await analyzeFaceBase64(frameBase64);
      onResult(result);
      if (result.processed_image_base64) {
        setPreviewImage(result.processed_image_base64);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Facial analysis failed";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeFaceFile(file);
      onResult(result);
      if (result.processed_image_base64) {
        setPreviewImage(result.processed_image_base64);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to analyze image file";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Continuous live evaluation loop if toggled on
  useEffect(() => {
    if (!isLiveContinuous || !isWebcamActive) return;

    const interval = setInterval(async () => {
      const frame = captureFrame();
      if (frame && !isLoading) {
        try {
          const res = await analyzeFaceBase64(frame);
          onResult(res);
        } catch {
          // ignore transient background errors
        }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isLiveContinuous, isWebcamActive, isLoading]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col h-full border border-slate-800/80">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide text-white">Facial Emotion Detection</h3>
            <p className="text-[11px] text-slate-400">OpenCV Face Geometry & Haar Cascades</p>
          </div>
        </div>

        {savedResult && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready</span>
          </div>
        )}
      </div>

      {/* Video & Preview Display */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 flex items-center justify-center mb-4 group">
        {/* Hidden video element when streaming */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isWebcamActive ? "block" : "hidden"}`}
        />

        {/* Static Image Preview when webcam is inactive */}
        {!isWebcamActive && previewImage && (
          <img
            src={previewImage}
            alt="Face Analysis Preview"
            className="w-full h-full object-contain"
          />
        )}

        {/* Empty placeholder state */}
        {!isWebcamActive && !previewImage && (
          <div className="text-center p-6 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-2">
              <Camera className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-400 font-medium">Camera offline</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Start webcam stream or upload a portrait photo
            </p>
          </div>
        )}

        {/* Loading Spinner Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            <span className="text-xs text-cyan-300 font-medium">Extracting Facial Features...</span>
          </div>
        )}

        {/* Bounding Box Info Overlay Tag */}
        {savedResult?.face_detected && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded bg-slate-900/90 border border-cyan-500/40 text-[11px] font-mono text-cyan-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Face Detected ({savedResult.metadata?.resolution as string || "Active ROI"})
          </div>
        )}

        {/* Hidden Canvas for Frame Capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-3 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-auto">
        {!isWebcamActive ? (
          <button
            onClick={startWebcam}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all"
          >
            <Camera className="w-3.5 h-3.5" />
            Start Webcam
          </button>
        ) : (
          <button
            onClick={stopWebcam}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all"
          >
            <CameraOff className="w-3.5 h-3.5" />
            Stop Camera
          </button>
        )}

        {isWebcamActive ? (
          <button
            onClick={handleCaptureAndAnalyze}
            disabled={isLoading}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-cyan-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Analyze Frame
          </button>
        ) : (
          <label className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            Upload Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Result Indicator Footer */}
      {savedResult && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {EMOTION_META[savedResult.emotion]?.emoji || "😐"}
            </span>
            <div>
              <div className="text-xs font-bold text-white capitalize">
                {savedResult.emotion}
              </div>
              <div className="text-[10px] text-slate-400">
                Confidence: {(savedResult.confidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-semibold ${
              savedResult.is_fallback
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                : "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
            }`}
          >
            {savedResult.is_fallback ? "Demo Mode" : "Real Model"}
          </span>
        </div>
      )}
    </div>
  );
};
