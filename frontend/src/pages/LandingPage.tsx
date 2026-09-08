import React from "react";
import {
  Brain,
  Camera,
  Mic,
  MessageSquare,
  Cpu,
  Sparkles,
  ArrowRight,
  GraduationCap,
  HeartPulse,
  CheckCircle2,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { ContextMode } from "../types/emotion";

interface LandingPageProps {
  onStartAnalysis: () => void;
  onExploreResults: () => void;
  contextMode: ContextMode;
  setContextMode: (mode: ContextMode) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAnalysis,
  onExploreResults,
  contextMode,
  setContextMode,
}) => {
  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-8 flex flex-col items-center text-center max-w-4xl mx-auto px-4">
        {/* Glowing badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-6 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Multi-Modal Human Emotion Intelligence System</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight mb-4">
          <span className="gradient-text-cyber">EmotionVerse AI</span>
        </h1>

        {/* Subtitle */}
        <h2 className="text-lg sm:text-2xl font-semibold text-slate-200 mb-4 max-w-2xl">
          Understanding Human Emotions Through Face, Voice, and Text
        </h2>

        {/* Description */}
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mb-8 leading-relaxed">
          An AI-powered academic platform combining computer vision, audio acoustic prosody,
          and natural language semantics through late fusion algorithms to deliver real-time
          emotional awareness for Healthcare and Education support.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onStartAnalysis}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Launch Analysis Studio</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>

          <button
            onClick={onExploreResults}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all hover:border-slate-600"
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Explore Dashboard</span>
          </button>
        </div>

        {/* Context Mode Selector pills */}
        <div className="mt-8 flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs">
          <span className="text-slate-400 px-3 font-medium">Domain Mode:</span>
          <button
            onClick={() => setContextMode("education")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
              contextMode === "education"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Education & Learning
          </button>
          <button
            onClick={() => setContextMode("healthcare")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
              contextMode === "healthcare"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            Healthcare & Support
          </button>
        </div>
      </section>

      {/* THREE MODALITIES CARDS */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Tri-Modal Perception Layer
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Independently trained perceptual sensory pipelines designed for late multimodal fusion
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Facial Modality */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between group hover:border-cyan-500/40 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">👁 Facial Expression</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Real-time webcam or image face detection with OpenCV Haar Cascades, facial landmark
                geometry, mouth curvature, and brow furrow tension scoring.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2 text-cyan-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Webcam Live Frame Capture & ROI Bounding Box</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pluggable CNN / Vision Transformer Weights</span>
              </div>
            </div>
          </div>

          {/* 2. Voice Modality */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between group hover:border-purple-500/40 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                <Mic className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">🎙 Voice Acoustics</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Browser microphone recording and soundfile audio analysis extracting fundamental
                pitch (F0), RMS acoustic energy, spectral centroid, and zero-crossing dynamics.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2 text-purple-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Web Audio API Real-time Waveform Canvas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>WAV, MP3, WEBM & OGG Decoding</span>
              </div>
            </div>
          </div>

          {/* 3. Text Modality */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between group hover:border-blue-500/40 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">💬 Text Sentiment</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Natural language processing evaluating semantic valence, intensifiers, and emotional
                arousal over user messages and academic reflection prompts.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2 text-blue-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Semantic Valence & Polarity Metric</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>DistilBERT / Transformer Integration Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS 4-STEP SECTION */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold text-white tracking-tight">
            How Multimodal Fusion Operates
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Step-by-step workflow of the late fusion architecture
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-5 border border-slate-800 relative">
            <span className="text-3xl font-extrabold text-slate-700/80 font-mono">01</span>
            <h5 className="text-sm font-bold text-white mt-2 mb-1">Provide Inputs</h5>
            <p className="text-xs text-slate-400">
              Supply any combination of inputs: webcam snapshot, voice recording, or text message.
              Missing modalities are handled automatically.
            </p>
          </div>

          <div className="glass-card rounded-xl p-5 border border-slate-800 relative">
            <span className="text-3xl font-extrabold text-cyan-500/40 font-mono">02</span>
            <h5 className="text-sm font-bold text-white mt-2 mb-1">Perceptual Analysis</h5>
            <p className="text-xs text-slate-400">
              Each active modality executes isolated feature extraction and calculates a probability
              distribution across 7 canonical emotions.
            </p>
          </div>

          <div className="glass-card rounded-xl p-5 border border-slate-800 relative">
            <span className="text-3xl font-extrabold text-purple-500/40 font-mono">03</span>
            <h5 className="text-sm font-bold text-white mt-2 mb-1">Weighted Late Fusion</h5>
            <p className="text-xs text-slate-400">
              Dynamically normalizes modality weights (Face 35%, Audio 35%, Text 30%), calculates
              cross-modal agreement, and flags conflicting signals.
            </p>
          </div>

          <div className="glass-card rounded-xl p-5 border border-slate-800 relative">
            <span className="text-3xl font-extrabold text-blue-500/40 font-mono">04</span>
            <h5 className="text-sm font-bold text-white mt-2 mb-1">Insights & Action</h5>
            <p className="text-xs text-slate-400">
              Computes engagement level and delivers tailored recommendations customized to
              Education or Healthcare Support contexts.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER ACADEMIC NOTICE */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <ShieldCheck className="w-8 h-8 text-cyan-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Ethical AI & Privacy Guardrails</div>
              <div className="text-[11px] text-slate-400">
                Non-diagnostic assistive system. Zero permanent storage of biometric face frames or voice data without explicit user request.
              </div>
            </div>
          </div>
          <button
            onClick={onStartAnalysis}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shrink-0 transition-all shadow-md shadow-cyan-500/20"
          >
            Start Analyzing
          </button>
        </div>
      </section>
    </div>
  );
};
