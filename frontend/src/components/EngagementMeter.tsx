import React from "react";
import { Zap, Smile, CheckCircle, Percent } from "lucide-react";
import { EngagementLevel, MoodCategory } from "../types/emotion";

interface EngagementMeterProps {
  engagementLevel: EngagementLevel;
  moodCategory: MoodCategory;
  agreementScore: number;
  confidence: number;
}

export const EngagementMeter: React.FC<EngagementMeterProps> = ({
  engagementLevel,
  moodCategory,
  agreementScore,
  confidence,
}) => {
  // Engagement percentage mapping for visualization
  const engagementConfig = {
    high: { pct: 88, color: "text-emerald-400", bg: "bg-emerald-500", label: "High Cognitive Attention" },
    medium: { pct: 58, color: "text-amber-400", bg: "bg-amber-500", label: "Balanced / Steady" },
    low: { pct: 28, color: "text-rose-400", bg: "bg-rose-500", label: "Low Attention / Disengaged" },
  }[engagementLevel];

  const moodConfig = {
    positive: { color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30", label: "Positive Valence" },
    neutral: { color: "text-slate-300", bg: "bg-slate-500/15 border-slate-500/30", label: "Neutral Baseline" },
    negative: { color: "text-rose-400", bg: "bg-rose-500/15 border-rose-500/30", label: "Negative / Distressed" },
  }[moodCategory];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Engagement Meter Card */}
      <div className="glass-card rounded-xl p-4 border border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 font-medium">
            <Zap className="w-4 h-4 text-cyan-400" />
            Engagement Level
          </span>
          <span className={`font-bold uppercase tracking-wider text-[11px] ${engagementConfig.color}`}>
            {engagementLevel}
          </span>
        </div>

        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden mb-1.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${engagementConfig.bg}`}
            style={{ width: `${engagementConfig.pct}%` }}
          />
        </div>
        <div className="text-[11px] text-slate-400">{engagementConfig.label}</div>
      </div>

      {/* 2. Mood Valence Card */}
      <div className="glass-card rounded-xl p-4 border border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 font-medium">
            <Smile className="w-4 h-4 text-purple-400" />
            Mood Valence
          </span>
          <span className={`font-bold uppercase tracking-wider text-[11px] ${moodConfig.color}`}>
            {moodCategory}
          </span>
        </div>

        <div className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-between ${moodConfig.bg}`}>
          <span>{moodConfig.label}</span>
          <span className="text-sm">
            {moodCategory === "positive" ? "✨" : moodCategory === "negative" ? "⚠️" : "⚖️"}
          </span>
        </div>
      </div>

      {/* 3. Cross-Modality Agreement */}
      <div className="glass-card rounded-xl p-4 border border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            Modality Agreement
          </span>
          <span className="font-mono font-bold text-white">
            {Math.round(agreementScore * 100)}%
          </span>
        </div>

        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden mb-1.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
            style={{ width: `${Math.round(agreementScore * 100)}%` }}
          />
        </div>
        <div className="text-[11px] text-slate-400">
          {agreementScore >= 0.7
            ? "High Cross-Channel Coherence"
            : agreementScore >= 0.45
            ? "Moderate Multi-Modal Agreement"
            : "Mixed / Divergent Channel Cues"}
        </div>
      </div>

      {/* 4. Overall Confidence */}
      <div className="glass-card rounded-xl p-4 border border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 font-medium">
            <Percent className="w-4 h-4 text-emerald-400" />
            Fusion Confidence
          </span>
          <span className="font-mono font-bold text-cyan-300">
            {Math.round(confidence * 100)}%
          </span>
        </div>

        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden mb-1.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700"
            style={{ width: `${Math.round(confidence * 100)}%` }}
          />
        </div>
        <div className="text-[11px] text-slate-400">Calibrated Softmax Distribution</div>
      </div>
    </div>
  );
};
