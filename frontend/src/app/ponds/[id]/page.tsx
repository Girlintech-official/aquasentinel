"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useParams } from "next/navigation";

type Pond = {
  id: number;
  name: string;
  species: string;
  farm: string;
};

type WaterReading = {
  id: number;
  pond_id: number;
  sensor_id: number;
  temperature: number;
  ph: number;
  dissolved_oxygen: number;
  recorded_at: string;
};

type FishObservation = {
  activity_level: string;
};

type RiskAssessment = {
  risk_level: string;
  risk_score: number;
  contributing_factors: string;
};



export default function PondPage() {
  const params = useParams();
  const id = params.id;

  const [pond, setPond] = useState<Pond | null>(null);
  const [water, setWater] = useState<WaterReading | null>(null);
  const [fish, setFish] = useState<FishObservation | null>(null);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [chartData, setChartData] = useState<
  {
    time: string;
    temperature: number;
    oxygen: number;
  }[]
>([]);
  

  useEffect(() => {
  async function loadData() {
    try {

      const token = localStorage.getItem(
        "aquasentinel_token"
      );

      if (!token) {
        console.error("No token found");
        return;
      }


      const headers = {
        Authorization: `Bearer ${token}`,
      };


      const [
        pondsRes,
        waterRes,
        fishRes,
        riskRes
      ] = await Promise.all([

        fetch(
          "https://aquasentinel-api-q232.onrender.com/ponds",
          {
            headers,
          }
        ),

        fetch(
          "https://aquasentinel-api-q232.onrender.com/water-readings",
          {
            headers,
          }
        ),

        fetch(
          "https://aquasentinel-api-q232.onrender.com/fish-observations",
          {
            headers,
          }
        ),

        fetch(
          "https://aquasentinel-api-q232.onrender.com/risk-assessments",
          {
            headers,
          }
        ),

      ]);



      const ponds = await pondsRes.json();
      const waterData = await waterRes.json();
      const fishData = await fishRes.json();
      const riskData = await riskRes.json();



      const selectedPond = ponds.find(
        (item: Pond) =>
          item.id.toString() === id
      );


      const pondWater = waterData.filter(
        (item: WaterReading) =>
          item.pond_id?.toString() === id
      );


      const pondFish = fishData.filter(
        (item: any) =>
          item.pond_id?.toString() === id
      );


      const pondRisk = riskData.filter(
        (item: any) =>
          item.pond_id?.toString() === id
      );



      setPond(selectedPond || null);


      setWater(
        pondWater[0] || waterData[0] || null
      );


      setFish(
        pondFish[0] || fishData[0] || null
      );


      setRisk(
        pondRisk[0] || riskData[0] || null
      );



      const formattedChartData =
        pondWater
        .slice()
        .reverse()
        .map((reading: WaterReading) => ({
          time: new Date(
            reading.recorded_at
          ).toLocaleTimeString([], {
            hour:"2-digit",
            minute:"2-digit",
          }),

          temperature:
            reading.temperature,

          oxygen:
            reading.dissolved_oxygen,
        }));


      setChartData(formattedChartData);


    } catch(error){

      console.error(
        "Failed to load pond intelligence:",
        error
      );

    }
  }


  loadData();


  const interval = setInterval(
    loadData,
    10000
  );


  return () =>
    clearInterval(interval);


}, [id]);

  if (!pond) {
    return (
      <main className="min-h-screen bg-[#032f35] px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-slate-500">
            Loading pond intelligence...
          </p>
        </div>
      </main>
    );
  }

  const riskLevel = risk?.risk_level || "Low";

  const riskColor =
    riskLevel === "High"
      ? "text-red-300 bg-red-400/10 border-red-400/20"
      : riskLevel === "Moderate"
      ? "text-amber-300 bg-amber-400/10 border-amber-400/20"
      : "text-emerald-300 bg-emerald-400/10 border-emerald-400/20";

  return (
    <main className="min-h-screen bg-[#032f35] px-6 py-10 text-white">

      <div className="mx-auto max-w-7xl">

        <p className="text-xs uppercase tracking-[0.2em] text-[#27e0d0]">
          {pond.farm}
        </p>

        <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

          <div>
            <h1 className="text-4xl font-semibold tracking-tight">
              {pond.name}
            </h1>

            <p className="mt-2 text-slate-400">
              {pond.species} • Pond #{pond.id}
            </p>
          </div>

          <div className="flex items-center gap-3">

            <span
              className={`rounded-full border px-4 py-2 text-sm font-medium ${riskColor}`}
            >
              ● {riskLevel} Risk
            </span>

            <span className="rounded-full border border-[#27e0d0]/20 bg-[#27e0d0]/5 px-4 py-2 text-sm text-[#27e0d0]">
              Monitoring
            </span>

          </div>

        </div>

        {/* Metrics */}

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <Metric
            label="Temperature"
            value={water ? `${water.temperature}°C` : "--"}
            detail="Water temperature"
          />

          <Metric
            label="pH Balance"
            value={water ? water.ph.toString() : "--"}
            detail="Water acidity"
          />

          <Metric
            label="Dissolved Oxygen"
            value={
              water
                ? `${water.dissolved_oxygen} mg/L`
                : "--"
            }
            detail="Available oxygen"
          />

          <Metric
            label="Fish Activity"
            value={fish ? fish.activity_level : "--"}
            detail="Behaviour signal"
          />

        </section>
        {/* Water conditions chart */}

<section className="mt-5 rounded-3xl border border-white/5 bg-[#073f46] p-7">

  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">

    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        Water Conditions
      </p>

      <h2 className="mt-2 text-xl font-semibold">
        Environmental trends
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Temperature and dissolved oxygen over time
      </p>
    </div>

    <div className="flex gap-4 text-xs text-slate-500">
      <span>● Temperature</span>
      <span>● Oxygen</span>
    </div>

  </div>

  <div className="mt-8 h-[300px] w-full">

    <ResponsiveContainer width="100%" height="100%">

      <LineChart data={chartData}>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.05)"
        />

        <XAxis
          dataKey="time"
          stroke="#64748b"
          tickLine={false}
          axisLine={false}
          fontSize={11}
        />

        <YAxis
          stroke="#64748b"
          tickLine={false}
          axisLine={false}
          fontSize={11}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: "#071d23",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            color: "#fff",
          }}
        />

        <Line
          type="monotone"
          dataKey="temperature"
          stroke="#27e0d0"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 5 }}
        />

        <Line
          type="monotone"
          dataKey="oxygen"
          stroke="#7be495"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 5 }}
        />

      </LineChart>

    </ResponsiveContainer>

  </div>

