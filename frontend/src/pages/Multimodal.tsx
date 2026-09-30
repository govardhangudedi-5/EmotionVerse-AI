import React, { useState, useEffect, useMemo } from "react";
import {
  Cpu,
  Sparkles,
  Sliders,
  Layers,
  Camera,
  MessageSquare,
  Mic,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  GraduationCap,
  Save,
  RotateCcw,
  RefreshCw,
  Activity,
  ArrowRight,
} from "lucide-react";
import {
  AudioAnalysisResponse,
  ContextMode,
  EmotionType,
  EMOTION_META,
  FaceAnalysisResponse,
  MultimodalFusionRequest,
  MultimodalFusionResponse,
  TextAnalysisResponse,
} from "../types/emotion";
import { analyzeFusion, saveAnalysis } from "../services/api";
import { LiveFaceDetector } from "../components/LiveFaceDetector";

interface MultimodalPageProps {
  contextMode: ContextMode;
  faceResult: FaceAnalysisResponse | null;
  setFaceResult: (res: FaceAnalysisResponse | null) => void;
  audioResult: AudioAnalysisResponse | null;
  setAudioResult: (res: AudioAnalysisResponse | null) => void;
  textResult: TextAnalysisResponse | null;
  setTextResult: (res: TextAnalysisResponse | null) => void;
  onNavigateToHistory: () => void;
}

