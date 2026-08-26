"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Risk = {
  id: number;
  pond_id: number;
  risk_level: string;
  risk_score: number;
  contributing_factors: string;
  assessed_at: string;
};

type Reading = {
  id: number;
  sensor_id: number;
  temperature: number;
  ph: number;
  dissolved_oxygen: number;
  recorded_at: string;
};

type FishObservation = {
  id: number;
  pond_id: number;
  activity_level: string;
  feeding_response: string;
  unusual_behaviour: string;
  fish_count: number;
  observed_at: string;
};

export default function InsightsPage() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [fish, setFish] = useState<FishObservation | null>(null);

  useEffect(() => {
    async function loadInsights() {
      try {
        const [
          riskResponse,
          waterResponse,
          fishResponse,
        ] = await Promise.all([
          fetch(
            "https://aquasentinel-api-q232.onrender.com/risk-assessments"
          ),
          fetch(
            "https://aquasentinel-api-q232.onrender.com/water-readings"
          ),
          fetch(
            "https://aquasentinel-api-q232.onrender.com/fish-observations"
          ),
        ]);

        const riskData = await riskResponse.json();
        const waterData = await waterResponse.json();
        const fishData = await fishResponse.json();

        setRisks(riskData || []);
        setReadings(waterData || []);
        setFish(fishData[0] || null);
      } catch (error) {
        console.error(
          "Failed to load intelligence:",
          error
        );
      }
    }

    loadInsights();

    const interval = setInterval(
      loadInsights,
      10000
    );

    return () => clearInterval(interval);
  }, []);

  const risk = risks[0] || null;
  const reading = readings[0] || null;

  const riskLevel =
    risk?.risk_level || "Unknown";

  const recommendation =
    riskLevel === "High"
      ? "Immediate attention recommended. Review water conditions and fish behaviour before the next monitoring cycle."
      : riskLevel === "Moderate"
      ? "Monitor the pond closely and investigate the contributing stress signals."
      : "Current conditions appear stable. Continue routine monitoring.";

  const fishInterpretation =
    fish?.activity_level === "Normal" &&
    fish?.feeding_response === "Good"
      ? "Fish behaviour currently appears normal, with healthy activity and feeding response."
      : "Behavioural signals indicate that the pond should be monitored more closely.";

  const chartReadings = [...readings]
    .slice()
    .reverse()
    .map((item) => ({
      time: new Date(
        item.recorded_at
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      temperature: item.temperature,
      ph: item.ph,
      oxygen: item.dissolved_oxygen,
    }));

  const chartRisks = [...risks]
    .slice()
    .reverse()
    .map((item) => ({
      time: new Date(
        item.assessed_at
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      score: item.risk_score,
    }));

  const riskColor =
    riskLevel === "High"
      ? "text-red-300"
      : riskLevel === "Moderate"
      ? "text-amber-300"
      : "text-emerald-300";

  return (
    <main className="min-h-screen bg-[#022b30] px-5 py-8 text-white sm:px-8 lg:px-10">

      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-10">

          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#27e0d0]">
            AquaSentinel Labs
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Intelligence
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Early-warning intelligence generated from water
            conditions, fish behaviour, and risk patterns.
          </p>

        </div>

        {/* Overview */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-3xl border border-white/5 bg-[#06434a] p-6">

            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              Current risk
            </p>

            <p className={`mt-4 text-3xl font-semibold ${riskColor}`}>
              {riskLevel}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Risk score: {risk?.risk_score ?? "--"}
            </p>

          </div>

          <div className="rounded-3xl border border-white/5 bg-[#06434a] p-6">

            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              Temperature
            </p>

            <p className="mt-4 text-3xl font-semibold">
              {reading
                ? `${reading.temperature}°C`
                : "--"}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Latest water reading
            </p>

          </div>

          <div className="rounded-3xl border border-white/5 bg-[#06434a] p-6">

            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              Dissolved oxygen
            </p>

            <p className="mt-4 text-3xl font-semibold">
              {reading
                ? `${reading.dissolved_oxygen} mg/L`
                : "--"}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Latest water reading
            </p>

          </div>

          <div className="rounded-3xl border border-white/5 bg-[#06434a] p-6">

            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              Fish activity
            </p>

            <p className="mt-4 text-3xl font-semibold">
              {fish?.activity_level || "--"}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Latest behavioural signal
            </p>

          </div>

        </section>

        {/* Water trends */}
        <section className="mt-5 rounded-3xl border border-white/5 bg-[#06434a] p-7">

          <div className="mb-7">

            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Water intelligence
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              Water quality trends
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Recent changes in temperature, pH, and dissolved oxygen.
            </p>

          </div>

          <div className="h-[320px] w-full">

            {chartReadings.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">

                <LineChart data={chartReadings}>

                  <CartesianGrid
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#073a40",
                      border:
                        "1px solid rgba(39,224,208,0.15)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#27e0d0"
                    strokeWidth={2}
                    dot={false}
                    name="Temperature"
                  />

                  <Line
                    type="monotone"
                    dataKey="ph"
                    stroke="#7dd3fc"
                    strokeWidth={2}
                    dot={false}
                    name="pH"
                  />

                  <Line
                    type="monotone"
                    dataKey="oxygen"
                    stroke="#a7f3d0"
                    strokeWidth={2}
                    dot={false}
                    name="Dissolved Oxygen"
                  />

                </LineChart>

              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Waiting for water readings...
              </div>
            )}

          </div>

        </section>

        {/* Risk trend */}
        <section className="mt-5 rounded-3xl border border-white/5 bg-[#06434a] p-7">

          <div className="mb-7">

            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Risk intelligence
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              Risk progression
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              How the pond's assessed risk has changed across recent
              monitoring cycles.
            </p>

          </div>

          <div className="h-[280px] w-full">

            {chartRisks.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">

                <LineChart data={chartRisks}>

                  <CartesianGrid
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    domain={[0, 100]}
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#073a40",
                      border:
                        "1px solid rgba(39,224,208,0.15)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#fbbf24"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    name="Risk Score"
                  />

                </LineChart>

              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Waiting for risk assessments...
              </div>
            )}

          </div>

        </section>

        {/* Interpretation */}
        <section className="mt-5 grid gap-5 lg:grid-cols-2">

          <div className="rounded-3xl border border-white/5 bg-[#06434a] p-8">

            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Sentinel interpretation
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              What the system is seeing
            </h2>

            <div className="mt-7 rounded-2xl bg-white/[0.03] p-6">

              <p className="text-sm leading-7 text-slate-300">
                {risk?.contributing_factors ||
                  "No significant stress signals have been detected."}
              </p>

            </div>

          </div>

          <div className="rounded-3xl border border-[#27e0d0]/10 bg-[#06434a] p-8">

            <p className="text-xs uppercase tracking-[0.18em] text-[#27e0d0]">
              Recommended action
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              What you should do
            </h2>

            <div className="mt-7 rounded-2xl bg-[#27e0d0]/5 p-6">

              <p className="text-sm leading-7 text-slate-300">
                {recommendation}
              </p>

            </div>

          </div>

        </section>

        {/* Behaviour intelligence */}
        <section className="mt-5 rounded-3xl border border-white/5 bg-[#06434a] p-7">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Behavioural intelligence
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Fish behaviour signals
              </h2>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#27e0d0]/10 text-[#27e0d0]">
              ◉
            </div>

          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-2xl bg-white/[0.03] p-5">

              <p className="text-xs text-slate-500">
                Activity
              </p>

              <p className="mt-2 text-lg font-semibold">
                {fish?.activity_level || "--"}
              </p>

            </div>

            <div className="rounded-2xl bg-white/[0.03] p-5">

              <p className="text-xs text-slate-500">
                Feeding response
              </p>

              <p className="mt-2 text-lg font-semibold">
                {fish?.feeding_response || "--"}
              </p>

            </div>

            <div className="rounded-2xl bg-white/[0.03] p-5">

              <p className="text-xs text-slate-500">
                Fish count
              </p>

              <p className="mt-2 text-lg font-semibold">
                {fish?.fish_count ?? "--"}
              </p>

            </div>

            <div className="rounded-2xl bg-white/[0.03] p-5">

              <p className="text-xs text-slate-500">
                Unusual behaviour
              </p>

              <p className="mt-2 text-lg font-semibold">
                {fish?.unusual_behaviour || "--"}
              </p>

            </div>

          </div>

          <div className="mt-5 rounded-2xl border border-[#27e0d0]/10 bg-[#27e0d0]/5 p-5">

            <p className="text-xs uppercase tracking-[0.16em] text-[#27e0d0]">
              Behaviour interpretation
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              {fishInterpretation}
            </p>

          </div>

        </section>

        {/* Intelligence footer */}
        <div className="mt-8 rounded-3xl border border-white/5 bg-[#06434a] p-7">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#27e0d0]/10 text-[#27e0d0]">
              ✦
            </div>

            <div>

              <p className="font-medium">
                AquaSentinel Intelligence
              </p>

              <p className="text-xs text-slate-500">
                Multimodal early-warning monitoring
              </p>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}

