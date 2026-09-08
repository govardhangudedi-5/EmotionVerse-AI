import React from "react";
import { Camera, Mic, MessageSquare, Cpu, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { MultimodalFusionResponse, EMOTION_META } from "../types/emotion";

interface FusionPipelineProps {
  fusionResult: MultimodalFusionResponse | null;
  faceActive: boolean;
  audioActive: boolean;
  textActive: boolean;
}

export const FusionPipeline: React.FC<FusionPipelineProps> = ({
  fusionResult,
  faceActive,
  audioActive,
  textActive,
}) => {
  const weights = fusionResult?.effective_weights || { face: 0.35, audio: 0.35, text: 0.30 };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-sm tracking-wide text-white">
            Multimodal Late Fusion Architecture
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Weighted Softmax Aggregation
        </span>
      </div>

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 py-4 px-2">
        {/* Input Modalities Column */}
        <div className="flex flex-col gap-3 w-full md:w-56">
          {/* Face Node */}
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
              faceActive
                ? "bg-cyan-950/40 border-cyan-500/50 shadow-sm shadow-cyan-500/20"
                : "bg-slate-900/40 border-slate-800 opacity-60"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${faceActive ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-800 text-slate-500"}`}>
                <Camera className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Face Expression</div>
                <div className="text-[10px] text-slate-400">Haar / CNN Vector</div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800">
              {(weights.face * 100).toFixed(0)}%
            </span>
          </div>

          {/* Voice Node */}
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
              audioActive
                ? "bg-purple-950/40 border-purple-500/50 shadow-sm shadow-purple-500/20"
                : "bg-slate-900/40 border-slate-800 opacity-60"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${audioActive ? "bg-purple-500/20 text-purple-300" : "bg-slate-800 text-slate-500"}`}>
                <Mic className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Voice Acoustics</div>
                <div className="text-[10px] text-slate-400">MFCC / Pitch F0</div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-purple-400 border border-slate-800">
              {(weights.audio * 100).toFixed(0)}%
            </span>
          </div>

          {/* Text Node */}
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
              textActive
                ? "bg-blue-950/40 border-blue-500/50 shadow-sm shadow-blue-500/20"
                : "bg-slate-900/40 border-slate-800 opacity-60"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${textActive ? "bg-blue-500/20 text-blue-300" : "bg-slate-800 text-slate-500"}`}>
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Text Sentiment</div>
                <div className="text-[10px] text-slate-400">NLP Semantic Valence</div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-blue-400 border border-slate-800">
              {(weights.text * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Dynamic Connector Arrows */}
        <div className="hidden md:flex flex-col items-center justify-center gap-4 text-slate-600">
          <ArrowRight className={`w-5 h-5 transition-colors ${faceActive ? "text-cyan-400 animate-pulse" : ""}`} />
          <ArrowRight className={`w-5 h-5 transition-colors ${audioActive ? "text-purple-400 animate-pulse" : ""}`} />
          <ArrowRight className={`w-5 h-5 transition-colors ${textActive ? "text-blue-400 animate-pulse" : ""}`} />
        </div>

        {/* Central Fusion Processor Node */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 shadow-xl shadow-cyan-500/10 w-full md:w-56 text-center relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-blue-500" />
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white mb-2 shadow-md">
            <Cpu className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-white tracking-wide">FUSION CORE</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">
            P = &sum; (w<sub>m</sub> &middot; P<sub>m</sub>)
          </p>

          <div className="w-full mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Agreement:</span>
            <span className="font-mono font-bold text-cyan-300">
              {fusionResult ? `${(fusionResult.agreement_score * 100).toFixed(0)}%` : "--"}
            </span>
          </div>
        </div>

        {/* Right Flow Arrow */}
        <div className="hidden md:flex items-center text-slate-600">
          <ArrowRight className="w-6 h-6 text-cyan-400 animate-pulse" />
        </div>

        {/* Final Emotion Output Node */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 w-full md:w-56 text-center">
          {fusionResult ? (
            <>
              <span className="text-3xl mb-1">
                {EMOTION_META[fusionResult.final_emotion]?.emoji || "✨"}
              </span>
              <div className="text-sm font-extrabold capitalize text-white flex items-center gap-1.5">
                <span>{fusionResult.final_emotion}</span>
                {fusionResult.is_mixed_emotion && (
                  <span className="text-[10px] text-amber-400 font-normal px-1 py-0.2 bg-amber-400/10 rounded">
                    Mixed
                  </span>
                )}
              </div>
              <div className="text-xs font-mono text-cyan-300 mt-0.5">
                {(fusionResult.confidence * 100).toFixed(1)}% Confidence
              </div>
            </>
          ) : (
            <div className="py-2 text-slate-500 text-xs flex flex-col items-center">
              <Sparkles className="w-6 h-6 mb-1 text-slate-600" />
              <span>Awaiting Inputs</span>
            </div>
          )}
        </div>
      </div>

      {/* Disagreement / Mixed Emotion Banner */}
      {fusionResult?.disagreement_detected && (
        <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Modalities Divergence Detected:</strong> Models reported differing emotions across channels. The fusion engine marked this as a nuanced / mixed emotional signal with calibrated uncertainty.
          </span>
        </div>
      )}
    </div>
  );
};
