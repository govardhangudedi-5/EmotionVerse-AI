export type EmotionType =
  | "happy"
  | "sad"
  | "angry"
  | "fear"
  | "surprise"
  | "disgust"
  | "neutral";

export type MoodCategory = "positive" | "neutral" | "negative";

export type EngagementLevel = "high" | "medium" | "low";

export type ContextMode = "education" | "healthcare";

export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ModalityResultBase {
  modality: "face" | "audio" | "text";
  emotion: EmotionType;
  confidence: number;
  probabilities: Record<EmotionType, number>;
  mood_category: MoodCategory;
  is_fallback: boolean;
  model_name: string;
  metadata?: Record<string, unknown>;
}

export interface FaceAnalysisResponse extends ModalityResultBase {
  face_detected: boolean;
  bounding_box: FaceBoundingBox | null;
  processed_image_base64: string | null;
}

export interface AudioAnalysisResponse extends ModalityResultBase {
  waveform_points: number[] | null;
  duration_seconds: number | null;
  sample_rate: number | null;
  pitch_estimate: number | null;
  energy_level: number | null;
}

export interface TextAnalysisResponse extends ModalityResultBase {
  character_count: number;
  word_count: number;
  sentiment_polarity: number;
}

export interface RecommendationItem {
  title: string;
  description: string;
  category: string;
  action_type: "activity" | "mindfulness" | "resource" | "alert";
}

export interface MultimodalFusionRequest {
  face_result?: FaceAnalysisResponse | null;
  audio_result?: AudioAnalysisResponse | null;
  text_result?: TextAnalysisResponse | null;
  context_mode: ContextMode;
  custom_weights?: Record<string, number>;
}

export interface MultimodalFusionResponse {
  final_emotion: EmotionType;
  confidence: number;
  engagement_level: EngagementLevel;
  mood_category: MoodCategory;
  modalities_used: ("face" | "audio" | "text")[];
  effective_weights: Record<string, number>;
  fusion_probabilities: Record<EmotionType, number>;
  agreement_score: number;
  is_mixed_emotion: boolean;
  disagreement_detected: boolean;
  context_mode: ContextMode;
  recommendations: RecommendationItem[];
  medical_disclaimer: string;
}

export interface AnalysisRecord {
  id: number;
  session_id: string;
  timestamp: string;
  context_mode: ContextMode;
  face_emotion?: EmotionType;
  face_confidence?: number;
  audio_emotion?: EmotionType;
  audio_confidence?: number;
  text_emotion?: EmotionType;
  text_confidence?: number;
  final_emotion: EmotionType;
  confidence: number;
  engagement_level: EngagementLevel;
  mood_category: MoodCategory;
  agreement_score: number;
  modalities_used: ("face" | "audio" | "text")[];
  notes?: string;
}

export interface AnalysisHistoryStats {
  total_analyses: number;
  most_frequent_emotion: string;
  average_confidence: number;
  emotion_distribution: Record<string, number>;
  mood_distribution: Record<string, number>;
  engagement_distribution: Record<string, number>;
  modalities_frequency: Record<string, number>;
}

export const EMOTION_META: Record<
  EmotionType,
  { label: string; emoji: string; color: string; bgBadge: string }
> = {
  happy: {
    label: "Happy",
    emoji: "😊",
    color: "#10b981",
    bgBadge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  sad: {
    label: "Sad",
    emoji: "😢",
    color: "#60a5fa",
    bgBadge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  angry: {
    label: "Angry",
    emoji: "😠",
    color: "#ef4444",
    bgBadge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  },
  fear: {
    label: "Fear",
    emoji: "😨",
    color: "#a855f7",
    bgBadge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  surprise: {
    label: "Surprise",
    emoji: "😲",
    color: "#f59e0b",
    bgBadge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  disgust: {
    label: "Disgust",
    emoji: "🤢",
    color: "#84cc16",
    bgBadge: "bg-lime-500/20 text-lime-300 border-lime-500/30",
  },
  neutral: {
    label: "Neutral",
    emoji: "😐",
    color: "#94a3b8",
    bgBadge: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  },
};
