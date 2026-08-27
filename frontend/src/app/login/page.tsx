"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const formData = new URLSearchParams();

      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch(
        "https://aquasentinel-api-q232.onrender.com/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        }
      );

      if (!response.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await response.json();

      localStorage.setItem(
        "aquasentinel_token",
        data.access_token
      );

      router.push("/");

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed"
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="min-h-screen flex items-center justify-center bg-[#022b30] text-white px-5">

      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#06434a] p-8 shadow-2xl">

        <div className="mb-8">

          <h1 className="text-3xl font-semibold">
            AquaSentinel
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Sign in to monitor your aquaculture environment.
          </p>

        </div>


        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >

          <div>

            <label className="text-sm text-slate-400">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#27e0d0]"
              placeholder="you@example.com"
              required
            />

          </div>


          <div>

            <label className="text-sm text-slate-400">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#27e0d0]"
              placeholder="••••••••"
              required
            />

          </div>


          {error && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}


          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#00b8a9] py-3 font-semibold text-[#022b30] transition hover:bg-[#27e0d0] disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>


        </form>

      </div>

    </main>
  );
}