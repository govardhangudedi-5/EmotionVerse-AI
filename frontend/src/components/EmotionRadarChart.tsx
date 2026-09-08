import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { EmotionType } from "../types/emotion";

interface EmotionRadarChartProps {
  probabilities: Record<EmotionType, number>;
}

export const EmotionRadarChart: React.FC<EmotionRadarChartProps> = ({ probabilities }) => {
  const data = Object.entries(probabilities || {}).map(([emotion, prob]) => ({
    emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
    value: Math.round(prob * 100),
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#334155" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="emotion"
            tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "#64748b", fontSize: 9 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0c1022",
              borderColor: "#1e293b",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#f8fafc",
            }}
            formatter={(val) => [`${val}%`, "Probability"]}
          />
          <Radar
            name="Emotion Probability"
            dataKey="value"
            stroke="#00f0ff"
            fill="#00f0ff"
            fillOpacity={0.35}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
