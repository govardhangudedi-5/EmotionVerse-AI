import React, { useState } from "react";
import {
  MessageSquare,
  Sparkles,
  ArrowRight,
  Layers,
  Cpu,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileText,
  TrendingUp,
} from "lucide-react";
import { EmotionType, EMOTION_META, TextAnalysisResponse } from "../types/emotion";
import { analyzeText } from "../services/api";

interface TextEmotionPageProps {
  onResult: (result: TextAnalysisResponse) => void;
  savedResult: TextAnalysisResponse | null;
  onNavigateToMultimodal: () => void;
}

export const TextEmotion: React.FC<TextEmotionPageProps> = ({
  onResult,
  savedResult,
  onNavigateToMultimodal,
}) => {
  const [textInput, setTextInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    {
      label: "Celebration / Success",
      text: "I am extremely happy because I got selected for the AI competition! My hard work finally paid off!",
      expected: "happy",
    },
    {
      label: "Anxious / Exam Pressure",
      text: "I am feeling so overwhelmed, stressed, and terrified about tomorrow's clinical board exam.",
      expected: "fear",
    },
    {
      label: "Frustrated Grievance",
      text: "This unfair grading policy and lack of clear guidance makes me so angry and irritated.",
      expected: "angry",
    },
    {
      label: "Shock / Surprise",
      text: "I can't believe it! Out of nowhere, the professor announced we won the grand research grant!",
      expected: "surprise",
    },
    {
      label: "Sorrow / Grief",
      text: "I feel completely heartbroken and downcast today. Nothing seems to bring me any joy.",
      expected: "sad",
    },
  ];

  const handleAnalyze = async () => {
    if (!textInput.trim()) {
      setError("Please enter a sentence or message to analyze.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await analyzeText(textInput.trim());
      onResult(response);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to analyze text emotion.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const emotionsList: EmotionType[] = [
    "happy",
    "neutral",
    "surprise",
    "sad",
    "angry",
    "fear",
    "disgust",
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Text Emotion Analysis
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 uppercase font-mono">
                NLP Sentiment & Semantics
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Natural Language Processing model classifying emotional valence, semantic arousal, and 7-class emotion probabilities.
            </p>
          </div>
        </div>

        {savedResult && (
          <button
            onClick={onNavigateToMultimodal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all"
          >
            <span>Send to Multimodal Fusion</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Grid: Input + NLP Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Text Input & Presets (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Enter Your Message
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {textInput.length} chars &bull; {textInput.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            <textarea
              rows={5}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your message, journal reflection, patient response, or student feedback here..."
              className="w-full rounded-xl bg-slate-950/80 border border-slate-800 p-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all resize-y"
            />

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setTextInput("")}
                disabled={!textInput}
                className="text-xs text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors"
              >
                Clear Input
              </button>

              <button
                onClick={handleAnalyze}
                disabled={isLoading || !textInput.trim()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-extrabold text-xs tracking-wide shadow-lg shadow-blue-500/20 transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-slate-950 animate-spin" />
                    <span>Analyzing NLP Semantics...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Analyze Text</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Quick Test Prompts
            </span>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setTextInput(preset.text)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-all"
                >
                  <span className="font-semibold">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Prediction & Distributions (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {savedResult ? (
            <>
              {/* Top Result Card */}
              <div className="glass-card rounded-2xl p-6 border border-blue-500/30 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span className="font-bold tracking-wider uppercase text-blue-400">
                    Text Emotion
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    NLP Evaluated
                  </span>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <span className="text-6xl filter drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                    {EMOTION_META[savedResult.emotion]?.emoji || "😐"}
                  </span>
                  <div>
                    <h3 className="text-3xl font-black text-white tracking-tight uppercase">
                      {savedResult.emotion}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">Model Confidence:</span>
                      <span className="text-base font-extrabold text-blue-300 font-mono">
                        {(savedResult.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Polarity Valence Bar */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Valence Polarity:</span>
                    <span className="font-mono text-white font-bold">
                      {savedResult.sentiment_polarity > 0
                        ? `+${savedResult.sentiment_polarity.toFixed(2)} (Positive)`
                        : savedResult.sentiment_polarity < 0
                        ? `${savedResult.sentiment_polarity.toFixed(2)} (Negative)`
                        : "0.00 (Neutral)"}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full ${
                        savedResult.sentiment_polarity >= 0 ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(10, Math.abs(savedResult.sentiment_polarity) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 7-Emotion Probability Distribution */}
              <div className="glass-card rounded-2xl p-5 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    Emotion Probability Distribution
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">NLP Probabilities</span>
                </div>

                <div className="space-y-2.5">
                  {emotionsList.map((emo) => {
                    const meta = EMOTION_META[emo];
                    const prob = savedResult.probabilities[emo] || 0;
                    const percent = Math.round(prob * 100);
                    const isDominant = savedResult.emotion === emo;

                    return (
                      <div key={emo} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 font-medium text-slate-300">
                            <span className="text-sm">{meta.emoji}</span>
                            <span className={`capitalize ${isDominant ? "text-white font-bold" : ""}`}>
                              {meta.label}
                            </span>
                          </span>
                          <span
                            className={`font-mono text-xs ${
                              isDominant ? "text-blue-300 font-bold" : "text-slate-400"
                            }`}
                          >
                            {percent}%
                          </span>
                        </div>

                        <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800/80">
                          <div
                            className="h-full rounded-full transition-all duration-300 ease-out"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: isDominant ? "#38bdf8" : meta.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card rounded-2xl p-8 border border-slate-800 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Awaiting Text Input</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Enter your sentence or choose one of the preset prompts and click Analyze Text to view probabilities.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
