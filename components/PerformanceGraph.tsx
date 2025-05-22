"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export type DataPoint = {
  timestamp: number; // ms since epoch
  postureScore: number; // 0–1
  expressionScore: number; // 0–1
};

interface PerformanceGraphProps {
  data: DataPoint[];
}

export default function PerformanceGraph({ data }: PerformanceGraphProps) {
  const [domainMin, domainMax] = useMemo(() => {
    const now = Date.now();
    if (data.length === 0) {
      return [now, now + 60_000];
    }
    const first = data[0].timestamp;
    const last = data[data.length - 1].timestamp;
    const maxInitial = first + 60_000;
    if (last < maxInitial) {
      return [first, maxInitial];
    }
    return [last - 60_000, last];
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={[domainMin, domainMax]}
          tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
        />
        <YAxis domain={[0, 1]} />
        <Tooltip
          labelFormatter={(label) =>
            new Date(label as number).toLocaleTimeString()
          }
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="postureScore"
          name="Posture"
          stroke="#8884d8"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="expressionScore"
          name="Expression"
          stroke="#82ca9d"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