export const Multimodal: React.FC<MultimodalPageProps> = ({
  contextMode,
  faceResult,
  setFaceResult,
  audioResult,
  setAudioResult,
  textResult,
  setTextResult,
  onNavigateToHistory,
}) => {
  const [isLiveCameraActive, setIsLiveCameraActive] = useState<boolean>(true);
  const [weights, setWeights] = useState({ face: 0.34, audio: 0.33, text: 0.33 });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [fusionResult, setFusionResult] = useState<MultimodalFusionResponse | null>(null);

  const activeCount = (faceResult ? 1 : 0) + (audioResult ? 1 : 0) + (textResult ? 1 : 0);

  // Real-time Decision-Level Late Fusion Calculation (Section 17 & 20)
  const localFused = useMemo(() => {
    if (activeCount === 0) return null;

    const emotions: EmotionType[] = [
      "happy",
      "sad",
      "angry",
      "fear",
      "surprise",
      "disgust",
      "neutral",
    ];

    // Calculate effective normalized weights
    let totalWeight = 0;
    if (faceResult) totalWeight += weights.face;
    if (audioResult) totalWeight += weights.audio;
    if (textResult) totalWeight += weights.text;

    if (totalWeight === 0) totalWeight = 1;

    const effective = {
      face: faceResult ? weights.face / totalWeight : 0,
      audio: audioResult ? weights.audio / totalWeight : 0,
      text: textResult ? weights.text / totalWeight : 0,
    };

    // Calculate fused probability for each emotion
    const fusedProbs: Record<EmotionType, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      neutral: 0,
    };

    for (const emo of emotions) {
      let score = 0;
      if (faceResult) score += effective.face * (faceResult.probabilities[emo] || 0);
      if (audioResult) score += effective.audio * (audioResult.probabilities[emo] || 0);
      if (textResult) score += effective.text * (textResult.probabilities[emo] || 0);
      fusedProbs[emo] = Math.round(score * 1000) / 1000;
    }

    // Determine top emotion
    let topEmo: EmotionType = "neutral";
    let maxP = 0;
    for (const emo of emotions) {
      if (fusedProbs[emo] > maxP) {
        maxP = fusedProbs[emo];
        topEmo = emo;
      }
    }

    // Agreement score calculation across active modalities
    const activeEmos = [
      faceResult?.emotion,
      audioResult?.emotion,
      textResult?.emotion,
    ].filter(Boolean) as EmotionType[];

    const agreementCount = activeEmos.filter((e) => e === topEmo).length;
    const agreementScore = activeEmos.length > 0 ? agreementCount / activeEmos.length : 1;

    return {
      finalEmotion: topEmo,
      confidence: Math.round(maxP * 100) / 100,
      fusionProbabilities: fusedProbs,
      effectiveWeights: effective,
      agreementScore: Math.round(agreementScore * 100) / 100,
      disagreement: agreementScore < 0.6,
    };
  }, [faceResult, audioResult, textResult, weights, activeCount]);

  // Synchronize backend recommendations if available
  useEffect(() => {
    if (!localFused) {
      setFusionResult(null);
      return;
    }

    const triggerBackendFusion = async () => {
      try {
        const payload: MultimodalFusionRequest = {
          face_result: faceResult,
          audio_result: audioResult,
          text_result: textResult,
          context_mode: contextMode,
          custom_weights: weights,
        };
        const res = await analyzeFusion(payload);
        setFusionResult(res);
      } catch {
        // Fall back gracefully to local calculation
      }
    };

    // Debounce backend sync slightly for high-FPS camera updates
    const timer = setTimeout(triggerBackendFusion, 300);
    return () => clearTimeout(timer);
  }, [faceResult?.emotion, audioResult?.emotion, textResult?.emotion, contextMode, weights]);

  // Save to Session History
  const handleSaveToHistory = async () => {
    if (!localFused) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const modalitiesUsed: ("face" | "audio" | "text")[] = [];
      if (faceResult) modalitiesUsed.push("face");
      if (audioResult) modalitiesUsed.push("audio");
      if (textResult) modalitiesUsed.push("text");

      await saveAnalysis({
        context_mode: contextMode,
        face_emotion: faceResult?.emotion,
        face_confidence: faceResult?.confidence,
        audio_emotion: audioResult?.emotion,
        audio_confidence: audioResult?.confidence,
        text_emotion: textResult?.emotion,
        text_confidence: textResult?.confidence,
        final_emotion: localFused.finalEmotion,
        confidence: localFused.confidence,
        agreement_score: localFused.agreementScore,
        engagement_level: localFused.agreementScore > 0.7 ? "high" : "medium",
        mood_category:
          localFused.finalEmotion === "happy"
            ? "positive"
            : localFused.finalEmotion === "neutral"
            ? "neutral"
            : "negative",
        modalities_used: modalitiesUsed,
        notes: `Real-time Late Fusion with ${activeCount} active modalities.`,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save analysis record:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const currentEmotion = localFused?.finalEmotion || "neutral";
  const currentMeta = EMOTION_META[currentEmotion];
  const combinedConfPercent = localFused ? Math.round(localFused.confidence * 100) : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1.5px]">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Multimodal Emotion Intelligence
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase font-mono">
                  Real-Time Fusion Mode
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Combines live camera facial expressions, user text, and recorded voice acoustics. Dynamically recalculates overall emotion as facial expression changes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {localFused && (
            <button
              onClick={handleSaveToHistory}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save to History"}</span>
            </button>
          )}

          <button
            onClick={onNavigateToHistory}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all"
          >
            <span>View History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SECTION 18 & 20: HERO OVERALL EMOTION DISPLAY */}
      {localFused ? (
        <div className="relative rounded-3xl p-8 bg-gradient-to-r from-slate-950 via-[#0a0f24] to-slate-950 border border-cyan-500/40 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Massive Result Card (Verbatim Section 18 Layout) */}
            <div className="w-full md:w-1/2 p-6 rounded-2xl bg-slate-950/80 border border-cyan-500/30 text-center shadow-xl">
              <div className="text-xs uppercase tracking-widest font-mono text-cyan-400 mb-2">
                OVERALL MULTIMODAL EMOTION
              </div>
              <div className="text-7xl sm:text-8xl my-2 filter drop-shadow-[0_0_25px_rgba(0,240,255,0.4)] animate-scale-in">
                {currentMeta.emoji}
              </div>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-wider uppercase mb-1">
                {currentEmotion}
              </div>
              <div className="text-sm font-semibold text-slate-400">
                Combined Confidence:{" "}
                <span className="text-cyan-300 font-bold font-mono text-base">
                  {combinedConfPercent}%
                </span>
              </div>
            </div>

            {/* Tri-Modal Sub-Scores Breakdown (Section 18 & 21) */}
            <div className="w-full md:w-1/2 space-y-3 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Modality Confidence Breakdown
              </h4>

              {/* Face Modality Row */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold text-white">Facial Emotion</span>
                </div>
                {faceResult ? (
                  <div className="flex items-center gap-2">
                    <span>{EMOTION_META[faceResult.emotion]?.emoji}</span>
                    <span className="font-bold text-white capitalize">{faceResult.emotion}</span>
                    <span className="text-slate-400 font-mono">
                      — {(faceResult.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-500 italic">Not provided</span>
                )}
              </div>

              {/* Text Modality Row */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-white">Text Emotion</span>
                </div>
                {textResult ? (
                  <div className="flex items-center gap-2">
                    <span>{EMOTION_META[textResult.emotion]?.emoji}</span>
                    <span className="font-bold text-white capitalize">{textResult.emotion}</span>
                    <span className="text-slate-400 font-mono">
                      — {(textResult.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-500 italic">Not provided</span>
                )}
              </div>

              {/* Voice Modality Row */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Mic className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-white">Voice Emotion</span>
                </div>
                {audioResult ? (
                  <div className="flex items-center gap-2">
                    <span>{EMOTION_META[audioResult.emotion]?.emoji}</span>
                    <span className="font-bold text-white capitalize">{audioResult.emotion}</span>
                    <span className="text-slate-400 font-mono">
                      — {(audioResult.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-500 italic">Not provided</span>
                )}
              </div>

              {/* Multimodal Agreement Score */}
              <div className="pt-2 flex items-center justify-between text-slate-400 text-[11px] font-mono">
                <span>Cross-Modal Agreement: {(localFused.agreementScore * 100).toFixed(0)}%</span>
                <span className={localFused.disagreement ? "text-amber-400" : "text-emerald-400"}>
                  {localFused.disagreement ? "Mixed / Conflicting Signals" : "Congruent Across Modalities"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-10 rounded-3xl bg-slate-950/60 border border-slate-800 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 mb-3">
            <Cpu className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Awaiting Modality Inputs</h3>
          <p className="text-xs text-slate-400 max-w-md">
            Enable the live camera below or supply voice/text inputs to compute real-time multimodal fusion.
          </p>
        </div>
      )}

      {/* LIVE CAMERA INTEGRATION FOR REAL-TIME DYNAMIC RECALCULATION (Sections 20 & 21) */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Live Camera Continuous Fusion Engine</h3>
              <p className="text-[11px] text-slate-400">
                Notice: When you smile or change facial expressions in front of the camera, the Overall Emotion dynamically updates!
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsLiveCameraActive(!isLiveCameraActive)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border bg-slate-900 text-slate-300 border-slate-800 hover:text-white"
          >
            {isLiveCameraActive ? "Hide Camera View" : "Show Camera View"}
          </button>
        </div>

        {isLiveCameraActive && (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            <LiveFaceDetector onEmotionUpdate={setFaceResult} compact />
          </div>
        )}
      </div>

      {/* CONFIGURABLE MODALITY WEIGHTS (Section 17) */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Decision-Level Fusion Weights Configuration
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            Default: 33.3% each &bull; Auto-normalized across active inputs
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
              min="0.1"
              max="0.8"
              step="0.05"
              value={weights.face}
              onChange={(e) => setWeights({ ...weights, face: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Voice Weight:</span>
              <span className="font-mono text-purple-300">{(weights.audio * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.8"
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
              min="0.1"
              max="0.8"
              step="0.05"
              value={weights.text}
              onChange={(e) => setWeights({ ...weights, text: parseFloat(e.target.value) })}
              className="w-full accent-blue-400"
            />
          </div>
        </div>
      </div>

      {/* DOMAIN-SPECIFIC ACTIONABLE RECOMMENDATIONS (Sections 29 & 30) */}
      {fusionResult?.recommendations && fusionResult.recommendations.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {contextMode === "education" ? (
                <>
                  <GraduationCap className="w-4 h-4 text-blue-400" />
                  <span>Education & Student Engagement Interventions</span>
                </>
              ) : (
                <>
                  <HeartPulse className="w-4 h-4 text-purple-400" />
                  <span>Supportive Healthcare Wellness Recommendations</span>
                </>
              )}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize">
              {contextMode} Mode
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fusionResult.recommendations.map((rec, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{rec.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 uppercase">
                    {rec.action_type}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
