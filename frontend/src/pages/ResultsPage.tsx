import React, { useState } from "react";
import {
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  PieChart,
  Brain,
  Layers,
  HeartPulse,
  GraduationCap,
  Info,
} from "lucide-react";
import {
  AudioAnalysisResponse,
  FaceAnalysisResponse,
  MultimodalFusionResponse,
  TextAnalysisResponse,
  EMOTION_META,
  ContextMode,
} from "../types/emotion";
import { EmotionRadarChart } from "../components/EmotionRadarChart";
import { EmotionBarChart } from "../components/EmotionBarChart";
import { EngagementMeter } from "../components/EngagementMeter";
import { FusionPipeline } from "../components/FusionPipeline";
import { saveAnalysis } from "../services/api";

interface ResultsPageProps {
  fusionResult: MultimodalFusionResponse | null;
  faceResult: FaceAnalysisResponse | null;
  audioResult: AudioAnalysisResponse | null;
  textResult: TextAnalysisResponse | null;
  onNavigateToStudio: () => void;
  onNavigateToHistory: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  fusionResult,
  faceResult,
  audioResult,
  textResult,
  onNavigateToStudio,
  onNavigateToHistory,
}) => {
  const [chartView, setChartView] = useState<"radar" | "bar">("radar");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!fusionResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-4">
          <Brain className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Analysis Results Yet</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
          Capture facial expressions, voice recordings, or enter text in the Analysis Studio, then run multimodal late fusion.
        </p>
        <button
          onClick={onNavigateToStudio}
          className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20"
        >
          Open Analysis Studio
        </button>
      </div>
    );
  }

  const emotionMeta = EMOTION_META[fusionResult.final_emotion] || EMOTION_META.neutral;

  const handleSaveToHistory = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      await saveAnalysis({
        context_mode: fusionResult.context_mode,
        face_emotion: faceResult?.emotion,
        face_confidence: faceResult?.confidence,
        audio_emotion: audioResult?.emotion,
        audio_confidence: audioResult?.confidence,
        text_emotion: textResult?.emotion,
        text_confidence: textResult?.confidence,
        final_emotion: fusionResult.final_emotion,
        confidence: fusionResult.confidence,
        engagement_level: fusionResult.engagement_level,
        mood_category: fusionResult.mood_category,
        agreement_score: fusionResult.agreement_score,
        modalities_used: fusionResult.modalities_used,
      });
      setSavedSuccess(true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save analysis";
      setSaveError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 pb-16">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Multimodal Intelligence Dashboard
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase">
              {fusionResult.context_mode} Mode
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated decision from {fusionResult.modalities_used.length} active modalities
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveToHistory}
            disabled={isSaving || savedSuccess}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              savedSuccess
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
            }`}
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Saved to Database</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Saving..." : "Save Analysis"}</span>
              </>
            )}
          </button>

          <button
            onClick={onNavigateToStudio}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Session</span>
          </button>
        </div>
      </div>

      {saveError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* 1. Main Emotion Card + Modality Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Final Emotion Card (Hero Highlight) */}
        <div className="glass-card rounded-2xl p-6 border border-cyan-500/40 flex flex-col justify-between bg-gradient-to-br from-slate-950 via-[#0c1228] to-slate-950 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <span className="text-9xl font-black">{emotionMeta.emoji}</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Multimodal Consensus Emotion
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${emotionMeta.bgBadge}`}>
                {emotionMeta.label}
              </span>
            </div>

            <div className="flex items-center gap-4 my-3">
              <span className="text-6xl">{emotionMeta.emoji}</span>
              <div>
                <h3 className="text-3xl font-extrabold capitalize text-white tracking-tight">
                  {fusionResult.final_emotion}
                  {fusionResult.is_mixed_emotion && (
                    <span className="ml-2 text-sm font-semibold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 align-middle">
                      Mixed
                    </span>
                  )}
                </h3>
                <div className="text-xs text-slate-400 font-medium mt-0.5">
                  Derived from {fusionResult.modalities_used.join(" + ").toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">Total Confidence:</div>
              <div className="text-xl font-extrabold font-mono text-cyan-300">
                {(fusionResult.confidence * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Channel Agreement:</div>
              <div className="text-xl font-extrabold font-mono text-purple-300">
                {(fusionResult.agreement_score * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* 2. Individual Modality Channel Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Face Modality */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-400">👁 Face Modality</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                {fusionResult.effective_weights.face ? `${(fusionResult.effective_weights.face * 100).toFixed(0)}% w` : "Inactive"}
              </span>
            </div>
            {faceResult ? (
              <div>
                <div className="flex items-center gap-2 my-2">
                  <span className="text-2xl">{EMOTION_META[faceResult.emotion]?.emoji || "😐"}</span>
                  <div>
                    <div className="text-sm font-bold capitalize text-white">{faceResult.emotion}</div>
                    <div className="text-xs text-cyan-300 font-mono">{(faceResult.confidence * 100).toFixed(1)}%</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400">
                  {faceResult.face_detected ? "Primary face detected" : "No face in frame"}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-500">Not provided</div>
            )}
            <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
              OpenCV Geometry
            </div>
          </div>

          {/* Voice Modality */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-400">🎙 Voice Modality</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                {fusionResult.effective_weights.audio ? `${(fusionResult.effective_weights.audio * 100).toFixed(0)}% w` : "Inactive"}
              </span>
            </div>
            {audioResult ? (
              <div>
                <div className="flex items-center gap-2 my-2">
                  <span className="text-2xl">{EMOTION_META[audioResult.emotion]?.emoji || "😐"}</span>
                  <div>
                    <div className="text-sm font-bold capitalize text-white">{audioResult.emotion}</div>
                    <div className="text-xs text-purple-300 font-mono">{(audioResult.confidence * 100).toFixed(1)}%</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400">
                  F0: {audioResult.pitch_estimate}Hz | RMS: {audioResult.energy_level}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-500">Not provided</div>
            )}
            <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
              Spectral Prosody
            </div>
          </div>

          {/* Text Modality */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-400">💬 Text Modality</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                {fusionResult.effective_weights.text ? `${(fusionResult.effective_weights.text * 100).toFixed(0)}% w` : "Inactive"}
              </span>
            </div>
            {textResult ? (
              <div>
                <div className="flex items-center gap-2 my-2">
                  <span className="text-2xl">{EMOTION_META[textResult.emotion]?.emoji || "😐"}</span>
                  <div>
                    <div className="text-sm font-bold capitalize text-white">{textResult.emotion}</div>
                    <div className="text-xs text-blue-300 font-mono">{(textResult.confidence * 100).toFixed(1)}%</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400">
                  Polarity: {textResult.sentiment_polarity} | {textResult.word_count} words
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-500">Not provided</div>
            )}
            <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
              Semantic Valence
            </div>
          </div>
        </div>
      </div>

      {/* 2. Engagement & Mood Gauges */}
      <EngagementMeter
        engagementLevel={fusionResult.engagement_level}
        moodCategory={fusionResult.mood_category}
        agreementScore={fusionResult.agreement_score}
        confidence={fusionResult.confidence}
      />

      {/* 3. Fusion Architecture Flow Diagram */}
      <FusionPipeline
        fusionResult={fusionResult}
        faceActive={Boolean(faceResult)}
        audioActive={Boolean(audioResult)}
        textActive={Boolean(textResult)}
      />

      {/* 4. Probability Chart (Radar vs Bar Toggle) */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm tracking-wide text-white">
              7-Emotion Probability Distribution
            </h3>
          </div>

          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setChartView("radar")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-all ${
                chartView === "radar"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              Radar View
            </button>
            <button
              onClick={() => setChartView("bar")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-all ${
                chartView === "bar"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Bar Chart
            </button>
          </div>
        </div>

        {chartView === "radar" ? (
          <EmotionRadarChart probabilities={fusionResult.fusion_probabilities} />
        ) : (
          <EmotionBarChart probabilities={fusionResult.fusion_probabilities} />
        )}
      </div>

      {/* 5. Personalized Recommendations */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            {fusionResult.context_mode === "education" ? (
              <GraduationCap className="w-4 h-4" />
            ) : (
              <HeartPulse className="w-4 h-4" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide text-white">
              Personalized {fusionResult.context_mode === "education" ? "Academic Learning" : "Supportive Wellness"} Recommendations
            </h3>
            <p className="text-xs text-slate-400">
              Calibrated for {fusionResult.final_emotion} emotion & {fusionResult.engagement_level} engagement
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fusionResult.recommendations.map((rec, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white">{rec.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 font-mono">
                    {rec.category}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{rec.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Medical disclaimer note */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span>{fusionResult.medical_disclaimer}</span>
        </div>
      </div>
    </div>
  );
};
