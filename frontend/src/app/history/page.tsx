"use client";

import { useEffect, useState } from "react";

type Reading = {
  id: number;
  sensor_id: number;
  temperature: number;
  ph: number;
  dissolved_oxygen: number;
  recorded_at: string;
};

export default function HistoryPage() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/water-readings"
        );

        const data = await response.json();

        setReadings(data);
      } catch (error) {
        console.error("Failed to load history:", error);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  return (
    <main className="min-h-screen bg-[#032f35] px-6 py-10 text-white">

      <div className="mx-auto max-w-7xl">

        <p className="text-xs uppercase tracking-[0.2em] text-[#27e0d0]">
          AquaSentinel Labs
        </p>

        <h1 className="mt-3 text-4xl font-semibold">
          Monitoring History
        </h1>

        <p className="mt-2 text-slate-400">
          Historical water-quality observations captured by your sensors.
        </p>

        {loading ? (
          <div className="mt-10 rounded-3xl border border-white/5 bg-[#073f46] p-10 text-center text-slate-500">
            Loading history...
          </div>
        ) : (
          <div className="mt-10 overflow-hidden rounded-3xl border border-white/5 bg-[#073f46]">

            <div className="overflow-x-auto">

              <table className="w-full text-left text-sm">

                <thead className="border-b border-white/5 bg-white/[0.02]">

                  <tr>
                    <th className="px-6 py-4 font-medium text-slate-500">
                      Time
                    </th>

                    <th className="px-6 py-4 font-medium text-slate-500">
                      Temperature
                    </th>

                    <th className="px-6 py-4 font-medium text-slate-500">
                      pH
                    </th>

                    <th className="px-6 py-4 font-medium text-slate-500">
                      Dissolved Oxygen
                    </th>

                    <th className="px-6 py-4 font-medium text-slate-500">
                      Sensor
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {readings.map((reading) => (
                    <tr
                      key={reading.id}
                      className="border-b border-white/5 transition hover:bg-white/[0.02]"
                    >

                      <td className="px-6 py-5 text-slate-400">
                        {new Date(
                          reading.recorded_at
                        ).toLocaleString()}
                      </td>

                      <td className="px-6 py-5 font-medium">
                        {reading.temperature}°C
                      </td>

                      <td className="px-6 py-5">
                        {reading.ph}
                      </td>

                      <td className="px-6 py-5">
                        {reading.dissolved_oxygen} mg/L
                      </td>

                      <td className="px-6 py-5 text-slate-400">
                        #{reading.sensor_id}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          </div>
        )}

      </div>

    </main>
  );
}