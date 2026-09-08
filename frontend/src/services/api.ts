import {
  AnalysisHistoryStats,
  AnalysisRecord,
  AudioAnalysisResponse,
  FaceAnalysisResponse,
  MultimodalFusionRequest,
  MultimodalFusionResponse,
  TextAnalysisResponse,
} from "../types/emotion";

const API_BASE = "http://localhost:8000/api";

export async function checkHealth(): Promise<{ status: string; demo_mode: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error("Health check failed");
    return await res.json();
  } catch (err) {
    console.warn("Backend server not responding, running in connected/client mode:", err);
    return { status: "offline", demo_mode: true };
  }
}

export async function analyzeFaceFile(file: File): Promise<FaceAnalysisResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/analyze/face`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Face analysis failed" }));
    throw new Error(err.detail || "Face analysis failed");
  }
  return res.json();
}

export async function analyzeFaceBase64(image_base64: string): Promise<FaceAnalysisResponse> {
  const res = await fetch(`${API_BASE}/analyze/face-base64`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64 }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Face snapshot analysis failed" }));
    throw new Error(err.detail || "Face snapshot analysis failed");
  }
  return res.json();
}

export async function analyzeAudio(audioBlob: Blob): Promise<AudioAnalysisResponse> {
  const formData = new FormData();
  const file = new File([audioBlob], "recording.wav", { type: audioBlob.type || "audio/wav" });
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/analyze/audio`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Audio analysis failed" }));
    throw new Error(err.detail || "Audio analysis failed");
  }
  return res.json();
}

export async function analyzeText(text: string): Promise<TextAnalysisResponse> {
  const res = await fetch(`${API_BASE}/analyze/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Text analysis failed" }));
    throw new Error(err.detail || "Text analysis failed");
  }
  return res.json();
}

export async function analyzeFusion(req: MultimodalFusionRequest): Promise<MultimodalFusionResponse> {
  const res = await fetch(`${API_BASE}/analyze/fusion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Fusion analysis failed" }));
    throw new Error(err.detail || "Fusion analysis failed");
  }
  return res.json();
}

export async function saveAnalysis(record: Partial<AnalysisRecord>): Promise<AnalysisRecord> {
  const res = await fetch(`${API_BASE}/analysis/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to save analysis" }));
    throw new Error(err.detail || "Failed to save analysis");
  }
  return res.json();
}

export async function fetchHistory(limit = 50, mode?: string): Promise<AnalysisRecord[]> {
  const url = new URL(`${API_BASE}/analysis/history`);
  url.searchParams.append("limit", limit.toString());
  if (mode) url.searchParams.append("context_mode", mode);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error("Failed to fetch history");
  }
  return res.json();
}

export async function fetchStats(): Promise<AnalysisHistoryStats> {
  const res = await fetch(`${API_BASE}/analysis/stats`);
  if (!res.ok) {
    throw new Error("Failed to fetch stats");
  }
  return res.json();
}

export async function deleteAnalysis(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/analysis/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete record");
  }
}
