import React, { useState } from "react";
import { MessageSquare, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Lightbulb } from "lucide-react";
import { TextAnalysisResponse, EMOTION_META } from "../types/emotion";
import { analyzeText } from "../services/api";

interface TextAnalyzerProps {
  onResult: (result: TextAnalysisResponse) => void;
  savedResult: TextAnalysisResponse | null;
}

const PRESET_EXAMPLES = [
  {
    label: "Exam Stress",
    text: "I am feeling very stressed and anxious about my upcoming final semester exams. The deadlines are piling up and I feel overwhelmed.",
  },
  {
    label: "Success Joy",
    text: "I am absolutely thrilled and proud! Our research paper got accepted and the AI system worked flawlessly during the demonstration.",
  },
  {
    label: "Study Burnout",
    text: "I feel so lonely, defeated, and exhausted after studying non-stop. I have no motivation left and feel like crying.",
  },
  {
    label: "Inquiry Baseline",
    text: "The lecture covered the fundamental concepts of backpropagation and loss optimization across convolutional neural networks.",
  },
];

export const TextAnalyzer: React.FC<TextAnalyzerProps> = ({ onResult, savedResult }) => {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError("Please enter a sentence or select an example below.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await analyzeText(text);
      onResult(result);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Text emotion analysis failed";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (presetText: string) => {
    setText(presetText);
    setError(null);
  };

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col h-full border border-slate-800/80">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide text-white">Text Sentiment & Emotion</h3>
            <p className="text-[11px] text-slate-400">NLP Semantic Valence & Keyword Arousal</p>
          </div>
        </div>

        {savedResult && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready</span>
          </div>
        )}
      </div>

      {/* Textarea Input */}
      <div className="relative mb-3">
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe your current thoughts, academic feelings, or emotional state... e.g. 'I am feeling very anxious about my thesis submission tomorrow.'"
          className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 resize-none transition-all"
        />

        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 mt-1">
          <span>
            {text.length} characters | {text.trim() ? text.trim().split(/\s+/).length : 0} words
          </span>
          {savedResult?.sentiment_polarity !== undefined && (
            <span className="font-mono text-cyan-400">
              Polarity: {savedResult.sentiment_polarity > 0 ? "+" : ""}{savedResult.sentiment_polarity}
            </span>
          )}
        </div>
      </div>

      {/* Preset Academic Scenarios */}
      <div className="mb-4">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mb-2">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Demonstration Presets:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_EXAMPLES.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleSelectPreset(preset.text)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-3 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleAnalyze}
        disabled={isLoading || !text.trim()}
        className="mt-auto flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-blue-600/20"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Analyzing Semantic Valence...
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5" />
            Analyze Text Emotion
          </>
        )}
      </button>

      {/* Result Indicator Footer */}
      {savedResult && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {EMOTION_META[savedResult.emotion]?.emoji || "😐"}
            </span>
            <div>
              <div className="text-xs font-bold text-white capitalize">
                {savedResult.emotion}
              </div>
              <div className="text-[10px] text-slate-400">
                Confidence: {(savedResult.confidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-semibold ${
              savedResult.is_fallback
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                : "bg-blue-500/10 text-blue-300 border-blue-500/30"
            }`}
          >
            {savedResult.is_fallback ? "Demo Mode" : "Real Model"}
          </span>
        </div>
      )}
    </div>
  );
};
