"use client";

import { useEffect, useState } from "react";

type Alert = {
  id: number;
  pond_id: number;
  risk_level: string;
  risk_score: number;
  contributing_factors: string;
  created_at: string;
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const response = await fetch(
          "https://aquasentinel-api-q232.onrender.com/risk-assessments"
        );

        const data = await response.json();

        setAlerts(data);
      } catch (error) {
        console.error("Failed to load alerts:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAlerts();

    const interval = setInterval(loadAlerts, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#032f35] px-6 py-10 text-white">

      <div className="mx-auto max-w-7xl">

        <p className="text-xs uppercase tracking-[0.2em] text-[#27e0d0]">
          AquaSentinel Labs
        </p>

        <div className="mt-3">
          <h1 className="text-4xl font-semibold tracking-tight">
            Alerts
          </h1>

          <p className="mt-2 text-slate-400">
            Early warnings and detected pond stress signals.
          </p>
        </div>

        {loading ? (
          <div className="mt-10 rounded-3xl border border-white/5 bg-[#073f46] p-10 text-center text-slate-500">
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-emerald-400/10 bg-[#073f46] p-10 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/10 text-xl text-emerald-300">
              ✓
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              No alerts detected
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              AquaSentinel has not detected any immediate pond stress.
            </p>

          </div>
        ) : (
          <div className="mt-10 space-y-4">

            {alerts.map((alert) => {

              const isHigh = alert.risk_level === "High";
              const isModerate =
                alert.risk_level === "Moderate";

              const styles = isHigh
                ? "border-red-400/20 bg-red-400/[0.04]"
                : isModerate
                ? "border-amber-400/20 bg-amber-400/[0.04]"
                : "border-emerald-400/10 bg-emerald-400/[0.03]";

              const icon = isHigh
                ? "!"
                : isModerate
                ? "!"
                : "✓";

              const iconStyle = isHigh
                ? "bg-red-400/10 text-red-300"
                : isModerate
                ? "bg-amber-400/10 text-amber-300"
                : "bg-emerald-400/10 text-emerald-300";

              return (
                <div
                  key={alert.id}
                  className={`rounded-3xl border p-6 ${styles}`}
                >

                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-start gap-4">

                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-bold ${iconStyle}`}
                      >
                        {icon}
                      </div>

                      <div>

                        <div className="flex flex-wrap items-center gap-3">

                          <h2 className="font-semibold">
                            Pond #{alert.pond_id}
                          </h2>

                          <span className="rounded-full border border-white/5 bg-white/[0.04] px-3 py-1 text-xs text-slate-400">
                            {alert.risk_level} Risk
                          </span>

                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {alert.contributing_factors}
                        </p>

                      </div>

                    </div>

                    <div className="shrink-0 text-left sm:text-right">

                      <p className="text-2xl font-semibold">
                        {alert.risk_score}
                      </p>

                      <p className="text-xs text-slate-600">
                        risk score
                      </p>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>

    </main>
  );
}

