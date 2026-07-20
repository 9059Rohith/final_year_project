"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { therapistApi, authApi } from "@/lib/api";

interface ChildSummary {
  id: string;
  name: string;
  age: number;
  mastery_score?: number;
  trend?: string;
  last_session?: string;
  active_programs: number;
}

interface DashboardData {
  total_children: number;
  active_sessions_today: number;
  avg_mastery: number;
  children: ChildSummary[];
}

export default function TherapistDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await therapistApi.dashboard();
      setData(res.data);
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-calm-bg flex items-center justify-center">
        <div className="text-warm-500 text-xl animate-pulse">Loading... 🤖</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-calm-bg p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-warm-700">Therapist Dashboard</h1>
            <p className="text-stone-500">Manage your children & content</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/therapist/content"
              className="bg-warm-500 hover:bg-warm-600 text-white px-4 py-2 rounded-2xl text-sm font-semibold"
            >
              📚 Content
            </Link>
            <button onClick={handleLogout} className="text-stone-400 hover:text-warm-600 text-sm">
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Children", value: data?.total_children ?? 0, emoji: "👧" },
            { label: "Active Today", value: data?.active_sessions_today ?? 0, emoji: "📅" },
            { label: "Avg Mastery", value: `${data?.avg_mastery?.toFixed(0) ?? 0}%`, emoji: "🏆" },
          ].map((s) => (
            <div key={s.label} className="card-warm text-center">
              <div className="text-2xl mb-1">{s.emoji}</div>
              <div className="text-2xl font-bold text-warm-700">{s.value}</div>
              <div className="text-stone-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Children List */}
        <h2 className="text-xl font-bold text-stone-700 mb-4">Your Children</h2>
        {!data?.children?.length ? (
          <div className="text-center py-12 text-stone-400">
            <div className="text-5xl mb-3">👧</div>
            <p>No children assigned yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {data.children.map((child) => (
              <div key={child.id} className="card-warm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-warm-100 flex items-center justify-center text-2xl">
                    🧒
                  </div>
                  <div>
                    <p className="font-bold text-stone-800">{child.name}</p>
                    <p className="text-stone-400 text-sm">Age {child.age} • {child.active_programs} programs</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {child.mastery_score != null && (
                    <div className="text-right">
                      <div className={`font-bold text-lg ${
                        child.mastery_score >= 80 ? "text-accent-green" :
                        child.mastery_score >= 50 ? "text-warm-500" : "text-stone-400"
                      }`}>
                        {child.mastery_score.toFixed(0)}%
                      </div>
                      <div className="text-xs text-stone-400">
                        {child.trend === "improving" ? "📈" : child.trend === "declining" ? "📉" : "📊"} {child.trend}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => router.push(`/therapist/children/${child.id}`)}
                    className="bg-warm-100 hover:bg-warm-200 text-warm-700 px-4 py-2 rounded-xl text-sm font-medium"
                  >
                    View →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
