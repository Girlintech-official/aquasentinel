"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: fullName,
            email,
            password,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      router.push("/login");

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="min-h-screen flex items-center justify-center bg-[#022b30] text-white px-5">

      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#06434a] p-8 shadow-2xl">

        <h1 className="text-3xl font-semibold">
          Create Account
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Register your AquaSentinel account.
        </p>


        <form
          onSubmit={handleRegister}
          className="mt-8 space-y-5"
        >

          <div>
            <label className="text-sm text-slate-400">
              Full name
            </label>

            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#27e0d0]"
              required
            />
          </div>


          <div>
            <label className="text-sm text-slate-400">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#27e0d0]"
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
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#27e0d0]"
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
            className="w-full rounded-xl bg-[#00b8a9] py-3 font-semibold text-[#022b30] hover:bg-[#27e0d0] disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Register"}
          </button>


        </form>


        <p className="mt-5 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-[#27e0d0] hover:underline"
          >
            Sign in
          </button>
        </p>

      </div>

    </main>
  );
}