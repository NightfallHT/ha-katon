"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";

// Decorative copy of the table below it, so it is hidden from screen readers.
export function TrendChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <div aria-hidden="true" className="h-72 w-full text-foreground">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 24, right: 16 }} accessibilityLayer={false}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} stroke="currentColor" />
          <YAxis type="category" dataKey="name" width={170} stroke="currentColor" />
          <Bar dataKey="count" fill="currentColor" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
