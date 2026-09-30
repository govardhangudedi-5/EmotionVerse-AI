import React, { useState } from "react";
import {
  ShieldCheck,
  CameraOff,
  MicOff,
  Trash2,
  Lock,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Server,
  FileCheck,
} from "lucide-react";
import { deleteAnalysis, fetchHistory } from "../services/api";

interface PrivacyPageProps {
  onStopAllMedia?: () => void;
  onClearHistory?: () => void;
}

export const Privacy: React.FC<PrivacyPageProps> = () => {
  const [clearedNotice, setClearedNotice] = useState<boolean>(false);
  const [stoppedMediaNotice, setStoppedMediaNotice] = useState<boolean>(false);

  const handleStopAllSensors = () => {
    // Stop all media streams across the browser window
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop());
      })
      .catch(() => {});

    setStoppedMediaNotice(true);
    setTimeout(() => setStoppedMediaNotice(false), 3000);
  };

  const handleClearAllHistory = async () => {
    try {
      const records = await fetchHistory(500);
      for (const r of records) {
        await deleteAnalysis(r.id);
      }
      setClearedNotice(true);
      setTimeout(() => setClearedNotice(false), 3000);
    } catch (err) {
      console.error("Failed to clear session history:", err);
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="pt-2 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Privacy & Ethical AI Governance
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase font-mono">
                Data Protection
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Transparent biometric handling policies, user sensor controls, and non-diagnostic ethical guardrails.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 27: VERBATIM PRIVACY NOTICE BANNER */}
      <div className="glass-card rounded-3xl p-8 border border-cyan-500/40 bg-gradient-to-r from-slate-950 via-[#071324] to-slate-950 space-y-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Privacy Notice</h2>
            <span className="text-xs text-cyan-400 font-mono">Section 27 Mandatory Specification</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-sm sm:text-base text-slate-200 leading-relaxed">
          &ldquo;Camera and microphone data are processed for emotion analysis. Raw camera frames and audio recordings are not permanently stored unless the user explicitly chooses to save them.&rdquo;
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          All real-time facial feature extraction and acoustic prosody evaluations are executed ephemerally in browser RAM and on-device hardware buffers. No biometric face templates, raw image snapshots, or voice audio recordings are written to disk or sent to third-party cloud servers without your explicit click on &ldquo;Save to History&rdquo;.
        </p>
      </div>

      {/* SECTION 27: IMMEDIATE HARDWARE PRIVACY CONTROLS */}
      <section className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-cyan-400" />
          Immediate Sensor & Session Controls
        </h3>
        <p className="text-xs text-slate-400">
          Exercise direct control over your local browser media devices and stored session metadata.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Stop Sensors */}
          <button
            onClick={handleStopAllSensors}
            className="flex items-center justify-center gap-2 p-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all"
          >
            <CameraOff className="w-4 h-4 text-rose-400" />
            <span>Stop Camera & Mic</span>
          </button>

          {/* Clear Session History */}
          <button
            onClick={handleClearAllHistory}
            className="flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
          >
            <Trash2 className="w-4 h-4 text-slate-400" />
            <span>Clear Session History</span>
          </button>

          {/* Revoke Browser Access Help */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Permissions can be revoked at any time via browser site settings icon.</span>
          </div>
        </div>

        {stoppedMediaNotice && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>All media stream tracks terminated and camera released.</span>
          </div>
        )}

        {clearedNotice && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Session history cleared from local database.</span>
          </div>
        )}
      </section>

      {/* SECTION 28: CRITICAL ETHICAL LIMITATION DECLARATION */}
      <section className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Section 28 Core Limitation Requirement
        </h3>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 text-xs text-slate-300 space-y-2">
          <p className="font-semibold text-white">
            &ldquo;EmotionVerse AI estimates emotional expressions from observable facial, vocal, and textual signals. These predictions are probabilistic and may not represent a person's actual internal emotional state.&rdquo;
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Antigravity and scientific consensus emphasize that external motor and prosodic expressions do not have a deterministic 1-to-1 correspondence with subjective emotional feelings. For instance, a smile can indicate joy, politeness, sarcasm, nervous tension, or masked sorrow. Consequently, all metrics are formally labeled <strong className="text-cyan-300">Model Confidence</strong>, never <strong className="text-rose-400">Accuracy</strong>.
          </p>
        </div>
      </section>

      {/* BIOMETRIC INTEGRITY PRINCIPLES */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
          <span className="font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            Zero Persistent Biometrics
          </span>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            The system does NOT compute or persist 128-d face recognition embeddings, facial identity biometric templates, or voiceprints. Analysis is strictly behavioral and expression-focused.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
          <span className="font-bold text-white flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-purple-400" />
            Local-First Edge Execution
          </span>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Live webcam inference executes locally within your browser client. High-frequency frames never leave your local device, eliminating network eavesdropping risks.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
          <span className="font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Medical Non-Diagnostic Boundary
          </span>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            The platform is explicitly designed for human-computer interaction research and academic assistive support, never as an autonomous clinical diagnosis tool.
          </p>
        </div>
      </section>
    </div>
  );
};
