"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"parent" | "therapist">("parent");
  const [form, setForm] = useState({
    email: "", password: "", full_name: "",
    phone: "", license_number: "", specialization: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.register({ ...form, role });
      toast.success("Account created! 🎉");
      router.push(role === "parent" ? "/children" : "/therapist/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <main className="min-h-screen bg-calm-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🤖</div>
          <h1 className="text-3xl font-bold text-warm-700">Join Mitra</h1>
          <p className="text-stone-500 mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="card-warm flex flex-col gap-4">
          {/* Role Toggle */}
          <div className="flex rounded-2xl overflow-hidden border border-warm-200">
            {(["parent", "therapist"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-3 text-base font-semibold transition-all ${
                  role === r ? "bg-warm-500 text-white" : "bg-warm-50 text-stone-600"
                }`}
              >
                {r === "parent" ? "👪 Parent" : "👨‍⚕️ Therapist"}
              </button>
            ))}
          </div>

          {[
            { key: "full_name", label: "Full Name", type: "text", placeholder: "Priya Rajan" },
            { key: "email", label: "Email", type: "email", placeholder: "you@example.com" },
            { key: "password", label: "Password", type: "password", placeholder: "Min 8 chars" },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-stone-700 mb-1">{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={(e) => update(key, e.target.value)}
                required
                placeholder={placeholder}
                className="w-full border border-warm-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-warm-400 bg-warm-50"
              />
            </div>
          ))}

          {role === "parent" && (
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Phone (optional)</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full border border-warm-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-warm-400 bg-warm-50"
              />
            </div>
          )}

          {role === "therapist" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">License Number</label>
                <input
                  type="text"
                  value={form.license_number}
                  onChange={(e) => update("license_number", e.target.value)}
                  placeholder="RCI-XXXX"
                  className="w-full border border-warm-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-warm-400 bg-warm-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Specialization</label>
                <input
                  type="text"
                  value={form.specialization}
                  onChange={(e) => update("specialization", e.target.value)}
                  placeholder="Speech-Language Pathology"
                  className="w-full border border-warm-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-warm-400 bg-warm-50"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-warm-500 hover:bg-warm-600 disabled:opacity-60 text-white py-4 rounded-2xl text-lg font-semibold transition-all shadow-warm mt-2"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-center text-stone-500">
            Already have an account?{" "}
            <Link href="/login" className="text-warm-600 font-semibold hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