</section>
        {/* Risk assessment */}

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">

          <div className="rounded-3xl border border-white/5 bg-[#073f46] p-7">

            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Sentinel Assessment
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              Current pond risk
            </h2>

            <div className="mt-8 flex items-end gap-4">

              <span className="text-6xl font-semibold">
                {risk?.risk_score ?? "--"}
              </span>

              <span className="pb-2 text-sm text-slate-500">
                risk score
              </span>

            </div>

            <div className="mt-7 h-2 overflow-hidden rounded-full bg-white/5">

              <div
                className={`h-full rounded-full ${
                  riskLevel === "High"
                    ? "bg-red-400"
                    : riskLevel === "Moderate"
                    ? "bg-amber-400"
                    : "bg-emerald-400"
                }`}
                style={{
                  width: `${Math.min(
                    risk?.risk_score ?? 0,
                    100
                  )}%`,
                }}
              />

            </div>

            <div className="mt-6 rounded-2xl bg-white/[0.03] p-5">

              <p className="text-xs uppercase tracking-widest text-slate-600">
                Contributing factors
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                {risk?.contributing_factors ||
                  "No contributing factors detected."}
              </p>

            </div>

          </div>

          {/* Intelligence summary */}

          <div className="rounded-3xl border border-white/5 bg-[#073f46] p-7">

            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Intelligence Summary
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              What Sentinel sees
            </h2>

            <div className="mt-7 space-y-4">

              <Signal
                label="Water temperature"
                status="Monitored"
                good
              />

              <Signal
                label="pH balance"
                status="Monitored"
                good
              />

              <Signal
                label="Dissolved oxygen"
                status="Monitored"
                good
              />

              <Signal
                label="Fish behaviour"
                status={fish?.activity_level || "Unknown"}
                good={
                  fish?.activity_level?.toLowerCase() ===
                  "normal"
                }
              />

            </div>

          </div>

        </section>

        <footer className="mt-10 border-t border-white/5 pt-6 text-xs text-slate-600">
          AquaSentinel Labs • Multimodal Early-Warning Intelligence
          for African Aquaculture
        </footer>

      </div>

    </main>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-white/5 bg-[#073f46] p-6 transition hover:border-[#27e0d0]/20">

      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-4 text-3xl font-semibold tracking-tight">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-600">
        {detail}
      </p>

    </div>
  );
}

function Signal({
  label,
  status,
  good,
}: {
  label: string;
  status: string;
  good: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] p-4">

      <div className="flex items-center gap-3">

        <span
          className={`h-2.5 w-2.5 rounded-full ${
            good
              ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
              : "bg-amber-400"
          }`}
        />

        <span className="text-sm text-slate-300">
          {label}
        </span>

      </div>

      <span className="text-xs text-slate-500">
        {status}
      </span>

    </div>
  );
}
