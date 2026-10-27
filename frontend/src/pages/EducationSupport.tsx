import React, { useState, useMemo, useCallback } from "react";
import {
  GraduationCap,
  Camera,
  MessageSquare,
  Mic,
  Sparkles,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Activity,
  ShieldCheck,
  CameraOff,
  MicOff,
  Play,
  Square,
  ChevronDown,
  ChevronUp,
  Info,
  BookOpen,
  Lightbulb,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  AudioAnalysisResponse,
  EmotionType,
  EMOTION_META,
  FaceAnalysisResponse,
  TextAnalysisResponse,
} from "../types/emotion";
import { LiveFaceDetector } from "../components/LiveFaceDetector";
import { analyzeText, analyzeAudio } from "../services/api";

/* ── Types ── */
interface LearningEntry {
  id: number;
  timestamp: string;
  studentText?: string;
  textEmotion?: EmotionType;
  textConf?: number;
  faceEmotion?: EmotionType;
  faceConf?: number;
  voiceEmotion?: EmotionType;
  voiceConf?: number;
  fusedEmotion: EmotionType;
  fusedConf: number;
  suggestions: LearningAction[];
}

interface LearningAction {
  icon: string;
  label: string;
  description: string;
}

/* ── Helpers ── */
const EMOTIONS: EmotionType[] = ["happy", "sad", "angry", "fear", "surprise", "disgust", "neutral"];

function computeFusion(
  face: FaceAnalysisResponse | null,
  text: TextAnalysisResponse | null,
  voice: AudioAnalysisResponse | null
): { emotion: EmotionType; confidence: number } | null {
  const active = [face, text, voice].filter(Boolean);
  if (active.length === 0) return null;
  const weight = 1 / active.length;
  const probs: Record<EmotionType, number> = {
    happy: 0, sad: 0, angry: 0, fear: 0, surprise: 0, disgust: 0, neutral: 0,
  };
  for (const emo of EMOTIONS) {
    if (face) probs[emo] += weight * (face.probabilities[emo] || 0);
    if (text) probs[emo] += weight * (text.probabilities[emo] || 0);
    if (voice) probs[emo] += weight * (voice.probabilities[emo] || 0);
  }
  let top: EmotionType = "neutral";
  let maxP = 0;
  for (const emo of EMOTIONS) { if (probs[emo] > maxP) { maxP = probs[emo]; top = emo; } }
  return { emotion: top, confidence: Math.round(maxP * 100) / 100 };
}

function getLearningSuggestions(emotion: EmotionType, hasText: boolean, studentText?: string): LearningAction[] {
  /* The suggestions are based primarily on what the student wrote/said, not on assumed facial meaning */
  const confusionKeywords = ["don't understand", "confused", "difficult", "again", "times", "still", "cannot", "can't", "unclear", "help"];
  const isConfused = studentText
    ? confusionKeywords.some((k) => studentText.toLowerCase().includes(k))
    : false;

  if (isConfused || emotion === "fear" || emotion === "sad") {
    return [
      { icon: "🔤", label: "Simplify the explanation", description: "Break the concept down into smaller, simpler steps using familiar language." },
      { icon: "🧩", label: "Show a step-by-step example", description: "Walk through a concrete worked example from beginning to end." },
      { icon: "📝", label: "Offer a short revision exercise", description: "Provide a brief practice problem to consolidate understanding." },
      { icon: "🙋", label: "Invite the student to ask for help", description: "Remind the student that reaching out to the teacher or a peer is always an option." },
    ];
  }
  if (emotion === "angry" || emotion === "disgust") {
    return [
      { icon: "🤝", label: "Acknowledge the frustration", description: "Validate that finding certain topics difficult is normal and expected." },
      { icon: "🔄", label: "Try a different learning format", description: "Switch to a video, diagram, or interactive simulation to present the concept differently." },
      { icon: "⏸️", label: "Suggest a short break", description: "A brief pause (5–10 minutes) can help reset focus and reduce cognitive overload." },
    ];
  }
  if (emotion === "surprise") {
    return [
      { icon: "💡", label: "Explore the new idea further", description: "Encourage the student to ask questions about what surprised them." },
      { icon: "🔗", label: "Connect to prior knowledge", description: "Link the surprising concept to something the student already understands." },
    ];
  }
  if (emotion === "happy") {
    return [
      { icon: "🚀", label: "Extend learning with a challenge", description: "Offer an optional advanced task or bonus question to maintain engagement." },
      { icon: "✅", label: "Celebrate the progress", description: "Acknowledge the student's positive momentum and encourage continued effort." },
    ];
  }
  /* neutral or default */
  return [
    { icon: "📖", label: "Check comprehension", description: "Ask the student to summarise the key points in their own words." },
    { icon: "❓", label: "Invite questions", description: "Ask: 'Is there any part you would like to revisit or discuss further?'" },
    { icon: "🎯", label: "Set a clear next step", description: "Define a specific, achievable learning goal for the next session." },
  ];
}

