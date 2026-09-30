import React, { useRef, useState, useEffect } from "react";
import {
  Mic,
  Square,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Upload,
  Layers,
  AlertCircle,
  RefreshCw,
  Volume2,
  FileAudio,
  Sliders,
  MessageSquare,
  CheckCircle2,
  Edit3,
} from "lucide-react";
import { AudioAnalysisResponse, EMOTION_META, EmotionType } from "../types/emotion";
import { analyzeAudio } from "../services/api";
import { convertBlobToWav, audioBufferToWavBlob } from "../utils/audioEncoder";

interface VoiceEmotionPageProps {
  onResult: (result: AudioAnalysisResponse) => void;
  savedResult: AudioAnalysisResponse | null;
  onNavigateToMultimodal: () => void;
}

export const VoiceEmotion: React.FC<VoiceEmotionPageProps> = ({
  onResult,
  savedResult,
  onNavigateToMultimodal,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);

  // Analysis Mode: Dual Voice Intelligence (prosody + speech) vs Pure Acoustic Prosody
  const [analysisMode, setAnalysisMode] = useState<"combined" | "acoustic">("combined");

  // Speech-to-Text state (Section 15)
  const [transcribedText, setTranscribedText] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isEditingTranscript, setIsEditingTranscript] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // Preset phrases for quick verification
  const samplePhrases = [
    { label: "Happy News 😊", text: "Today is my birthday! I am so happy and excited!", emotion: "happy" },
    { label: "Sad News 😢", text: "I lost my job and failed my exam today, feeling very sad and low.", emotion: "sad" },
    { label: "Angry Voice 😠", text: "This is completely unacceptable and I am furious about this mistake!", emotion: "angry" },
    { label: "Surprise 😮", text: "Oh my goodness, I cannot believe this unbelievable surprise!", emotion: "surprise" },
    { label: "Neutral Info 😐", text: "The scheduled quarterly briefing is set for ten o'clock tomorrow.", emotion: "neutral" },
  ];

  // Initialize Web Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let currentText = "";
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + " ";
        }
        setTranscribedText(currentText.trim());
      };

      recognition.onerror = () => {
        setIsTranscribing(false);
      };

      recognition.onend = () => {
        setIsTranscribing(false);
      };

      speechRecognitionRef.current = recognition;
    }
  }, []);

  // Visualizer loop for canvas
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    ctx.fillStyle = "#070913";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#c084fc"; // purple-400
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  };

  // Start recording
  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscribedText("");
    setRecordingDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // AudioContext & Analyser setup for waveform visualizer
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/ogg",
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mime = mediaRecorder.mimeType || "audio/webm";
        const rawBlob = new Blob(audioChunksRef.current, { type: mime });

        // Convert browser-recorded WebM/Opus to standard 16kHz PCM WAV
        let processedBlob = rawBlob;
        try {
          processedBlob = await convertBlobToWav(rawBlob, 16000);
        } catch (convErr) {
          console.warn("WAV conversion warning:", convErr);
        }

        setAudioBlob(processedBlob);
        const url = URL.createObjectURL(processedBlob);
        setAudioUrl(url);

        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());

        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);

      // Start waveform drawing
      drawWaveform();

      // Start duration counter
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Start SpeechRecognition if supported
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.start();
          setIsTranscribing(true);
        } catch {
          // already started or unavailable
        }
      }
    } catch (err: unknown) {
      console.error("Microphone access error:", err);
      setError("Microphone access denied or audio device not found.");
      setIsRecording(false);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (speechRecognitionRef.current && isTranscribing) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsTranscribing(false);
    }
  };

  // Audio Playback
  const togglePlayAudio = () => {
    if (!audioUrl) return;

    if (!audioElementRef.current) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      audioElementRef.current = audio;
    }

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  // Trigger Acoustic & Voice Analysis
  const handleAnalyze = async () => {
    if (!audioBlob && !transcribedText.trim()) {
      setError("Please record audio, upload a sound file, or select a sample phrase before analyzing.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // If user typed/selected text but didn't record audio, generate synthetic wav blob
      let payloadBlob = audioBlob;
      if (!payloadBlob) {
        // Create 1-second quiet mono WAV blob as carrier
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const dummyCtx = new AudioCtx();
          const dummyBuffer = dummyCtx.createBuffer(1, 16000, 16000);
          const channel = dummyBuffer.getChannelData(0);
          for (let i = 0; i < 16000; i++) {
            channel[i] = Math.sin(2 * Math.PI * 220 * (i / 16000)) * 0.05;
          }
          payloadBlob = audioBufferToWavBlob(dummyBuffer, 16000);
          dummyCtx.close().catch(() => {});
        } else {
          payloadBlob = new Blob([], { type: "audio/wav" });
        }
      }

      const response = await analyzeAudio(payloadBlob, transcribedText, analysisMode);
      onResult(response);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to analyze voice emotion.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let finalFile: Blob = file;
    try {
      finalFile = await convertBlobToWav(file, 16000);
    } catch (err) {
      console.warn("Upload audio conversion error:", err);
    }

    setAudioBlob(finalFile);
    const url = URL.createObjectURL(finalFile);
    setAudioUrl(url);
    if (!transcribedText) {
      setTranscribedText("(Uploaded audio recording)");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (audioElementRef.current) audioElementRef.current.pause();
    };
  }, []);

  const emotionsList: EmotionType[] = [
    "happy",
    "neutral",
    "surprise",
    "sad",
    "angry",
    "fear",
    "disgust",
  ];

  // Prosody descriptions based on pitch & energy
  const getProsodyDescription = (pitch?: number | null, energy?: number | null) => {
    const p = pitch || 160;
    const e = energy || 0.05;
    if (p > 190 && e > 0.07) return { text: "Elevated, Animated & Expressive Prosody", color: "text-amber-300" };
    if (p > 220) return { text: "High Pitch Dynamic Variation", color: "text-purple-300" };
    if (p < 140 && e < 0.04) return { text: "Subdued, Flat Monotone Intonation", color: "text-blue-300" };
    if (e > 0.12) return { text: "High Acoustic Intensity / Emphatic", color: "text-rose-300" };
    return { text: "Standard Conversational Cadence", color: "text-cyan-300" };
  };

  const prosodyDesc = getProsodyDescription(savedResult?.pitch_estimate, savedResult?.energy_level);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Voice Emotion Analysis
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 uppercase font-mono">
                Acoustic Prosody & Speech
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Dual vocal intelligence: analyzes pitch (F0), RMS acoustic energy, and spoken linguistic sentiment in real time.
            </p>
          </div>
        </div>

        {savedResult && (
          <button
            onClick={onNavigateToMultimodal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all shadow-lg hover:shadow-purple-500/20"
          >
            <span>Send to Multimodal Fusion</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Analysis Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>Intelligence Mode:</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAnalysisMode("combined")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              analysisMode === "combined"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dual Voice Intelligence (Acoustics + Speech)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-200 font-mono">
              Recommended
            </span>
          </button>
          <button
            onClick={() => setAnalysisMode("acoustic")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              analysisMode === "acoustic"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Acoustic Prosody Only</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recording Controls & Waveform (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Waveform Canvas Box */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-purple-400" />
                Real-Time Audio Waveform
              </span>

              {isRecording && (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[11px] font-mono font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Recording: {recordingDuration}s
                </div>
              )}
            </div>

            <div className="h-32 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative flex items-center justify-center">
              <canvas ref={canvasRef} className="w-full h-full block" width={600} height={128} />

              {!isRecording && !audioUrl && (
                <div className="absolute text-center text-xs text-slate-500 pointer-events-none px-4">
                  Press <strong className="text-purple-400">Start Recording</strong> and speak happy news into your microphone
                </div>
              )}

              {audioUrl && !isRecording && (
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/90 text-purple-300 text-[10px] font-mono border border-purple-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  16kHz PCM WAV Ready
                </div>
              )}
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Recording Controls: Start / Stop / Play / Analyze */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-purple-600/25 transition-all hover:scale-105"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start Recording</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-rose-600/25 transition-all animate-pulse"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop Recording</span>
                </button>
              )}

              <button
                onClick={togglePlayAudio}
                disabled={!audioUrl || isRecording}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Play className={`w-4 h-4 ${isPlaying ? "text-purple-400 fill-purple-400" : ""}`} />
                <span>{isPlaying ? "Pause" : "Play Audio"}</span>
              </button>

              <label className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs transition-all cursor-pointer">
                <Upload className="w-4 h-4 text-slate-400" />
                <span>Upload Audio</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleAnalyze}
                disabled={(!audioBlob && !transcribedText.trim()) || isLoading || isRecording}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs tracking-wide shadow-md shadow-purple-500/20 transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 text-slate-950 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-slate-950" />
                )}
                <span>Analyze Voice</span>
              </button>
            </div>
          </div>

          {/* Speech-to-Text Transcription Box */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>Speech-to-Text Transcription</span>
                {isTranscribing && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono text-[10px] animate-pulse">
                    Listening...
                  </span>
                )}
              </span>
              <button
                onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditingTranscript ? "Done Editing" : "Edit Words"}</span>
              </button>
            </div>

            {isEditingTranscript ? (
              <textarea
                value={transcribedText}
                onChange={(e) => setTranscribedText(e.target.value)}
                placeholder="Type or edit the spoken sentence here..."
                rows={2}
                className="w-full p-3 rounded-xl bg-slate-950 border border-cyan-500/50 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs min-h-[56px] text-slate-200">
                {transcribedText ? (
                  <span className="italic font-medium">&ldquo;{transcribedText}&rdquo;</span>
                ) : (
                  <span className="text-slate-500 not-italic">
                    Spoken words during microphone recording will appear here automatically, or select a sample phrase below...
                  </span>
                )}
              </div>
            )}

            {/* Quick Test Sample Phrases */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-slate-400 block font-medium">Quick Sample Phrases:</span>
              <div className="flex flex-wrap gap-1.5">
                {samplePhrases.map((phrase) => (
                  <button
                    key={phrase.label}
                    onClick={() => {
                      setTranscribedText(phrase.text);
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                      transcribedText === phrase.text
                        ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    {phrase.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-cyan-400">Dual Voice Intelligence:</strong> EmotionVerse AI analyzes vocal pitch, energy modulation, and spoken emotional words together so saying happy news reliably reflects <strong className="text-amber-300">Happy 😊</strong>.
            </div>
          </div>
        </div>

        {/* Right Column: Prediction & Distributions (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {savedResult ? (
            <>
              {/* Top Result Card */}
              <div className="glass-card rounded-2xl p-6 border border-purple-500/30 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span className="font-bold tracking-wider uppercase text-purple-400">
                    Voice Emotion
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {savedResult.model_name.includes("Dual")
                      ? "Dual Intelligence (Prosody + Speech)"
                      : "Acoustic Prosody"}
                  </span>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <span className="text-6xl filter drop-shadow-[0_0_15px_rgba(192,132,252,0.3)]">
                    {EMOTION_META[savedResult.emotion]?.emoji || "😐"}
                  </span>
                  <div>
                    <h3 className="text-3xl font-black text-white tracking-tight uppercase">
                      {savedResult.emotion}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">Model Confidence:</span>
                      <span className="text-base font-extrabold text-purple-300 font-mono">
                        {(savedResult.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prosodic Tone Descriptor */}
                <div className="mt-3 py-1.5 px-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between">
                  <span className="text-slate-400">Vocal Tone:</span>
                  <span className={`font-semibold ${prosodyDesc.color}`}>
                    {prosodyDesc.text}
                  </span>
                </div>

                {/* Acoustic Features Telemetry */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Pitch (F0):</span>
                    <span className="font-mono text-cyan-300 font-bold text-sm">
                      {savedResult.pitch_estimate || 160} Hz
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Vocal Frequency</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">RMS Energy:</span>
                    <span className="font-mono text-purple-300 font-bold text-sm">
                      {(savedResult.energy_level || 0.05).toFixed(3)}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Vocal Intensity</span>
                  </div>
                </div>

                {/* Speech transcript breakdown if available */}
                {Boolean(savedResult.metadata?.transcript) && (
                  <div className="mt-3 p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/20 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-cyan-400 font-bold">Spoken Linguistic Analysis:</span>
                      {Boolean(savedResult.metadata?.speech_emotion) && (
                        <span className="text-amber-300 font-semibold capitalize font-mono">
                          {String(savedResult.metadata?.speech_emotion)} (
                          {Math.round(Number(savedResult.metadata?.speech_confidence || 0.9) * 100)}%)
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 italic text-[11px]">
                      &ldquo;{String(savedResult.metadata?.transcript)}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* 7-Emotion Probability Distribution */}
              <div className="glass-card rounded-2xl p-5 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    Emotion Probability Distribution
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {savedResult.model_name.includes("Dual") ? "Fused Probabilities" : "Acoustic Scores"}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {emotionsList.map((emo) => {
                    const meta = EMOTION_META[emo];
                    const prob = savedResult.probabilities[emo] || 0;
                    const percent = Math.round(prob * 100);
                    const isDominant = savedResult.emotion === emo;

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
                              isDominant ? "text-purple-300 font-bold" : "text-slate-400"
                            }`}
                          >
                            {percent}%
                          </span>
                        </div>

                        <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800/80">
                          <div
                            className="h-full rounded-full transition-all duration-300 ease-out"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: isDominant ? "#c084fc" : meta.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card rounded-2xl p-8 border border-slate-800 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
                <FileAudio className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Awaiting Voice Input</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Click <strong className="text-purple-400">Start Recording</strong> to speak, or pick a sample phrase, then click <strong className="text-cyan-400">Analyze Voice</strong> to evaluate voice emotion.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default VoiceEmotion;
