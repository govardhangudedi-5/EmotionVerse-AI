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
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-950 via-[#0c1329] to-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Multi-Modal Human Emotion Intelligence</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              EmotionVerse AI
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Real-time continuous facial expression recognition, speech prosody acoustic analysis,
              and natural language sentiment late fusion for Healthcare and Education support.
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate("live-face")}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs tracking-wide shadow-lg shadow-cyan-500/25 transition-all hover:scale-105"
            >
              <Camera className="w-4 h-4 text-slate-950" />
              <span>Open Live Camera</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
            </button>

            <button
              onClick={() => onNavigate("multimodal")}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs tracking-wide transition-all"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Multimodal Fusion</span>
            </button>
          </div>
        </div>

        {/* Domain Mode Switcher Pill */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Active Domain Mode:</span>
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setContextMode("education")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                  contextMode === "education"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Education & Student Engagement
              </button>
              <button
                onClick={() => setContextMode("healthcare")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                  contextMode === "healthcare"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5" />
                Healthcare & Wellness Support
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              {activeModalitiesCount} / 3 Modalities Active
            </span>
          </div>
        </div>
      </div>

      {/* SECTION: LIVE CAMERA DASHBOARD (Section 23 Core Requirement) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-cyan-400" />
              Live Continuous Facial Emotion Detection
            </h2>
            <p className="text-xs text-slate-400">
              Camera continuously analyzes facial expressions and auto-updates the detected emotion
              in real time without requiring manual captures.
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

        {/* Live Camera Stream with Instant Emotion & 7-Emotion Bars */}
        <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl">
          <LiveFaceDetector onEmotionUpdate={setFaceResult} />
        </div>
      </section>

      {/* SECTION: TRI-MODAL PERCEPTION STATUS CARDS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Tri-Modal Sensory Intelligence Status
            </h3>
            <p className="text-xs text-slate-400">
              Independent perceptual pipelines feeding into late multimodal fusion
            </p>
          </div>
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
                Computer Vision & Action Units analyzing mouth curvature, brow furrow, and eye aperture.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              {faceResult ? (
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {EMOTION_META[faceResult.emotion]?.emoji || "😐"}
                  </span>
                  <div>
                    <span className="font-bold text-white capitalize block text-xs">
                      {faceResult.emotion}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Conf: {(faceResult.confidence * 100).toFixed(0)}%
                    </span>
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
                  <span className="text-xl">
                    {EMOTION_META[textResult.emotion]?.emoji || "😐"}
                  </span>
                  <div>
                    <span className="font-bold text-white capitalize block text-xs">
                      {textResult.emotion}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Conf: {(textResult.confidence * 100).toFixed(0)}%
                    </span>
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
                  <span className="text-xl">
                    {EMOTION_META[audioResult.emotion]?.emoji || "😐"}
                  </span>
                  <div>
                    <span className="font-bold text-white capitalize block text-xs">
                      {audioResult.emotion}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Conf: {(audioResult.confidence * 100).toFixed(0)}%
                    </span>
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

      {/* Multimodal Quick Launch Teaser */}
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

      {/* Privacy Notice Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-white">Privacy Notice:</strong> Camera and microphone data are processed for emotion analysis in real time. Raw frames are never permanently stored without explicit consent.
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
