"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const { role } = res.data;
      toast.success(`Welcome back! 👋`);
      if (role === "parent") router.push("/children");
      else if (role === "therapist") router.push("/therapist/dashboard");
      else if (role === "admin") router.push("/admin");
      else router.push("/children");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-calm-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🤖</div>
          <h1 className="text-3xl font-bold text-warm-700">மித்ரா</h1>
          <p className="text-stone-500 mt-1">Sign in to continue</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card-warm flex flex-col gap-5"
        >
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="parent@example.com"
              className="w-full border border-warm-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-warm-400 bg-warm-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-warm-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-warm-400 bg-warm-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-warm-500 hover:bg-warm-600 disabled:opacity-60 text-white py-4 rounded-2xl text-lg font-semibold transition-all shadow-warm"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-stone-500">
            No account?{" "}
            <Link href="/register" className="text-warm-600 font-semibold hover:underline">
              Register
            </Link>
          </p>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-warm-50 rounded-2xl border border-warm-200 text-sm text-stone-600">
          <p className="font-semibold mb-2">Demo Accounts:</p>
          <p>👪 Parent: priya.rajan@gmail.com / Parent@123</p>
          <p>👨‍⚕️ Therapist: dr.kavitha@mitra.app / Therapist@123</p>
          <p>🔧 Admin: admin@mitra.app / Admin@2024</p>
        </div>
      </div>
    </main>
  );
}
