"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Pond = {
  id: number;
  name: string;
  species: string;
  farm: string;
};

export default function PondsPage() {
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
  async function loadPonds() {
    try {
      const token = localStorage.getItem(
        "aquasentinel_token"
      );

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        "https://aquasentinel-api-q232.onrender.com/ponds",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem(
          "aquasentinel_token"
        );

        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Failed to load ponds"
        );
      }

      const data = await response.json();

      setPonds(data);

    } catch (error) {
      console.error(
        "Failed to load ponds:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  loadPonds();

}, [router]);
  

  return (
    <main className="min-h-screen bg-[#032f35] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#27e0d0]">
          AquaSentinel Labs
        </p>

        <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

          <div>
            <h1 className="text-4xl font-semibold tracking-tight">
              Your Ponds
            </h1>

            <p className="mt-2 text-slate-400">
              Monitor the aquaculture environments connected to your system.
            </p>
          </div>

          <div className="rounded-full border border-white/5 bg-white/[0.03] px-4 py-2 text-sm text-slate-400">
            {ponds.length} {ponds.length === 1 ? "pond" : "ponds"}
          </div>

        </div>

        {loading ? (
          <div className="mt-10 rounded-3xl border border-white/5 bg-[#073f46] p-10 text-center text-slate-500">
            Loading ponds...
          </div>
        ) : ponds.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-white/5 bg-[#073f46] p-10 text-center">
            <p className="text-lg font-medium">
              No ponds found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Add a pond to begin monitoring your aquaculture environment.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {ponds.map((pond) => (
              <div
                key={pond.id}
                className="group rounded-3xl border border-white/5 bg-[#073f46] p-6 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-[#27e0d0]/20"
              >

                <div className="flex items-start justify-between">

                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                      {pond.farm}
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold">
                      {pond.name}
                    </h2>
                  </div>

                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                    Active
                  </span>

                </div>

                <div className="mt-8 grid grid-cols-2 gap-3">

                  <div className="rounded-2xl bg-white/[0.03] p-4">
                    <p className="text-xs text-slate-500">
                      Species
                    </p>

                    <p className="mt-2 text-sm font-medium">
                      {pond.species}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/[0.03] p-4">
                    <p className="text-xs text-slate-500">
                      Pond ID
                    </p>

                    <p className="mt-2 text-sm font-medium">
                      #{pond.id}
                    </p>
                  </div>

                </div>
<button
  onClick={() => router.push(`/ponds/${pond.id}`)}
  className="mt-6 w-full rounded-xl bg-[#00b8a9]/10 py-3 text-sm font-medium text-[#27e0d0] transition hover:bg-[#00b8a9]/20"
>
  View pond
</button>

              </div>
            ))}

          </div>
        )}

      </div>
    </main>
  );
}

