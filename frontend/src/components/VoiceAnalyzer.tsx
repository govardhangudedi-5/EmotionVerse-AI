import React, { useRef, useState, useEffect } from "react";
import { Mic, Square, Play, Pause, Upload, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Volume2 } from "lucide-react";
import { AudioAnalysisResponse, EMOTION_META } from "../types/emotion";
import { analyzeAudio } from "../services/api";

interface VoiceAnalyzerProps {
  onResult: (result: AudioAnalysisResponse) => void;
  savedResult: AudioAnalysisResponse | null;
}

export const VoiceAnalyzer: React.FC<VoiceAnalyzerProps> = ({ onResult, savedResult }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordDuration, setRecordDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<any>(null);

  // Audio Context for live microphone meter
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Start Voice Recording
  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];
    setRecordDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Audio analysis visualizer setup
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      sourceRef.current = source;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop live mic tracks
        stream.getTracks().forEach((track) => track.stop());
        if (audioCtxRef.current) {
          audioCtxRef.current.close();
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);

      // Start duration counter
      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);

      // Draw real-time canvas waveform
      drawLiveWaveform();
    } catch (err) {
      console.error("Microphone access error:", err);
      setError("Microphone permission denied or device unavailable. You can upload an audio file instead.");
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Real-time canvas drawing of audio amplitude bars
  const drawLiveWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        // Gradient from cyan to purple
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, "#00f0ff");
        gradient.addColorStop(1, "#a855f7");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
  };

  // Handle analyze action
  const handleAnalyze = async () => {
    if (!audioBlob) {
      setError("No audio recording or file available to analyze.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await analyzeAudio(audioBlob);
      onResult(result);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Voice emotion analysis failed";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle uploaded audio file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioBlob(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setError(null);
  };

  // Play / Pause audio
  const togglePlayAudio = () => {
    if (!audioElementRef.current || !audioUrl) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  // Static waveform rendering if saved result waveform points exist
  useEffect(() => {
    if (!isRecording && savedResult?.waveform_points && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const points = savedResult.waveform_points;
      const barWidth = canvas.width / points.length;

      points.forEach((val, i) => {
        const barHeight = val * (canvas.height * 0.85);
        const y = (canvas.height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, "#38bdf8");
        gradient.addColorStop(1, "#818cf8");

        ctx.fillStyle = gradient;
        ctx.fillRect(i * barWidth, y, barWidth - 1, barHeight);
      });
    }
  }, [isRecording, savedResult]);

  // Clean up timers & context
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col h-full border border-slate-800/80">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide text-white">Voice Emotion Analysis</h3>
            <p className="text-[11px] text-slate-400">Pitch F0, RMS Energy & Spectral Prosody</p>
          </div>
        </div>

        {savedResult && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready</span>
          </div>
        )}
      </div>

      {/* Waveform Canvas & Visualizer Container */}
      <div className="relative h-28 w-full rounded-xl bg-slate-950 border border-slate-800/80 p-3 flex flex-col justify-between mb-4 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={400}
          height={80}
          className="w-full h-16 object-cover rounded"
        />

        {/* Status / Duration text overlay */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1">
          <div className="flex items-center gap-1.5">
            {isRecording ? (
              <span className="flex items-center gap-1 text-rose-400 animate-pulse font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                RECORDING {recordDuration}s
              </span>
            ) : audioBlob ? (
              <span className="flex items-center gap-1 text-cyan-400">
                <Volume2 className="w-3.5 h-3.5" />
                Audio Captured ({savedResult?.duration_seconds ? `${savedResult.duration_seconds}s` : "Ready to analyze"})
              </span>
            ) : (
              <span>Waveform Idle</span>
            )}
          </div>

          {savedResult?.pitch_estimate && (
            <span className="text-slate-400">
              F0: {savedResult.pitch_estimate} Hz | RMS: {savedResult.energy_level}
            </span>
          )}
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
            <span className="text-xs text-purple-300 font-medium">Extracting Spectral Prosody...</span>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-3 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden Audio Player for Review */}
      {audioUrl && (
        <audio
          ref={audioElementRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {/* Controls */}
      <div className="grid grid-cols-2 gap-2 mt-auto">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all"
          >
            <Mic className="w-3.5 h-3.5" />
            Record Voice
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-all animate-pulse"
          >
            <Square className="w-3.5 h-3.5" />
            Stop Recording
          </button>
        )}

        {audioBlob ? (
          <div className="flex gap-2">
            <button
              onClick={togglePlayAudio}
              className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
              title="Play recording"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </button>
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-purple-600/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyze</span>
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            Upload Audio
            <input
              type="file"
              accept="audio/*"
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
                : "bg-purple-500/10 text-purple-300 border-purple-500/30"
            }`}
          >
            {savedResult.is_fallback ? "Demo Mode" : "Real Model"}
          </span>
        </div>
      )}
    </div>
  );
};
