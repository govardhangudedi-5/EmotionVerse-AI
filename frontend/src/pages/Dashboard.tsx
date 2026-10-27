import React from "react";
import {
  Camera,
  Mic,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  HeartPulse,
  GraduationCap,
  Activity,
  CheckCircle2,
  Play,
  BookOpen,
  Stethoscope,
  Brain,
} from "lucide-react";
import {
  AudioAnalysisResponse,
  ContextMode,
  FaceAnalysisResponse,
  MultimodalFusionResponse,
  TextAnalysisResponse,
  EMOTION_META,
} from "../types/emotion";
import { LiveFaceDetector } from "../components/LiveFaceDetector";

interface DashboardProps {
  contextMode: ContextMode;
  setContextMode: (mode: ContextMode) => void;
  onNavigate: (tab: any) => void;
  faceResult: FaceAnalysisResponse | null;
  setFaceResult: (res: FaceAnalysisResponse | null) => void;
  audioResult: AudioAnalysisResponse | null;
  textResult: TextAnalysisResponse | null;
  fusionResult: MultimodalFusionResponse | null;
}

export const Dashboard: React.FC<DashboardProps> = ({
  contextMode,
  setContextMode,
  onNavigate,
  faceResult,
  setFaceResult,
  audioResult,
  textResult,
  fusionResult,
}) => {
  const activeModalitiesCount =
    (faceResult ? 1 : 0) + (audioResult ? 1 : 0) + (textResult ? 1 : 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ══════════════════════════════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-950 via-[#0c1329] to-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Multi-Modal Human Emotion Intelligence</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              EmotionVerse AI
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Real-time multi-modal emotion intelligence for{" "}
              <span className="text-rose-300 font-semibold">Healthcare patient communication</span>{" "}
              and{" "}
              <span className="text-blue-300 font-semibold">Education learning support</span>.
              Combines facial expressions, voice acoustics, and natural language understanding.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate("healthcare")}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-extrabold text-xs tracking-wide shadow-lg shadow-rose-500/25 transition-all hover:scale-105"
            >
              <HeartPulse className="w-4 h-4" />
              <span>Healthcare Support</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onNavigate("education")}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-extrabold text-xs tracking-wide shadow-lg shadow-blue-500/25 transition-all hover:scale-105"
            >
              <GraduationCap className="w-4 h-4 text-slate-950" />
              <span>Education Support</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Active modalities status */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              {activeModalitiesCount} / 3 Modalities Active
            </span>
            {faceResult && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                <Camera className="w-3 h-3" />Face
              </span>
            )}
            {textResult && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                <MessageSquare className="w-3 h-3" />Text
              </span>
            )}
            {audioResult && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                <Mic className="w-3 h-3" />Voice
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TWO PRIMARY APPLICATION MODULES — PROMINENTLY FEATURED
      ══════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-400" />
            Primary Application Areas
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Select your application domain to begin. Both modules use the same AI models — tailored
            for their specific context.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ── Healthcare Card ── */}
          <div
            onClick={() => onNavigate("healthcare")}
            className="group relative rounded-3xl p-7 border border-rose-500/25 bg-gradient-to-br from-slate-950 via-[#1a0815] to-slate-950 hover:border-rose-500/50 cursor-pointer overflow-hidden transition-all hover:shadow-2xl hover:shadow-rose-500/10 hover:scale-[1.01]"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/8 rounded-full blur-3xl pointer-events-none group-hover:bg-rose-500/15 transition-all" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              {/* Icon + Badge */}
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 p-[1.5px] shadow-lg shadow-rose-500/25">
                  <div className="w-full h-full bg-[#12060f] rounded-[14px] flex items-center justify-center">
                    <HeartPulse className="w-7 h-7 text-rose-400" />
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
                  Module 1
                </span>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-xl font-black text-white group-hover:text-rose-200 transition-colors">
                  Healthcare Emotion Support
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Supports patient–clinician communication by analyzing emotional signals from
                  patient feedback, facial expressions, and vocal tone.
                </p>
              </div>

              {/* Feature List */}
              <div className="space-y-2 text-xs">
                {[
                  "Optional live webcam facial expression analysis",
                  "Context-based NLP text analysis of patient messages",
                  "Acoustic voice emotion analysis (pitch, energy, cadence)",
                  "Combined multimodal estimate with confidence scores",
                  "Communication support suggestions for care teams",
                  "Session history with privacy controls",
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                  <Stethoscope className="w-3.5 h-3.5 text-rose-500" />
                  <span>Not a diagnostic device — supports communication only</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-400 group-hover:text-rose-300 transition-colors">
                  <span className="text-xs font-bold">Open</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Education Card ── */}
          <div
            onClick={() => onNavigate("education")}
            className="group relative rounded-3xl p-7 border border-blue-500/25 bg-gradient-to-br from-slate-950 via-[#050e1a] to-slate-950 hover:border-blue-500/50 cursor-pointer overflow-hidden transition-all hover:shadow-2xl hover:shadow-blue-500/10 hover:scale-[1.01]"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/8 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/15 transition-all" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              {/* Icon + Badge */}
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-500 p-[1.5px] shadow-lg shadow-blue-500/25">
                  <div className="w-full h-full bg-[#05080f] rounded-[14px] flex items-center justify-center">
                    <GraduationCap className="w-7 h-7 text-blue-400" />
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                  Module 2
                </span>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-xl font-black text-white group-hover:text-blue-200 transition-colors">
                  Education Emotion Support
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Supports personalised learning by understanding student feedback, difficulty
                  signals, and emotional state to generate targeted learning suggestions.
                </p>
              </div>

              {/* Feature List */}
              <div className="space-y-2 text-xs">
                {[
                  "Optional live facial expression analysis during sessions",
                  "NLP analysis of student written or spoken feedback",
                  "Voice acoustic emotion analysis (tone, energy)",
                  "Multimodal combined estimate when multiple inputs active",
                  "Actionable learning support suggestions (simplify, practice, ask)",
                  "Teacher view with student consent requirement",
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  <span>Not for grading or discipline — supports learning only</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-400 group-hover:text-blue-300 transition-colors">
                  <span className="text-xs font-bold">Open</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          LIVE CAMERA SECTION (General Emotion Analysis)
      ══════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              Live Continuous Facial Emotion Detection
            </h2>
            <p className="text-xs text-slate-400">
              General-purpose emotion detection. Use within either module for domain-specific support.
            </p>
          </div>

          <button
            onClick={() => onNavigate("live-face")}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <span>Full Camera Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl">
          <LiveFaceDetector onEmotionUpdate={setFaceResult} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TRI-MODAL STATUS CARDS
      ══════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Tri-Modal Sensory Intelligence
          </h3>
          <p className="text-xs text-slate-400">
            Three independent perceptual pipelines feeding into late multimodal fusion
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Live Face Card */}
          <div
            onClick={() => onNavigate("live-face")}
            className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                {faceResult ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">Ready</span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                Module 1: Live Face Emotion
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Computer Vision analyzing mouth curvature, brow furrow, and eye aperture.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              {faceResult ? (
                <div className="flex items-center gap-2">
                  <span className="text-xl">{EMOTION_META[faceResult.emotion]?.emoji || "😐"}</span>
                  <div>
                    <span className="font-bold text-white capitalize block text-xs">{faceResult.emotion}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Conf: {(faceResult.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ) : (
                <span className="text-slate-500 text-[11px]">No active face stream</span>
              )}
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>

          {/* 2. Text Emotion Card */}
          <div
            onClick={() => onNavigate("text")}
            className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-blue-500/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                {textResult ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    Analyzed
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">Ready</span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                Module 2: Text Emotion
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                NLP semantic valence and emotional intensity classifier across 7 canonical classes.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              {textResult ? (
                <div className="flex items-center gap-2">
                  <span className="text-xl">{EMOTION_META[textResult.emotion]?.emoji || "😐"}</span>
                  <div>
                    <span className="font-bold text-white capitalize block text-xs">{textResult.emotion}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Conf: {(textResult.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ) : (
                <span className="text-slate-500 text-[11px]">Enter a message to analyze</span>
              )}
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>

          {/* 3. Voice Emotion Card */}
          <div
            onClick={() => onNavigate("voice")}
            className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <Mic className="w-5 h-5" />
                </div>
                {audioResult ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    Recorded
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">Ready</span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                Module 3: Voice Emotion
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Acoustic prosody extracting pitch (F0), RMS energy, spectral centroid, and speech-to-text.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              {audioResult ? (
                <div className="flex items-center gap-2">
                  <span className="text-xl">{EMOTION_META[audioResult.emotion]?.emoji || "😐"}</span>
                  <div>
                    <span className="font-bold text-white capitalize block text-xs">{audioResult.emotion}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Conf: {(audioResult.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ) : (
                <span className="text-slate-500 text-[11px]">Record microphone audio</span>
              )}
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          MULTIMODAL FUSION LAUNCH
      ══════════════════════════════════════════════════════════════ */}
      <div className="glass-card rounded-2xl p-6 border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-md shadow-cyan-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Execute Real-Time Multimodal Late Fusion</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono">
                {activeModalitiesCount} Active Inputs
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              Fuses Live Camera + Text + Voice with dynamic confidence weighting and cross-modal agreement.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate("multimodal")}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 shrink-0"
        >
          <span>Open Multimodal Fusion</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          HOW IT WORKS — WORKFLOW OVERVIEW
      ══════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Play className="w-4 h-4 text-cyan-400" />
          Demonstration Workflows
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Healthcare workflow */}
          <div className="glass-card rounded-2xl p-5 border border-rose-500/20 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-rose-300">
              <HeartPulse className="w-4 h-4" />
              Healthcare Demonstration
            </div>
            <div className="space-y-2 text-xs">
              {[
                { step: "1", label: "Patient enters feedback", desc: '"I am worried about my upcoming treatment."' },
                { step: "2", label: "Text NLP analysis", desc: "Model analyzes full sentence context → detects fear/anxiety" },
                { step: "3", label: "Optional: face + voice", desc: "Camera and mic capture independent acoustic/visual signals" },
                { step: "4", label: "Combined estimate", desc: "Multimodal fusion with normalized weights across active modalities" },
                { step: "5", label: "Support suggestion", desc: '"Consider asking the patient about their treatment concerns."' },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold flex items-center justify-center shrink-0 border border-rose-500/30">
                    {s.step}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-300">{s.label}: </span>
                    <span className="text-slate-500 italic">{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigate("healthcare")}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all"
            >
              <HeartPulse className="w-3.5 h-3.5" />
              Open Healthcare Module
            </button>
          </div>

          {/* Education workflow */}
          <div className="glass-card rounded-2xl p-5 border border-blue-500/20 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-300">
              <GraduationCap className="w-4 h-4" />
              Education Demonstration
            </div>
            <div className="space-y-2 text-xs">
              {[
                { step: "1", label: "Student enters feedback", desc: '"I read this chapter 3 times but still cannot understand it."' },
                { step: "2", label: "Text NLP analysis", desc: "Model detects confusion/frustration from sentence meaning" },
                { step: "3", label: "Optional: face + voice", desc: "Supplements text but does not override explicit student feedback" },
                { step: "4", label: "Combined estimate", desc: "Multimodal fusion across available inputs with confidence scores" },
                { step: "5", label: "Learning support", desc: "Simplify, show step-by-step example, invite teacher help" },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0 border border-blue-500/30">
                    {s.step}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-300">{s.label}: </span>
                    <span className="text-slate-500 italic">{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigate("education")}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Open Education Module
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PRIVACY NOTICE
      ══════════════════════════════════════════════════════════════ */}
      <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-white">Privacy Notice:</strong> Camera and microphone data are
            processed for emotion analysis in real time. Raw frames are never permanently stored
            without explicit consent. Camera and voice access is always optional.
          </span>
        </div>
        <button
          onClick={() => onNavigate("privacy")}
          className="text-cyan-400 hover:text-cyan-300 font-semibold underline shrink-0 ml-3"
        >
          Learn More
        </button>
      </div>
    </div>
  );
};
