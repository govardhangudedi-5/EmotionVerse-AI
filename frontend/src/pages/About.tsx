import React from "react";
import {
  Brain,
  HeartPulse,
  GraduationCap,
  Cpu,
  Layers,
  ShieldAlert,
  AlertTriangle,
  Code,
  Server,
  Camera,
  Mic,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export const About: React.FC = () => {
  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="pt-2 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              About EmotionVerse AI
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase font-mono">
                System Architecture
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-Modal Human Emotion Intelligence Platform for Healthcare and Education Research.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 28: CRITICAL LIMITATION STATEMENT */}
      <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs space-y-2 shadow-xl">
        <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>Fundamental Limitation & Probabilistic Nature Declaration</span>
        </div>
        <p className="leading-relaxed text-amber-200/90 text-sm">
          &ldquo;EmotionVerse AI estimates emotional expressions from observable facial, vocal, and textual signals. These predictions are probabilistic and may not represent a person's actual internal emotional state.&rdquo;
        </p>
        <p className="text-[11px] text-amber-300/70">
          The system identifies motor facial muscle configurations, acoustic vocal acoustics, and lexical sentiment polarity. It does not possess direct cognitive access to an individual's subjective emotional reality.
        </p>
      </div>

      {/* HEALTHCARE APPLICATIONS & WARNING (Section 29) */}
      <section className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-500/30 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Healthcare & Supportive Wellness Applications</h2>
            <p className="text-xs text-slate-400">Non-diagnostic assistive emotional awareness</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              Emotion-Aware Patient Interaction
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Provides auxiliary awareness for healthcare providers during remote telehealth consultations, assisting in noticing subtle signs of patient distress or discomfort.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              Supporting Communication
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Assists neurodivergent individuals and patients with alexithymia in recognizing observable emotional expressions in communicative dialogue.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              Monitoring Emotional Expression
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Enables longitudinal tracking of affective expression variance during therapeutic interventions, cognitive behavioral sessions, or guided mindfulness routines.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              Affective Research
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Serves as an open testbed for psychology researchers investigating multimodal late fusion and cross-modal incongruence (e.g. smiling while speaking distressed words).
            </p>
          </div>
        </div>

        {/* Mandatory Medical Warning */}
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 shrink-0 text-rose-400" />
          <div>
            <strong className="block text-white">MANDATORY HEALTHCARE WARNING</strong>
            <span>&ldquo;This system is not a medical diagnostic tool and should not be used to make medical decisions.&rdquo;</span>
          </div>
        </div>
      </section>

      {/* EDUCATION APPLICATIONS (Section 30) */}
      <section className="glass-card rounded-3xl p-6 sm:p-8 border border-blue-500/30 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Education & Student Engagement Applications</h2>
            <p className="text-xs text-slate-400">Adaptive emotion-aware learning environments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Student Engagement Analysis
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Assesses classroom engagement levels by observing facial alertness, vocal pitch animation, and text reflection enthusiasm.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Frustration & Confusion Detection
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Detects early signs of cognitive overload or perplexity (brow furrowing AU4, prolonged hesitation, negative text sentiment) to prompt tutoring hints.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Emotion-Aware Interactive Learning
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Dynamically tailors curriculum difficulty and pacing, offering gamified encouragement when student morale dips.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Reflective Student Feedback
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Helps educators understand student responses to complex assignments or exams through tri-modal sentiment aggregation.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400">
          <strong className="text-blue-300">Academic Disclaimer:</strong> The system provides AI-based estimates and not definitive judgments. Emotional expressions vary broadly across cultures, neurotypes, and personal contexts.
        </div>
      </section>

      {/* SYSTEM ARCHITECTURE & PIPELINE */}
      <section className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            End-to-End System Architecture
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tri-modal sensory perception layer feeding into late decision-level multimodal fusion
          </p>
        </div>

        {/* Visual Pipeline Flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="text-cyan-400 font-bold flex items-center gap-1.5">
              <Camera className="w-4 h-4" />
              <span>1. Live Camera</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Continuous 30 FPS video stream. Extracts facial landmarks & Action Units (AU12 smile, AU4 furrow, AU26 jaw drop) with exponential smoothing.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="text-purple-400 font-bold flex items-center gap-1.5">
              <Mic className="w-4 h-4" />
              <span>2. Audio Prosody</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Microphone stream. Extracts fundamental pitch (F0), RMS acoustic energy, and spectral harmonics, with separate Web Speech API transcription.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="text-blue-400 font-bold flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              <span>3. Text Semantics</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              NLP lexicon and transformer valence-arousal scoring assessing semantic intent, intensity, and 7 canonical emotion distributions.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-2">
            <div className="text-cyan-300 font-bold flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              <span>4. Late Fusion</span>
            </div>
            <p className="text-[11px] text-cyan-200/80 font-sans">
              Decision-level confidence-weighted late fusion: $S_e = \sum w_m P_m(e)$. Normalizes dynamically for missing modalities and calculates agreement.
            </p>
          </div>
        </div>
      </section>

      {/* TECHNOLOGY STACK */}
      <section className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Code className="w-4 h-4 text-cyan-400" />
          Technical Stack & Technologies
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="font-bold text-white block mb-0.5">Frontend UI</span>
            <span className="text-slate-400">React 19, TypeScript, Vite, Tailwind CSS</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="font-bold text-white block mb-0.5">Backend Engine</span>
            <span className="text-slate-400">FastAPI, Python 3.13, Uvicorn, SQLite</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="font-bold text-white block mb-0.5">Vision & Audio</span>
            <span className="text-slate-400">OpenCV, MediaPipe, Web Audio API, SoundFile</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="font-bold text-white block mb-0.5">NLP & Fusion</span>
            <span className="text-slate-400">Late Weighted Fusion, VADER, DistilBERT</span>
          </div>
        </div>
      </section>
    </div>
  );
};
