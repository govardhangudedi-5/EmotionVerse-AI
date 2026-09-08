import React, { useState } from "react";
import {
  Sparkles,
  Sliders,
  RotateCcw,
  AlertCircle,
  ArrowRight,
  Layers,
  Cpu,
} from "lucide-react";
import {
  AudioAnalysisResponse,
  ContextMode,
  FaceAnalysisResponse,
  MultimodalFusionRequest,
  MultimodalFusionResponse,
  TextAnalysisResponse,
} from "../types/emotion";
import { FaceAnalyzer } from "../components/FaceAnalyzer";
import { VoiceAnalyzer } from "../components/VoiceAnalyzer";
import { TextAnalyzer } from "../components/TextAnalyzer";
import { analyzeFusion } from "../services/api";

interface AnalysisPageProps {
  contextMode: ContextMode;
  faceResult: FaceAnalysisResponse | null;
  setFaceResult: (res: FaceAnalysisResponse | null) => void;
  audioResult: AudioAnalysisResponse | null;
  setAudioResult: (res: AudioAnalysisResponse | null) => void;
  textResult: TextAnalysisResponse | null;
  setTextResult: (res: TextAnalysisResponse | null) => void;
  onFusionComplete: (result: MultimodalFusionResponse) => void;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({
  contextMode,
  faceResult,
  setFaceResult,
  audioResult,
  setAudioResult,
  textResult,
  setTextResult,
  onFusionComplete,
}) => {
  const [isFusing, setIsFusing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWeightsConfig, setShowWeightsConfig] = useState(false);
  const [weights, setWeights] = useState({ face: 0.35, audio: 0.35, text: 0.30 });

  const availableCount = (faceResult ? 1 : 0) + (audioResult ? 1 : 0) + (textResult ? 1 : 0);

  const handleRunFusion = async () => {
    if (availableCount === 0) {
      setError("Please provide at least one input modality (Face, Voice, or Text) before fusing.");
      return;
    }

    setIsFusing(true);
    setError(null);

    const payload: MultimodalFusionRequest = {
      face_result: faceResult,
      audio_result: audioResult,
      text_result: textResult,
      context_mode: contextMode,
      custom_weights: weights,
    };

    try {
      const response = await analyzeFusion(payload);
      onFusionComplete(response);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Multimodal fusion failed";
      setError(errorMsg);
    } finally {
      setIsFusing(false);
    }
  };

  const handleResetAll = () => {
    setFaceResult(null);
    setAudioResult(null);
    setTextResult(null);
    setError(null);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 pb-16">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Emotion Analysis Studio
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase">
              {contextMode} Mode
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Provide inputs via any combination of modalities: Face, Voice, or Text.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWeightsConfig(!showWeightsConfig)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              showWeightsConfig
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Modality Weights</span>
          </button>

          <button
            onClick={handleResetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-300 border border-slate-800 text-xs font-semibold transition-all"
            title="Clear all modality results"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Optional Weights Configuration Accordion */}
      {showWeightsConfig && (
        <div className="glass-card rounded-2xl p-4 border border-cyan-500/30 bg-slate-950/60">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              Custom Modality Weight Distribution
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              Weights are dynamically normalized across available inputs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Face Weight:</span>
                <span className="font-mono text-cyan-300">{(weights.face * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={weights.face}
                onChange={(e) => setWeights({ ...weights, face: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Audio Weight:</span>
                <span className="font-mono text-purple-300">{(weights.audio * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={weights.audio}
                onChange={(e) => setWeights({ ...weights, audio: parseFloat(e.target.value) })}
                className="w-full accent-purple-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Text Weight:</span>
                <span className="font-mono text-blue-300">{(weights.text * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={weights.text}
                onChange={(e) => setWeights({ ...weights, text: parseFloat(e.target.value) })}
                className="w-full accent-blue-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tri-Modal Input Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <FaceAnalyzer onResult={setFaceResult} savedResult={faceResult} />
        <VoiceAnalyzer onResult={setAudioResult} savedResult={audioResult} />
        <TextAnalyzer onResult={setTextResult} savedResult={textResult} />
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Prominent Fusion Bar */}
      <div className="glass-card rounded-2xl p-6 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-md shadow-cyan-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>Execute Multimodal Fusion</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {availableCount} of 3 Active
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              Combines probabilities, computes cross-modal agreement score, and calculates recommendations.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunFusion}
          disabled={isFusing || availableCount === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-extrabold text-sm tracking-wide shadow-xl shadow-cyan-500/25 transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-5 h-5 text-slate-950" />
          <span>{isFusing ? "Fusing Modalities..." : "Run Multimodal Analysis"}</span>
          <ArrowRight className="w-5 h-5 text-slate-950" />
        </button>
      </div>
    </div>
  );
};
