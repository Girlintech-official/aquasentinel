"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import router from "next/dist/shared/lib/router/router";
import Link from "next/link";

type WaterReading = {
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

type RiskAssessment = {
  risk_level: string;
  risk_score: number;
  contributing_factors: string;
  assessed_at: string;
};

export default function Home() {
   const router = useRouter();

  const [water, setWater] = useState<WaterReading | null>(null);
  const [fish, setFish] = useState<FishObservation | null>(null);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);

  const [greeting, setGreeting] = useState("Good afternoon.");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
  const checkAuth = () => {
    const token = localStorage.getItem("aquasentinel_token");

    console.log("CHECK TOKEN:", token);

    if (!token) {
      router.replace("/login");
    }
  };

  checkAuth();

  window.addEventListener("storage", checkAuth);

  return () => {
    window.removeEventListener("storage", checkAuth);
  };
}, [router]);

  useEffect(() => {
    function updateGreeting() {
      const hour = new Date().getHours();

      setGreeting(
        hour < 12
          ? "Good morning."
          : hour < 17
          ? "Good afternoon."
          : "Good evening."
      );
    }

    updateGreeting();

    const greetingInterval = setInterval(updateGreeting, 60000);

    return () => clearInterval(greetingInterval);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        
        const token = localStorage.getItem("aquasentinel_token");

if (!token) {
  console.error("No token found");
  return;
}

const headers: HeadersInit = {
  Authorization: `Bearer ${token}`,
};


const [waterRes, fishRes, riskRes] = await Promise.all([
  fetch("https://aquasentinel-api-q232.onrender.com/water-readings", {
    headers,
}),
fetch("https://aquasentinel-api-q232.onrender.com/fish-observations", {
  headers,
}),
fetch("https://aquasentinel-api-q232.onrender.com/risk-assessments", {
  headers,
}),
]);

        const waterData = await waterRes.json();
        const fishData = await fishRes.json();
        const riskData = await riskRes.json();

        const latestRisk = riskData[0] || null;

        setWater(waterData[0] || null);
        setFish(fishData[0] || null);
        setRisk(latestRisk);
      } catch (error) {
        console.error("AquaSentinel data error:", error);
      }
    }

    loadData();

    const interval = setInterval(loadData, 10000);

    return () => clearInterval(interval);
  }, []);

  const riskLevel = risk?.risk_level || "Low";

  const riskStyles = {
    Low: {
      badge:
        "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
      glow:
        "shadow-[0_0_50px_rgba(52,211,153,0.08)]",
      icon: "✓",
      message: "Conditions look healthy",
    },

    Moderate: {
      badge:
        "bg-amber-400/10 text-amber-300 border-amber-400/20",
      glow:
        "shadow-[0_0_50px_rgba(251,191,36,0.08)]",
      icon: "!",
      message: "Potential stress detected",
    },

    High: {
      badge:
        "bg-red-400/10 text-red-300 border-red-400/20",
      glow:
        "shadow-[0_0_50px_rgba(248,113,113,0.10)]",
      icon: "!",
      message: "Potentially harmful conditions detected",
    },
  };

  const currentRisk =
    riskStyles[riskLevel as keyof typeof riskStyles] ||
    riskStyles.Low;

  return (
    <main className="min-h-screen bg-[#022b30] text-white">

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#00b8a9]/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-[#27e0d0]/5 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen">

        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-white/5 bg-[#071d23]/90 px-5 py-7 lg:block">

          <div className="mb-12">
            <Image
              src="/logo.jpg"
              alt="AquaSentinel Labs"
              width={420}
              height={130}
              priority
              className="h-auto w-full max-w-[210px]"
            />
          </div>

          <nav className="space-y-2">

            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              Overview
            </p>

            <Link
              href="/"
              className="flex w-full items-center gap-3 rounded-xl bg-[#00b8a9]/10 px-3 py-3 text-sm font-medium text-[#27e0d0]"
            >
              <span>◉</span>
              Dashboard
            </Link>

            <Link
              href="/ponds"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <span>◌</span>
              Ponds
            </Link>

            <Link
              href="/insights"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <span>⌁</span>
              Insights
            </Link>

            <p className="mb-3 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              Monitoring
            </p>

            <Link
              href="/alerts"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <span>◈</span>
              Alerts
            </Link>

            <Link
              href="/history"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <span>◷</span>
              History
            </Link>

          </nav>

          <div className="mt-16 rounded-2xl border border-[#00b8a9]/10 bg-[#00b8a9]/5 p-4">

            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#27e0d0]" />

              <span className="text-xs font-medium text-[#27e0d0]">
                SENTINEL ACTIVE
              </span>
            </div>

            <p className="text-xs leading-5 text-slate-500">
              Continuous monitoring is active for your aquaculture environment.
            </p>

          </div>

        </aside>

        {/* Main */}
        <section className="flex-1 px-5 py-7 sm:px-8 lg:px-10">

          {/* Top bar */}
          <header className="mb-6 flex items-center justify-between">

            {/* Mobile logo + hamburger */}
            <div className="flex items-center gap-3 lg:hidden">

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl text-white transition hover:bg-white/10"
                aria-label="Toggle navigation menu"
              >
                {menuOpen ? "✕" : "☰"}
              </button>

              <Image
                src="/logo.jpg"
                alt="AquaSentinel Labs"
                width={420}
                height={130}
                priority
                className="h-auto w-[150px] sm:w-[180px]"
              />

            </div>

            {/* Farm information */}
            <div className="ml-auto flex items-center gap-4">

              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">
                  Saha Aqua Farm
                </p>

                <p className="text-xs text-slate-500">
                  Gurugu, Tamale
                </p>
              </div>

             <button
   onClick={() => {
    localStorage.removeItem("aquasentinel_token");
    router.replace("/login");
  }}
  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#27e0d0]/20 bg-[#27e0d0]/10 text-sm font-semibold text-[#27e0d0]"
  title="Logout"
>
  S
</button>

            </div>

          </header>

          {/* Mobile navigation */}
          {menuOpen && (
            <div className="mb-8 rounded-2xl border border-white/10 bg-[#071d23] p-3 shadow-2xl lg:hidden">

              <nav className="space-y-1">

                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl bg-[#00b8a9]/10 px-4 py-3 text-sm font-medium text-[#27e0d0]"
                >
                  <span>◉</span>
                  Dashboard
                </Link>

                <Link
                  href="/ponds"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  <span>◌</span>
                  Ponds
                </Link>

                <Link
                  href="/insights"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  <span>⌁</span>
                  Insights
                </Link>

                <div className="my-2 border-t border-white/5" />

                <Link
                  href="/alerts"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  <span>◈</span>
                  Alerts
                </Link>

                <Link
                  href="/history"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  <span>◷</span>
                  History
                </Link>

              </nav>

              <div className="mt-4 rounded-xl border border-[#00b8a9]/10 bg-[#00b8a9]/5 p-4">

                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#27e0d0]" />

                  <span className="text-xs font-medium text-[#27e0d0]">
                    SENTINEL ACTIVE
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Continuous monitoring is active.
                </p>

              </div>

            </div>
          )}

          {/* Hero */}
          <div className="mb-9">

            <p className="mb-2 text-sm font-medium text-[#27e0d0]">
              EARLY-WARNING INTELLIGENCE
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {greeting}
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Your ponds are being monitored continuously. Here is the latest
              picture of your aquaculture environment.
            </p>

          </div>

          {/* Metrics */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <MetricCard
              label="Temperature"
              value={water ? `${water.temperature}°` : "--"}
              unit="C"
              detail="Water temperature"
              icon="◉"
            />

            <MetricCard
              label="pH Balance"
              value={water ? water.ph.toString() : "--"}
              unit=""
              detail="Water acidity"
              icon="◌"
            />

            <MetricCard
              label="Dissolved Oxygen"
              value={
                water
                  ? water.dissolved_oxygen.toString()
                  : "--"
              }
              unit="mg/L"
              detail="Available oxygen"
              icon="≈"
            />

            <MetricCard
              label="Fish Activity"
              value={
                fish
                  ? fish.activity_level
                  : "--"
              }
              unit=""
              detail="Behaviour signal"
              icon="◇"
            />

          </section>

          {/* Fish Behaviour */}
          <section className="mt-5">

            <div className="rounded-3xl border border-white/5 bg-[#06434a] p-7">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                    Fish Behaviour
                  </p>

                  <h2 className="mt-2 text-xl font-semibold">
                    Behavioural signals
                  </h2>

                  <p className="mt-2 max-w-xl text-sm text-slate-500">
                    Biological signals provide another layer of insight
                    beyond water quality measurements.
                  </p>

                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#27e0d0]/10 text-lg text-[#27e0d0]">
                  ◉
                </div>

              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <div className="rounded-2xl bg-white/[0.03] p-5">

                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    Activity
                  </p>

                  <p className="mt-3 text-lg font-semibold">
                    {fish?.activity_level || "--"}
                  </p>

                </div>

                <div className="rounded-2xl bg-white/[0.03] p-5">

                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    Feeding response
                  </p>

                  <p className="mt-3 text-lg font-semibold">
                    {fish?.feeding_response || "--"}
                  </p>

                </div>

                <div className="rounded-2xl bg-white/[0.03] p-5">

                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    Fish population
                  </p>

                  <p className="mt-3 text-lg font-semibold">
                    {fish?.fish_count ?? "--"}
                  </p>

                </div>

                <div className="rounded-2xl bg-white/[0.03] p-5">

                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    Unusual behaviour
                  </p>

                  <p className="mt-3 text-lg font-semibold">
                    {fish?.unusual_behaviour || "--"}
                  </p>

                </div>

              </div>

              <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-5">

                <p className="text-xs text-slate-500">
                  Latest observation
                </p>

                <p className="text-xs text-slate-400">
                  {fish?.observed_at
                    ? new Date(
                        fish.observed_at
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--"}
                </p>

              </div>

            </div>

          </section>

          {/* Risk + status */}
          <section className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">

            {/* Risk */}
            <div
              className={`rounded-3xl border border-white/5 bg-[#06434a] p-7 ${currentRisk.glow}`}
            >

              <div className="mb-8 flex items-start justify-between">

                <div>

                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                    Sentinel Assessment
                  </p>

                  <h2 className="mt-2 text-xl font-semibold">
                    Current pond risk
                  </h2>

                </div>

                <div
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${currentRisk.badge}`}
                >
                  {riskLevel.toUpperCase()}
                </div>

              </div>

              {/* Risk score */}
              <div className="flex items-end justify-between">

                <div>

                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Risk score
                  </p>

                  <p className="mt-2 text-5xl font-semibold tracking-tight">
                    {risk?.risk_score ?? 0}
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Last assessed
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    {risk?.assessed_at
                      ? new Date(
                          risk.assessed_at
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--"}
                  </p>

                </div>

              </div>

              {/* Risk intensity */}
              <div className="mt-6">

                <div className="h-2 overflow-hidden rounded-full bg-white/5">

                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
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

                <p className="mt-2 text-xs text-slate-500">
                  Risk intensity
                </p>

              </div>

              {/* Attention banner */}
              {riskLevel !== "Low" && (
                <div
                  className={`mt-6 rounded-2xl border px-5 py-4 ${
                    riskLevel === "High"
                      ? "border-red-400/20 bg-red-400/10"
                      : "border-amber-400/20 bg-amber-400/10"
                  }`}
                >

                  <div className="flex items-start gap-3">

                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold ${
                        riskLevel === "High"
                          ? "bg-red-400/10 text-red-300"
                          : "bg-amber-400/10 text-amber-300"
                      }`}
                    >
                      !
                    </div>

                    <div>

                      <p className="font-semibold">
                        {riskLevel === "High"
                          ? "Potentially harmful conditions detected"
                          : "Potential stress detected"}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {risk?.contributing_factors ||
                          "AquaSentinel has detected conditions that may require closer monitoring."}
                      </p>

                    </div>

                  </div>

                </div>
              )}

              {/* Sentinel factors */}
              <div className="mt-5 rounded-2xl bg-white/[0.03] p-4">

                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Sentinel factors
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {risk?.contributing_factors ||
                    "No significant stress signals detected."}
                </p>

              </div>

              {/* Risk interpretation */}
              <div className="mt-5 flex items-center gap-3">

                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${currentRisk.badge}`}
                >
                  {currentRisk.icon}
                </div>

                <div>

                  <p className="text-sm font-medium">
                    {currentRisk.message}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Based on current water and fish behaviour signals.
                  </p>

                </div>

              </div>

            </div>

            {/* Sentinel status */}
            <div className="rounded-3xl border border-white/5 bg-[#06434a] p-7">

              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Sentinel Status
              </p>

              <div className="mt-8 flex items-center gap-5">

                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[#27e0d0]/20 bg-[#27e0d0]/5">

                  <div className="absolute h-12 w-12 animate-pulse rounded-full bg-[#27e0d0]/10" />

                  <div className="h-3 w-3 rounded-full bg-[#27e0d0] shadow-[0_0_20px_rgba(39,224,208,0.8)]" />

                </div>

                <div>

                  <h2 className="text-2xl font-semibold">
                    Monitoring
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    System operating normally
                  </p>

                </div>

              </div>

              <div className="mt-8 border-t border-white/5 pt-5">

                <div className="flex items-center justify-between text-sm">

                  <span className="text-slate-500">
                    Monitoring interval
                  </span>

                  <span className="font-medium">
                    10 seconds
                  </span>

                </div>

                <div className="mt-4 flex items-center justify-between text-sm">

                  <span className="text-slate-500">
                    Active pond
                  </span>

                  <span className="font-medium">
                    Pond 1
                  </span>

                </div>

              </div>

            </div>

          </section>

          {/* Bottom cards */}
          <section className="mt-5 grid gap-5 md:grid-cols-2">

            <div className="rounded-3xl border border-white/5 bg-[#06434a] p-7">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Fish Behaviour
                  </p>

                  <h2 className="mt-2 text-lg font-semibold">
                    Behaviour signal
                  </h2>

                </div>

                <div className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                  {fish?.activity_level || "Unknown"}
                </div>

              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">

                <div className="rounded-2xl bg-white/[0.03] p-4">

                  <p className="text-xs text-slate-500">
                    Activity
                  </p>

                  <p className="mt-2 text-sm font-medium">
                    {fish?.activity_level || "--"}
                  </p>

                </div>

                <div className="rounded-2xl bg-white/[0.03] p-4">

                  <p className="text-xs text-slate-500">
                    Feeding response
                  </p>

                  <p className="mt-2 text-sm font-medium">
                    {fish?.feeding_response || "--"}
                  </p>

                </div>

              </div>

            </div>

            <div className="rounded-3xl border border-white/5 bg-[#06434a] p-7">

              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Risk Factors
              </p>

              <h2 className="mt-2 text-lg font-semibold">
                What is influencing the score?
              </h2>

              <div className="mt-6 rounded-2xl bg-white/[0.03] p-4">

                <p className="text-sm leading-6 text-slate-400">
                  {risk?.contributing_factors ||
                    "No contributing factors detected."}
                </p>

              </div>

            </div>

          </section>

          <footer className="mt-10 border-t border-white/5 pt-6 text-xs text-slate-600">
            AquaSentinel • Multimodal Early-Warning Intelligence for African
            Aquaculture
          </footer>

        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  unit,
  detail,
  icon,
}: {
  label: string;
  value: string;
  unit: string;
  detail: string;
  icon: string;
}) {
  return (
    <div className="group rounded-3xl border border-white/5 bg-[#06434a] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#27e0d0]/20 hover:shadow-[0_15px_50px_rgba(0,0,0,0.2)]">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>

          <div className="mt-4 flex items-baseline gap-2">

            <span className="text-3xl font-semibold tracking-tight">
              {value}
            </span>

            {unit && (
              <span className="text-xs text-slate-500">
                {unit}
              </span>
            )}

          </div>

          <p className="mt-2 text-xs text-slate-600">
            {detail}
          </p>

        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#27e0d0]/5 text-[#27e0d0] transition group-hover:bg-[#27e0d0]/10">
          {icon}
        </div>

      </div>

    </div>
  );
}