/* ── Demo Scenarios ── */
const DEMO_SCENARIOS = [
  {
    label: "Struggling with Concept",
    text: "I have read this chapter three times, but I still cannot understand how recursion works.",
  },
  {
    label: "Frustrated with Homework",
    text: "This assignment is too difficult and the instructions are not clear at all.",
  },
  {
    label: "Making Progress",
    text: "I finally understood how sorting algorithms work! The visual diagram really helped me.",
  },
  {
    label: "Needs Clarification",
    text: "I understand the theory but I am not sure how to apply it to real problems.",
  },
];

/* ══════════════════════════════════════════════════════════════════ */
export const EducationSupport: React.FC = () => {
  /* Camera */
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [faceResult, setFaceResult] = useState<FaceAnalysisResponse | null>(null);

  /* Text */
  const [studentText, setStudentText] = useState("");
  const [textResult, setTextResult] = useState<TextAnalysisResponse | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);

  /* Voice */
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voiceResult, setVoiceResult] = useState<AudioAnalysisResponse | null>(null);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  /* Session */
  const [sessionHistory, setSessionHistory] = useState<LearningEntry[]>([]);
  const [sessionCounter, setSessionCounter] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [teacherViewEnabled, setTeacherViewEnabled] = useState(false);
  const [teacherConsentGiven, setTeacherConsentGiven] = useState(false);

  /* ── Fusion ── */
  const fusion = useMemo(
    () => computeFusion(faceResult, textResult, voiceResult),
    [faceResult, textResult, voiceResult]
  );
  const suggestions = useMemo(
    () => (fusion ? getLearningSuggestions(fusion.emotion, !!textResult, studentText) : []),
    [fusion, textResult, studentText]
  );

  /* ── Text Analysis ── */
  const handleAnalyzeText = async () => {
    if (!studentText.trim()) { setTextError("Please enter the student's message."); return; }
    setTextLoading(true);
    setTextError(null);
    try {
      const res = await analyzeText(studentText.trim());
      setTextResult(res);
    } catch (e: unknown) {
      setTextError(e instanceof Error ? e.message : "Text analysis failed.");
    } finally {
      setTextLoading(false);
    }
  };

  /* ── Microphone Recording ── */
  const startRecording = async () => {
    setVoiceError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      setIsRecording(true);
    } catch {
      setVoiceError("Microphone permission denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAnalyzeVoice = async () => {
    if (!audioBlob) { setVoiceError("Please record audio first."); return; }
    setVoiceLoading(true);
    setVoiceError(null);
    try {
      const res = await analyzeAudio(audioBlob, undefined, "acoustic");
      setVoiceResult(res);
    } catch (e: unknown) {
      setVoiceError(e instanceof Error ? e.message : "Voice analysis failed.");
    } finally {
      setVoiceLoading(false);
    }
  };

  /* ── Save to Session ── */
  const handleSaveToSession = useCallback(() => {
    if (!fusion) return;
    const entry: LearningEntry = {
      id: sessionCounter + 1,
      timestamp: new Date().toLocaleTimeString(),
      studentText: studentText || undefined,
      textEmotion: textResult?.emotion,
      textConf: textResult?.confidence,
      faceEmotion: faceResult?.emotion,
      faceConf: faceResult?.confidence,
      voiceEmotion: voiceResult?.emotion,
      voiceConf: voiceResult?.confidence,
      fusedEmotion: fusion.emotion,
      fusedConf: fusion.confidence,
      suggestions: suggestions.slice(0, 3),
    };
    setSessionHistory((prev) => [entry, ...prev]);
    setSessionCounter((c) => c + 1);
  }, [fusion, studentText, textResult, faceResult, voiceResult, suggestions, sessionCounter]);

  /* ── Clear ── */
  const clearAll = () => {
    setStudentText("");
    setTextResult(null);
    setFaceResult(null);
    setVoiceResult(null);
    setAudioBlob(null);
    setTextError(null);
    setVoiceError(null);
  };

  const activeCount = (faceResult ? 1 : 0) + (textResult ? 1 : 0) + (voiceResult ? 1 : 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-500 p-[1.5px]">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Education Emotion Support
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 uppercase font-mono">
                Student Learning
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalized learning support based on student feedback — not for grading or discipline.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
          {fusion && (
            <button
              onClick={handleSaveToSession}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all"
            >
              <Activity className="w-3.5 h-3.5" />
              Save to Session
            </button>
          )}
        </div>
      </div>

      {/* ── Notice ── */}
      <div className="p-4 rounded-2xl bg-blue-500/8 border border-blue-500/20 flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <div className="text-slate-300 leading-relaxed">
          <strong className="text-blue-300">Learning Support Reminder: </strong>
          Suggestions are based primarily on what the student writes or says. A neutral or confused
          facial expression does not necessarily indicate boredom or disengagement. Emotion
          predictions are estimates and{" "}
          <strong className="text-blue-200">must not be used for grading, assessment, or discipline</strong>.
        </div>
      </div>

      {/* ── Demo Scenarios ── */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          Demo Student Feedback Scenarios
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono normal-case">
            Click to load
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {DEMO_SCENARIOS.map((s, i) => (
            <button
              key={i}
              onClick={() => setStudentText(s.text)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/30 text-xs text-slate-300 transition-all"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main 3-Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── 1. Camera Module ── */}
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-white">Facial Expression</span>
            </div>
            <button
              onClick={() => { setCameraEnabled((v) => !v); if (cameraEnabled) setFaceResult(null); }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                cameraEnabled
                  ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-rose-500/15 hover:text-rose-300 hover:border-rose-500/30"
                  : "bg-slate-900 text-slate-400 border-slate-700 hover:text-cyan-300 hover:border-cyan-500/30"
              }`}
            >
              {cameraEnabled ? (
                <><CameraOff className="w-3 h-3" />Stop Camera</>
              ) : (
                <><Camera className="w-3 h-3" />Start Camera</>
              )}
            </button>
          </div>

          <div className="p-4 flex-1">
            {cameraEnabled ? (
              <LiveFaceDetector onEmotionUpdate={setFaceResult} compact />
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                  <CameraOff className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-500">
                  Camera is optional. Facial analysis supplements student feedback but is not interpreted alone.
                </p>
              </div>
            )}
            {faceResult && (
              <div className="mt-3 p-3 rounded-xl bg-cyan-500/8 border border-cyan-500/20 flex items-center gap-2 text-xs">
                <span className="text-xl">{EMOTION_META[faceResult.emotion].emoji}</span>
                <div>
                  <span className="font-bold text-white capitalize">{faceResult.emotion}</span>
                  <span className="text-slate-400 ml-2">Conf: {(faceResult.confidence * 100).toFixed(0)}%</span>
                </div>
                <span className="ml-auto text-[10px] text-slate-500 italic">facial only</span>
              </div>
            )}
          </div>
        </div>

        {/* ── 2. Text Module ── */}
        <div className="glass-card rounded-2xl border border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-white">Student Feedback (Text)</span>
          </div>

          <div className="p-4 flex-1 flex flex-col gap-3">
            <textarea
              rows={5}
              value={studentText}
              onChange={(e) => setStudentText(e.target.value)}
              placeholder="Student types their feedback, question, or reflection here..."
              className="w-full rounded-xl bg-slate-950/80 border border-slate-800 p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all resize-none"
            />

            {textError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {textError}
              </div>
            )}

            <button
              onClick={handleAnalyzeText}
              disabled={textLoading || !studentText.trim()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-blue-500/20 transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
            >
              {textLoading ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Analyzing...</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" />Analyze Feedback</>
              )}
            </button>

            {textResult && (
              <div className="p-3 rounded-xl bg-blue-500/8 border border-blue-500/20 flex items-center gap-2 text-xs">
                <span className="text-xl">{EMOTION_META[textResult.emotion].emoji}</span>
                <div>
                  <span className="font-bold text-white capitalize">{textResult.emotion}</span>
                  <span className="text-slate-400 ml-2">Conf: {(textResult.confidence * 100).toFixed(0)}%</span>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
              </div>
            )}
          </div>
        </div>

        {/* ── 3. Voice Module ── */}
        <div className="glass-card rounded-2xl border border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-bold text-white">Voice Analysis</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Acoustic prosody</span>
          </div>

          <div className="p-4 flex-1 flex flex-col gap-3">
            <p className="text-xs text-slate-400 leading-relaxed">
              Analyzes vocal tone and energy characteristics — supplements text feedback, not a replacement.
            </p>

            {voiceError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {voiceError}
              </div>
            )}

            <div className="flex gap-2">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold animate-pulse"
                >
                  <Square className="w-3.5 h-3.5" />
                  Stop Recording
                </button>
              )}
            </div>

            {audioBlob && !isRecording && (
              <button
                onClick={handleAnalyzeVoice}
                disabled={voiceLoading}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-bold text-xs shadow-lg transition-all hover:scale-105 disabled:opacity-40"
              >
                {voiceLoading ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Analyzing...</>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5" />Analyze Voice</>
                )}
              </button>
            )}

            {!audioBlob && !isRecording && (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <MicOff className="w-6 h-6 text-slate-600 mb-2" />
                <p className="text-xs text-slate-500">Voice analysis is optional.</p>
              </div>
            )}

            {voiceResult && (
              <div className="p-3 rounded-xl bg-purple-500/8 border border-purple-500/20 flex items-center gap-2 text-xs">
                <span className="text-xl">{EMOTION_META[voiceResult.emotion].emoji}</span>
                <div>
                  <span className="font-bold text-white capitalize">{voiceResult.emotion}</span>
                  <span className="text-slate-400 ml-2">Conf: {(voiceResult.confidence * 100).toFixed(0)}%</span>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Multimodal Fusion + Learning Support ── */}
      {fusion ? (
        <div className="relative rounded-3xl p-8 bg-gradient-to-r from-slate-950 via-[#071020] to-slate-950 border border-blue-500/30 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Combined Result */}
              <div className="w-full md:w-1/4 p-6 rounded-2xl bg-slate-950/80 border border-blue-500/20 text-center shadow-xl shrink-0">
                <div className="text-xs uppercase tracking-widest font-mono text-blue-400 mb-2">
                  Combined Estimate
                </div>
                <div className="text-6xl my-2 filter drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  {EMOTION_META[fusion.emotion].emoji}
                </div>
                <div className="text-2xl font-black text-white tracking-wider uppercase mb-1">
                  {fusion.emotion}
                </div>
                <div className="text-sm text-slate-400">
                  Confidence:{" "}
                  <span className="text-blue-300 font-bold font-mono">{(fusion.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="mt-1 text-[10px] text-slate-500 font-mono">
                  {activeCount} of 3 modalities
                </div>
              </div>

              {/* Modality Breakdown */}
              <div className="w-full space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Modality Breakdown</h4>
                {[
                  { label: "Facial Expression", result: faceResult, icon: <Camera className="w-3.5 h-3.5 text-cyan-400" />, note: "supplement only" },
                  { label: "Student Feedback", result: textResult, icon: <MessageSquare className="w-3.5 h-3.5 text-blue-400" />, note: "primary signal" },
                  { label: "Voice Acoustics", result: voiceResult, icon: <Mic className="w-3.5 h-3.5 text-purple-400" />, note: "supplement only" },
                ].map(({ label, result, icon, note }) => (
                  <div key={label} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      {icon}
                      <span className="text-slate-300 font-medium">{label}</span>
                      <span className="text-slate-600 italic text-[10px]">({note})</span>
                    </div>
                    {result ? (
                      <div className="flex items-center gap-1.5">
                        <span>{EMOTION_META[result.emotion].emoji}</span>
                        <span className="font-bold text-white capitalize">{result.emotion}</span>
                        <span className="text-slate-400 font-mono">{(result.confidence * 100).toFixed(0)}%</span>
                      </div>
                    ) : (
                      <span className="text-slate-600 italic">Not provided</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Support Actions */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-blue-400" />
                Learning Support Suggestions
                <span className="text-xs font-normal text-slate-400 font-mono normal-case">
                  — based primarily on student feedback
                </span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestions.map((s, i) => (
                  <div key={i} className="p-4 rounded-xl bg-blue-500/8 border border-blue-500/20 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span>{s.icon}</span>
                      <span className="font-bold text-white text-xs">{s.label}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed pl-6">{s.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-10 rounded-3xl bg-slate-950/60 border border-slate-800 text-center flex flex-col items-center">
          <BookOpen className="w-10 h-10 text-slate-700 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Awaiting Student Feedback</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Have the student enter their feedback, enable the camera, or record their voice to generate personalized learning support suggestions.
          </p>
        </div>
      )}

      {/* ── Privacy ── */}
      <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center gap-3 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <strong className="text-white">Privacy: </strong>
          Camera and microphone access requires explicit permission. Data is processed in real time
          and not permanently stored. Session data is cleared when you click "Clear Session."
        </span>
      </div>

      {/* ── Teacher View Toggle ── */}
      <div className="glass-card rounded-2xl border border-slate-800 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-white">Teacher Support View</span>
            <span className="text-xs text-slate-500 font-mono">— requires student consent</span>
          </div>
          <button
            onClick={() => {
              if (!teacherConsentGiven) {
                const confirmed = window.confirm(
                  "The student must consent before their session summary is shared with the teacher. Has the student given permission to share this summary?"
                );
                if (confirmed) {
                  setTeacherConsentGiven(true);
                  setTeacherViewEnabled(true);
                }
              } else {
                setTeacherViewEnabled((v) => !v);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              teacherViewEnabled
                ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                : "bg-slate-900 text-slate-400 border-slate-700 hover:border-blue-500/30"
            }`}
          >
            {teacherViewEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {teacherViewEnabled ? "Hide Teacher View" : "Enable Teacher View"}
          </button>
        </div>

        {teacherViewEnabled && teacherConsentGiven && (
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Student consent confirmed — sharing session summary.
            </p>
            {sessionHistory.length === 0 ? (
              <p className="text-xs text-slate-500">No session entries yet to share.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-300">Session Summary ({sessionHistory.length} entries):</p>
                {sessionHistory.slice(0, 3).map((entry) => (
                  <div key={entry.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500">#{entry.id} · {entry.timestamp}</span>
                      <span>{EMOTION_META[entry.fusedEmotion].emoji}</span>
                      <span className="text-white font-bold capitalize">{entry.fusedEmotion}</span>
                    </div>
                    {entry.studentText && <p className="text-slate-400 italic truncate">"{entry.studentText}"</p>}
                    {entry.suggestions[0] && <p className="text-slate-400">Suggested: {entry.suggestions[0].label}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Session History ── */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <button
          onClick={() => setHistoryOpen((v) => !v)}
          className="w-full flex items-center justify-between p-4 text-sm font-bold text-white hover:bg-slate-900/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Learning Session History
            {sessionHistory.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono border border-blue-500/30">
                {sessionHistory.length} entries
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {sessionHistory.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSessionHistory([]);
                  setTeacherConsentGiven(false);
                  setTeacherViewEnabled(false);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 text-rose-400 hover:bg-rose-500/10 text-xs transition-all"
              >
                <Trash2 className="w-3 h-3" />
                Clear Session
              </button>
            )}
            {historyOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {historyOpen && (
          <div className="border-t border-slate-800 divide-y divide-slate-800/60">
            {sessionHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <Info className="w-5 h-5 text-slate-700 mx-auto mb-2" />
                No session entries yet. Analyze feedback and click "Save to Session."
              </div>
            ) : (
              sessionHistory.map((entry) => (
                <div key={entry.id} className="p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-500">#{entry.id} · {entry.timestamp}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{EMOTION_META[entry.fusedEmotion].emoji}</span>
                      <span className="font-bold text-white capitalize">{entry.fusedEmotion}</span>
                      <span className="text-slate-400">({(entry.fusedConf * 100).toFixed(0)}%)</span>
                    </div>
                  </div>
                  {entry.studentText && (
                    <p className="text-slate-400 italic truncate">"{entry.studentText}"</p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {entry.faceEmotion && <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">Face: {entry.faceEmotion}</span>}
                    {entry.textEmotion && <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">Text: {entry.textEmotion}</span>}
                    {entry.voiceEmotion && <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">Voice: {entry.voiceEmotion}</span>}
                  </div>
                  {entry.suggestions[0] && (
                    <p className="text-slate-400 leading-relaxed">{entry.suggestions[0].icon} {entry.suggestions[0].label}: {entry.suggestions[0].description}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
