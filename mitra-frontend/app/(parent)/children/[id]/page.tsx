"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { parentApi, progressApi } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Program {
  id: string;
  module_id: string;
  module_name: string;
  difficulty_level: string;
  is_active: boolean;
  target_sessions_per_week: number;
  mastery_score?: number;
  trend?: string;
}

interface ProgressSummary {
  overall_mastery: number;
  total_sessions: number;
  total_attempts: number;
  streak_days: number;
  trend: string;
}

interface TimeseriesPoint {
  date: string;
  score: number;
}

export default function ChildDetailPage() {
  const params = useParams();
  const router = useRouter();
  const childId = params.id as string;

  const [programs, setPrograms] = useState<Program[]>([]);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [childName, setChildName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [childId]);

  const loadData = async () => {
    try {
      const [progRes, summaryRes, tsRes] = await Promise.all([
        parentApi.programs(childId),
        progressApi.summary(childId),
        progressApi.timeseries(childId, 14),
      ]);
      setPrograms(progRes.data.programs || []);
      setChildName(progRes.data.child_name || "");
      setSummary(summaryRes.data);
      setTimeseries(tsRes.data.timeseries || []);
    } catch {
      toast.error("Failed to load child data");
    } finally {
      setLoading(false);
    }
  };

  const startSession = (programId: string) => {
    sessionStorage.setItem("active_child_id", childId);
    router.push(`/session/${programId}`);
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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push("/children")} className="text-stone-400 hover:text-warm-600 text-2xl">
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold text-warm-700">{childName || "Child"}</h1>
            <p className="text-stone-500 text-sm">Progress & Programs</p>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { label: "Mastery", value: `${summary.overall_mastery?.toFixed(0) ?? 0}%`, emoji: "🏆" },
              { label: "Sessions", value: summary.total_sessions ?? 0, emoji: "📅" },
              { label: "Streak", value: `${summary.streak_days ?? 0}d`, emoji: "🔥" },
              { label: "Trend", value: summary.trend ?? "stable", emoji: summary.trend === "improving" ? "📈" : "📊" },
            ].map((s) => (
              <div key={s.label} className="card-warm text-center py-4">
                <div className="text-2xl mb-1">{s.emoji}</div>
                <div className="text-xl font-bold text-warm-700">{s.value}</div>
                <div className="text-stone-400 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Progress Chart */}
        {timeseries.length > 0 && (
          <div className="card-warm mb-6">
            <h3 className="font-bold text-stone-700 mb-4">Score over 14 days</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={timeseries}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#F97316"
                  strokeWidth={2}
                  dot={{ fill: "#F97316", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Programs */}
        <h2 className="text-xl font-bold text-stone-700 mb-4">Practice Programs</h2>
        {programs.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <div className="text-5xl mb-3">📚</div>
            <p>No programs assigned yet.</p>
            <p className="text-sm mt-1">Ask your therapist to assign programs.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {programs.filter((p) => p.is_active).map((program) => (
              <div
                key={program.id}
                className="card-warm flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <h3 className="font-bold text-stone-800 text-lg">{program.module_name}</h3>
                  <p className="text-stone-500 text-sm capitalize">{program.difficulty_level} • {program.target_sessions_per_week}x/week</p>
                  {program.mastery_score != null && (
                    <div className="flex items-center gap-1 mt-1">
                      <div
                        className="h-2 rounded-full bg-warm-100 flex-1 max-w-24 overflow-hidden"
                      >
                        <div
                          className="h-full bg-warm-500 rounded-full"
                          style={{ width: `${program.mastery_score}%` }}
                        />
                      </div>
                      <span className="text-xs text-stone-400">{program.mastery_score.toFixed(0)}%</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => startSession(program.id)}
                  className="bg-warm-500 hover:bg-warm-600 text-white px-5 py-3 rounded-2xl font-semibold text-base shadow-warm whitespace-nowrap"
                >
                  ▶ Start
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
