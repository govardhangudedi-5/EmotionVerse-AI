import React, { useState } from "react";
import {
  Camera,
  Sparkles,
  Info,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Smile,
  Frown,
  Flame,
  Zap,
  RefreshCw,
} from "lucide-react";
import { FaceAnalysisResponse, EMOTION_META } from "../types/emotion";
import { LiveFaceDetector } from "../components/LiveFaceDetector";

interface LiveFacePageProps {
  onEmotionUpdate: (result: FaceAnalysisResponse) => void;
  savedResult: FaceAnalysisResponse | null;
  onNavigateToMultimodal: () => void;
}

export const LiveFace: React.FC<LiveFacePageProps> = ({
  onEmotionUpdate,
  savedResult,
  onNavigateToMultimodal,
}) => {
  const [guideStep, setGuideStep] = useState<number>(0);

  const testExpressions = [
    {
      title: "Neutral Expression",
      emoji: "😐",
      desc: "Relax your facial muscles completely and look directly into the camera.",
      target: "neutral",
    },
    {
      title: "Happy Smile",
      emoji: "😊",
      desc: "Smile naturally showing teeth. Observe how AU12 instantly triggers Happy.",
      target: "happy",
    },
    {
      title: "Surprise Expression",
      emoji: "😮",
      desc: "Drop your jaw open and raise your eyebrows. Observe AU26 and AU5 activate.",
      target: "surprise",
    },
    {
      title: "Angry / Furrowed Brow",
      emoji: "😠",
      desc: "Furrow your eyebrows together tightly. Observe AU4 trigger Anger/Stress.",
      target: "angry",
    },
    {
      title: "Sad Expression",
      emoji: "😢",
      desc: "Lower the corners of your mouth and soften your gaze to trigger Sadness.",
      target: "sad",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Live Face Emotion Detection
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase font-mono">
                  Primary Real-Time Module
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Continuous real-time facial expression analysis at 30 FPS. Updates automatically as expressions change without requiring photo capture.
              </p>
            </div>
          </div>
        </div>

        {savedResult && (
          <button
            onClick={onNavigateToMultimodal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all"
          >
            <span>Send to Multimodal Fusion</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Primary Real-Time Facial Detector Component */}
      <div className="glass-card rounded-3xl p-6 border border-cyan-500/20 shadow-2xl bg-slate-950/60">
        <LiveFaceDetector onEmotionUpdate={onEmotionUpdate} />
      </div>

      {/* Guided Expression Testing Cards */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Interactive Expression Verification Guide</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Test canonical facial action units live
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {testExpressions.map((exp, idx) => {
            const isCurrent = savedResult?.emotion === exp.target;
            return (
              <div
                key={idx}
                onClick={() => setGuideStep(idx)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isCurrent
                    ? "bg-cyan-500/15 border-cyan-500/50 shadow-md shadow-cyan-500/10"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">{exp.emoji}</span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-400 text-slate-950">
                        DETECTED
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">{exp.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{exp.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Technical Architecture Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-400">
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-white font-bold">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Continuous Pipeline Architecture</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            The camera stream executes non-blocking canvas feature analysis every ~33ms (30 FPS).
            Facial Action Units (FACS) quantify lip corner elevation (AU12), brow furrowing (AU4),
            jaw depression (AU26), and eye aperture (AU5). An Exponential Moving Average (EMA)
            filters high-frequency noise while guaranteeing responsiveness when the user switches expressions.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-white font-bold">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Privacy & Zero Biometric Storage</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            All facial landmark detection and Action Unit calculations operate directly in your browser's
            hardware acceleration memory. Camera frames are ephemeral and are NEVER stored or transmitted
            without your explicit user command.
          </p>
        </div>
      </div>
    </div>
  );
};
